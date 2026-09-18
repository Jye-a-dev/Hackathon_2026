const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.qnbdnarcyeavapfncokm:Hackathon_2026@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  await client.query("UPDATE users SET role = 'BUYER', full_name = 'User Test Normal' WHERE phone = '0900000001'");
  await client.query("UPDATE users SET role = 'ADMIN', full_name = 'Admin TrustPass' WHERE phone = '0900000002'");
  const res = await client.query("SELECT id, phone, wallet_address, role, full_name FROM users WHERE phone IN ('0900000001', '0900000002')");
  console.log('Updated users:');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

