/**
 * Interface for API controllers in the SmallBlind system
 */
export interface Request {
  body: any;
  params: Record<string, string>;
  query: Record<string, string>;
  headers: Record<string, string>;
  user?: any;
}

export interface Response {
  status(code: number): Response;
  json(data: any): Response;
  send(data: any): Response;
  end(): Response;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export interface IController {
  /**
   * Handle incoming HTTP requests
   * @param req Request object
   * @param res Response object
   */
  handleRequest(req: Request, res: Response): Promise<void>;
  
  /**
   * Validate input data
   * @param data Data to validate
   * @protected Only for use within controller implementations
   */
  // Note: TypeScript interfaces cannot specify method visibility (like protected),
  // but we can document this method as protected to indicate its intended use
  validateInput?(data: any): ValidationResult;
} 