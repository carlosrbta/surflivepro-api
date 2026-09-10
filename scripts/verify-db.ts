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

async function verifyDatabase() {
  try {
    await dataSource.initialize();
    console.log('✓ Connected to database\n');

    // List all tables
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('📋 Tables created:');
    tables.forEach((t: any) => console.log(`  - ${t.table_name}`));

    // Check webhook_events table
    const webhookEvents = await dataSource.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'webhook_events' 
      ORDER BY ordinal_position
    `);

    console.log('\n🔍 webhook_events table structure:');
    webhookEvents.forEach((c: any) =>
      console.log(`  - ${c.column_name}: ${c.data_type}`),
    );

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

verifyDatabase();
