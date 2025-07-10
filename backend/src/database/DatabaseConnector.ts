import { IDBConnector } from '../interfaces/IDBConnector';

export interface DBConfig {
    host: string;
    port: number;
    username?: string;
    password?: string;
    database: string;
    [key: string]: any;
}

/**
 * Abstract base class for database connectors
 */
export abstract class DatabaseConnector implements IDBConnector {
    protected config: DBConfig;
    protected client: any;

    constructor(config: DBConfig) {
        this.config = config;
        this.client = null;
    }

    /**
     * Connect to the database
     */
    public abstract connect(): Promise<boolean>;

    /**
     * Disconnect from the database
     */
    public abstract disconnect(): Promise<boolean>;

    /**
     * Query data from the database
     * @param criteria Query criteria
     */
    public abstract query(criteria: any): Promise<any[]>;

    /**
     * Insert a document into the database
     * @param document Document to insert
     */
    public abstract insert(document: any): Promise<any>;

    /**
     * Update documents in the database
     * @param criteria Criteria to match documents
     * @param data Data to update
     */
    public abstract update(criteria: any, data: any): Promise<any>;

    /**
     * Delete documents from the database
     * @param criteria Criteria to match documents
     */
    public abstract delete(criteria: any): Promise<boolean>;

    /**
     * Execute a query on the database
     * @param query Query to execute
     */
    protected async executeQuery(query: any): Promise<any> {
        // Base implementation - to be overridden by specific connectors
        return null;
    }
} 