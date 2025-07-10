/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FACIAL_RECOGNITION_API_URL: string;
  readonly VITE_HUGGING_FACE_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
