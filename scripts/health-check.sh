#!/bin/bash
# ══════════════════════════════════════════════════
#  Nameh.me — Service Health Check
# ══════════════════════════════════════════════════

RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'
ok() { echo -e "  ${GREEN}OK${NC}  $1"; }
fail() { echo -e "  ${RED}FAIL${NC}  $1"; }

echo "=== Nameh.me Health Check ==="
echo ""

# PostgreSQL
docker exec nameh-postgres pg_isready -U nameh > /dev/null 2>&1 && ok "PostgreSQL" || fail "PostgreSQL"

# Redis
docker exec nameh-redis redis-cli ping > /dev/null 2>&1 && ok "Redis" || fail "Redis"

# MinIO
curl -sf http://localhost:9000/minio/health/live > /dev/null 2>&1 && ok "MinIO" || fail "MinIO"

# Stalwart
curl -sf http://localhost:8080/healthz > /dev/null 2>&1 && ok "Stalwart" || fail "Stalwart"

# Traefik
curl -sf http://localhost:8090/api/overview > /dev/null 2>&1 && ok "Traefik" || fail "Traefik"

# Backend API
curl -sf http://localhost:8000/api/health > /dev/null 2>&1 && ok "Backend API" || fail "Backend API"

# Roundcube
curl -sf http://localhost:8888/ > /dev/null 2>&1 && ok "Roundcube" || fail "Roundcube"

# Rspamd
curl -sf http://localhost:11334/ > /dev/null 2>&1 && ok "Rspamd" || fail "Rspamd"

echo ""
echo "=== Done ==="
