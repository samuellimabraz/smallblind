/**
 * Environment variable utilities for SmallBlind
 * Provides safe access to environment variables with fallbacks
 */

export const env = {
  // Facial Recognition API Configuration
  FACIAL_RECOGNITION_API_URL:
    import.meta.env.VITE_FACIAL_RECOGNITION_API_URL ||
    "http://localhost:8000/api",

  // Hugging Face API Token
  HUGGING_FACE_TOKEN: import.meta.env.VITE_HUGGING_FACE_TOKEN,

  // Backend API URL
  BACKEND_API_URL:
    import.meta.env.VITE_BACKEND_API_URL ||
    "http://localhost:3000/api",

  // Check if required environment variables are available
  isConfigured: {
    facialRecognition: !!import.meta.env.VITE_FACIAL_RECOGNITION_API_URL,
    huggingFace: !!import.meta.env.VITE_HUGGING_FACE_TOKEN,
    backend: !!import.meta.env.VITE_BACKEND_API_URL,
  },

  // Get environment configuration status
  getStatus: () => ({
    facialRecognitionConfigured: !!import.meta.env
      .VITE_FACIAL_RECOGNITION_API_URL,
    huggingFaceConfigured: !!import.meta.env.VITE_HUGGING_FACE_TOKEN,
    backendConfigured: !!import.meta.env.VITE_BACKEND_API_URL,
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
  }),

  // Get missing environment variables
  getMissingVars: () => {
    const missing: string[] = [];

    if (!import.meta.env.VITE_HUGGING_FACE_TOKEN) {
      missing.push("VITE_HUGGING_FACE_TOKEN");
    }

    return missing;
  },
};

// Helper function to validate environment setup
export const validateEnvironment = () => {
  const missing = env.getMissingVars();

  if (missing.length > 0) {
    console.warn("Missing environment variables:", missing);
    console.warn(
      "Some features may not work properly. Please check your .env file.",
    );
  }

  return missing.length === 0;
};

// Development mode helper
export const isDev = import.meta.env.DEV;
