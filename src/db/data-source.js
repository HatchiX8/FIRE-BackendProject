"use strict";
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
var typeorm_1 = require("typeorm");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: (_a = process.env.DB_HOST) !== null && _a !== void 0 ? _a : 'localhost',
    port: Number((_b = process.env.DB_PORT) !== null && _b !== void 0 ? _b : '5432'),
    username: (_c = process.env.DB_USER) !== null && _c !== void 0 ? _c : 'fire',
    password: (_d = process.env.DB_PASSWORD) !== null && _d !== void 0 ? _d : 'fire',
    database: (_e = process.env.DB_NAME) !== null && _e !== void 0 ? _e : 'fire',
    synchronize: false,
    logging: false,
    entities: ['src/**/*.entity.ts', 'dist/**/*.entity.js'],
    migrations: ['src/db/migrations/*.ts', 'dist/db/migrations/*.js'],
});
