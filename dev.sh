#!/bin/bash
# Bash script to start development mode
# This enables hot-reload without rebuilding containers

export CLIENT_DOCKERFILE=Dockerfile.dev
export BACKEND_DOCKERFILE=Dockerfile.dev
export NODE_ENV=development

docker-compose build client backend
docker-compose up -d mongodb mongo-express client backend nginx

echo "Development mode started!"
echo "Vite dev server is running on port 5173"
echo "Node.js server is running with watch mode on port 3000"
echo "Changes to client/src/ will hot-reload automatically!"
echo "Changes to backend/ will hot-reload automatically!"

