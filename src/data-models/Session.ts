import { Interaction } from './Interaction';

/**
 * Session model for tracking user sessions
 */
export class Session {
  /**
   * Unique identifier for the session
   */
  id: string;
  
  /**
   * ID of the user this session belongs to
   */
  userId: string;
  
  /**
   * Interactions that occurred during this session
   */
  interactions: Interaction[];
  
  /**
   * Timestamp when the session started
   */
  startTime: Date;
  
  /**
   * Timestamp when the session ended
   */
  endTime: Date;
  
  /**
   * Information about the device used for this session
   */
  deviceInfo: any;
  
  constructor(data: Partial<Session>) {
    this.id = data.id || '';
    this.userId = data.userId || '';
    this.interactions = data.interactions || [];
    this.startTime = data.startTime || new Date();
    this.endTime = data.endTime || new Date();
    this.deviceInfo = data.deviceInfo || {};
  }
} 