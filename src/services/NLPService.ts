import { BaseService, ServiceConfig } from './BaseService';
import { ModelManager } from '../core/ModelManager';
import { TextModel } from '../models/TextModel';
import { ILogger } from '../interfaces/ILogger';

export interface SentimentResult {
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    confidence: number;
}

export interface EntityRecognitionResult {
    entities: Entity[];
    text: string;
}

export interface Entity {
    text: string;
    type: string;
    startIndex: number;
    endIndex: number;
    score: number;
}

export interface TranslationOptions {
    sourceLanguage?: string;
    targetLanguage: string;
    preserveFormatting?: boolean;
}

export interface LanguageDetectionResult {
    language: string;
    confidence: number;
    alternatives?: Array<{ language: string; confidence: number }>;
}

/**
 * Service for natural language processing tasks
 */
export class NLPService extends BaseService {
    private modelManager: ModelManager;
    private textModels: Map<string, TextModel>;
    private supportedLanguages: Map<string, string>;

    constructor(config: ServiceConfig, logger: ILogger, modelManager: ModelManager) {
        super(config, logger);
        this.modelManager = modelManager;
        this.textModels = new Map<string, TextModel>();
        this.supportedLanguages = this.initializeSupportedLanguages();
    }

    /**
     * Initialize the NLP service
     */
    public async initialize(): Promise<void> {
        await super.initialize();

        try {
            // Pre-load commonly used models
            const sentimentModel = await this.getOrLoadModel('sentiment-analysis');
            const nerModel = await this.getOrLoadModel('named-entity-recognition');
            const translationModel = await this.getOrLoadModel('translation');

            this.logger.info('NLP service initialized', {
                loadedModels: Array.from(this.textModels.keys()),
                supportedLanguages: this.supportedLanguages.size
            });
        } catch (error) {
            this.logger.error('Error initializing NLP service', error);
        }
    }

    /**
     * Analyze sentiment of text
     * @param text Text to analyze
     */
    public async analyzeSentiment(text: string): Promise<SentimentResult> {
        this.logActivity('Analyzing sentiment', { textLength: text.length });

        if (!text || typeof text !== 'string') {
            throw new Error('Invalid input: text is required');
        }

        try {
            const model = await this.getOrLoadModel('sentiment-analysis');

            // Predict sentiment
            const result = await model.predict(text);

            // Process result
            if (result && result.sentiment) {
                return {
                    sentiment: result.sentiment,
                    score: result.score || 0,
                    confidence: result.confidence || 0
                };
            } else {
                return {
                    sentiment: 'neutral',
                    score: 0.5,
                    confidence: 0
                };
            }
        } catch (error) {
            this.logger.error('Error analyzing sentiment', error);
            return { sentiment: 'neutral', score: 0.5, confidence: 0 };
        }
    }

    /**
     * Recognize named entities in text
     * @param text Text to analyze
     */
    public async recognizeEntities(text: string): Promise<EntityRecognitionResult> {
        this.logActivity('Recognizing entities', { textLength: text.length });

        if (!text || typeof text !== 'string') {
            throw new Error('Invalid input: text is required');
        }

        try {
            const model = await this.getOrLoadModel('named-entity-recognition');

            // Predict entities
            const result = await model.predict(text);

            // Process result
            if (result && Array.isArray(result.entities)) {
                return {
                    entities: result.entities.map(entity => ({
                        text: entity.text || '',
                        type: entity.type || 'UNKNOWN',
                        startIndex: entity.startIndex || 0,
                        endIndex: entity.endIndex || 0,
                        score: entity.score || 0
                    })),
                    text
                };
            } else {
                return { entities: [], text };
            }
        } catch (error) {
            this.logger.error('Error recognizing entities', error);
            return { entities: [], text };
        }
    }

    /**
     * Translate text from one language to another
     * @param text Text to translate
     * @param options Translation options
     */
    public async translateText(text: string, options: TranslationOptions): Promise<string> {
        this.logActivity('Translating text', {
            textLength: text.length,
            sourceLanguage: options.sourceLanguage || 'auto',
            targetLanguage: options.targetLanguage
        });

        if (!text || typeof text !== 'string') {
            throw new Error('Invalid input: text is required');
        }

        if (!options.targetLanguage) {
            throw new Error('Invalid options: targetLanguage is required');
        }

        try {
            // Check if target language is supported
            if (!this.supportedLanguages.has(options.targetLanguage)) {
                throw new Error(`Unsupported target language: ${options.targetLanguage}`);
            }

            // If source language is not specified, detect it
            let sourceLanguage = options.sourceLanguage;
            if (!sourceLanguage || sourceLanguage === 'auto') {
                const detectionResult = await this.detectLanguage(text);
                sourceLanguage = detectionResult.language;
            }

            // Check if source language is supported
            if (!this.supportedLanguages.has(sourceLanguage)) {
                throw new Error(`Unsupported source language: ${sourceLanguage}`);
            }

            const model = await this.getOrLoadModel('translation');

            // Prepare translation input
            const translationInput = {
                text,
                sourceLanguage,
                targetLanguage: options.targetLanguage,
                preserveFormatting: options.preserveFormatting || false
            };

            // Predict translation
            const result = await model.predict(translationInput);

            // Process result
            if (typeof result === 'string') {
                return result;
            } else if (result && result.translatedText) {
                return result.translatedText;
            } else {
                throw new Error('Invalid translation result');
            }
        } catch (error) {
            this.logger.error('Error translating text', error);
            return text; // Return original text on error
        }
    }

