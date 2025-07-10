# SmallBlind Backend Technical Specification

## 1. System Architecture

### 1.1 Overall Architecture

SmallBlind will follow a microservices architecture to handle different AI processing tasks efficiently:

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Application                      │
│          (React Native with Next.js, Vision Camera)             │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API Gateway Service                       │
│         (Express.js/TypeScript, Authentication, Routing)        │
└───┬───────────────┬───────────────┬───────────────┬─────────────┘
    │               │               │               │
    ▼               ▼               ▼               ▼
┌─────────────┐ ┌───────────┐ ┌─────────────┐ ┌─────────────────┐
│ Vision API  │ │Speech API │ │ Text API    │ │User/Profile API │
│             │ │           │ │             │ │                 │
└──────┬──────┘ └─────┬─────┘ └──────┬──────┘ └────────┬────────┘
       │              │              │                 │
       ▼              ▼              ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Model Management Layer                    │
│        (Model Loading, Quantization, Inference Optimization)    │
└───┬───────────────┬───────────────┬───────────────┬─────────────┘
    │               │               │               │
    ▼               ▼               ▼               ▼
┌─────────────┐ ┌───────────┐ ┌─────────────┐ ┌─────────────────┐
│Image Models │ │Audio Models│ │Text Models  │ │Vector DB/Search │
│             │ │           │ │             │ │                 │
└─────────────┘ └───────────┘ └─────────────┘ └─────────────────┘
```

### 1.2 Technology Stack

- **Runtime Environment**: Node.js with TypeScript
- **API Framework**: Express.js
- **WebSockets**: Socket.IO for real-time communication
- **Model Inference**: ONNX Runtime, TensorFlow.js, transformers-js
- **Databases**:
  - MongoDB for session/user data
  - Redis for caching and temporary storage
  - Milvus/Qdrant for vector database (facial recognition embeddings)
- **Authentication**: JWT, OAuth 2.0
- **Deployment**: Docker containers, Kubernetes for orchestration
- **CI/CD**: GitHub Actions

## 2. Core Services

### 2.1 API Gateway Service

The central entry point for all client requests, responsible for:
- Request routing
- Authentication and authorization
- Rate limiting
- Request/response transformation
- Logging and monitoring

### 2.2 Vision API Service

Handles all computer vision related tasks:
- Image processing and preprocessing
- Model inference routing
- Results formatting

### 2.3 Speech API Service

Manages speech-related functionalities:
- Speech-to-text conversion (STT)
- Text-to-speech conversion (TTS)
- Voice profile management

### 2.4 Text API Service

Processes text-based operations:
- OCR processing
- Question answering from extracted text
- Text analysis and interpretation

### 2.5 User/Profile API Service

Manages user-specific data:
- User preferences
- Session history
- Saved faces/objects for recognition
- Settings synchronization

### 2.6 Model Management Service

Centralizes model operations:
- Model loading and unloading
- Model quantization and optimization
- Model version management
- Inference scheduling and distribution

## 3. Database Architecture

### 3.1 Operational Database (MongoDB)

**Collections:**
- **Users**: User profiles and preferences
- **Sessions**: Chat/interaction history
- **AppSettings**: Application configuration
- **ModelRegistry**: Available model metadata

### 3.2 Vector Database (Milvus/Qdrant)

- Storage for facial recognition embeddings
- Fast similarity search for identification
- Custom collections for different embedding types

### 3.3 Cache Layer (Redis)

- Temporary storage for active sessions
- Model inference results caching
- Authentication token storage
- Rate limiting implementation

## 4. API Routes & Endpoints

### 4.1 Authentication Routes

```
POST /api/auth/register - Create new user account
POST /api/auth/login - Authenticate user
POST /api/auth/refresh - Refresh authentication token
GET /api/auth/profile - Get user profile
PUT /api/auth/profile - Update user profile
```

### 4.2 Vision API Routes

```
POST /api/vision/caption - Generate image description
POST /api/vision/detect-objects - Detect and identify objects
POST /api/vision/obstacle-detection - Identify potential obstacles
POST /api/vision/scene-understanding - Generate scene narrative
POST /api/vision/face-detection - Detect faces in image
POST /api/vision/face-recognition - Recognize registered faces
POST /api/vision/register-face - Register new face for recognition
```

### 4.3 Question-Answering Routes

```
POST /api/qa/visual - Answer questions about an image
POST /api/qa/document - Answer questions about a document
```

### 4.4 OCR Routes

```
POST /api/ocr/extract - Extract text from image
POST /api/ocr/document - Process document image (forms, receipts)
POST /api/ocr/read-aloud - Extract and convert text to speech
```

### 4.5 Speech Routes

```
POST /api/speech/text-to-speech - Convert text to speech
POST /api/speech/speech-to-text - Convert speech to text
GET /api/speech/voices - Get available TTS voices
PUT /api/speech/preferences - Update speech preferences
```

### 4.6 Session Management Routes

```
GET /api/sessions - Get user sessions history
GET /api/sessions/:id - Get specific session details
POST /api/sessions - Create new session
DELETE /api/sessions/:id - Delete session
```

### 4.7 WebSocket Endpoints

```
/ws/speech - Real-time speech streaming
/ws/vision - Real-time vision processing results
/ws/notifications - System notifications and alerts
```

## 5. Model Integration

### 5.1 Vision Models

| Model | Tasks | Format | Size |
|-------|-------|--------|------|
| SmolVLM2 | General captioning, VQA | ONNX | ~300MB |
| SmolDocling-256M | Document processing | ONNX | ~256MB |
| TinyYOLOv8 | Object detection | ONNX | ~6MB |
| FaceNet-ONNX | Face detection & embedding | ONNX | ~30MB |

### 5.2 Audio Models

| Model | Tasks | Format | Size |
|-------|-------|--------|------|
| Whisper Tiny | Speech-to-text | ONNX | ~75MB |
| Bark-small | Text-to-speech | ONNX | ~140MB |

### 5.3 Model Router

The Model Router will dynamically select the appropriate model based on:
- User request type
- Device capabilities
- Battery/resource constraints
- Task complexity

## 6. Operational Flow

### 6.1 Image Caption Generation Flow

1. User captures image via React Native Vision Camera
2. Image is preprocessed on device (resizing, normalization)
3. Image is sent to `/api/vision/caption` endpoint
4. API Gateway authenticates and routes request
5. Vision API Service selects appropriate model (SmolVLM2)
6. Model inference is performed
7. Caption is returned to client
8. Client converts caption to speech using Text-to-Speech API

### 6.2 Visual Question Answering Flow

1. User captures image and asks question (text or speech)
2. If audio question, Speech-to-Text converts to text
3. Image and question sent to `/api/qa/visual` endpoint
4. Vision API Service routes to VQA model
5. Model generates answer
6. Answer returned to client and converted to speech

### 6.3 OCR and Text Reading Flow

1. User captures document/text image
2. Image sent to `/api/ocr/extract` or `/api/ocr/document`
3. OCR model extracts text
4. Extracted text is processed and structured
5. Result sent to client
6. Client requests text-to-speech conversion if needed

### 6.4 Face Recognition Flow

1. User activates face recognition mode
2. Image captured and sent to `/api/vision/face-recognition`
3. Vision API detects faces and generates embeddings
4. Vector database performs similarity search
5. Matched identities returned to client
6. Client announces recognized individuals via speech

### 6.5 New Face Registration Flow

1. User activates face registration mode
2. Multiple angles of face captured
3. Faces sent to `/api/vision/register-face` with name/identifier
4. System generates embeddings for each angle
5. Embeddings stored in vector database
6. Confirmation returned to client

## 7. Security Considerations

### 7.1 Data Protection

- All sensitive data encrypted at rest and in transit
- Images processed temporarily and not stored by default
- User can opt-in to save specific images or sessions
- Regular purging of temporary data

### 7.2 Authentication & Authorization

- JWT-based authentication
- Scope-based permissions
- Rate limiting to prevent abuse
- Secure token storage and refresh mechanisms

### 7.3 Privacy

- Facial recognition data stored only on user's account
- Opt-in for all data collection features
- Clear user data deletion processes
- Compliance with accessibility and privacy regulations

## 8. Performance Optimization

### 8.1 Model Optimization Techniques

- ONNX model quantization (INT8, FP16)
- Model pruning where applicable
- Progressive loading of model components
- Caching of common inference results

### 8.2 API Optimization

- Connection pooling
- Response compression
- Pagination of large result sets
- Efficient binary protocols for image transfer

### 8.3 Resource Management

- Adaptive model selection based on device capabilities
- Background processing for non-critical tasks
- Graceful degradation when resources are constrained

## 9. Deployment Strategy

### 9.1 Development Environment

- Local development using Docker Compose
- Mock services for AI models during development
- Integration testing with actual models in CI pipeline

### 9.2 Production Environment

- Kubernetes-based deployment
- Horizontal scaling for API services
- Vertical scaling for model inference services
- CDN integration for static assets

### 9.3 Monitoring & Logging

- Prometheus for metrics
- ELK stack for log aggregation
- Error tracking and alerting
- Performance monitoring dashboards

## 10. Future Expansion

### 10.1 Planned Features

- Multi-language support
- Offline mode with compressed models
- User feedback loop to improve model accuracy
- Community-contributed model additions
- Integration with navigation systems

### 10.2 API Extensibility

- Plugin architecture for custom model integration
- Webhook support for third-party notifications
- Public API for developer community (with rate limiting)
