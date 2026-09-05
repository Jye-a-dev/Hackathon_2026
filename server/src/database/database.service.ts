import {
  Injectable,
  Inject,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { PG_POOL } from './pg.provider';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onModuleInit(): Promise<void> {
    await this.initSchema();
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Closing PostgreSQL pool connections...');
    await this.pool.end();
  }

  /**
   * Execute a single query against the connection pool
   */
  async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[],
  ): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const res = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      this.logger.debug(
        `Executed query: ${text.substring(0, 100)}... (${duration}ms, ${res.rowCount} rows)`,
      );
      return res;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Query error: ${err.message} - Query: ${text}`,
        err.stack,
      );
      throw err;
    }
  }

  /**
   * Execute operations inside a transactional client
   */
  async withTransaction<T>(
    callback: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Initialize tables and indexes for P2P Escrow Marketplace
   */
  private async initSchema(): Promise<void> {
    this.logger.log('Verifying and initializing PostgreSQL schemas...');

    const schemaSql = `
      -- Users Table: id, wallet_address, email, role (BUYER, SELLER, ADMIN)
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        wallet_address VARCHAR(64) UNIQUE NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(32),
        full_name VARCHAR(128),
        avatar_url TEXT,
        rating_score NUMERIC(3, 2) DEFAULT 5.0,
        auth_provider VARCHAR(32) DEFAULT 'WALLET',
        role VARCHAR(16) NOT NULL DEFAULT 'BUYER' CHECK (role IN ('BUYER', 'SELLER', 'ADMIN')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

      -- Orders Table: id (bigint / u64 order_id), buyer_id, seller_id, amount_lamports, escrow_pda, status, tracking_code, delivered_at, created_at
      CREATE TABLE IF NOT EXISTS orders (
        id BIGINT PRIMARY KEY,
        buyer_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
        seller_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
        payer_wallet VARCHAR(64),
        buyer_wallet VARCHAR(64) NOT NULL,
        seller_wallet VARCHAR(64) NOT NULL,
        arbiter_wallet VARCHAR(64) NOT NULL,
        amount_lamports BIGINT NOT NULL,
        escrow_pda VARCHAR(64) NOT NULL,
        vault_pda VARCHAR(64) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'LOCKED',
        tracking_code VARCHAR(128),
        timeout_duration BIGINT NOT NULL DEFAULT 172800,
        tx_signature VARCHAR(128),
        delivered_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        disputed_at TIMESTAMPTZ,
        resolved_at TIMESTAMPTZ,
        resolution_recipient VARCHAR(64),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payer_wallet VARCHAR(64);

      CREATE INDEX IF NOT EXISTS idx_orders_id ON orders(id);
      CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_wallet);
      CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_wallet);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_tracking_code ON orders(tracking_code);
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

      -- Payment Intents Table (VietQR / MoMo Fiat-to-Web3 with Slippage Protection)
      CREATE TABLE IF NOT EXISTS payment_intents (
        id VARCHAR(64) PRIMARY KEY,
        order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        amount_vnd NUMERIC(15, 0) NOT NULL,
        locked_sol_price NUMERIC(18, 9) NOT NULL,
        amount_lamports BIGINT NOT NULL,
        max_slippage_bps INT NOT NULL DEFAULT 150,
        expires_at TIMESTAMPTZ NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
        payment_method VARCHAR(32) NOT NULL DEFAULT 'VIETQR',
        qr_payload TEXT,
        tx_signature VARCHAR(128),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_payment_intents_order_id ON payment_intents(order_id);
      CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON payment_intents(status);

      -- Idempotency Registry Table for Webhook Ingestion
      CREATE TABLE IF NOT EXISTS processed_webhooks (
        id VARCHAR(128) PRIMARY KEY,
        provider VARCHAR(32) NOT NULL,
        resource_id VARCHAR(64) NOT NULL,
        payload JSONB NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'PROCESSED',
        processed_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_processed_webhooks_resource ON processed_webhooks(resource_id);

      -- E-Commerce Listings Table (Pass đồ & Feed)
      CREATE TABLE IF NOT EXISTS listings (
        id BIGSERIAL PRIMARY KEY,
        seller_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
        seller_wallet VARCHAR(64) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price_vnd NUMERIC(15, 0) NOT NULL,
        price_sol NUMERIC(18, 9),
        category VARCHAR(64) NOT NULL,
        condition VARCHAR(32) DEFAULT 'USED',
        images TEXT[],
        location_name VARCHAR(128),
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
      CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
      CREATE INDEX IF NOT EXISTS idx_listings_price_vnd ON listings(price_vnd);
      CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);

      -- Real-time Chat: Conversations and Messages
      CREATE TABLE IF NOT EXISTS conversations (
        id BIGSERIAL PRIMARY KEY,
        buyer_wallet VARCHAR(64) NOT NULL,
        seller_wallet VARCHAR(64) NOT NULL,
        listing_id BIGINT REFERENCES listings(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(buyer_wallet, seller_wallet);

      CREATE TABLE IF NOT EXISTS messages (
        id BIGSERIAL PRIMARY KEY,
        conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_wallet VARCHAR(64) NOT NULL,
        content TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at ASC);

      -- Disputes Table: order_id, reason, evidence_urls, resolution_status
      CREATE TABLE IF NOT EXISTS disputes (
        id BIGSERIAL PRIMARY KEY,
        order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        buyer_wallet VARCHAR(64),
        reason TEXT,
        evidence_urls TEXT[],
        resolution_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
        decision VARCHAR(32),
        resolved_by VARCHAR(64),
        tx_signature VARCHAR(128),
        resolved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_disputes_order_id ON disputes(order_id);
      CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(resolution_status);

      -- Escrow On-Chain Events Audit Table
      CREATE TABLE IF NOT EXISTS escrow_events (
        id BIGSERIAL PRIMARY KEY,
        order_id BIGINT NOT NULL,
        event_name VARCHAR(64) NOT NULL,
        signature VARCHAR(128),
        slot BIGINT,
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_escrow_events_order_id ON escrow_events(order_id);
      CREATE INDEX IF NOT EXISTS idx_escrow_events_name ON escrow_events(event_name);

      -- Backward-compatible Escrows View mapping to orders
      CREATE OR REPLACE VIEW escrows AS
        SELECT 
          id,
          id AS order_id,
          buyer_id,
          seller_id,
          payer_wallet,
          buyer_wallet,
          seller_wallet,
          arbiter_wallet,
          amount_lamports AS amount,
          amount_lamports,
          status,
          escrow_pda,
          vault_pda,
          tracking_code,
          timeout_duration,
          tx_signature,
          delivered_at,
          completed_at,
          disputed_at,
          resolved_at,
          resolution_recipient,
          created_at,
          updated_at
        FROM orders;
    `;

    try {
      await this.pool.query(schemaSql);
      this.logger.log('Database schema initialization completed successfully.');
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Failed to initialize schema: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }
}
