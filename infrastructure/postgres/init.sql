-- ══════════════════════════════════════════════════
--  Nameh.me — PostgreSQL Initialization
--  Runs on first boot only (docker-entrypoint-initdb)
-- ══════════════════════════════════════════════════

-- Create database for Stalwart mail server
CREATE DATABASE stalwart;

-- Grant full access to the main user
GRANT ALL PRIVILEGES ON DATABASE stalwart TO nameh;

-- Extensions for the main application database
\c nameh
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Extensions for Stalwart database
\c stalwart
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
GRANT ALL ON SCHEMA public TO nameh;
