#!/bin/sh
# ══════════════════════════════════════════════════
#  Nameh.me — Stalwart Post-Boot Initialization
#  Waits for Stalwart, then configures domain
# ══════════════════════════════════════════════════

set -e

STALWART_URL="http://stalwart:8080"
MAX_RETRIES=30
RETRY_INTERVAL=5

echo "[init] Waiting for Stalwart to become available..."

retries=0
while [ $retries -lt $MAX_RETRIES ]; do
    if curl -sf "${STALWART_URL}/healthz" > /dev/null 2>&1; then
        echo "[init] Stalwart is up and running."
        break
    fi
    retries=$((retries + 1))
    echo "[init] Attempt ${retries}/${MAX_RETRIES} — waiting ${RETRY_INTERVAL}s..."
    sleep $RETRY_INTERVAL
done

if [ $retries -eq $MAX_RETRIES ]; then
    echo "[init] ERROR: Stalwart did not start in time."
    exit 1
fi

echo "[init] Stalwart initialization check complete."
echo "[init] Use the Stalwart Admin UI at ${STALWART_URL} to:"
echo "  1. Set hostname (Settings > Server > Network)"
echo "  2. Add domain (Management > Directory > Domains)"
echo "  3. Create user accounts (Management > Directory > Accounts)"
echo "[init] Admin credentials were printed in Stalwart container logs on first boot."
echo "[init] Run: docker logs nameh-stalwart | grep -i password"
