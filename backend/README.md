# SmallBlind: Vision API

SmallBlind is an API that provides vision capabilities including object detection and image description with persistent storage of analysis results.

## Features

- Object detection using Hugging Face transformers.js models
- Image description using:
  - Llama.cpp server with multimodal models (InternVL3, SmolVLM)
- Persistent storage of vision analysis results in PostgreSQL
- User authentication and session management
- Vision history retrieval with pagination
- Image analysis history tied to user accounts and sessions

## Requirements

- Docker and Docker Compose (for containerized deployment)
- Node.js 18+ (for local development only)

## Quick Start

The easiest way to get started is to use the setup script:

```bash
# Make the setup script executable
chmod +x scripts/setup.sh

# Run the setup script
./scripts/setup.sh
```

The script will:
1. Create a `.env` file with a secure JWT secret
2. Set up the necessary directories
3. Check for required dependencies
4. Guide you through the next steps

## Running with Docker (Recommended)

The easiest way to run SmallBlind is using Docker Compose, which will set up the entire application stack including the database, llama.cpp server, and the API.

### 1. Download the Models

Run the following script to download the required model files:

```bash
# Make the script executable
chmod +x scripts/download-models.sh

# Run the script
./scripts/download-models.sh
```

The script will guide you through downloading either:
- InternVL3-1B-Instruct (recommended for better quality)
- SmolVLM-500M-Instruct (smaller and faster)

### 2. Configure Environment Variables

Copy the sample .env file and adjust as needed:

```bash
cp .env.example .env
```

For security, generate a strong JWT secret:

```bash
# Make the script executable
chmod +x scripts/generate-jwt-secret.sh

# Generate a secure secret
./scripts/generate-jwt-secret.sh
```

### 3. Start All Services

```bash
# Build and start all services
docker compose up -d
```

This single command will:
- Set up the PostgreSQL database
- Start the llama.cpp server with the specified model
- Build and run the Node.js API server

The API will be available at http://localhost:3000 by default.

To view logs:
```bash
docker compose logs -f api
```

To stop all services:
```bash
docker compose down
```

## Local Development Setup

If you prefer to run the API locally during development:

### 1. Database Setup and Prisma Configuration

SmallBlind uses Prisma ORM to manage database operations. The database schema is defined in `prisma/schema.prisma`.

#### Initial Database Setup

When running the application for the first time:

```bash
# Install dependencies
npm install

# Create and apply database migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate
```

### 2. Using Prisma Studio

Prisma Studio provides a visual interface to view and modify your database:

```bash
# Start Prisma Studio
npx prisma studio
```

This will open Prisma Studio at http://localhost:5555, where you can:
- Browse all database tables and records
- View relationships between models
- Create, update, or delete records
- Filter and sort data

### 3. Database Schema Overview

The database includes the following key models:
- **User**: Stores user account information
- **Session**: Tracks user sessions
- **VisionAnalysis**: Parent record for all vision analyses
- **ObjectDetection**: Stores object detection results
- **DetectedObject**: Stores individual objects found in images
- **ImageDescription**: Stores image description results

### 4. Setting Up the Llama.cpp Server

Start just the required Docker services:

```bash
# Start PostgreSQL and llama.cpp server
docker compose up -d db llama-server
```

### 5. Start the Development Server

```bash
# Run the API in development mode
npm run dev
```

## API Usage

Once everything is set up, you can use the various API endpoints:

### Authentication

```
POST /api/auth/register
POST /api/auth/login
```

### Object Detection

```
POST /api/vision/object-detection
```

With the following form parameters:
- `image`: Image file to analyze
- `model` (optional): Detection model name
- `threshold` (optional): Detection confidence threshold
- `maxObjects` (optional): Maximum number of objects to return

### Image Description

```
POST /api/llama/describe-image
```

With the following form parameters:
- `image`: Image file to describe
- `prompt` (optional): Custom prompt to guide the description
- `model` (optional): Model ID ('internvl3-1b' or 'smolvlm-500m')
- `maxNewTokens` (optional): Maximum length of generated description
- `doSample` (optional): Whether to use sampling for text generation

### Vision History

```
GET /api/vision/history
GET /api/vision/history/session/{sessionId}
GET /api/vision/history/{id}
```

## What to Expect in the Database

After using the application, you'll see the following in Prisma Studio:

1. **Users Table**: 
   - User accounts created through registration
   - Authentication information

2. **Sessions Table**: 
   - Active user sessions
   - Session start and end times

