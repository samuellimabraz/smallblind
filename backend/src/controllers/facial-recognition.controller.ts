import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { FacialRecognitionService, PersonData } from '../services/facial-recognition.service';
import { VisionStorageService } from '../services/vision-storage.service';
import { AuthRequest } from '../middlewares/authMiddleware';
import multer from 'multer';

export class FacialRecognitionController {
    private facialRecognitionService: FacialRecognitionService;
    private visionStorageService: VisionStorageService;

    constructor() {
        this.facialRecognitionService = new FacialRecognitionService();
        this.visionStorageService = VisionStorageService.getInstance();
    }

    async initializeOrganization(req: AuthRequest, res: Response): Promise<void> {
        try {
            await this.facialRecognitionService.initializeOrganization();

            res.status(200).json({
                success: true,
                message: 'Organization initialized successfully',
                config: this.facialRecognitionService.getConfig(),
            });
        } catch (error: any) {
            console.error('Error initializing organization:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to initialize organization',
                details: error.message,
            });
        }
    }

    async registerPerson(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const { name } = req.body;
            const files = (req.files as Express.Multer.File[])?.filter(file => file.fieldname === 'photos');

            if (!name || !files || files.length === 0) {
                res.status(400).json({
                    success: false,
                    error: 'Name and at least one image are required',
                });
                return;
            }

            const images: string[] = [];
            for (const file of files) {
                const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
                images.push(base64Image);
            }

            const person = await this.facialRecognitionService.registerPerson(name, images);

            res.status(201).json({
                success: true,
                message: 'Person registered successfully',
                person: {
                    id: person.id,
                    name: person.name,
                    photos: person.images,
                    createdAt: person.createdAt,
                    updatedAt: person.updatedAt,
                },
            });
        } catch (error: any) {
            console.error('Error registering person:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to register person',
                details: error.message,
            });
        }
    }

    async recognizeFace(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            if (!req.file) {
                res.status(400).json({
                    success: false,
                    error: 'Image file is required',
                });
                return;
            }

            const threshold = req.body.threshold ? parseFloat(req.body.threshold) : 0.5;
            const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

            const startTime = Date.now();
            const result = await this.facialRecognitionService.recognizeFace(base64Image, threshold);
            const processingTime = Date.now() - startTime;

            // Save face recognition results to database if user is authenticated
            if (req.user && result.success) {
                try {
                    const recognizedFaces = result.results?.map(face => ({
                        personId: face.personId,
                        personName: face.personName,
                        confidence: face.confidence,
                        boundingBox: face.boundingBox,
                    })) || [];

                    await this.visionStorageService.saveFaceRecognition(
                        req.user.id,
                        req.session?.id || null,
                        req.file.buffer,
                        req.file.originalname,
                        req.file.mimetype,
                        threshold,
                        recognizedFaces,
                        processingTime
                    );

                    console.log('Face recognition results saved to database');
                } catch (saveError) {
                    console.error('Failed to save face recognition results:', saveError);
                    // Don't fail the request if saving fails
                }
            }

            res.status(200).json({
                success: result.success,
                results: result.results,
                error: result.error,
                processingTime,
            });
        } catch (error: any) {
            console.error('Error recognizing face:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to recognize face',
                details: error.message,
            });
        }
    }

    async getPersons(req: AuthRequest, res: Response): Promise<void> {
        try {
            const persons = await this.facialRecognitionService.getPersons();

            res.status(200).json({
                success: true,
                persons: persons.map(person => ({
                    id: person.id,
                    name: person.name,
                    photos: person.images,
                    createdAt: person.createdAt,
                    updatedAt: person.updatedAt,
                })),
            });
        } catch (error: any) {
            console.error('Error getting persons:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get persons',
                details: error.message,
            });
        }
    }

    async updatePerson(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const { id } = req.params;
            const { name } = req.body;
            const files = (req.files as Express.Multer.File[])?.filter(file => file.fieldname === 'photos');

            if (!id || !name) {
                res.status(400).json({
                    success: false,
                    error: 'Person ID and name are required',
                });
                return;
            }

            let images: string[] | undefined;
            if (files && files.length > 0) {
                images = [];
                for (const file of files) {
                    const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
                    images.push(base64Image);
                }
            }

            const person = await this.facialRecognitionService.updatePerson(id, name, images);

            res.status(200).json({
                success: true,
                message: 'Person updated successfully',
                person: {
                    id: person.id,
                    name: person.name,
                    photos: person.images,
                    createdAt: person.createdAt,
                    updatedAt: person.updatedAt,
                },
            });
        } catch (error: any) {
            console.error('Error updating person:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update person',
                details: error.message,
            });
        }
    }

    async deletePerson(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({
                    success: false,
                    error: 'Person ID is required',
                });
                return;
            }

            await this.facialRecognitionService.deletePerson(id);

            res.status(200).json({
                success: true,
                message: 'Person deleted successfully',
            });
        } catch (error: any) {
            console.error('Error deleting person:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete person',
                details: error.message,
            });
        }
    }

    async getConfig(req: AuthRequest, res: Response): Promise<void> {
        try {
            const config = this.facialRecognitionService.getConfig();

            res.status(200).json({
                success: true,
                config: {
                    organization: config.organization,
                    user: config.user,
                    apiKeyName: config.apiKeyName,
                    hasApiKey: !!config.apiKey,
                },
            });
        } catch (error: any) {
            console.error('Error getting config:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get configuration',
                details: error.message,
            });
        }
    }
} 