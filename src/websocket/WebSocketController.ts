import { IService } from '../interfaces/IService';
import { WebSocketManager } from '../core/WebSocketManager';

/**
 * Abstract base class for WebSocket controllers
 */
export abstract class WebSocketController {
    protected wsManager: WebSocketManager;
    protected service: IService;

    constructor(wsManager: WebSocketManager, service: IService) {
        this.wsManager = wsManager;
        this.service = service;
    }

    /**
     * Handle a new WebSocket connection
     * @param socket WebSocket connection
     */
    public abstract handleConnection(socket: any): void;

    /**
     * Handle an incoming WebSocket message
     * @param socket WebSocket connection
     * @param message Message received
     */
    public abstract handleMessage(socket: any, message: any): Promise<void>;

    /**
     * Handle a WebSocket disconnection
     * @param socket WebSocket connection
     */
    public abstract handleDisconnection(socket: any): void;
} 