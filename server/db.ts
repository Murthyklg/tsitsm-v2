import 'dotenv/config';
import sql from 'mssql';

const baseConfig = {
  server: (process.env.SQL_SERVER || 'localhost\\SQLEXPRESS').trim(),
  database: (process.env.SQL_DATABASE || 'tsitsm').trim(),
  ...(process.env.SQL_PORT ? { port: Number(process.env.SQL_PORT) } : {}),
  options: {
    encrypt: process.env.SQL_ENCRYPT !== 'false',
    trustServerCertificate: process.env.SQL_TRUST_SERVER_CERTIFICATE === 'true',
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};

const config = process.env.SQL_AUTH === 'windows'
  ? { ...baseConfig, driver: process.env.SQL_DRIVER || 'ODBC Driver 17 for SQL Server', options: { ...baseConfig.options, trustedConnection: true } }
  : { ...baseConfig, user: process.env.SQL_USER, password: process.env.SQL_PASSWORD };

let poolPromise: Promise<sql.ConnectionPool> | undefined;
export const getPool = async () => {
  if (!poolPromise) {
    if (process.env.SQL_AUTH === 'windows') {
      const { default: sqlWindows } = await import('mssql/msnodesqlv8');
      poolPromise = sqlWindows.connect(config);
    } else {
      poolPromise = sql.connect(config);
    }
  }
  return poolPromise;
};

export { sql };
