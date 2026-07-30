const { Client } = require('pg');
const { execSync } = require('child_process');

async function waitForDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  let retries = 10;
  const delay = 5000; // 5 seconds

  while (retries > 0) {
    try {
      console.log(`Attempting to connect to database... (${retries} retries left)`);
      await client.connect();
      console.log('✓ Database connected successfully');
      await client.end();
      return true;
    } catch (error) {
      console.log(`✗ Database connection failed: ${error.message}`);
      retries--;
      if (retries > 0) {
        console.log(`Waiting ${delay / 1000} seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error('Failed to connect to database after multiple retries');
}

async function start() {
  try {
    await waitForDatabase();
    
    console.log('Running Prisma db push...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    
    console.log('Running Prisma db seed...');
    execSync('npx prisma db seed', { stdio: 'inherit' });
    
    console.log('Starting server...');
    execSync('node dist/server.js', { stdio: 'inherit' });
  } catch (error) {
    console.error('Startup failed:', error.message);
    process.exit(1);
  }
}

start();
