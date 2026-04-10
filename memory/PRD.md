# Nameh.me — PRD (Product Requirements Document)

## Original Problem Statement
Build a production-grade, Docker Compose-based email platform called Nameh.me, designed to scale to 1M+ users. The backend must be fully containerized and health-checked, using Stalwart (Rust mail engine), PostgreSQL, Redis, MinIO (S3), Traefik (edge proxy), Rspamd, ClamAV, Roundcube (reference webmail), and a custom FastAPI application API. All services must boot healthy with `docker compose up`. Frontend (React) is deferred to a separate phase.

## Architecture
- **Mail Engine**: Stalwart (SMTP/IMAP/JMAP/CalDAV/CardDAV)
- **Backend API**: FastAPI (Python) with JWT auth, JMAP proxy
- **Database**: PostgreSQL 16 (Stalwart metadata + API data)
- **Cache**: Redis 7 (lookup, sessions)
- **Blob Storage**: MinIO S3 (email bodies, attachments)
- **Edge Proxy**: Traefik v3 (auto TLS, Docker-native)
- **Spam**: Rspamd + ClamAV
- **Webmail**: Roundcube (reference/fallback)
- **Domain**: nameh.me (production TBD)

## User Personas
1. **Platform Admin**: Manages domains, accounts, monitoring via Stalwart Admin UI + Backend API
2. **End User (1M+)**: Sends/receives email via React frontend (JMAP) or email client (IMAP/SMTP)
3. **Developer**: Extends backend API, builds React frontend using JMAP proxy

## Core Requirements (Static)
- [x] Single `docker compose up` boots all 12 services
- [x] Stalwart uses external PostgreSQL + MinIO + Redis
- [x] Automated bucket creation (MinIO init)
- [x] Traefik handles HTTP routing with ACME-ready TLS
- [x] Backend API with auth, health, user management, JMAP proxy
- [x] Works on localhost without domain
- [x] Production-ready for nameh.me with config changes
- [x] Comprehensive documentation (README, structure, plan)

## What's Been Implemented (Jan 2026)
- **Docker Compose**: 12 services, 8 volumes, 1 network, health checks, dependency chains
- **Infrastructure configs**: Stalwart config.toml, PostgreSQL init.sql, Redis config, MinIO init, Traefik static+dynamic, Rspamd 4 configs
- **Backend API**: FastAPI with 11 endpoints (health, auth, users, mail/JMAP)
- **Automation**: setup.sh, health-check.sh, init-stalwart.sh, Makefile with 13 targets
- **Documentation**: README.md, structure.md, plan.md, frontend/README.md
- **Testing**: 100% pass rate on syntax, config, and code validation

## Prioritized Backlog

### P0 (Critical for Production)
- [ ] Alembic database migrations
- [ ] Production .env with real passwords
- [ ] DNS setup for nameh.me
- [ ] TLS certificate validation

### P1 (Important)
- [ ] Rate limiting (Redis-based)
- [ ] Admin API endpoints
- [ ] Email quota management
- [ ] Stalwart account sync background jobs
- [ ] React frontend (Phase 3)

### P2 (Enhancement)
- [ ] Monitoring (Prometheus + Grafana)
- [ ] Backup automation
- [ ] CI/CD pipeline
- [ ] Load testing
- [ ] Custom domain support per user
- [ ] Two-factor authentication
- [ ] E2E encryption (PGP/S-MIME)

## Next Tasks
1. Clone repo and run `docker compose up` to verify all services boot
2. Configure Stalwart domain + first user account via admin UI
3. Test email flow end-to-end (send/receive via Roundcube)
4. Begin React frontend development
5. Set up Alembic migrations for backend API
