#!/usr/bin/env npx ts-node

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_URL = process.env.FACIAL_RECOGNITION_API_URL || 'https://faceapi-113664566132.europe-west1.run.app';
const ORG_NAME = process.env.FACE_RECOGNITION_ORG_NAME || 'smallblind';
const USER = process.env.FACE_RECOGNITION_USER || 'system';
const API_KEY_NAME = process.env.FACE_RECOGNITION_API_KEY_NAME || 'smallblind-api-key';

async function createOrganization() {
    try {
        console.log('Creating organization...');
        const response = await axios.post(`${API_URL}/orgs`, {
            organization: ORG_NAME,
        });
        console.log('✅ Organization created:', response.data);
        return true;
    } catch (error: any) {
        if (error.response?.status === 409) {
            console.log('✅ Organization already exists');
            return true;
        } else {
            console.error('❌ Failed to create organization:', error.response?.data || error.message);
            return false;
        }
    }
}

async function createApiKey() {
    try {
        console.log('Creating API key...');
        const response = await axios.post(`${API_URL}/orgs/${ORG_NAME}/api-key`, {
            user: USER,
            api_key_name: API_KEY_NAME,
        });

        console.log('✅ API Key created successfully!');
        console.log('Response:', JSON.stringify(response.data, null, 2));

        // Try to find the API key in the response
        const data = response.data;
        const possibleKeys = ['api_key', 'key', 'apiKey', 'token', 'access_token'];

        for (const keyField of possibleKeys) {
            if (data[keyField]) {
                console.log(`\n🔑 Found API key in field '${keyField}':`);
                console.log(`${data[keyField]}`);
                console.log(`\nAdd this to your .env file:`);
                console.log(`FACE_RECOGNITION_API_KEY=${data[keyField]}`);
                return data[keyField];
            }
        }

        // Check nested data
        if (data.data && typeof data.data === 'object') {
            for (const keyField of possibleKeys) {
                if (data.data[keyField]) {
                    console.log(`\n🔑 Found API key in nested field 'data.${keyField}':`);
                    console.log(`${data.data[keyField]}`);
                    console.log(`\nAdd this to your .env file:`);
                    console.log(`FACE_RECOGNITION_API_KEY=${data.data[keyField]}`);
                    return data.data[keyField];
                }
            }
        }

        console.log('\n⚠️  API key not found in expected fields. Check the response above.');
        return null;

    } catch (error: any) {
        if (error.response?.status === 400) {
            console.log('⚠️  API key might already exist');
            console.log('Response:', JSON.stringify(error.response.data, null, 2));

            if (error.response.data?.error?.includes('already exists')) {
                console.log('\n📝 The API key already exists on the server.');
                console.log('You need to use the existing key. If you don\'t have it, you may need to:');
                console.log('1. Delete the existing key (if the API supports it)');
                console.log('2. Or use a different API_KEY_NAME');
                console.log('3. Or contact the API provider for the existing key');
            }
        } else {
            console.error('❌ Failed to create API key:', error.response?.data || error.message);
        }
        return null;
    }
}

async function main() {
    console.log('🚀 Facial Recognition API Key Setup');
    console.log('=====================================');
    console.log(`API URL: ${API_URL}`);
    console.log(`Organization: ${ORG_NAME}`);
    console.log(`User: ${USER}`);
    console.log(`API Key Name: ${API_KEY_NAME}`);
    console.log('');

    // Step 1: Create organization
    const orgCreated = await createOrganization();
    if (!orgCreated) {
        console.log('❌ Failed to create organization. Exiting.');
        process.exit(1);
    }

    console.log('');

    // Step 2: Create API key
    const apiKey = await createApiKey();

    if (apiKey) {
        console.log('\n✅ Setup complete! Your API key is ready to use.');
        console.log('\nNext steps:');
        console.log('1. Add the API key to your .env file');
        console.log('2. Restart your application');
        console.log('3. Test person registration');
    } else {
        console.log('\n⚠️  Setup incomplete. Please check the messages above.');
    }
}

// Run the script
main().catch(console.error); 