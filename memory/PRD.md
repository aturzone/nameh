# Nameh.me — PRD (Product Requirements Document)

## Original Problem Statement
Build a production-grade, Docker Compose-based email platform called Nameh.me, designed to scale to 1M+ users. Complete backend infrastructure with Stalwart (Rust mail engine), PostgreSQL, Redis, MinIO (S3), Traefik (edge proxy), Rspamd, ClamAV, Roundcube, and a custom FastAPI application API. Full React frontend email client with 3-column layout, compose, RTL/Persian support, and folder management.

## Architecture
- **Mail Engine**: Stalwart (SMTP/IMAP/JMAP/CalDAV/CardDAV)
- **Backend API**: FastAPI (Python) with JWT auth, JMAP proxy
- **Frontend**: React 18 with Tailwind CSS, 3-column email client
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
3. **Developer**: Extends backend API, builds on React frontend

## What's Been Implemented (Jan 2026)

### Infrastructure (Phase 1)
- Docker Compose: 13 services, 8 volumes, 1 network
- Stalwart config.toml: PostgreSQL + MinIO + Redis stores
- Traefik v3: Edge proxy with Let's Encrypt ACME support
- PostgreSQL init: stalwart + nameh databases
- Redis: Caching layer with persistence
- MinIO: S3 buckets (stalwart-mail, user-avatars, attachments)
- Rspamd + ClamAV: Spam filtering + antivirus
- Roundcube: Reference webmail
- Alembic: Database migration framework

### Backend API (Phase 2)
- 15+ API endpoints (health, auth, users, mail CRUD)
- JWT authentication (register/login)
- Email CRUD: list, view, compose, delete
- Email actions: star, read/unread, trash, spam, move
- Folder management with unread counts
- Email search
- JMAP proxy to Stalwart
- Stalwart API client

### React Frontend (Phase 3)
- Auth page: Login/Register with branded visual
- 3-column "Control Room Grid": Sidebar + Email List + Reading Pane
- Compose/Reply/Forward modal with minimize
- Folder navigation (Inbox, Sent, Drafts, Trash, Spam)
- Email search with real-time filtering
- RTL/Persian toggle (Tailwind logical properties)
- Swiss & High-Contrast design (Manrope + IBM Plex Sans)
- Unread dots, star indicators, attachment icons
- Empty state illustrations
- Staggered animation entrances

### Automation & Docs
- setup.sh: One-command automated setup
- Makefile: 13 command shortcuts
- health-check.sh: Service verification
- README.md: Comprehensive documentation
- structure.md: Architecture diagram
- plan.md: Full roadmap

## Testing Results
- Infrastructure: 100% validation (20/20 checks)
- Backend API: 100% (19/19 tests)
- Frontend: 100% (all interactive tests pass)

## Prioritized Backlog

### P0 (Critical for Production)
- [ ] Production .env with strong passwords
- [ ] DNS setup for nameh.me
- [ ] TLS certificate validation
- [ ] End-to-end email flow testing with Stalwart

### P1 (Important)
- [ ] Rate limiting (Redis-based)
- [ ] Admin panel endpoints
- [ ] Email quota management
- [ ] Contact management
- [ ] Settings panel (expanded)
- [ ] Password reset flow
- [ ] Dark mode theme

### P2 (Enhancement)
- [ ] Monitoring (Prometheus + Grafana)
- [ ] Backup automation
- [ ] CI/CD pipeline
- [ ] Load testing (1M user simulation)
- [ ] Custom domain support per user
- [ ] Two-factor authentication
- [ ] Mobile responsive optimization
