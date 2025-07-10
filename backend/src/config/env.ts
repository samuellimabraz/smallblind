import dotenv from 'dotenv';

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000'),
  
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  
  FACIAL_RECOGNITION_API_URL: process.env.FACIAL_RECOGNITION_API_URL || 'http://localhost:8000',
  FACE_RECOGNITION_ORG_NAME: process.env.FACE_RECOGNITION_ORG_NAME || 'smallblind',
  FACE_RECOGNITION_API_KEY: process.env.FACE_RECOGNITION_API_KEY || '',
  FACE_RECOGNITION_API_KEY_NAME: process.env.FACE_RECOGNITION_API_KEY_NAME || 'smallblind-api-key',
  FACE_RECOGNITION_USER: process.env.FACE_RECOGNITION_USER || 'system',
  
  HUGGING_FACE_TOKEN: process.env.HUGGING_FACE_TOKEN || '',
  
  LLAMA_CPP_SERVER_URL: process.env.LLAMA_CPP_SERVER_URL || 'http://localhost:8080',
  
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  validateRequired: () => {
    const required = ['DATABASE_URL', 'JWT_SECRET'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  },
}; 