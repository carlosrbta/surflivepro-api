import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
});

async function runMigrations() {
  try {
    console.log('Initializing database connection...');
    await dataSource.initialize();

    console.log('Running pending migrations...');
    const migrations = await dataSource.runMigrations();

    if (migrations.length === 0) {
      console.log('No pending migrations to run.');
    } else {
      console.log(`Successfully ran ${migrations.length} migration(s):`);
      migrations.forEach((migration) => {
        console.log(`  - ${migration.name}`);
      });
    }

    await dataSource.destroy();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations();
