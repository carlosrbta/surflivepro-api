import { config } from 'dotenv';
import { dirname } from 'path';
import { DataSource } from 'typeorm';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

config({ path: ['.env.local', '.env'] });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username: process.env.DATABASE_USER ?? 'surflivepro',
  password: process.env.DATABASE_PASSWORD ?? 'surflivepro',
  database: process.env.DATABASE_NAME ?? 'surflivepro',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});
