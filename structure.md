# Nameh.me — Project Structure

## Overview

```
nameh/
|
|-- .env                          # Environment variables (gitignored)
|-- .env.example                  # Template for .env
|-- docker-compose.yml            # Production orchestration
|-- docker-compose.override.yml   # Local dev overrides (extra ports)
|-- setup.sh                      # One-command automated setup
|-- Makefile                      # Common commands shortcut
|-- README.md                     # Project documentation
|-- structure.md                  # This file
|-- plan.md                       # Project roadmap
|
|-- backend/                      # Custom Application API (FastAPI)
|   |-- Dockerfile
|   |-- requirements.txt
|   |-- app/
|   |   |-- __init__.py
|   |   |-- main.py               # FastAPI entry point
|   |   |-- config.py             # Settings from environment
|   |   |-- database.py           # SQLAlchemy async engine
|   |   |-- models/
|   |   |   |-- __init__.py
|   |   |   |-- user.py           # User model (PostgreSQL)
|   |   |-- routes/
|   |   |   |-- __init__.py
|   |   |   |-- health.py         # Health & readiness probes
|   |   |   |-- auth.py           # Registration & login (JWT)
|   |   |   |-- users.py          # User profile management
|   |   |   |-- mail.py           # JMAP proxy & mail status
|   |   |-- services/
|   |   |   |-- __init__.py
|   |   |   |-- stalwart.py       # Stalwart API client
|   |   |-- utils/
|   |       |-- __init__.py
|   |       |-- security.py       # Password hashing, JWT, auth deps
|
|-- frontend/                     # React app (placeholder)
|   |-- README.md
|
|-- infrastructure/               # Service configurations
|   |-- stalwart/
|   |   |-- config.toml           # Stalwart bootstrap config
|   |-- traefik/
|   |   |-- traefik.yml           # Traefik static configuration
|   |   |-- dynamic/
|   |       |-- default.yml       # Middleware & security headers
|   |-- postgres/
|   |   |-- init.sql              # Database initialization script
|   |-- redis/
|   |   |-- redis.conf            # Redis server configuration
|   |-- minio/
|   |   |-- init.sh               # Bucket creation script
|   |-- rspamd/
|       |-- local.d/
|           |-- worker-normal.inc  # Worker config
|           |-- redis.conf         # Redis connection
|           |-- milter_headers.conf# Header settings
|           |-- antivirus.conf     # ClamAV integration
|
|-- scripts/
|   |-- init-stalwart.sh          # Post-boot Stalwart setup
|   |-- health-check.sh           # Service health verification
```

## Service Architecture

```
                          Internet
                             |
                    +--------+--------+
                    |     Traefik     |  :80 / :443
                    |  (Edge Proxy)   |  :8090 (dashboard)
                    +--------+--------+
                             |
          +------------------+------------------+
          |                  |                  |
    +-----------+    +-----------+    +-----------+
    | Stalwart  |    |  Backend  |    | Roundcube |
    | Mail Core |    |  API      |    | Webmail   |
    | :8080     |    | :8000     |    | :80       |
    +-----------+    +-----------+    +-----------+
          |                |                |
    Mail Ports        +----+----+     +-----------+
    :25  SMTP         |         |     | Roundcube |
    :587 Submission   |         |     | DB (PG)   |
    :465 SMTPS        |         |     +-----------+
    :143 IMAP    +----+----+  +-+------+
    :993 IMAPS   |PostgreSQL|  | Redis  |
    :4190 Sieve  | :5432    |  | :6379  |
                 +----------+  +--------+
                       |
                 +----------+    +---------+
                 |  MinIO   |    | Rspamd  |  :11334
                 | S3 Store |    | + ClamAV|
                 | :9000    |    +---------+
                 | :9001    |
                 +----------+
```

## Data Flow

1. **User Registration**: React App -> Backend API -> PostgreSQL + Stalwart
2. **Login**: React App -> Backend API -> JWT Token
3. **Send/Read Mail**: React App -> Backend API (JMAP Proxy) -> Stalwart -> PostgreSQL (metadata) + MinIO (blobs)
4. **Spam Filter**: Inbound Mail -> Stalwart -> Rspamd (milter) -> ClamAV -> Deliver
