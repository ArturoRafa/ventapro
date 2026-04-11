import 'reflect-metadata';
import path from 'path';
import { DataSource } from 'typeorm';

import { env } from './env';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: env.databaseUrl,
  ssl: { rejectUnauthorized: false },
  synchronize: false,
  logging: !env.isProduction,
  entities: [path.join(__dirname, '..', 'entities', '*.{ts,js}')],
  migrations: [path.join(__dirname, '..', 'migrations', '*.{ts,js}')],
});
