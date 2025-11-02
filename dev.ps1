# PowerShell script to start development mode
# This enables hot-reload without rebuilding containers

$env:CLIENT_DOCKERFILE = "Dockerfile.dev"
$env:BACKEND_DOCKERFILE = "Dockerfile.dev"
$env:NODE_ENV = "development"

docker-compose build client backend
docker-compose up -d mongodb mongo-express client backend nginx

Write-Host "Development mode started!" -ForegroundColor Green
Write-Host "Vite dev server is running on port 5173" -ForegroundColor Cyan
Write-Host "Node.js server is running with watch mode on port 3000" -ForegroundColor Cyan
Write-Host "Changes to client/src/ will hot-reload automatically!" -ForegroundColor Yellow
Write-Host "Changes to backend/ will hot-reload automatically!" -ForegroundColor Yellow

