import { BaseService, ServiceConfig } from './BaseService';
import { ModelManager } from '../core/ModelManager';
import { OCRModel } from '../models/OCRModel';
import { ILogger } from '../interfaces/ILogger';
import fs from 'fs/promises';
import path from 'path';

export interface OCROptions {
    language?: string;
    detectOrientation?: boolean;
    detectLanguage?: boolean;
    enhanceImage?: boolean;
}

export interface DocumentField {
    name: string;
    value: string;
    confidence: number;
    boundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

export interface OCRDocument {
    documentType: string;
    fields: DocumentField[];
    pageCount: number;
    confidence: number;
}

export interface TextExtraction {
    fullText: string;
    lines: { text: string; boundingBox?: { x: number; y: number; width: number; height: number } }[];
    language?: string;
    confidence: number;
}

/**
 * Service for OCR (Optical Character Recognition) tasks
 */
export class OCRService extends BaseService {
    private modelManager: ModelManager;
    private ocrModels: Map<string, OCRModel>;
    private supportedLanguages: string[];
    private supportedDocumentTypes: string[];

    constructor(config: ServiceConfig, logger: ILogger, modelManager: ModelManager) {
        super(config, logger);
        this.modelManager = modelManager;
        this.ocrModels = new Map<string, OCRModel>();
        this.supportedLanguages = ['en', 'fr', 'de', 'es', 'it', 'pt', 'nl', 'ru', 'zh', 'ja'];
        this.supportedDocumentTypes = ['invoice', 'receipt', 'id_card', 'passport', 'driver_license', 'form'];
    }

    /**
     * Initialize the OCR service
     */
    public async initialize(): Promise<void> {
        await super.initialize();

        try {
            // Pre-load OCR model
            const ocrModel = await this.getOrLoadModel('text-extraction');
            const documentModel = await this.getOrLoadModel('document-analysis');

            this.logger.info('OCR service initialized', {
                loadedModels: Array.from(this.ocrModels.keys()),
                supportedLanguages: this.supportedLanguages.length,
                supportedDocumentTypes: this.supportedDocumentTypes.length
            });
        } catch (error) {
            this.logger.error('Error initializing OCR service', error);
        }
    }

    /**
     * Extract text from an image
     * @param image Image buffer or file path
     * @param options OCR options
     */
    public async extractText(image: Buffer | string, options?: OCROptions): Promise<TextExtraction> {
        this.logActivity('Extracting text from image', {
            imageType: typeof image === 'string' ? 'path' : 'buffer',
            options
        });

        try {
            // Load image if path is provided
            const imageBuffer = typeof image === 'string'
                ? await this.loadImageFromPath(image)
                : image;

            // Get OCR model
            const model = await this.getOrLoadModel('text-extraction');

            // Process options
            const processedOptions = this.processOptions(options);

            // Extract text
            const result = await model.extractText(imageBuffer);

            if (typeof result === 'string') {
                // Simple text extraction result
                return {
                    fullText: result,
                    lines: [{ text: result }],
                    confidence: 0.8 // Mock confidence
                };
            } else {
                // Structured OCR result
                return {
                    fullText: typeof result.text === 'string' ? result.text : '',
                    lines: Array.isArray(result.lines) ? result.lines : [{ text: result.text || '' }],
                    language: result.language || processedOptions.language,
                    confidence: result.confidence || 0.8
                };
            }
        } catch (error) {
            this.logger.error('Error extracting text', error);
            return {
                fullText: '',
                lines: [],
                confidence: 0
            };
        }
    }

    /**
     * Process a document image
     * @param image Image buffer or file path
     * @param documentType Type of document to process
     * @param options OCR options
     */
    public async processDocument(image: Buffer | string, documentType: string, options?: OCROptions): Promise<OCRDocument> {
        this.logActivity('Processing document', {
            documentType,
            imageType: typeof image === 'string' ? 'path' : 'buffer',
            options
        });

        if (!this.supportedDocumentTypes.includes(documentType)) {
            throw new Error(`Unsupported document type: ${documentType}`);
        }

        try {
            // Load image if path is provided
            const imageBuffer = typeof image === 'string'
                ? await this.loadImageFromPath(image)
                : image;

            // Get document analysis model
            const model = await this.getOrLoadModel('document-analysis');

            // Process document
            const result = await model.processDocument(imageBuffer);

            if (result && Array.isArray(result.fields)) {
                return {
                    documentType,
                    fields: result.fields.map(field => ({
                        name: field.name || '',
                        value: field.value || '',
                        confidence: field.confidence || 0,
                        boundingBox: field.boundingBox
                    })),
                    pageCount: result.pageCount || 1,
                    confidence: result.confidence || 0
                };
            } else {
                throw new Error('Invalid document processing result');
            }
        } catch (error) {
            this.logger.error('Error processing document', error);
            return {
                documentType,
                fields: [],
                pageCount: 1,
                confidence: 0
            };
        }
    }

    /**
     * Get supported document types
     */
    public getSupportedDocumentTypes(): string[] {
        return [...this.supportedDocumentTypes];
    }

    /**
     * Get supported languages for OCR
     */
    public getSupportedLanguages(): string[] {
        return [...this.supportedLanguages];
    }

    /**
     * Check if a document type is supported
     * @param documentType Document type to check
     */
    public isDocumentTypeSupported(documentType: string): boolean {
        return this.supportedDocumentTypes.includes(documentType);
    }

    /**
     * Load image from file path
     * @param imagePath Path to image file
     */
    private async loadImageFromPath(imagePath: string): Promise<Buffer> {
        try {
            // Check if file exists
            await fs.access(imagePath);

            // Check file extension
            const extension = path.extname(imagePath).toLowerCase().replace('.', '');
            const supportedFormats = ['jpg', 'jpeg', 'png', 'tiff', 'pdf', 'bmp'];

            if (!supportedFormats.includes(extension)) {
                throw new Error(`Unsupported file format for OCR: ${extension}`);
            }

            // Read file
            return await fs.readFile(imagePath);
        } catch (error) {
            this.logger.error('Error loading image from path', error);
            throw error;
        }
    }

    /**
     * Process OCR options
     * @param options OCR options
     */
    private processOptions(options?: OCROptions): OCROptions {
        const defaultOptions: OCROptions = {
            language: 'en',
            detectOrientation: true,
            detectLanguage: true,
            enhanceImage: false
        };

        if (!options) {
            return defaultOptions;
        }

        // Merge with defaults
        return {
            ...defaultOptions,
            ...options,
            // Validate language if provided
            language: options.language && this.supportedLanguages.includes(options.language)
                ? options.language
                : defaultOptions.language
        };
    }

    /**
     * Get or load an OCR model by task
     * @param task Model task
     */
    private async getOrLoadModel(task: string): Promise<OCRModel> {
        // Check if we already have this model loaded
        const cachedModel = Array.from(this.ocrModels.values()).find(model =>
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

        if (model instanceof OCRModel) {
            // Cache the model for future use
            this.ocrModels.set(model.getMetadata().id, model);
            return model;
        } else {
            throw new Error(`Model for task ${task} is not an OCR model`);
        }
    }
} 