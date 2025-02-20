import { QdrantClient } from '@qdrant/js-client-rest';

// Create a simple function to test our connection
async function testQdrantConnection() {
    // Create a client that connects to your local Qdrant instance
    const client = new QdrantClient({ 
        url: 'http://localhost:6333' 
    });

    try {
        // This will check if we can connect to Qdrant
        const healthCheck = await client.healthCheck();
        console.log('Successfully connected to Qdrant:', healthCheck);
    } catch (error) {
        console.error('Failed to connect to Qdrant:', error);
    }
}

// Run the test
testQdrantConnection();