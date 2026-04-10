# Nameh.me — Project Plan

## Vision
Build a world-class, self-hosted email platform capable of serving 1 million+ users with a custom React frontend and a robust backend infrastructure.

## Phase 1: Infrastructure Foundation (Current)

### Completed
- [x] Docker Compose orchestration (12 services)
- [x] Stalwart mail engine with external storage (PostgreSQL + MinIO + Redis)
- [x] Traefik edge proxy with TLS/ACME support
- [x] PostgreSQL primary database
- [x] Redis caching layer
- [x] MinIO S3-compatible object storage
- [x] Rspamd spam filtering + ClamAV antivirus
- [x] Roundcube reference webmail
- [x] Custom FastAPI backend API skeleton
- [x] Automated setup script
- [x] Health check tooling
- [x] Comprehensive documentation

### Backend API Features
- [x] Health check endpoints (liveness + readiness)
- [x] User registration with Stalwart sync
- [x] JWT authentication (login/logout)
- [x] User profile management
- [x] JMAP proxy to Stalwart
- [x] Mail status endpoint
- [x] Domain listing
- [x] Alembic database migrations
- [x] Email CRUD (list, view, compose, delete)
- [x] Email actions (star, read/unread, trash, spam, move)
- [x] Folder management with unread counts
- [x] Email search

## Phase 2: Backend Hardening (Next)
- [ ] Alembic database migrations
- [ ] Rate limiting (Redis-based)
- [ ] Admin endpoints (user management, domain CRUD)
- [ ] Email quota management
- [ ] Webhook system for mail events
- [ ] API key authentication (for integrations)
- [ ] Audit logging
- [ ] Stalwart account sync (background jobs)

## Phase 3: React Frontend (Completed)
- [x] Authentication UI (register, login)
- [x] Inbox / Mailbox view (3-column layout)
- [x] Email reading pane with action bar
- [x] Compose / Reply / Forward modal
- [x] Folder navigation (inbox, sent, drafts, trash, spam)
- [x] Email search
- [x] RTL / Persian language support toggle
- [x] Unread indicators, star/flag, attachment icons
- [x] Swiss & High-Contrast design (Manrope + IBM Plex Sans)
- [ ] Contact management
- [ ] Settings panel (expanded)
- [ ] Mobile responsive design
- [ ] Dark / Light theme toggle
- [ ] Password reset flow

## Phase 4: Production Readiness
- [ ] Let's Encrypt TLS automation (nameh.me domain)
- [ ] DNS configuration guide (MX, SPF, DKIM, DMARC)
- [ ] Horizontal scaling documentation
- [ ] Monitoring stack (Prometheus + Grafana)
- [ ] Backup automation (PostgreSQL + MinIO)
- [ ] CI/CD pipeline
- [ ] Load testing (1M user simulation)

## Phase 5: Premium Features
- [ ] Custom domain support (per-user)
- [ ] Calendar (CalDAV via Stalwart)
- [ ] Contacts (CardDAV via Stalwart)
- [ ] End-to-end encryption (PGP/S-MIME)
- [ ] Email aliases and forwarding rules
- [ ] Storage usage dashboard
- [ ] Two-factor authentication (TOTP)
- [ ] OAuth2 provider

## Architecture Decisions
| Decision | Choice | Reason |
|----------|--------|--------|
| Mail Engine | Stalwart | Modern (Rust), JMAP native, all-in-one |
| Backend API | FastAPI (Python) | Async, fast, great DX, type-safe |
| Database | PostgreSQL 16 | Gold standard, Stalwart native support |
| Cache | Redis 7 | Industry standard, Stalwart compatible |
| Blob Storage | MinIO (S3) | Scalable, decoupled from disk |
| Edge Proxy | Traefik v3 | Auto-SSL, Docker native, modern |
| Spam Filter | Rspamd | ML-based, fast, Redis integration |
| Antivirus | ClamAV | Open source standard |
| Auth | JWT (HS256) | Stateless, simple, scalable |

## Domain: nameh.me
- Production deployment TBD
- Requires DNS (MX, A, AAAA, SPF, DKIM, DMARC records)
- Traefik handles Let's Encrypt certificate automation
