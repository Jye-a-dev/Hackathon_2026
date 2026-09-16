const { Pool } = require('pg');

async function migrate() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres.qnbdnarcyeavapfncokm:Hackathon_2026@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await pool.query(`
      INSERT INTO orders (id, buyer_wallet, seller_wallet, arbiter_wallet, amount_lamports, status, escrow_pda, vault_pda, timeout_duration, tx_signature, delivered_at, disputed_at, created_at, updated_at)
      SELECT order_id, buyer_wallet, seller_wallet, arbiter_wallet, amount, status, escrow_pda, vault_pda, timeout_duration, tx_signature, delivered_at, disputed_at, created_at, updated_at
      FROM escrows_legacy
      ON CONFLICT (id) DO NOTHING;
    `);

    await pool.query('ALTER TABLE disputes DROP CONSTRAINT IF EXISTS disputes_order_id_fkey;');
    await pool.query('ALTER TABLE disputes ADD CONSTRAINT disputes_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;');
    await pool.query('ALTER TABLE disputes ADD COLUMN IF NOT EXISTS evidence_urls TEXT[];');

    console.log('Migration OK');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();

