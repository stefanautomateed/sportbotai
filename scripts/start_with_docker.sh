#!/usr/bin/env bash
set -euo pipefail

echo "Building and starting Docker Compose services..."
docker compose up --build
