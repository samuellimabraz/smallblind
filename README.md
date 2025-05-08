# SmallBlind Backend

A modular backend system for AI-powered assistive services designed to help visually impaired users interact with their environment.

## Overview

SmallBlind Backend is a TypeScript-based service-oriented architecture that provides various AI capabilities through a unified API. The system is designed to be modular, extensible, and maintainable, with clear separation of concerns between different components.

## Features

- **Vision Services**: Object detection, image classification, scene description
- **Speech Services**: Text-to-speech and speech-to-text conversion with customizable voices
- **NLP Services**: Sentiment analysis, entity recognition, text translation, and summarization
- **OCR Services**: Text extraction from images and document processing
- **Face Recognition**: Face detection, recognition, and identity management

## Architecture

The project follows a modular architecture with the following components:

- **Models**: Base classes for different AI model types (Vision, Audio, Text, OCR, Face Recognition)
- **Services**: Higher-level services that use models to provide business functionality
- **API Layer**: Express-based REST API with authentication and rate limiting
- **Core Components**: Database connector, model manager, and other system utilities
- **WebSocket Support**: Real-time communication for specific use cases

## Directory Structure

```
smallblind/
├── src/
│   ├── api/             # API endpoints and controllers
│   ├── auth/            # Authentication and authorization
│   ├── config/          # Configuration management
│   ├── core/            # Core system components
│   ├── data-models/     # Data models and DTOs
│   ├── interfaces/      # TypeScript interfaces
│   ├── models/          # AI model wrappers
│   ├── services/        # Business logic services
│   ├── utils/           # Utility functions and helpers
│   └── index.ts         # Application entry point
├── tests/               # Test files
├── dist/                # Compiled JavaScript (gitignored)
├── models/              # AI model files (gitignored)
├── storage/             # Storage for uploads, etc. (gitignored)
├── package.json         # Project dependencies
├── tsconfig.json        # TypeScript configuration
└── README.md            # This file
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- TypeScript

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/smallblind.git
cd smallblind
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example` and configure environment variables.

4. Build the project:
```bash
npm run build
```

5. Start the server:
```bash
npm start
```

For development:
```bash
npm run dev
```

## API Documentation

The API follows RESTful principles and provides endpoints for all services. Authentication is required for most endpoints.

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication

Most endpoints require authentication using JWT tokens.

```
Authorization: Bearer <token>
```

To obtain a token, use the `/auth/login` endpoint.

### Main API Endpoints

- `/auth` - Authentication endpoints
- `/vision` - Vision-related endpoints
- `/speech` - Speech-related endpoints
- `/nlp` - Natural language processing endpoints
- `/ocr` - OCR-related endpoints
- `/face` - Face recognition endpoints

For detailed API documentation, see the [API Docs](docs/api.md).

## Development

### Code Style

The project uses ESLint and Prettier for code formatting and linting:

```bash
# Format code
npm run format

# Lint code
npm run lint
```

### Testing

Tests are written using Jest:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- This project structure is based on modern TypeScript best practices
- AI model integration follows recommended patterns for efficient inference 