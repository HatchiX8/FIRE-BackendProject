import 'reflect-metadata';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? '5432'),
  username: process.env.DB_USER ?? 'fire',
  password: process.env.DB_PASSWORD ?? 'fire',
  database: process.env.DB_NAME ?? 'fire',
  synchronize: false,
  logging: false,
  entities: ['src/**/*.entity.ts', 'dist/**/*.entity.js'],
  migrations: ['src/db/migrations/*.ts', 'dist/db/migrations/*.js'],
});
