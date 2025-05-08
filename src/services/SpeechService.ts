import { BaseService, ServiceConfig } from './BaseService';
import { ModelManager } from '../core/ModelManager';
import { AudioModel } from '../models/AudioModel';
import { ILogger } from '../interfaces/ILogger';

export interface Voice {
    id: string;
    name: string;
    gender: 'male' | 'female' | 'neutral';
    language: string;
    tags: string[];
}

export interface VoiceProfile {
    userId: string;
    preferredVoiceId: string;
    speechRate: number;
    pitch: number;
    volume: number;
}

export interface TTSOptions {
    voiceId?: string;
    speechRate?: number;
    pitch?: number;
    volume?: number;
}

export interface SpeechPreferences {
    preferredVoiceId: string;
    speechRate: number;
    pitch: number;
    volume: number;
    pauseBetweenSentences: number;
}

/**
 * Service for speech-related tasks
 */
export class SpeechService extends BaseService {
    private modelManager: ModelManager;
    private audioModels: Map<string, AudioModel>;
    private voiceProfiles: Map<string, VoiceProfile>;
    private availableVoices: Voice[];

    constructor(config: ServiceConfig, logger: ILogger, modelManager: ModelManager) {
        super(config, logger);
        this.modelManager = modelManager;
        this.audioModels = new Map<string, AudioModel>();
        this.voiceProfiles = new Map<string, VoiceProfile>();
        this.availableVoices = this.initializeVoices();
    }

    /**
     * Initialize the speech service
     */
    public async initialize(): Promise<void> {
        await super.initialize();

        // Pre-load commonly used models
        const ttsModel = await this.getOrLoadModel('text-to-speech');
        const sttModel = await this.getOrLoadModel('speech-to-text');

        this.logger.info('Speech service initialized', {
            loadedModels: Array.from(this.audioModels.keys()),
            availableVoices: this.availableVoices.length
        });
    }

    /**
     * Convert text to speech
     * @param text Text to convert to speech
     * @param options TTS options
     */
    public async textToSpeech(text: string, options?: TTSOptions): Promise<Buffer> {
        this.logActivity('Converting text to speech', { textLength: text.length });

        try {
            const model = await this.getOrLoadModel('text-to-speech');

            // Prepare input for the model
            const ttsInput = {
                text,
                voiceId: options?.voiceId || 'default',
                speechRate: options?.speechRate || 1.0,
                pitch: options?.pitch || 1.0,
                volume: options?.volume || 1.0
            };

            // Generate speech
            const result = await model.predict(ttsInput);

            if (result instanceof Buffer) {
                return result;
            } else if (result.audio && result.audio instanceof Buffer) {
                return result.audio;
            } else {
                throw new Error('TTS model did not return valid audio buffer');
            }
        } catch (error) {
            this.logger.error('Error in text-to-speech conversion', error);
            throw error;
        }
    }

    /**
     * Convert speech to text
     * @param audio Audio buffer
     */
    public async speechToText(audio: Buffer): Promise<string> {
        this.logActivity('Converting speech to text', { audioSize: audio.length });

        try {
            const model = await this.getOrLoadModel('speech-to-text');

            // Convert speech to text
            const result = await model.predict(audio);

            if (typeof result === 'string') {
                return result;
            } else if (result.text && typeof result.text === 'string') {
                return result.text;
            } else {
                throw new Error('STT model did not return valid text');
            }
        } catch (error) {
            this.logger.error('Error in speech-to-text conversion', error);
            return '';
        }
    }

    /**
     * Get available TTS voices
     */
    public async getAvailableVoices(): Promise<Voice[]> {
        return this.availableVoices;
    }

    /**
     * Update user's speech preferences
     * @param userId User ID
     * @param preferences Speech preferences
     */
    public async updatePreferences(userId: string, preferences: SpeechPreferences): Promise<boolean> {
        this.logActivity('Updating speech preferences', { userId });

        try {
            // Create or update voice profile
            const profile: VoiceProfile = {
                userId,
                preferredVoiceId: preferences.preferredVoiceId,
                speechRate: preferences.speechRate,
                pitch: preferences.pitch,
                volume: preferences.volume
            };

            // In a real implementation, this would be saved to a database
            this.voiceProfiles.set(userId, profile);

            return true;
        } catch (error) {
            this.logger.error('Error updating speech preferences', error);
            return false;
        }
    }

    /**
     * Get user's speech profile
     * @param userId User ID
     */
    public getVoiceProfile(userId: string): VoiceProfile | undefined {
        return this.voiceProfiles.get(userId);
    }

    /**
     * Initialize available voices
     */
    private initializeVoices(): Voice[] {
        // In a real implementation, this could be loaded from a configuration file or API
        return [
            {
                id: 'en-US-standard-A',
                name: 'Michael',
                gender: 'male',
                language: 'en-US',
                tags: ['standard', 'clear']
            },
            {
                id: 'en-US-standard-B',
                name: 'Emma',
                gender: 'female',
                language: 'en-US',
                tags: ['standard', 'clear']
            },
            {
                id: 'en-US-neural-C',
                name: 'Dave',
                gender: 'male',
                language: 'en-US',
                tags: ['neural', 'natural']
            },
            {
                id: 'en-US-neural-D',
                name: 'Olivia',
                gender: 'female',
                language: 'en-US',
                tags: ['neural', 'natural']
            },
            {
                id: 'en-GB-standard-A',
                name: 'William',
                gender: 'male',
                language: 'en-GB',
                tags: ['standard', 'clear']
            },
            {
                id: 'en-GB-standard-B',
                name: 'Charlotte',
                gender: 'female',
                language: 'en-GB',
                tags: ['standard', 'clear']
            }
        ];
    }

    /**
     * Get or load an audio model by task
     * @param task Model task
     */
    private async getOrLoadModel(task: string): Promise<AudioModel> {
        // Check if we already have this model loaded
        const cachedModel = Array.from(this.audioModels.values()).find(model =>
            model.getMetadata().tasks.includes(task)
        );

        if (cachedModel) {
            return cachedModel;
        }

        // Get model from model manager
        const model = await this.modelManager.getModelForTask(task);

        if (!model) {
            throw new Error(`No model available for task: ${task}`);
        }

        if (model instanceof AudioModel) {
            // Cache the model for future use
            this.audioModels.set(model.getMetadata().id, model);
            return model;
        } else {
            throw new Error(`Model for task ${task} is not an audio model`);
        }
    }
} 