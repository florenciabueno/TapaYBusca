import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'default-secret',
  jwtExpireIn: process.env.JWT_EXPIRE_IN || '24h',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/mydb',
} as const;
