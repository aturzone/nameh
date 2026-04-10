# ══════════════════════════════════════════════════
#  Nameh.me — Makefile
# ══════════════════════════════════════════════════

.PHONY: up down restart logs build health clean reset ps

up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f

build:
	docker compose build

health:
	bash scripts/health-check.sh

clean:
	docker compose down --remove-orphans

reset:
	docker compose down -v --remove-orphans

ps:
	docker compose ps

stalwart-logs:
	docker logs -f nameh-stalwart

backend-logs:
	docker logs -f nameh-backend

stalwart-password:
	docker logs nameh-stalwart 2>&1 | grep -i password

shell-backend:
	docker exec -it nameh-backend /bin/bash

shell-postgres:
	docker exec -it nameh-postgres psql -U nameh

shell-redis:
	docker exec -it nameh-redis redis-cli
