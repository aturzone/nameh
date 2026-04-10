# Nameh.me — Test Credentials

## Preview App (Mock Backend)
- **Demo Login**: demo@nameh.me / demo123
- **API URL**: https://d87fc225-204e-4eef-a790-f719f7a652ee.preview.emergentagent.com
- **Backend**: Port 8001 (mock, in-memory)
- **Frontend**: Port 3000 (React dev)

## Docker Production Stack

### Stalwart Admin
- **Username**: admin
- **Password**: Auto-generated → `docker logs nameh-stalwart 2>&1 | grep -i password`

### PostgreSQL
- **User**: nameh / **Password**: nameh_secret_2024
- **Databases**: nameh, stalwart

### MinIO
- **Access Key**: nameh_minio / **Secret**: nameh_minio_secret_2024
- **Console**: localhost:9001

### Roundcube DB
- **User**: roundcube / **Password**: roundcube_secret_2024

### Redis
- **URL**: redis://redis:6379 (no auth)

### Backend API
- **JWT Secret**: dev-secret-change-in-production
- **Docs**: localhost:8000/api/docs

### Grafana
- **Login**: admin / admin
- **URL**: localhost:3001

### Traefik Dashboard
- **URL**: localhost:8090

### Prometheus
- **URL**: localhost:9090
