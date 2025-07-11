import PrismaService from '../database/prisma-service';
import { createHash, randomUUID } from 'crypto';
import { Prisma } from '../generated/prisma';

/**
 * Service for storing vision analysis results (object detection and image description)
 * using the database models defined in the Prisma schema.
 */
export class VisionStorageService {
    private static instance: VisionStorageService;
    private prismaService: PrismaService;

    private constructor() {
        this.prismaService = PrismaService.getInstance();
    }

    /**
     * Get the singleton instance of VisionStorageService
     */
    public static getInstance(): VisionStorageService {
        if (!VisionStorageService.instance) {
            VisionStorageService.instance = new VisionStorageService();
        }
        return VisionStorageService.instance;
    }

    /**
     * Generate a hash for an image buffer to help with deduplication
     */
    private generateImageHash(imageBuffer: Buffer): string {
        return createHash('sha256').update(imageBuffer).digest('hex');
    }

    /**
     * Save object detection results to the database
     */
    public async saveObjectDetection(
        userId: string,
        sessionId: string | null,
        imageBuffer: Buffer,
        fileName: string | null,
        imageFormat: string | null,
        modelName: string,
        modelSettings: Record<string, any>,
        detections: Array<{
            label: string;
            confidence: number;
            boundingBox: {
                xMin: number;
                yMin: number;
                xMax: number;
                yMax: number;
            };
            attributes?: Record<string, any>;
        }>,
        processingTimeMs: number
    ) {
        const prisma = this.prismaService.prisma;

        try {
            // Generate hash for image deduplication
            const imageHash = this.generateImageHash(imageBuffer);

            // Create a transaction to ensure all database operations succeed or fail together
            return await prisma.$transaction(async (tx) => {
                // 1. Create the parent VisionAnalysis record
                const visionAnalysis = await tx.visionAnalysis.create({
                    data: {
                        id: randomUUID(),
                        userId,
                        sessionId,
                        analysisType: 'OBJECT_DETECTION',
                        imageHash,
                        imageFormat,
                        fileName,
                        // We're not storing the actual image, just metadata
                        // If you want to save the image, implement image storage logic and store the path here
                    },
                });

                // 2. Create the ObjectDetection record
                const objectDetection = await tx.objectDetection.create({
                    data: {
                        id: randomUUID(),
                        visionAnalysisId: visionAnalysis.id,
                        userId, // Duplicated for direct query capability
                        modelName,
                        modelSettings: modelSettings || {},
                        processingTimeMs,
                    },
                });

                // 3. Create DetectedObject records for each detection
                if (detections && detections.length > 0) {
                    // Create each detection individually instead of using createMany to avoid type issues
                    const detectionPromises = detections.map((detection) =>
                        tx.detectedObject.create({
                            data: {
                                id: randomUUID(),
                                objectDetectionId: objectDetection.id,
                                label: detection.label,
                                confidence: detection.confidence,
                                boundingBox: detection.boundingBox as unknown as Prisma.InputJsonValue,
                                attributes: detection.attributes ? detection.attributes as unknown as Prisma.InputJsonValue : undefined,
                            },
                        })
                    );

                    await Promise.all(detectionPromises);
                }

                // Return the created object detection with its related objects
                return await tx.objectDetection.findUnique({
                    where: { id: objectDetection.id },
                    include: {
                        VisionAnalysis: true,
                        DetectedObject: true,
                    },
                });
            });
        } catch (error) {
            console.error('Error saving object detection results:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to save object detection results: ${errorMessage}`);
        }
    }

    /**
     * Save face recognition results to the database
     */
    public async saveFaceRecognition(
        userId: string,
        sessionId: string | null,
        imageBuffer: Buffer,
        fileName: string | null,
        imageFormat: string | null,
        threshold: number,
        recognizedFaces: Array<{
            personId?: string;
            personName?: string;
            confidence: number;
            boundingBox?: {
                x: number;
                y: number;
                width: number;
                height: number;
            };
            attributes?: Record<string, any>;
        }>,
        processingTimeMs: number
    ) {
        const prisma = this.prismaService.prisma;

        try {
            // Generate hash for image deduplication
            const imageHash = this.generateImageHash(imageBuffer);

            // Create a transaction to ensure all database operations succeed or fail together
            return await prisma.$transaction(async (tx) => {
                // 1. Create the parent VisionAnalysis record
                const visionAnalysis = await tx.visionAnalysis.create({
                    data: {
                        id: randomUUID(),
                        userId,
                        sessionId,
                        analysisType: 'FACE_RECOGNITION',
                        imageHash,
                        imageFormat,
                        fileName,
                        // We're not storing the actual image, just metadata
                        // If you want to save the image, implement image storage logic and store the path here
                    },
                });

                // 2. Create the FaceRecognition record
                const faceRecognition = await tx.faceRecognition.create({
                    data: {
                        id: randomUUID(),
                        visionAnalysisId: visionAnalysis.id,
                        userId, // Duplicated for direct query capability
                        threshold,
                        processingTimeMs,
                    },
                });

                // 3. Create RecognizedFace records for each face
                if (recognizedFaces && recognizedFaces.length > 0) {
                    // Create each recognition individually
                    const recognitionPromises = recognizedFaces.map((face) =>
                        tx.recognizedFace.create({
                            data: {
                                id: randomUUID(),
                                faceRecognitionId: faceRecognition.id,
                                personId: face.personId || null,
                                personName: face.personName || null,
                                confidence: face.confidence,
                                boundingBox: face.boundingBox ? face.boundingBox as unknown as Prisma.InputJsonValue : undefined,
                                attributes: face.attributes ? face.attributes as unknown as Prisma.InputJsonValue : undefined,
                            },
                        })
                    );

                    await Promise.all(recognitionPromises);
                }

                // Return the created face recognition with its related faces
                return await tx.faceRecognition.findUnique({
                    where: { id: faceRecognition.id },
                    include: {
                        VisionAnalysis: true,
                        RecognizedFace: true,
                    },
                });
            });
        } catch (error) {
            console.error('Error saving face recognition results:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to save face recognition results: ${errorMessage}`);
        }
    }

    /**
     * Save image description results to the database
     */
    public async saveImageDescription(
        userId: string,
        sessionId: string | null,
        imageBuffer: Buffer,
        fileName: string | null,
        imageFormat: string | null,
        modelName: string,
        prompt: string,
        maxNewTokens: number | null,
        temperature: number | null,
        description: string,
        processingTimeMs: number
    ) {
        const prisma = this.prismaService.prisma;

        try {
            // Generate hash for image deduplication
            const imageHash = this.generateImageHash(imageBuffer);

            // Create a transaction to ensure all database operations succeed or fail together
            return await prisma.$transaction(async (tx) => {
                // 1. Create the parent VisionAnalysis record
                const visionAnalysis = await tx.visionAnalysis.create({
                    data: {
                        id: randomUUID(),
                        userId,
                        sessionId,
                        analysisType: 'IMAGE_DESCRIPTION',
                        imageHash,
                        imageFormat,
                        fileName,
                        // We're not storing the actual image, just metadata
                        // If you want to save the image, implement image storage logic and store the path here
                    },
                });

                // 2. Create the ImageDescription record
                const imageDescription = await tx.imageDescription.create({
                    data: {
                        id: randomUUID(),
                        visionAnalysisId: visionAnalysis.id,
                        userId, // Duplicated for direct query capability
                        modelName,
                        prompt,
                        maxNewTokens,
                        temperature,
                        description,
                        processingTimeMs,
                    },
                });

                // Return the created image description
                return await tx.imageDescription.findUnique({
                    where: { id: imageDescription.id },
                    include: {
                        VisionAnalysis: true,
                    },
                });
            });
        } catch (error) {
            console.error('Error saving image description results:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to save image description results: ${errorMessage}`);
        }
    }

    /**
     * Get all vision analyses for a user
     */
    public async getUserVisionAnalyses(userId: string, limit = 20, offset = 0) {
        const prisma = this.prismaService.prisma;

        try {
            // Get the count of total records
            const totalCount = await prisma.visionAnalysis.count({
                where: { userId },
            });

            // Get the actual records with pagination
            const analyses = await prisma.visionAnalysis.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limit,
                include: {
                    ObjectDetection: {
                        include: {
                            DetectedObject: true,
                        },
                    },
                    ImageDescription: true,
                    FaceRecognition: {
                        include: {
                            RecognizedFace: true,
                        },
                    },
                    Session: {
                        select: {
                            id: true,
                            startTime: true,
                            endTime: true,
                        },
                    },
                },
            });

            return {
                data: analyses,
                pagination: {
                    total: totalCount,
                    limit,
                    offset,
                    hasMore: offset + analyses.length < totalCount,
                },
            };
        } catch (error) {
            console.error('Error fetching user vision analyses:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to fetch user vision analyses: ${errorMessage}`);
        }
    }

    /**
     * Get all vision analyses for a session
     */
    public async getSessionVisionAnalyses(sessionId: string) {
        const prisma = this.prismaService.prisma;

        try {
            return await prisma.visionAnalysis.findMany({
                where: { sessionId },
                orderBy: { createdAt: 'desc' },
                include: {
                    ObjectDetection: {
                        include: {
                            DetectedObject: true,
                        },
                    },
                    ImageDescription: true,
                    FaceRecognition: {
                        include: {
                            RecognizedFace: true,
                        },
                    },
                },
            });
        } catch (error) {
            console.error('Error fetching session vision analyses:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to fetch session vision analyses: ${errorMessage}`);
        }
    }

    /**
     * Get a specific vision analysis by ID
     */
    public async getVisionAnalysis(id: string) {
        const prisma = this.prismaService.prisma;

        try {
            return await prisma.visionAnalysis.findUnique({
                where: { id },
                include: {
                    ObjectDetection: {
                        include: {
                            DetectedObject: true,
                        },
                    },
                    ImageDescription: true,
                    FaceRecognition: {
                        include: {
                            RecognizedFace: true,
                        },
                    },
                    Session: {
                        select: {
                            id: true,
                            startTime: true,
                            endTime: true,
                        },
                    },
                    User: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                },
            });
        } catch (error) {
            console.error('Error fetching vision analysis:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to fetch vision analysis: ${errorMessage}`);
        }
    }
} 