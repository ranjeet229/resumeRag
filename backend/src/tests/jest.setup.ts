// Set up test environment variables
process.env.PORT = '3000';
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/resumerag_test';
process.env.JWT_SECRET = 'this-is-a-very-long-secret-key-for-testing-32chars';
process.env.JWT_EXPIRES_IN = '1h';
process.env.MAX_FILE_SIZE = '5242880'; // 5MB
process.env.ALLOWED_FILE_TYPES = 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'AKIAIOSFODNN7EXAMPLE';
process.env.AWS_SECRET_ACCESS_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
process.env.AWS_BUCKET_NAME = 'resumerag-test-bucket';
process.env.PINECONE_API_KEY = 'test-pinecone-key';
process.env.PINECONE_ENVIRONMENT = 'test-env';
process.env.PINECONE_INDEX = 'test-index';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.REDIS_URL = 'redis://localhost:6379';