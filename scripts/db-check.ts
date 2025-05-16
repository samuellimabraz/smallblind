import { Client } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkDatabase() {
    // Parse the DATABASE_URL
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('DATABASE_URL is not defined in .env');
        return;
    }

    // Extract connection parameters from DATABASE_URL
    // Format: postgresql://username:password@hostname:port/database?schema=schema
    const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
    if (!match) {
        console.error('Invalid DATABASE_URL format');
        return;
    }

    const [, user, password, host, port, database] = match;

    const client = new Client({
        user,
        password,
        host,
        port: parseInt(port),
        database
    });

    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected successfully!');

        // Check for tables
        console.log('\nChecking for tables...');
        const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

        if (tablesResult.rows.length === 0) {
            console.log('No tables found in the database. You may need to run migrations.');
        } else {
            console.log(`Found ${tablesResult.rows.length} tables:`);
            tablesResult.rows.forEach(row => {
                console.log(`- ${row.table_name}`);
            });

            // Check for users
            console.log('\nChecking for users...');
            if (tablesResult.rows.some(row => row.table_name === 'User')) {
                const usersResult = await client.query('SELECT COUNT(*) FROM "User"');
                console.log(`Found ${usersResult.rows[0].count} users in the database.`);

                if (parseInt(usersResult.rows[0].count) > 0) {
                    const userDetails = await client.query('SELECT id, username, email FROM "User" LIMIT 5');
                    console.log('\nUser details:');
                    userDetails.rows.forEach(user => {
                        console.log(`- ${user.username} (${user.email})`);
                    });
                }
            } else {
                console.log('User table not found.');
            }
        }

        console.log('\nDatabase connection info:');
        console.log(`Host: ${host}`);
        console.log(`Port: ${port}`);
        console.log(`Database: ${database}`);
        console.log(`User: ${user}`);

    } catch (error) {
        console.error('Error connecting to the database:', error);
    } finally {
        await client.end();
        console.log('\nDisconnected from database');
    }
}

checkDatabase().catch(error => {
    console.error('Fatal error:', error);
}); 