#!/bin/bash
set -e

echo "=== Nairi Deployment to Oracle Cloud ==="

# Load environment from .env.oracle
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

if [ -f "$PROJECT_DIR/.env.oracle" ]; then
  set -a
  source "$PROJECT_DIR/.env.oracle"
  set +a
  echo "Loaded .env.oracle"
fi

# Build the Docker image
echo "Building Nairi Docker image..."
docker build -t nairi:latest "$PROJECT_DIR"

# Deploy with docker-compose
echo "Starting services with docker-compose..."
docker compose -f "$PROJECT_DIR/docker-compose.yml" up -d --build

echo "=== Deployment Complete ==="
echo "Nairi: http://localhost:3000"
echo "OpenCode: http://localhost:4096"
echo "Public: https://nairi-api.duckdns.org"
