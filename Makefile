# ══════════════════════════════════════════════════
#  Nameh.me — Makefile
# ══════════════════════════════════════════════════

.PHONY: init up down restart logs build health clean reset ps

init:
	@if [ ! -f .env ]; then \
		echo "Creating .env from .env.example..."; \
		cp .env.example .env; \
		sed -i "s/CHANGE_ME/$$(openssl rand -hex 16)/g" .env; \
		sed -i "s/CHANGE_ME_USE_openssl_rand_hex_32/$$(openssl rand -hex 32)/g" .env; \
	fi
	docker compose build

up: init
	docker compose up -d

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f

build:
	docker compose build

test:
	docker compose run --rm backend pytest tests/test_backend_unit.py

health:
	@docker exec nameh-postgres pg_isready -U nameh || echo "PostgreSQL NOT READY"
	@docker exec nameh-redis redis-cli ping || echo "Redis NOT READY"
	@curl -sf http://localhost:9000/minio/health/live > /dev/null && echo "MinIO READY" || echo "MinIO NOT READY"
	@curl -sf http://localhost:8080/healthz > /dev/null && echo "Stalwart READY" || echo "Stalwart NOT READY"
	@curl -sf http://localhost:8000/api/health > /dev/null && echo "Backend API READY" || echo "Backend API NOT READY"

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
