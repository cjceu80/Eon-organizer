# Environment Configuration

This project uses environment variables for sensitive configuration. Follow these steps to set up your environment:

## Setup Instructions

1. **Create your `.env` file** in the `backend` directory:
   ```bash
   cp .env.example .env
   ```

2. **Edit the `.env` file** with your actual values:
   - Replace `JWT_SECRET` with a strong, random secret key
   - Update `MONGODB_URI` if your database is hosted elsewhere
   - Adjust `PORT` if needed

3. **Never commit `.env` to git!** It's already in `.gitignore`

## Required Environment Variables

- `PORT` - Server port (default: 3000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT token signing

## Docker Usage

When running with Docker, you can either:
- Use the `.env` file for local development
- Pass environment variables via `docker-compose.yml`
- Use Docker secrets for production

## Security Notes

⚠️ **IMPORTANT**: 
- Never share your `.env` file or commit it to version control
- Use different `JWT_SECRET` values for development and production
- Generate strong random secrets for production environments
- Consider using a password manager to generate and store secrets

