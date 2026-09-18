#!/usr/bin/env bash
set -e

echo "=== [1/4] Chạy Database Migrations và Build Contract song song ==="

# Chạy migration DB ngầm trong background
(
  cd server
  echo "--> [DB] Đang chạy migrations..."
  npm run migration:run || echo "[DB] Migration completed/skipped"
) &
PID_DB=$!

# Build và Deploy Solana Anchor Contract
(
  cd contracts
  echo "--> [Contract] Đang build Anchor artifacts..."
  if command -v anchor &>/dev/null; then
    anchor build
  else
    node scripts/runner.js build
  fi
  
  echo "--> [Contract] Đang deploy lên Devnet/Localnet..."
  PROGRAM_KEYPAIR="target/deploy/p2p_escrow-keypair.json"
  if command -v anchor &>/dev/null; then
    anchor deploy --provider.cluster devnet || true
  fi

  # Trích xuất Program ID từ keypair deploy
  if command -v solana-keygen &>/dev/null; then
    PROGRAM_ID=$(solana-keygen pubkey "$PROGRAM_KEYPAIR" 2>/dev/null || solana address -k "$PROGRAM_KEYPAIR")
  elif command -v solana &>/dev/null; then
    PROGRAM_ID=$(solana address -k "$PROGRAM_KEYPAIR")
  else
    PROGRAM_ID=$(node -e "
      const fs = require('fs');
      const { Keypair } = require('@solana/web3.js');
      const secret = JSON.parse(fs.readFileSync('$PROGRAM_KEYPAIR', 'utf8'));
      console.log(Keypair.fromSecretKey(Uint8Array.from(secret)).publicKey.toBase58());
    ")
  fi
  echo "--> [Contract] Deployed Program ID: $PROGRAM_ID"

  # Đồng bộ IDL và types sang Server
  mkdir -p ../server/src/modules/escrow/
  mkdir -p ../server/src/modules/solana/idl/
  cp target/idl/p2p_escrow.json ../server/src/modules/escrow/p2p_escrow.json
  cp target/idl/p2p_escrow.json ../server/src/modules/solana/idl/p2p_escrow.json
  
  # Update SOLANA_PROGRAM_ID vào server/.env tự động
  if grep -q "SOLANA_PROGRAM_ID=" ../server/.env; then
    sed -i "s/SOLANA_PROGRAM_ID=.*/SOLANA_PROGRAM_ID=$PROGRAM_ID/" ../server/.env
  else
    echo "SOLANA_PROGRAM_ID=$PROGRAM_ID" >> ../server/.env
  fi
) &
PID_CONTRACT=$!

# Chờ cả 2 luồng hoàn tất
wait $PID_DB
wait $PID_CONTRACT

echo "=== [2/4] Kiểm tra & cấp vốn ví Arbiter Relayer ==="
cd server
node -e '
  const { Connection, Keypair, LAMPORTS_PER_SOL } = require("@solana/web3.js");
  const bs58 = require("bs58");
  require("dotenv").config();

  (async () => {
    const conn = new Connection(process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com", "confirmed");
    let secret = process.env.ARBITER_PRIVATE_KEY;
    if (!secret) {
      console.warn("ARBITER_PRIVATE_KEY not set; skipping gas pre-flight check.");
      return;
    }
    let keypair = secret.startsWith("[") 
      ? Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret)))
      : Keypair.fromSecretKey(bs58.decode(secret));
      
    try {
      const balance = await conn.getBalance(keypair.publicKey);
      console.log(`Arbiter (${keypair.publicKey.toBase58()}) Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
      
      if (balance < 0.5 * LAMPORTS_PER_SOL) {
        console.log("--> Requesting airdrop 1 SOL...");
        const sig = await conn.requestAirdrop(keypair.publicKey, 1 * LAMPORTS_PER_SOL);
        await conn.confirmTransaction(sig);
        console.log("--> Airdrop confirmed!");
      }
    } catch (err) {
      console.warn(`Arbiter balance check skipped/failed: ${err.message}`);
    }
  })();
'

echo "=== [3/4] Build NestJS Server ==="
npm run build

echo "=== [4/4] Khởi động Server NestJS ==="
npm run start:prod

