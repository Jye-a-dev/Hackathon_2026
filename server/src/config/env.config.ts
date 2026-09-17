export interface EnvironmentVariables {
  PORT: number;
  DATABASE_URL: string;
  SOLANA_RPC_URL: string;
  SOLANA_WS_URL: string;
  SOLANA_PROGRAM_ID: string;
  ARBITER_PRIVATE_KEY: string;
  ARBITER_PUBLIC_KEY?: string;
  DEFAULT_TIMEOUT_DURATION: number;
}

export const validateEnv = (
  config: Record<string, unknown>,
): EnvironmentVariables => {
  const port = parseInt(config.PORT as string, 10) || 3000;
  const timeoutDuration =
    parseInt(config.DEFAULT_TIMEOUT_DURATION as string, 10) || 172800;

  if (!config.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  if (!config.SOLANA_PROGRAM_ID) {
    throw new Error('SOLANA_PROGRAM_ID environment variable is required');
  }

  return {
    PORT: port,
    DATABASE_URL: config.DATABASE_URL as string,
    SOLANA_RPC_URL:
      (config.SOLANA_RPC_URL as string) || 'https://api.devnet.solana.com',
    SOLANA_WS_URL:
      (config.SOLANA_WS_URL as string) || 'wss://api.devnet.solana.com',
    SOLANA_PROGRAM_ID: config.SOLANA_PROGRAM_ID as string,
    ARBITER_PRIVATE_KEY: (config.ARBITER_PRIVATE_KEY as string) || '',
    ARBITER_PUBLIC_KEY: config.ARBITER_PUBLIC_KEY as string | undefined,
    DEFAULT_TIMEOUT_DURATION: timeoutDuration,
  };
};
