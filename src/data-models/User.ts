/**
 * User model for the SmallBlind system
 */
export class User {
  /**
   * Unique identifier for the user
   */
  id: string;
  
  /**
   * Username for login
   */
  username: string;
  
  /**
   * User email address
   */
  email: string;
  
  /**
   * Hashed user password
   */
  passwordHash: string;
  
  /**
   * User preferences
   */
  preferences: any;
  
  /**
   * Account creation timestamp
   */
  createdAt: Date;
  
  /**
   * Last login timestamp
   */
  lastLogin: Date;
  
  constructor(data: Partial<User>) {
    this.id = data.id || '';
    this.username = data.username || '';
    this.email = data.email || '';
    this.passwordHash = data.passwordHash || '';
    this.preferences = data.preferences || {};
    this.createdAt = data.createdAt || new Date();
    this.lastLogin = data.lastLogin || new Date();
  }
} 