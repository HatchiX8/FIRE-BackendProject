import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DataSource } from 'typeorm';
import { StockInfoSchema } from '../entity/stockInfo.schema.js';
import { StockPricesSchema } from '../entity/currentStockPrices.schema.js';
import { UserSchema } from '../entity/user.schema.js';
import { RefreshTokenEntity } from '../modules/auth/refresh-token.entity.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distSeg = `${path.sep}dist`;
const isBuilt = __dirname.includes(`${distSeg}${path.sep}`) || __dirname.endsWith(distSeg);

export const AppDataSource = new DataSource({
  type: 'postgres',

  url: process.env.DATABASE_URL,
  host: process.env.DATABASE_URL ? undefined : process.env.DB_HOST ?? 'localhost',
  port: process.env.DATABASE_URL ? undefined : Number(process.env.DB_PORT ?? '5432'),
  username: process.env.DATABASE_URL ? undefined : process.env.DB_USER ?? 'fire',
  password: process.env.DATABASE_URL ? undefined : process.env.DB_PASSWORD ?? 'fire',
  database: process.env.DATABASE_URL ? undefined : process.env.DB_NAME ?? 'fire',

  synchronize: false,
  logging: false,

  entities: [StockInfoSchema, StockPricesSchema, UserSchema, RefreshTokenEntity],
  migrations: [
    isBuilt
      ? path.resolve(__dirname, '../**/migrations/*.js')
      : path.resolve(__dirname, '../**/migrations/*.ts'),
  ],
});
