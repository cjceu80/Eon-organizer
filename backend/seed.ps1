# PowerShell script to run seed script locally
# This connects to the MongoDB running in Docker container via localhost

Write-Host "Running seed script locally..." -ForegroundColor Cyan
Write-Host "Connecting to MongoDB at localhost:27017" -ForegroundColor Yellow

# Override MONGODB_URI to use localhost for local execution
# This allows Docker to continue using the .env file with 'mongodb' hostname
$env:MONGODB_URI = "mongodb://localhost:27017/eon-organizer"

# Run the seed script via npm
npm run seed

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Seed script completed successfully!" -ForegroundColor Green
} else {
    Write-Host "`n✗ Seed script failed with exit code $LASTEXITCODE" -ForegroundColor Red
    Write-Host "Make sure MongoDB container is running: docker-compose ps mongodb" -ForegroundColor Yellow
    exit $LASTEXITCODE
}
