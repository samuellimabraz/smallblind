import axios from 'axios';
import { env } from '../config/env';

export interface FacialRecognitionConfig {
    apiUrl: string;
    organization: string;
    user: string;
    apiKeyName: string;
    apiKey: string;
}

export interface PersonData {
    id: string;
    name: string;
    images: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface RecognitionResult {
    personId?: string;
    personName?: string;
    confidence: number;
    boundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

export interface FacialRecognitionResponse {
    success: boolean;
    results?: RecognitionResult[];
    error?: string;
}

export class FacialRecognitionService {
    private client: ReturnType<typeof axios.create>;
    private config: FacialRecognitionConfig;

    constructor(config?: Partial<FacialRecognitionConfig>) {
        this.config = {
            apiUrl: config?.apiUrl || env.FACIAL_RECOGNITION_API_URL,
            organization: config?.organization || env.FACE_RECOGNITION_ORG_NAME,
            user: config?.user || env.FACE_RECOGNITION_USER,
            apiKeyName: config?.apiKeyName || env.FACE_RECOGNITION_API_KEY_NAME,
            apiKey: config?.apiKey || env.FACE_RECOGNITION_API_KEY,
        };

        this.client = axios.create({
            baseURL: this.config.apiUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    async initializeOrganization(): Promise<void> {
        try {
            console.log('Initializing facial recognition service...');
            console.log('Configuration:', {
                apiUrl: this.config.apiUrl,
                organization: this.config.organization,
                user: this.config.user,
                apiKeyName: this.config.apiKeyName,
                hasApiKey: !!this.config.apiKey
            });

            await this.createOrganization();
            await this.createApiKey();

            console.log('Facial recognition service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize organization:', error);
            throw error;
        }
    }

    private async createOrganization(): Promise<void> {
        try {
            const response = await this.client.post('/orgs', {
                organization: this.config.organization,
            });
            console.log('Organization created or already exists:', response.data);
        } catch (error: any) {
            if (error.response?.status === 409) {
                console.log('Organization already exists');
            } else {
                throw error;
            }
        }
    }

    private async createApiKey(): Promise<void> {
        try {
            const response = await this.client.post(`/orgs/${this.config.organization}/api-key`, {
                user: this.config.user,
                api_key_name: this.config.apiKeyName,
            });

            const data = response.data as any;
            console.log('API Key creation response:', JSON.stringify(data, null, 2));
            console.log('API key created successfully');
        } catch (error: any) {
            console.error('Failed to create API key:', error);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);

                // Handle case where API key already exists
                if (error.response.status === 400) {
                    const errorData = error.response.data;
                    if (errorData && typeof errorData === 'object' && errorData.error) {
                        if (errorData.error.includes('already exists') || errorData.error.includes('duplicate')) {
                            console.log('API key already exists, continuing...');
                            return;
                        }
                    }
                }
            }
            throw new Error(`Failed to create API key: ${error.response?.data?.error || error.message}`);
        }
    }

    async registerPerson(name: string, images: string[]): Promise<PersonData> {
        if (!this.config.apiKey) {
            throw new Error('API key not configured. Please set FACE_RECOGNITION_API_KEY environment variable.');
        }

        // Ensure organization and API key exist on the server
        try {
            await this.initializeOrganization();
        } catch (error) {
            console.error('Failed to initialize during registration:', error);
            // Continue anyway, the API key might already exist
        }

        try {
            console.log('Registering person:', name, 'with', images.length, 'images');
            console.log('Using organization:', this.config.organization);
            console.log('Using user:', this.config.user);
            console.log('Using API key name:', this.config.apiKeyName);

            const response = await this.client.post(`/register/${this.config.organization}`, {
                images,
                name,
                api_auth: {
                    user: this.config.user,
                    api_key_name: this.config.apiKeyName,
                },
            }, {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                },
            });

            const data = response.data as any;
            console.log('Registration response:', JSON.stringify(data, null, 2));

            return {
                id: data.person_id || data.id || `person_${Date.now()}`,
                name: data.name || name,
                images: data.images || images,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        } catch (error: any) {
            console.error('Failed to register person:', error);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
            throw new Error(`Failed to register person: ${error.response?.data?.error || error.message}`);
        }
    }

    async recognizeFace(imageData: string, threshold: number = 0.5): Promise<FacialRecognitionResponse> {
        if (!this.config.apiKey) {
            throw new Error('API key not configured. Please set FACE_RECOGNITION_API_KEY environment variable.');
        }

        try {
            console.log('Recognizing face with threshold:', threshold);
            console.log('Using organization:', this.config.organization);

            const response = await this.client.post(`/recognize/${this.config.organization}`, {
                image: imageData,
                threshold,
                api_auth: {
                    user: this.config.user,
                    api_key_name: this.config.apiKeyName,
                },
            }, {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                },
            });

            const data = response.data as any;
            console.log('Face recognition raw response:', JSON.stringify(data, null, 2));

            const results: RecognitionResult[] = [];

            // New format has detections.result array and searchs array
            if (data.detections?.result && Array.isArray(data.detections.result) &&
                data.searchs && Array.isArray(data.searchs)) {

                console.log(`Found ${data.detections.result.length} face detections and ${data.searchs.length} search results`);

                // Map each detection to a recognition result
                data.detections.result.forEach((detection: any, index: number) => {
                    const search = data.searchs[index];
                    console.log(`Processing detection ${index}:`, JSON.stringify(detection, null, 2));

                    if (search) {
                        console.log(`Found matching search result:`, JSON.stringify(search, null, 2));
                    }

                    // Create a recognition result
                    const result: RecognitionResult = {
                        // Use search data if available
                        personId: search ? `person_${search.name}` : undefined,
                        personName: search ? search.name : undefined,
                        // For confidence, use search distance if available, otherwise detection confidence
                        confidence: search ? search.distance : (detection.confidence || 0),
                        // Map the bounding box format
                        boundingBox: detection.bounding_box ? {
                            x: detection.bounding_box.x,
                            y: detection.bounding_box.y,
                            width: detection.bounding_box.w,
                            height: detection.bounding_box.h
                        } : undefined
                    };

                    results.push(result);
                });
            } else if (data.results && Array.isArray(data.results)) {
                // Handle the old format for backward compatibility
                console.log(`Found ${data.results.length} face results (old format)`);

                data.results.forEach((result: any, index: number) => {
                    console.log(`Processing face result ${index}:`, JSON.stringify(result, null, 2));

                    if (result.person_id) {
                        console.log(`Face ${index} matched with person_id: ${result.person_id}`);
                    } else {
                        console.log(`Face ${index} did not match any registered person`);
                    }

                    results.push({
                        personId: result.person_id,
                        personName: result.person_name,
                        confidence: result.confidence,
                        boundingBox: result.bounding_box,
                    });
                });
            } else {
                console.log('No face results returned from API');
            }

            console.log('Processed recognition results:', JSON.stringify(results, null, 2));

            return {
                success: true,
                results,
            };
        } catch (error: any) {
            console.error('Failed to recognize face:', error);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
            return {
                success: false,
                error: error.response?.data?.error || error.message,
            };
        }
    }

    async getPersons(): Promise<PersonData[]> {
        // Note: The external API doesn't provide a way to list registered persons
        // This would typically require a local database to track registered persons
        console.warn('getPersons: External API does not support listing persons');
        return [];
    }

    async updatePerson(id: string, name: string, images?: string[]): Promise<PersonData> {
        // Note: The external API doesn't support updating persons
        // This would require re-registering the person with new images
        throw new Error('Update person not supported by external API. Please register the person again with new photos.');
    }

    async deletePerson(id: string): Promise<void> {
        // Note: The external API doesn't support deleting persons
        // This would require a local database to track and manage persons
        throw new Error('Delete person not supported by external API. Persons cannot be removed once registered.');
    }

    setApiKey(apiKey: string): void {
        this.config.apiKey = apiKey;
    }

    getConfig(): FacialRecognitionConfig {
        return { ...this.config };
    }

    isInitialized(): boolean {
        return !!(this.config.organization && this.config.user && this.config.apiKeyName && this.config.apiKey);
    }
}

export const facialRecognitionService = new FacialRecognitionService(); 