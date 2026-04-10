# Nameh.me — Test Credentials

## Preview App (Mock Backend)
- **Demo Login**: demo@nameh.me / demo123
- **API URL**: https://d87fc225-204e-4eef-a790-f719f7a652ee.preview.emergentagent.com
- **Backend**: Port 8001 (mock, in-memory storage)
- **Frontend**: Port 3000 (React dev server)

## Docker Production Stack

### Stalwart Admin
- **Username**: admin
- **Password**: Auto-generated on first boot
  ```bash
  docker logs nameh-stalwart 2>&1 | grep -i password
  ```

### PostgreSQL (Main)
- **Host**: postgres:5432 (internal) / localhost:5432 (override)
- **User**: nameh
- **Password**: nameh_secret_2024
- **Databases**: nameh (API), stalwart (mail engine)

### PostgreSQL (Roundcube)
- **Host**: roundcube-db:5432 (internal)
- **User**: roundcube
- **Password**: roundcube_secret_2024
- **Database**: roundcubemail

### MinIO (S3)
- **Endpoint**: http://minio:9000 (internal) / http://localhost:9000 (override)
- **Console**: http://localhost:9001
- **Access Key**: nameh_minio
- **Secret Key**: nameh_minio_secret_2024
- **Buckets**: stalwart-mail, user-avatars, attachments

### Redis
- **URL**: redis://redis:6379 / redis://localhost:6379 (override)

### Backend API
- **URL**: http://localhost:8000/api/docs
- **JWT Secret**: dev-secret-change-in-production
- **JWT Algorithm**: HS256

### Traefik
- **Dashboard**: http://localhost:8090
