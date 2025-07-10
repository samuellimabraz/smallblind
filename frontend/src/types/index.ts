export interface Person {
  id: string;
  name: string;
  photos: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  apiKey: string;
}

export interface User {
  id: string;
  email: string;
  organizationId?: string;
}

export interface VisionAnalysisResult {
  type: "object-detection" | "ocr" | "scene-description" | "face-recognition";
  confidence: number;
  description: string;
  objects?: DetectedObject[];
  text?: string;
  faces?: RecognizedFace[];
  timestamp: Date;
}

export interface DetectedObject {
  label: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface RecognizedFace {
  personId?: string;
  personName?: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface CameraSettings {
  resolution: "low" | "medium" | "high";
  autoCapture: boolean;
  voiceAnnouncements: boolean;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  textToSpeech: boolean;
  voiceCommands: boolean;
  fontSize: "normal" | "large" | "extra-large";
  speechRate: number;
}

export type NavigationPage =
  | "home"
  | "login"
  | "menu"
  | "camera"
  | "persons"
  | "settings";
