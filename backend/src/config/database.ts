import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

const getDatabaseConfig = (): DatabaseConfig => {
  const config: DatabaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'family_health_keeper',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.NODE_ENV === 'production',
    max: 20, // Maximum number of connections in the pool
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 2000, // How long to wait when connecting a new client
  };

  // Support for DATABASE_URL (common in production)
  if (process.env.DATABASE_URL) {
    // Parse DATABASE_URL and override individual settings
    try {
      const url = new URL(process.env.DATABASE_URL);
      config.host = url.hostname || config.host;
      config.port = parseInt(url.port) || config.port;
      config.database = url.pathname.substring(1) || config.database;
      config.user = url.username || config.user;
      config.password = url.password || config.password;
      config.ssl = url.searchParams.has('sslmode') && url.searchParams.get('sslmode') !== 'disable';
    } catch (error) {
      logger.error('Failed to parse DATABASE_URL:', error);
      throw new Error('Invalid DATABASE_URL format');
    }
  }

  return config;
};

// Create connection pool
const poolConfig = getDatabaseConfig();
const pool = new Pool({
  host: poolConfig.host,
  port: poolConfig.port,
  database: poolConfig.database,
  user: poolConfig.user,
  password: poolConfig.password,
  ssl: poolConfig.ssl ? { rejectUnauthorized: false } : false,
  max: poolConfig.max,
  idleTimeoutMillis: poolConfig.idleTimeoutMillis,
  connectionTimeoutMillis: poolConfig.connectionTimeoutMillis,
});

// Log when a new client is connected
pool.on('connect', (client: PoolClient) => {
  logger.debug('New database client connected');
});

// Log when a client is removed from the pool
pool.on('remove', (client: PoolClient) => {
  logger.debug('Database client removed from pool');
});

// Log errors from the pool
pool.on('error', (err: Error) => {
  logger.error('Unexpected error on idle client:', err);
  process.exit(-1);
});

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connection successful:', result.rows[0].now);
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
};

// Helper function to execute queries with automatic connection handling
export const query = async (text: string, params?: any[]): Promise<any> => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Query failed', { text, duration, error });
    throw error;
  }
};

// Helper function for transactions
export const transaction = async (callback: (client: PoolClient) => Promise<any>): Promise<any> => {
  const client = await pool.connect();
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
};

// Graceful shutdown
export const closeDatabase = async (): Promise<void> => {
  try {
    await pool.end();
    logger.info('Database connection pool closed');
  } catch (error) {
    logger.error('Error closing database connection pool:', error);
  }
};

export default pool;