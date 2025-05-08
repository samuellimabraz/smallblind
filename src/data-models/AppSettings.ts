/**
 * Application settings for users
 */
export interface SpeechSettings {
    voiceId: string;
    pitch: number;
    rate: number;
    volume: number;
}

export interface VisionSettings {
    detailLevel: 'low' | 'medium' | 'high';
    objectHighlighting: boolean;
    obstacleSensitivity: number;
}

export interface GeneralSettings {
    theme: 'light' | 'dark' | 'highContrast';
    hapticFeedback: boolean;
    autoLogin: boolean;
}

export interface AccessibilitySettings {
    fontSize: number;
    contrastLevel: number;
    gestureSensitivity: number;
}

export class AppSettings {
    /**
     * Unique identifier for the settings
     */
    id: string;

    /**
     * User ID these settings belong to
     */
    userId: string;

    /**
     * Speech-related settings
     */
    speechSettings: SpeechSettings;

    /**
     * Vision-related settings
     */
    visionSettings: VisionSettings;

    /**
     * General application settings
     */
    generalSettings: GeneralSettings;

    /**
     * Accessibility settings
     */
    accessibilitySettings: AccessibilitySettings;

    constructor(data: Partial<AppSettings>) {
        this.id = data.id || '';
        this.userId = data.userId || '';
        this.speechSettings = data.speechSettings || {
            voiceId: 'default',
            pitch: 1.0,
            rate: 1.0,
            volume: 1.0
        };
        this.visionSettings = data.visionSettings || {
            detailLevel: 'medium',
            objectHighlighting: true,
            obstacleSensitivity: 0.5
        };
        this.generalSettings = data.generalSettings || {
            theme: 'light',
            hapticFeedback: true,
            autoLogin: false
        };
        this.accessibilitySettings = data.accessibilitySettings || {
            fontSize: 16,
            contrastLevel: 1.0,
            gestureSensitivity: 0.5
        };
    }
} 