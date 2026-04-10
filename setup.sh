#!/usr/bin/env bash
###############################################################
#  IranMail MVP Setup Script
#  Run: bash setup.sh
#  Tested on: Ubuntu 22.04 / 24.04, Debian 12, macOS (Docker Desktop)
###############################################################
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

info()    { echo -e "${CYAN}ℹ ${NC}$1"; }
success() { echo -e "${GREEN}✅ ${NC}$1"; }
warn()    { echo -e "${YELLOW}⚠  ${NC}$1"; }
error()   { echo -e "${RED}❌ ${NC}$1"; exit 1; }

echo ""
echo -e "${BOLD}╔════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║     IranMail MVP — Stack Setup         ║${NC}"
echo -e "${BOLD}╚════════════════════════════════════════╝${NC}"
echo ""

# ── 1. Check Docker ─────────────────────────────────────────
info "Checking Docker..."
if ! command -v docker &>/dev/null; then
    error "Docker not found. Install from: https://docs.docker.com/get-docker/"
fi
if ! docker compose version &>/dev/null; then
    error "Docker Compose v2 not found. Update Docker Desktop or install plugin."
fi
success "Docker $(docker --version | cut -d' ' -f3 | tr -d ',')"
success "Docker Compose $(docker compose version --short)"

# ── 2. Check port conflicts ──────────────────────────────────
info "Checking for port conflicts..."
PORTS=(25 80 110 143 443 465 587 993 995 4190 8080 11334)
CONFLICTS=()
for PORT in "${PORTS[@]}"; do
    if lsof -i ":$PORT" &>/dev/null 2>&1; then
        CONFLICTS+=("$PORT")
    fi
done
if [ ${#CONFLICTS[@]} -gt 0 ]; then
    warn "These ports are already in use: ${CONFLICTS[*]}"
    warn "You may need to stop other services (e.g. sudo systemctl stop postfix)"
    read -p "Continue anyway? [y/N] " -n 1 -r; echo
    [[ $REPLY =~ ^[Yy]$ ]] || exit 1
fi

# ── 3. Create rspamd config dir ──────────────────────────────
info "Creating config directories..."
mkdir -p rspamd-config nginx/conf.d roundcube-config
success "Directories ready"

# ── 4. Pull all images first ─────────────────────────────────
info "Pulling Docker images (this may take a few minutes)..."
docker compose pull
success "All images pulled"

# ── 5. Start the stack ───────────────────────────────────────
info "Starting IranMail stack..."
docker compose up -d
success "Stack started"

# ── 6. Wait for Stalwart to initialize ───────────────────────
info "Waiting for Stalwart to initialize (15 seconds)..."
sleep 15

# ── 7. Get Stalwart admin credentials ────────────────────────
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}   🔑  Stalwart Admin Credentials${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
docker logs stalwart 2>&1 | grep -E "(administrator|password|admin)" | head -5 || true
echo ""

# ── 8. Wait for ClamAV to download signatures ─────────────────
info "ClamAV is downloading virus signatures in the background..."
info "(First startup takes 2-5 min — stack works without it)"

# ── 9. Print access URLs ─────────────────────────────────────
echo ""
echo -e "${BOLD}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║           🚀  IranMail is Running!             ║${NC}"
echo -e "${BOLD}╠════════════════════════════════════════════════╣${NC}"
echo -e "${BOLD}║${NC}  📧  Webmail (Roundcube)                       ${BOLD}║${NC}"
echo -e "${BOLD}║${NC}      ${GREEN}http://localhost${NC}                           ${BOLD}║${NC}"
echo -e "${BOLD}║${NC}                                                ${BOLD}║${NC}"
echo -e "${BOLD}║${NC}  ⚙️   Stalwart Admin Panel                     ${BOLD}║${NC}"
echo -e "${BOLD}║${NC}      ${GREEN}http://localhost:8080${NC}                      ${BOLD}║${NC}"
echo -e "${BOLD}║${NC}      (check logs above for admin password)     ${BOLD}║${NC}"
echo -e "${BOLD}║${NC}                                                ${BOLD}║${NC}"
echo -e "${BOLD}║${NC}  🛡️   Rspamd Spam Dashboard                   ${BOLD}║${NC}"
echo -e "${BOLD}║${NC}      ${GREEN}http://localhost:11334${NC}                     ${BOLD}║${NC}"
echo -e "${BOLD}║${NC}                                                ${BOLD}║${NC}"
echo -e "${BOLD}║${NC}  📨  IMAP: localhost:143  (or 993 TLS)         ${BOLD}║${NC}"
echo -e "${BOLD}║${NC}  📤  SMTP: localhost:587  (or 465 TLS)         ${BOLD}║${NC}"
echo -e "${BOLD}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Go to http://localhost:8080 → log in as admin"
echo "  2. Settings → Server → Network → set hostname to 'localhost'"
echo "  3. Management → Directory → Domains → Add 'localhost'"
echo "  4. Management → Directory → Accounts → Create a test user"
echo "  5. Log into http://localhost with that user's credentials"
echo ""
echo -e "${CYAN}Useful commands:${NC}"
echo "  View logs:           docker compose logs -f"
echo "  Stalwart logs only:  docker logs -f stalwart"
echo "  Stop everything:     docker compose down"
echo "  Reset all data:      docker compose down -v"
echo ""
