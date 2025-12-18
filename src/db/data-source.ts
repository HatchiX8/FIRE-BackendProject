import { DataSource } from 'typeorm';

const isProd = process.env.NODE_ENV === 'production';

export const AppDataSource = new DataSource({
  type: 'postgres',

  // ✅ 雲端優先用 DATABASE_URL
  url: process.env.DATABASE_URL,

  // ⬇️ 只有在沒有 DATABASE_URL（本機）時才用下面這組
  host: process.env.DATABASE_URL ? undefined : process.env.DB_HOST ?? 'localhost',
  port: process.env.DATABASE_URL ? undefined : Number(process.env.DB_PORT ?? '5432'),
  username: process.env.DATABASE_URL ? undefined : process.env.DB_USER ?? 'fire',
  password: process.env.DATABASE_URL ? undefined : process.env.DB_PASSWORD ?? 'fire',
  database: process.env.DATABASE_URL ? undefined : process.env.DB_NAME ?? 'fire',

  synchronize: false,
  logging: false,
  entities: [isProd ? 'dist/**/*.entity.js' : 'src/**/*.entity.ts'],
  migrations: [isProd ? 'dist/db/migrations/*.js' : 'src/db/migrations/*.ts'],
});
