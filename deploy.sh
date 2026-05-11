#!/bin/bash

# Ensure script stops on error
set -e

echo "=================================================="
echo "Starting Deployment Process for PPT-V2"
echo "=================================================="

# 1. Pull latest code from git
echo "=> Pulling latest code from Git..."
git pull origin main

# 2. Stop running containers
echo "=> Stopping existing containers..."
docker compose down

# 3. Build new Docker images and start containers
echo "=> Building and starting containers..."
docker compose up -d --build

# 4. Cleanup unused Docker images (optional but good for NAS storage)
echo "=> Cleaning up dangling images..."
docker image prune -f

echo "=================================================="
echo "Deployment Successful! Services are up and running."
echo "=================================================="
