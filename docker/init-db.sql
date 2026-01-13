-- POA Database Initialization Script
-- This runs automatically when the PostgreSQL container is first created

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create additional schemas if needed
-- CREATE SCHEMA IF NOT EXISTS poa;

-- Note: Database name is set via POSTGRES_DB environment variable
-- No additional GRANT statements needed as the user is already the owner

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'POA Database initialized successfully at %', NOW();
END $$;
