#!/usr/bin/env bash
###############################################################
#  Nameh.me — Automated Setup Script
#  Usage: bash setup.sh
#  Prerequisites: Docker, Docker Compose v2.12+
###############################################################
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

info()    { echo -e "${CYAN}  INFO${NC}  $1"; }
success() { echo -e "${GREEN}  DONE${NC}  $1"; }
warn()    { echo -e "${YELLOW}  WARN${NC}  $1"; }
fail()    { echo -e "${RED}  FAIL${NC}  $1"; exit 1; }

echo ""
echo -e "${BOLD}  Nameh.me — Mail Platform Setup${NC}"
echo -e "${BOLD}  ================================${NC}"
echo ""

# ── 1. Check Prerequisites ──────────────────────────
info "Checking prerequisites..."

command -v docker &>/dev/null || fail "Docker not found. Install from https://docs.docker.com/get-docker/"
docker compose version &>/dev/null || fail "Docker Compose v2 not found."

success "Docker $(docker --version | cut -d' ' -f3 | tr -d ',')"
success "Docker Compose $(docker compose version --short)"

# ── 2. Environment File ─────────────────────────────
if [ ! -f .env ]; then
    info "Creating .env from .env.example..."
    cp .env.example .env
    success ".env file created — review and update passwords before production use"
else
    success ".env file exists"
fi

# ── 3. Check Ports ───────────────────────────────────
info "Checking for port conflicts..."
PORTS=(25 80 143 443 465 587 993 4190 5432 6379 8000 8080 8090 8888 9000 9001 11334)
CONFLICTS=()
for PORT in "${PORTS[@]}"; do
    if lsof -i ":$PORT" &>/dev/null 2>&1 || ss -tlnp | grep -q ":${PORT} " 2>/dev/null; then
        CONFLICTS+=("$PORT")
    fi
done
if [ ${#CONFLICTS[@]} -gt 0 ]; then
    warn "Ports in use: ${CONFLICTS[*]}"
    warn "Stop conflicting services or edit docker-compose.override.yml"
    read -p "  Continue? [y/N] " -n 1 -r; echo
    [[ $REPLY =~ ^[Yy]$ ]] || exit 1
fi

# ── 4. Create Required Directories ──────────────────
info "Ensuring config directories exist..."
mkdir -p infrastructure/{stalwart,traefik/dynamic,redis,postgres,minio,rspamd/local.d}
success "Directories ready"

# ── 5. Pull Images ──────────────────────────────────
info "Pulling Docker images (this may take a while)..."
docker compose pull
success "All images pulled"

# ── 6. Build Backend ────────────────────────────────
info "Building backend API image..."
docker compose build backend
success "Backend built"

# ── 7. Start Stack ──────────────────────────────────
info "Starting Nameh.me stack..."
docker compose up -d
success "Stack started"

# ── 8. Wait & Show Info ─────────────────────────────
info "Waiting for services to initialize (20s)..."
sleep 20

echo ""
echo -e "${BOLD}  Nameh.me is Running${NC}"
echo -e "${BOLD}  ════════════════════════════════════════════${NC}"
echo ""
echo "  Stalwart Admin    http://localhost:8080"
echo "  Backend API       http://localhost:8000/api/docs"
echo "  Webmail           http://localhost:8888"
echo "  Traefik Dashboard http://localhost:8090"
echo "  MinIO Console     http://localhost:9001"
echo "  Rspamd Dashboard  http://localhost:11334"
echo ""
echo -e "  ${YELLOW}Stalwart admin password:${NC}"
echo "  docker logs nameh-stalwart 2>&1 | grep -i password"
echo ""
echo -e "  ${CYAN}Health check:${NC}  bash scripts/health-check.sh"
echo -e "  ${CYAN}View logs:${NC}     docker compose logs -f"
echo -e "  ${CYAN}Stop:${NC}          docker compose down"
echo -e "  ${CYAN}Reset:${NC}         docker compose down -v"
echo ""
