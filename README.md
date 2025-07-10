# SmallBlind - AI-Powered Visual Assistance

SmallBlind is an AI-powered visual assistance application designed to help visually impaired users understand their environment through computer vision and facial recognition technologies.

## Features

### Core Vision Analysis
- **Object Detection**: Identify and locate objects in images using YOLO models
- **Scene Description**: Generate detailed descriptions of scenes using vision-language models
- **Text Extraction (OCR)**: Extract and read text from images
- **Facial Recognition**: Recognize registered people in images

### Facial Recognition Integration
- **Person Registration**: Register people with multiple photos for recognition
- **Face Recognition**: Identify registered people in captured images
- **External API Integration**: Uses external facial recognition service at `https://faceapi-113664566132.europe-west1.run.app`

## Architecture

### Backend (Node.js/Express)
- **Facial Recognition Service**: Handles communication with external API
- **Facial Recognition Controller**: Manages API endpoints
- **Authentication**: JWT-based authentication system
- **Database**: PostgreSQL with Prisma ORM

### Frontend (React/TypeScript)
- **Camera Page**: Integrated facial recognition in camera analysis
- **Person Management**: Interface for registering people
- **Facial Recognition Components**: Reusable UI components
- **Authentication Context**: Automatic service initialization

## API Endpoints

### Facial Recognition
- `POST /api/facial-recognition/initialize` - Initialize organization and API key
- `POST /api/facial-recognition/register` - Register a person with photos
- `POST /api/facial-recognition/recognize` - Recognize faces in an image
- `GET /api/facial-recognition/persons` - List registered persons (limited by external API)
- `GET /api/facial-recognition/config` - Get service configuration

## Environment Configuration

### Backend (.env)
```
FACIAL_RECOGNITION_API_URL=https://faceapi-113664566132.europe-west1.run.app
DATABASE_URL=postgresql://user:password@localhost:5432/smallblind
JWT_SECRET=your-secret-key
```

### Frontend (.env)
```
VITE_BACKEND_API_URL=http://localhost:3000/api
VITE_FACIAL_RECOGNITION_API_URL=https://faceapi-113664566132.europe-west1.run.app/
VITE_HUGGING_FACE_TOKEN=your-hugging-face-token
```

## Usage

### 1. Person Registration
1. Navigate to Person Management page
2. Click "Add Person"
3. Enter person's name
4. Upload 2-5 clear photos of the person's face
5. Click "Register"

### 2. Face Recognition
1. Go to Camera page
2. Enable "Face Recognition" in Analysis Configuration
3. Capture an image
4. Registered people will be identified automatically

## API Limitations

The external facial recognition API has the following limitations:
- **No Person Listing**: Cannot retrieve list of registered persons
- **No Person Updates**: Cannot modify registered person data
- **No Person Deletion**: Cannot remove registered persons
- **Permanent Registration**: Once registered, persons cannot be changed

## Key Integration Points

### Authentication Flow
1. User logs in → JWT token generated
2. Token set in facial recognition API client
3. Organization automatically initialized
4. Service ready for person registration and recognition

### Camera Analysis Integration
1. User captures image
2. If face recognition enabled, image sent to backend
3. Backend forwards to external API
4. Results processed and returned to frontend
5. Recognized people displayed in analysis results

### Error Handling
- Graceful handling of API limitations
- User-friendly error messages
- Fallback behavior for unavailable features

## Development

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Build
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## Security Considerations

- JWT tokens for authentication
- API key management for external service
- Image data handled securely
- No persistent storage of facial data locally

## Future Enhancements

- Local database for person management
- Offline face recognition capabilities
- Enhanced person search and filtering
- Batch person registration
- Face recognition confidence tuning

## Troubleshooting

### Common Issues

1. **API Initialization Failed**
   - Check internet connection
   - Verify API URL in environment variables
   - Ensure external API is accessible

2. **Person Registration Failed**
   - Check image file formats (JPG, PNG supported)
   - Ensure images contain clear faces
   - Verify API key is configured

3. **Face Recognition Not Working**
   - Ensure face recognition is enabled in camera settings
   - Check that persons are registered
   - Verify image quality and lighting

### Debug Mode
Set `NODE_ENV=development` in backend for detailed logging and optional authentication.

## License

This project is licensed under the MIT License. 