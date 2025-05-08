import { IController, Request, Response, ValidationResult } from '../interfaces/IController';
import { IService } from '../interfaces/IService';
import { ILogger } from '../interfaces/ILogger';

/**
 * Abstract base class for API controllers
 */
export abstract class BaseController implements IController {
    protected service: IService;
    protected logger: ILogger;

    constructor(service: IService, logger: ILogger) {
        this.service = service;
        this.logger = logger;
    }

    /**
     * Handle an incoming HTTP request
     * @param req Request object
     * @param res Response object
     */
    public abstract handleRequest(req: Request, res: Response): Promise<void>;

    /**
     * Send a formatted response
     * @param res Response object
     * @param data Data to send
     * @param statusCode HTTP status code
     */
    protected sendResponse(res: Response, data: any, statusCode: number = 200): void {
        res.status(statusCode).json(data);
    }

    /**
     * Handle and format an error response
     * @param res Response object
     * @param error Error object
     */
    protected handleError(res: Response, error: Error): void {
        this.logger.error('Controller error', error);

        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }

    /**
     * Validate input data
     * @param data Data to validate
     */
    protected validateInput(data: any): ValidationResult {
        return {
            valid: true
        };
    }
} 