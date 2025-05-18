// Test environment variables
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = "mongodb://localhost:27017/test";
process.env.AZURE_STORAGE_CONNECTION_STRING = "UseDevelopmentStorage=true";
process.env.AZURE_CONTAINER_NAME = "test-container";
process.env.USE_AZURE_MOCK = "true";
process.env.JWT_SECRET = "test_secret_2025";