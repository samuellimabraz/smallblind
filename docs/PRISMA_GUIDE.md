# Prisma ORM Guide for SmallBlind Backend

This guide explains how to use the Prisma ORM setup in the SmallBlind Backend project.

## Overview

Prisma is a modern database toolkit that makes working with databases easy with automated type-safety and an intuitive API. In this project, we use Prisma with PostgreSQL to create a robust database layer.

## Setup

### Prerequisites

- Node.js (v14 or higher)
- Docker and Docker Compose

### Running the Database

To start the PostgreSQL database in a Docker container, run:

```bash
docker-compose up -d
```

This will start a PostgreSQL server on port 5432 with the credentials specified in the `.env` file.

### Setting Up the Schema and Generating the Client

To set up the schema and generate the Prisma client, run:

```bash
npm run prisma:generate
```

### Pushing the Schema to the Database

To create the database tables based on the schema, run:

```bash
npm run prisma:push
```

### Seeding the Database

To populate the database with sample data, run:

```bash
npm run prisma:seed
```

This will create sample data for all the models defined in the schema, including users, app settings, sessions, interactions, face embeddings, model metadata, OCR results, and more.

## Exploring the Database

To explore the database visually with Prisma Studio, run:

```bash
npm run prisma:studio
```

This will open a web interface at http://localhost:5555 where you can browse and edit your data.

## Testing the Setup

To run a test script that demonstrates how to use Prisma in your application, run:

```bash
npm run prisma:test
```

This will:
1. Connect to the database
2. Fetch all users
3. Get details about the first user (profile, settings, faces, sessions)
4. Count the user's interactions
5. Display the results in the console

## Project Structure

- `prisma/schema.prisma`: Defines the database schema and models
- `prisma/seed.ts`: Contains code to seed the database with sample data
- `src/database/prisma-service.ts`: Provides a singleton instance of PrismaClient
- `src/database/postgres-connector.ts`: Implements the IDBConnector interface using Prisma
- `src/services/UserProfileService.ts`: Example service that uses Prisma for data access
- `src/scripts/test-prisma.ts`: Script for testing the Prisma setup

## Using Prisma in Your Code

### Getting the PrismaClient Instance

```typescript
import PrismaService from '../database/prisma-service';

// Get the singleton instance
const prismaService = PrismaService.getInstance();
const prisma = prismaService.prisma;
```

### Querying Data

```typescript
// Find a user by ID
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { settings: true } // Include related data
});

// Find multiple users
const users = await prisma.user.findMany({
  where: { email: { contains: '@example.com' } },
  orderBy: { createdAt: 'desc' }
});
```

### Creating Data

```typescript
// Create a user
const user = await prisma.user.create({
  data: {
    username: 'newuser',
    email: 'new.user@example.com',
    passwordHash: 'hashed_password',
    settings: {
      create: {
        // Create related settings in one query
        language: 'en-US',
        theme: 'dark'
      }
    }
  }
});
```

### Updating Data

```typescript
// Update a user
const updatedUser = await prisma.user.update({
  where: { id: userId },
  data: { 
    username: 'updatedname',
    lastLogin: new Date()
  }
});
```

### Deleting Data

```typescript
// Delete a user
const deletedUser = await prisma.user.delete({
  where: { id: userId }
});
```

### Transactions

```typescript
// Run multiple operations in a transaction
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ /* ... */ });
  const session = await tx.session.create({ /* ... */ });
  return { user, session };
});
```

## Extending the Schema

To extend the schema with new models or fields:

1. Edit the `prisma/schema.prisma` file
2. Run `npm run prisma:generate` to update the Prisma Client
3. Run `npm run prisma:push` to update the database schema

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Prisma Client API Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference) 