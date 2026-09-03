import { Provider, Logger } from '@nestjs/common';
import { Pool, PoolConfig } from 'pg';

export const PG_POOL = 'PG_POOL';

interface PingQueryResult {
  db: string;
  ver: string;
}

export const pgProvider: Provider = {
  provide: PG_POOL,
  useFactory: async (): Promise<Pool> => {
    const logger = new Logger('PgProvider');
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }

    // Strip sslmode from query string so pg does not enforce strict CA verification on cloud DB
    const cleanConnectionString = connectionString
      .replace(/([?&])sslmode=[^&]*(&|$)/i, '$1')
      .replace(/[?&]$/, '');

    const poolConfig: PoolConfig = {
      connectionString: cleanConnectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: parseInt(process.env.DB_POOL_MAX ?? '20', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    };

    const pool = new Pool(poolConfig);

    pool.on('connect', () => {
      logger.debug('New client connected to PostgreSQL pool');
    });

    pool.on('error', (err: Error) => {
      logger.error('Unexpected error on idle PostgreSQL client', err.stack);
    });

    // Test connectivity immediately
    try {
      const client = await pool.connect();
      const res = await client.query<PingQueryResult>(
        'SELECT current_database() as db, version() as ver',
      );
      client.release();
      const currentDb = res.rows[0]?.db ?? 'unknown';
      logger.log(
        `Connected to PostgreSQL database: "${currentDb}" with SSL active`,
      );
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(
        `Failed to connect to PostgreSQL: ${err.message}`,
        err.stack,
      );
      throw err;
    }

    return pool;
  },
};