    /**
     * Detect language of text
     * @param text Text to analyze
     */
    public async detectLanguage(text: string): Promise<LanguageDetectionResult> {
        this.logActivity('Detecting language', { textLength: text.length });

        if (!text || typeof text !== 'string') {
            throw new Error('Invalid input: text is required');
        }

        try {
            const model = await this.getOrLoadModel('language-detection');

            // Predict language
            const result = await model.predict(text);

            // Process result
            if (result && result.language) {
                return {
                    language: result.language,
                    confidence: result.confidence || 0,
                    alternatives: result.alternatives || []
                };
            } else {
                return { language: 'en', confidence: 0 };
            }
        } catch (error) {
            this.logger.error('Error detecting language', error);
            return { language: 'en', confidence: 0 };
        }
    }

    /**
     * Summarize text
     * @param text Text to summarize
     * @param maxLength Maximum length of summary
     */
    public async summarizeText(text: string, maxLength?: number): Promise<string> {
        this.logActivity('Summarizing text', {
            textLength: text.length,
            maxLength
        });

        if (!text || typeof text !== 'string') {
            throw new Error('Invalid input: text is required');
        }

        try {
            const model = await this.getOrLoadModel('summarization');

            // Prepare summarization input
            const summarizationInput = {
                text,
                maxLength: maxLength || Math.max(100, Math.ceil(text.length * 0.2)) // Default to 20% of original length
            };

            // Predict summary
            const result = await model.predict(summarizationInput);

            // Process result
            if (typeof result === 'string') {
                return result;
            } else if (result && result.summary) {
                return result.summary;
            } else {
                throw new Error('Invalid summarization result');
            }
        } catch (error) {
            this.logger.error('Error summarizing text', error);
            return text.substring(0, maxLength || 100) + '...'; // Return truncated text on error
        }
    }

    /**
     * Get supported languages
     */
    public getSupportedLanguages(): Map<string, string> {
        return new Map(this.supportedLanguages);
    }

    /**
     * Initialize supported languages
     */
    private initializeSupportedLanguages(): Map<string, string> {
        // In a real implementation, this could be loaded from a configuration file or API
        const languages = new Map<string, string>();

        languages.set('ar', 'Arabic');
        languages.set('zh', 'Chinese');
        languages.set('cs', 'Czech');
        languages.set('da', 'Danish');
        languages.set('nl', 'Dutch');
        languages.set('en', 'English');
        languages.set('fi', 'Finnish');
        languages.set('fr', 'French');
        languages.set('de', 'German');
        languages.set('el', 'Greek');
        languages.set('he', 'Hebrew');
        languages.set('hi', 'Hindi');
        languages.set('hu', 'Hungarian');
        languages.set('id', 'Indonesian');
        languages.set('it', 'Italian');
        languages.set('ja', 'Japanese');
        languages.set('ko', 'Korean');
        languages.set('no', 'Norwegian');
        languages.set('pl', 'Polish');
        languages.set('pt', 'Portuguese');
        languages.set('ro', 'Romanian');
        languages.set('ru', 'Russian');
        languages.set('es', 'Spanish');
        languages.set('sv', 'Swedish');
        languages.set('th', 'Thai');
        languages.set('tr', 'Turkish');
        languages.set('uk', 'Ukrainian');
        languages.set('vi', 'Vietnamese');

        return languages;
    }

    /**
     * Get or load a text model by task
     * @param task Model task
     */
    private async getOrLoadModel(task: string): Promise<TextModel> {
        // Check if we already have this model loaded
        const cachedModel = Array.from(this.textModels.values()).find(model =>
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

        if (model instanceof TextModel) {
            // Cache the model for future use
            this.textModels.set(model.getMetadata().id, model);
            return model;
        } else {
            throw new Error(`Model for task ${task} is not a text model`);
        }
    }
} 