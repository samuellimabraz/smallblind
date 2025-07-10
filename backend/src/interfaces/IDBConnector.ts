/**
 * Interface for database connectors
 */
export interface IDBConnector {
    /**
     * Connect to the database
     */
    connect(): Promise<boolean>;

    /**
     * Disconnect from the database
     */
    disconnect(): Promise<boolean>;

    /**
     * Query the database
     * @param model The model/collection to query
     * @param criteria Query criteria
     * @param options Additional query options
     */
    query(model: string, criteria: any, options?: any): Promise<any[]>;

    /**
     * Insert a document into the database
     * @param model The model/collection
     * @param document The document to insert
     */
    insert(model: string, document: any): Promise<any>;

    /**
     * Update documents in the database
     * @param model The model/collection
     * @param criteria Query criteria for documents to update
     * @param data The data to update
     */
    update(model: string, criteria: any, data: any): Promise<any>;

    /**
     * Delete documents from the database
     * @param model The model/collection
     * @param criteria Query criteria for documents to delete
     */
    delete(model: string, criteria: any): Promise<boolean>;
} 