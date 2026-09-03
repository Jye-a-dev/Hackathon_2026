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
        role VARCHAR(16) NOT NULL DEFAULT 'BUYER' CHECK (role IN ('BUYER', 'SELLER', 'ADMIN')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);

      -- Orders Table: id (bigint / u64 order_id), buyer_id, seller_id, amount_lamports, escrow_pda, status, tracking_code, delivered_at, created_at
      CREATE TABLE IF NOT EXISTS orders (
        id BIGINT PRIMARY KEY,
        buyer_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
        seller_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
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

      CREATE INDEX IF NOT EXISTS idx_orders_id ON orders(id);
      CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_wallet);
      CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_wallet);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_tracking_code ON orders(tracking_code);
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

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
