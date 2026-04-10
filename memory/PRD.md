# Nameh.me — PRD (Product Requirements Document)

## Original Problem Statement
Build a production-grade, Docker Compose-based email platform (Nameh.me) for 1M+ users. Gmail-level experience with custom branding, full English/Persian i18n, keyboard shortcuts, labels, bulk actions, category tabs, settings, and monitoring stack.

## Architecture (17 Services)
- **Mail Engine**: Stalwart (Rust, SMTP/IMAP/JMAP)
- **Backend API**: FastAPI (Python), JWT auth, JMAP proxy
- **Frontend**: React 18, DM Sans + Vazirmatn fonts, Tailwind CSS
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Blob Storage**: MinIO (S3)
- **Edge Proxy**: Traefik v3 (auto TLS)
- **Spam/AV**: Rspamd + ClamAV
- **Webmail**: Roundcube (reference)
- **Monitoring**: Prometheus + Grafana + Redis Exporter + PostgreSQL Exporter

## What's Been Implemented (Jan 2026)

### Infrastructure
- Docker Compose: 17 services, 10 volumes, 1 network
- Automated setup (setup.sh), Makefile (13+ targets), health checks
- Stalwart with external PostgreSQL + MinIO + Redis
- Traefik reverse proxy with ACME/Let's Encrypt
- Prometheus + Grafana monitoring with exporters

### Backend API (15+ endpoints)
- JWT auth (register/login), user profiles
- Email CRUD (list, view, compose, delete)
- Email actions (star, read/unread, trash, spam, move, label)
- Bulk actions (multi-select operations)
- Folder management with unread counts
- Category filtering (primary, social, promotions, updates)
- Labels CRUD with colors
- User settings (language, font, signature, theme)
- Email search, JMAP proxy, mail status
- Alembic database migrations

### React Frontend (Gmail-level)
- Custom SVG logo + consistent brand
- 3-column layout (sidebar, email list, reading pane)
- Category tabs (Inbox/Primary/Social/Promotions/Updates)
- Checkboxes + bulk action bar
- Hover actions (archive, trash) on email rows
- Star/flag toggle, unread indicators
- Compose/Reply/Forward modal with minimize
- Labels with colored tags on emails
- Settings panel (language, font, signature)
- Keyboard shortcuts (j/k, c, r, e, #, /, s, Esc)
- Toast notifications with undo
- Quick reply button in reading pane
- Colored sender avatars

### i18n (Full Translation)
- Complete English translation (90+ keys)
- Complete Persian/Farsi translation (90+ keys)
- RTL layout with Tailwind logical properties
- Language persistence in settings
- Vazirmatn font for Persian, DM Sans for English

## Testing Results (3 iterations)
- Iteration 1: Infrastructure validation 100% (20/20)
- Iteration 2: Basic features 100% (19/19 backend + all frontend)
- Iteration 3: Full V2 100% (backend 100%, frontend 100%, integration 100%, performance 100%, i18n 100%)

## Prioritized Backlog

### P0 (Production)
- [ ] DNS setup for nameh.me + TLS
- [ ] Strong passwords in production .env
- [ ] End-to-end email with real Stalwart

### P1 (Important)
- [ ] Dark mode theme
- [ ] Contact management
- [ ] Password reset flow
- [ ] Email threading/conversations
- [ ] Attachment upload
- [ ] Rate limiting
- [ ] Admin panel

### P2 (Enhancement)
- [ ] Mobile responsive
- [ ] 2FA (TOTP)
- [ ] Custom domains per user
- [ ] Grafana dashboard templates
- [ ] CI/CD pipeline
- [ ] Load testing (1M simulation)
- [ ] Backup automation
