# Nameh.me — Test Credentials

## Stalwart Admin
- **Username**: admin
- **Password**: Auto-generated on first boot. Retrieve with:
  ```bash
  docker logs nameh-stalwart 2>&1 | grep -i password
  ```

## PostgreSQL (Main)
- **Host**: postgres (internal) / localhost:5432 (dev override)
- **User**: nameh
- **Password**: nameh_secret_2024
- **Database**: nameh (API) / stalwart (mail engine)

## PostgreSQL (Roundcube)
- **Host**: roundcube-db (internal)
- **User**: roundcube
- **Password**: roundcube_secret_2024
- **Database**: roundcubemail

## MinIO (S3)
- **Endpoint**: http://minio:9000 (internal) / http://localhost:9000 (dev override)
- **Console**: http://localhost:9001
- **Access Key**: nameh_minio
- **Secret Key**: nameh_minio_secret_2024
- **Buckets**: stalwart-mail, user-avatars, attachments

## Redis
- **URL**: redis://redis:6379 (internal) / redis://localhost:6379 (dev override)
- **No password** (internal network only)

## Backend API
- **URL**: http://localhost:8000
- **Docs**: http://localhost:8000/api/docs
- **JWT Secret**: dev-secret-change-in-production
- **JWT Algorithm**: HS256

## Traefik Dashboard
- **URL**: http://localhost:8090
- **No auth** (insecure mode for development)
