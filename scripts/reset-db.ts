import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
});

async function resetDatabase() {
  try {
    await dataSource.initialize();
    console.log('Connected to database');

    await dataSource.query('DROP SCHEMA public CASCADE');
    console.log('Dropped schema public');

    await dataSource.query('CREATE SCHEMA public');
    console.log('Created schema public');

    await dataSource.query('GRANT ALL ON SCHEMA public TO postgres');
    await dataSource.query('GRANT ALL ON SCHEMA public TO public');
    console.log('Granted permissions');

    console.log('✓ Database reset successful');
    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

resetDatabase();
