import { DataSource } from 'typeorm';

const isProd = process.env.NODE_ENV === 'production';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? '5432'),
  username: process.env.DB_USER ?? 'fire',
  password: process.env.DB_PASSWORD ?? 'fire',
  database: process.env.DB_NAME ?? 'fire',
  synchronize: false,
  logging: false,
  entities: [isProd ? 'dist/**/*.entity.js' : 'src/**/*.entity.ts'],
  migrations: [isProd ? 'dist/db/migrations/*.js' : 'src/db/migrations/*.ts'],
});
