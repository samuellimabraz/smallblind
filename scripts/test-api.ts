import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Base URL
const BASE_URL = `http://localhost:${process.env.PORT || 3000}`;

// Store the auth token
let authToken: string | null = null;

/**
 * Test the authentication endpoints
 */
async function testAuth() {
    try {
        console.log('Testing Authentication...');

        // Register a new user
        console.log('\n1. Registering a new user...');
        const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
            username: `testuser_${Date.now()}`,
            email: `testuser_${Date.now()}@example.com`,
            password: 'password123',
        });

        console.log(`Status: ${registerResponse.status}`);
        console.log('User:', registerResponse.data.user);
        console.log('Token received:', registerResponse.data.token ? 'Yes' : 'No');

        // Get the token
        authToken = registerResponse.data.token;

        // Login
        console.log('\n2. Testing login...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: registerResponse.data.user.email,
            password: 'password123',
        });

        console.log(`Status: ${loginResponse.status}`);
        console.log('User:', loginResponse.data.user);
        console.log('Token received:', loginResponse.data.token ? 'Yes' : 'No');

        // Get user info
        console.log('\n3. Getting current user info...');
        const meResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });

        console.log(`Status: ${meResponse.status}`);
        console.log('User info:', meResponse.data.user);

        return true;
    } catch (error: any) {
        console.error('Authentication test failed:', error.response?.data || error.message);
        return false;
    }
}

/**
 * Test the user endpoints
 */
async function testUser() {
    try {
        console.log('\nTesting User API...');

        if (!authToken) {
            console.error('No auth token available. Authentication test must be run first.');
            return false;
        }

        // Get user settings
        console.log('\n1. Getting user settings...');
        try {
            const settingsResponse = await axios.get(`${BASE_URL}/api/users/settings`, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            console.log(`Status: ${settingsResponse.status}`);
            console.log('Settings:', settingsResponse.data.settings);
        } catch (error: any) {
            // Settings might not exist yet, that's okay
            console.log('Settings not found, will create them in the next step');
        }

        // Update user settings
        console.log('\n2. Updating user settings...');
        const updateSettingsResponse = await axios.put(
            `${BASE_URL}/api/users/settings`,
            {
                voiceId: 'en-US-neural-A',
                speechRate: 1.1,
                theme: 'dark',
                largeText: true,
            },
            {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            }
        );

        console.log(`Status: ${updateSettingsResponse.status}`);
        console.log('Updated settings:', updateSettingsResponse.data.settings);

        // Update user profile
        console.log('\n3. Updating user profile...');
        const updateProfileResponse = await axios.put(
            `${BASE_URL}/api/users/profile`,
            {
                username: `updated_user_${Date.now()}`,
            },
            {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            }
        );

        console.log(`Status: ${updateProfileResponse.status}`);
        console.log('Updated profile:', updateProfileResponse.data.user);

        return true;
    } catch (error: any) {
        console.error('User API test failed:', error.response?.data || error.message);
        return false;
    }
}

/**
 * Test the session endpoints
 */
async function testSession() {
    try {
        console.log('\nTesting Session API...');

        if (!authToken) {
            console.error('No auth token available. Authentication test must be run first.');
            return false;
        }

        // Create a new session
        console.log('\n1. Creating a new session...');
        const createSessionResponse = await axios.post(
            `${BASE_URL}/api/sessions`,
            {
                deviceInfo: {
                    platform: 'Node.js',
                    model: 'Test Script',
                    osVersion: process.version,
                    appVersion: '1.0.0',
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            }
        );

        console.log(`Status: ${createSessionResponse.status}`);
        console.log('New session:', createSessionResponse.data.session);

        const sessionId = createSessionResponse.data.session.id;

        // Add an interaction to the session
        console.log('\n2. Adding an interaction to the session...');
        const addInteractionResponse = await axios.post(
            `${BASE_URL}/api/sessions/${sessionId}/interactions`,
            {
                type: 'test',
                input: {
                    message: 'Hello from the test script',
                },
                output: {
                    response: 'Hello from the API',
                },
                duration: 123,
            },
            {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            }
        );

        console.log(`Status: ${addInteractionResponse.status}`);
        console.log('New interaction:', addInteractionResponse.data.interaction);

        // Get session details
        console.log('\n3. Getting session details...');
        const getSessionResponse = await axios.get(`${BASE_URL}/api/sessions/${sessionId}`, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });

        console.log(`Status: ${getSessionResponse.status}`);
        console.log('Session with interactions:', getSessionResponse.data.session);

        // End the session
        console.log('\n4. Ending the session...');
        const endSessionResponse = await axios.put(
            `${BASE_URL}/api/sessions/${sessionId}/end`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            }
        );

        console.log(`Status: ${endSessionResponse.status}`);
        console.log('Ended session:', endSessionResponse.data.session);

        // Get all sessions
        console.log('\n5. Getting all sessions...');
        const getAllSessionsResponse = await axios.get(`${BASE_URL}/api/sessions`, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });

        console.log(`Status: ${getAllSessionsResponse.status}`);
        console.log(`Found ${getAllSessionsResponse.data.sessions.length} sessions`);

        return true;
    } catch (error: any) {
        console.error('Session API test failed:', error.response?.data || error.message);
        return false;
    }
}

/**
 * Main test function
 */
async function runTests() {
    console.log('=== STARTING API TESTS ===');

    // Test health endpoint
    try {
        console.log('\nTesting health endpoint...');
        const healthResponse = await axios.get(`${BASE_URL}/health`);
        console.log(`Status: ${healthResponse.status}`);
        console.log('Health:', healthResponse.data);
    } catch (error: any) {
        console.error('Health check failed:', error.message);
        console.log('Make sure the server is running!');
        return;
    }

    // Run tests
    const authSuccess = await testAuth();
    if (!authSuccess) {
        console.log('Authentication tests failed, stopping further tests.');
        return;
    }

    const userSuccess = await testUser();
    if (!userSuccess) {
        console.log('User API tests failed, continuing to next test.');
    }

    const sessionSuccess = await testSession();
    if (!sessionSuccess) {
        console.log('Session API tests failed.');
    }

    console.log('\n=== API TESTS COMPLETED ===');
}

// Run the tests
runTests().catch(error => {
    console.error('Error running tests:', error);
}); 