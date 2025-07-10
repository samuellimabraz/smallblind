import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: '.env.test' });

// Set default environment variables for testing if not in .env.test
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.JWT_EXPIRATION = process.env.JWT_EXPIRATION || '3600';
process.env.PORT = process.env.PORT || '3000';
process.env.NODE_ENV = 'test'; 