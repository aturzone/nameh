#!/bin/sh
# Nameh.me — MinIO Bucket Initialization

set -e

echo "Configuring MinIO client..."
mc alias set nameh http://minio:9000 nameh_minio nameh_minio_secret_2024

echo "Creating buckets..."
mc mb nameh/stalwart-mail --ignore-existing
mc mb nameh/user-avatars --ignore-existing
mc mb nameh/attachments --ignore-existing

echo "Setting bucket policies..."
mc anonymous set download nameh/user-avatars

echo "MinIO initialization complete."
mc ls nameh/