3. **VisionAnalysis Table**:
   - Records for each analysis performed
   - References to users and sessions
   - Image metadata (hash, format)
   - Timestamp information

4. **ObjectDetection Table**:
   - Results from object detection operations
   - Model information used for detection
   - Processing time statistics

5. **DetectedObject Table**:
   - Individual objects detected within images
   - Confidence scores
   - Bounding box coordinates

6. **ImageDescription Table**:
   - Generated descriptions for images
   - Model information and parameters used
   - Processing time statistics

Each record includes relationships to allow easy tracing between users, sessions, and the analyses performed.

## Docker Compose Services

The Docker Compose setup includes:

1. **PostgreSQL Database**: Stores user and session data
2. **Llama.cpp Server**: Provides multimodal inference capabilities
3. **Node.js API**: Serves the SmallBlind API endpoints

## Environment Variables

The main environment variables are defined in the `.env` file:

```
POSTGRES_USER=postgre
POSTGRES_PASSWORD=postgre
POSTGRES_DB=postgre

DATABASE_URL="postgresql://postgre:postgre@db:5432/postgre?schema=public"

# JWT Authentication
JWT_SECRET="your-secret-key"
JWT_EXPIRATION=3600  # 1 hour in seconds
JWT_REFRESH_EXPIRATION=604800  # 7 days in seconds

# Server Configuration
PORT=3000
NODE_ENV=production

# Llama.cpp Server Configuration
LLAMA_SERVER_URL=http://llama-server:8080
LLAMA_DEFAULT_MODEL=internvl3-1b
```

## Facial Recognition Configuration

The application integrates with an external facial recognition API. To configure it properly, you need to set the following environment variables in your `.env` file:

```bash
# Facial Recognition API URL
FACIAL_RECOGNITION_API_URL=https://faceapi-113664566132.europe-west1.run.app

# Facial Recognition Configuration
FACE_RECOGNITION_ORG_NAME=smallblind
FACE_RECOGNITION_API_KEY=your-actual-api-key-here
FACE_RECOGNITION_API_KEY_NAME=smallblind-api-key
FACE_RECOGNITION_USER=system
```

### Configuration Details

- **FACIAL_RECOGNITION_API_URL**: The base URL of the external facial recognition API
- **FACE_RECOGNITION_ORG_NAME**: Your organization name (used to create/identify your org on the API)
- **FACE_RECOGNITION_API_KEY**: The actual API key for authentication (this should be the unhashed key)
- **FACE_RECOGNITION_API_KEY_NAME**: The name/identifier for your API key
- **FACE_RECOGNITION_USER**: The user identifier for API requests

### How It Works

1. **Initialization**: On startup, the application will:
   - Create the organization if it doesn't exist
   - Create the API key if it doesn't exist
   - If they already exist, it will continue normally

2. **Authentication**: For protected routes (register, recognize), the application uses:
   - **Authorization header**: `Bearer ${FACE_RECOGNITION_API_KEY}`
   - **api_auth payload**: Contains the user and api_key_name for verification

3. **Person Registration**: Users can register people through the webcam interface, which:
   - Captures multiple photos automatically
   - Converts them to base64 format
   - Sends them to the external API for training

4. **Face Recognition**: During camera analysis, the system can:
   - Detect faces in images
   - Identify registered people
   - Return confidence scores and bounding boxes

### Getting Your API Key

To get your actual API key:

1. The application will attempt to create an organization and API key automatically
2. Check the server logs for the API key creation response
3. If successful, the API should return the actual key you need to use
4. Update the `FACE_RECOGNITION_API_KEY` environment variable with this key
5. Restart the application

### Troubleshooting

- **"API key not configured"**: Make sure `FACE_RECOGNITION_API_KEY` is set in your `.env` file
- **Authentication errors**: Verify that the API key is the actual unhashed key, not the hashed version
- **Organization not found**: The application will create it automatically on first run
- **API key already exists**: This is normal - the application will continue with the existing key

## API Documentation

API documentation is available at:

```
http://localhost:3000/api-docs
```

## Database Maintenance

For ongoing database maintenance:

```bash
# Update database schema after changes to prisma/schema.prisma
npx prisma migrate dev --name <descriptive_name>

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Update Prisma client after schema changes
npx prisma generate
```

## Accessing Analysis Results

After performing vision analyses:

1. Authenticate by creating an account and logging in
2. Upload images for analysis using the object detection or image description endpoints
3. View your analysis history at `/api/vision/history`
4. View specific analysis details by ID at `/api/vision/history/{id}`

Each analysis is automatically associated with your user account and current session. 