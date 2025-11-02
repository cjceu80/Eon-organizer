# Development Mode Troubleshooting

## Verify Dev Mode is Active

Check if containers are running in dev mode:

```powershell
# Check client process
docker exec eon-client sh -c "ps aux" | findstr vite

# Check backend process  
docker exec eon-backend sh -c "ps aux" | findstr watch
```

You should see:
- Client: `vite --host 0.0.0.0` 
- Backend: `node --watch server.js`

## Verify Volumes are Mounted

```powershell
# Check client volumes
docker inspect eon-client --format='{{json .Mounts}}' | ConvertFrom-Json | Format-Table Source, Destination

# Check backend volumes
docker inspect eon-backend --format='{{json .Mounts}}' | ConvertFrom-Json | Format-Table Source, Destination
```

## Common Issues and Fixes

### Issue: Changes not hot-reloading (Frontend)

**Solution 1:** Added polling to vite.config.js - restart client:
```powershell
docker-compose restart client
```

**Solution 2:** Rebuild with dev Dockerfile:
```powershell
$env:CLIENT_DOCKERFILE = "Dockerfile.dev"
docker-compose build client
docker-compose up -d client
```

### Issue: Backend not restarting on file changes

**Solution:** Rebuild with dev Dockerfile:
```powershell
$env:BACKEND_DOCKERFILE = "Dockerfile.dev"
docker-compose build backend
docker-compose up -d backend
```

### Issue: Containers using production mode

**Solution:** Use the dev.ps1 script:
```powershell
.\dev.ps1
```

This ensures:
- CLIENT_DOCKERFILE=Dockerfile.dev
- BACKEND_DOCKERFILE=Dockerfile.dev
- NODE_ENV=development

## Test Hot Reload

1. **Frontend:** Edit a file in `client/src/` and save - browser should auto-refresh
2. **Backend:** Edit a file in `backend/routes/` and save - check logs:
   ```powershell
   docker logs -f eon-backend
   ```
   You should see the server restart automatically

## Verify It's Working

1. **Frontend logs:**
   ```powershell
   docker logs -f eon-client
   ```
   When you save a file, you should see Vite detecting the change

2. **Backend logs:**
   ```powershell
   docker logs -f eon-backend
   ```
   When you save a file, you should see:
   ```
   File change detected. Restarting...
   Server is running on port 3000
   ```

