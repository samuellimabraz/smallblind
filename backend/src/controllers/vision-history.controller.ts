import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { VisionStorageService } from '../services/vision-storage.service';

// Extended Request interface to include user and session
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        username?: string;
        email?: string;
    };
    session?: {
        id: string;
        [key: string]: any;
    };
}

export class VisionHistoryController {
    private visionStorageService: VisionStorageService;

    constructor() {
        this.visionStorageService = VisionStorageService.getInstance();
    }

    /**
     * Get vision analysis history for the authenticated user
     */
    public getUserVisionHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            // Ensure user is authenticated
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
                return;
            }

            // Parse pagination parameters
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
            const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

            // Get vision history for the user
            const result = await this.visionStorageService.getUserVisionAnalyses(
                req.user.id,
                limit,
                offset
            );

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Error fetching vision history:', error);
            res.status(500).json({
                success: false,
                error: 'Error fetching vision history',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    };

    /**
     * Get vision analysis history for a specific session
     */
    public getSessionVisionHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            // Ensure user is authenticated
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
                return;
            }

            // Get session ID from the request parameters
            const { sessionId } = req.params;
            if (!sessionId) {
                res.status(400).json({
                    success: false,
                    error: 'Session ID is required'
                });
                return;
            }

            // Get vision history for the session
            const result = await this.visionStorageService.getSessionVisionAnalyses(sessionId);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Error fetching session vision history:', error);
            res.status(500).json({
                success: false,
                error: 'Error fetching session vision history',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    };

    /**
     * Get a specific vision analysis by ID
     */
    public getVisionAnalysis = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            // Ensure user is authenticated
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
                return;
            }

            // Get analysis ID from the request parameters
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    success: false,
                    error: 'Analysis ID is required'
                });
                return;
            }

            // Get the vision analysis
            const result = await this.visionStorageService.getVisionAnalysis(id);

            // Check if the analysis exists and belongs to the authenticated user
            if (!result) {
                res.status(404).json({
                    success: false,
                    error: 'Vision analysis not found'
                });
                return;
            }

            // For security, verify this analysis belongs to the requesting user
            if (result.userId !== req.user.id) {
                res.status(403).json({
                    success: false,
                    error: 'Unauthorized access to this vision analysis'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Error fetching vision analysis:', error);
            res.status(500).json({
                success: false,
                error: 'Error fetching vision analysis',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    };
} 