import { getMigrations } from 'better-auth/db/migration';
import { auth } from '../auth/auth.js';

async function runAuthMigrations() {
  try {
    console.log('Preparing Better Auth migrations...');
    const { toBeAdded, toBeCreated, runMigrations } = await getMigrations(
      auth.options,
    );

    if (!toBeAdded.length && !toBeCreated.length) {
      console.log('No pending Better Auth migrations.');
      process.exit(0);
    }

    console.log('Running pending Better Auth migrations...');
    await runMigrations();
    console.log('Better Auth migrations completed.');
    process.exit(0);
  } catch (error) {
    console.error('Error running Better Auth migrations:', error);
    process.exit(1);
  }
}

runAuthMigrations();
