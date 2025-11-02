# Development Setup

## Hot Reload Development Mode

To use both Vite dev server and Node.js watch mode for hot-reload (no rebuild needed for code changes):

### Quick Start

**Windows (PowerShell):**
```powershell
.\dev.ps1
```

**Linux/Mac:**
```bash
chmod +x dev.sh
./dev.sh
```

### Manual Setup

1. Set environment variables to use development Dockerfiles:
   
   **PowerShell:**
   ```powershell
   $env:CLIENT_DOCKERFILE = "Dockerfile.dev"
   $env:BACKEND_DOCKERFILE = "Dockerfile.dev"
   $env:NODE_ENV = "development"
   ```
   
   **Bash:**
   ```bash
   export CLIENT_DOCKERFILE=Dockerfile.dev
   export BACKEND_DOCKERFILE=Dockerfile.dev
   export NODE_ENV=development
   ```
   
   Or create a `.env` file in the project root with:
   ```
   CLIENT_DOCKERFILE=Dockerfile.dev
   BACKEND_DOCKERFILE=Dockerfile.dev
   NODE_ENV=development
   ```

2. Rebuild and start containers:
   ```bash
   docker-compose build client backend
   docker-compose up -d client backend nginx
   ```

3. Your changes to `client/src/` and `backend/` will now hot-reload automatically! ✨

## Production Mode

For production builds (nginx serving static files, Node.js production mode):

1. Unset the environment variables:
   ```bash
   # PowerShell
   Remove-Item Env:\CLIENT_DOCKERFILE
   Remove-Item Env:\BACKEND_DOCKERFILE
   Remove-Item Env:\NODE_ENV
   
   # Bash
   unset CLIENT_DOCKERFILE
   unset BACKEND_DOCKERFILE
   unset NODE_ENV
   ```

2. Rebuild:
   ```bash
   docker-compose build client backend
   docker-compose up -d client backend nginx
   ```

## Notes

- **Development Mode:**
  - Client runs on port 5173 (Vite dev server with HMR)
  - Backend runs with `node --watch` for automatic restart on file changes
  - The nginx proxy forwards requests to the dev server on port 80
  - Source code in `client/src/` and `backend/` is mounted as volumes for instant updates
  - No need to rebuild containers when editing source files!
  
- **Access:**
  - Access your app at `http://localhost` (proxied through nginx)
  - API available at `http://localhost/api`
  
- **Hot Reload:**
  - Frontend: Changes to `client/src/` files trigger instant browser refresh via Vite HMR
  - Backend: Changes to `backend/` files trigger automatic server restart via Node.js `--watch`
