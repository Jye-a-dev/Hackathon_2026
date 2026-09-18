export const appConfig = () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: {
    url: process.env.DATABASE_URL,
    maxPool: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  },
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    wsUrl: process.env.SOLANA_WS_URL || 'wss://api.devnet.solana.com',
    programId:
      process.env.SOLANA_PROGRAM_ID ||
      'HxRDoZFg52q9R5y1VGTSPEMqJjyW3WNgnxsz5bN8ooXk',
    arbiterPrivateKey: process.env.ARBITER_PRIVATE_KEY || '',
    arbiterPublicKey: process.env.ARBITER_PUBLIC_KEY || '',
    defaultTimeoutDuration: parseInt(
      process.env.DEFAULT_TIMEOUT_DURATION ?? '172800',
      10,
    ),
  },
});
