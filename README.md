# Eon Organizer

A roleplaying game organizer that lets users create and manage worlds and characters with proper permission controls.

## Features

- **User Authentication**: Secure registration and login with JWT tokens
- **World Management**: Create and manage your own roleplaying worlds
- **Character Creation**: Create multiple characters in any world you have access to
- **Permission System**: 
  - World admins have full control over their worlds
  - Users can only manage their own characters
  - World admins can view and modify all characters in their worlds
- **Public/Private Worlds**: Control access to your worlds

## Architecture

### Backend
- **Express.js** API server
- **MongoDB** database with Mongoose ODM
- **JWT** authentication
- RESTful API design

### Frontend
- **React** with Vite
- **React Router** for navigation
- **Context API** for state management
- Modern responsive UI

### Docker
- Multi-container setup with Docker Compose
- MongoDB database container
- Mongo Express admin interface
- Nginx reverse proxy
- Hot-reload support for development

## Getting Started

### Prerequisites
- Node.js 18+
- Docker and Docker Compose

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/cjceu80/Eon-organizer.git
cd Eon-organizer
```

2. **Set up environment variables**
```bash
# Create Docker environment file
cp .env.example .env

# Create backend environment file
cp backend/.env.example backend/.env

# Edit both files with your configuration
```

3. **Start with Docker**
```bash
docker-compose up --build
```

4. **Access the application**
- Frontend: http://localhost
- Backend API: http://localhost/api
- Mongo Express: http://localhost:8081

### Development Mode

To run without Docker for faster development:

1. **Start MongoDB container**
```bash
docker-compose up mongodb -d
```

2. **Start backend**
```bash
cd backend
npm install
npm run dev
```

3. **Start frontend**
```bash
cd client
npm install
npm run dev
```

## Project Structure

```
├── backend/
│   ├── models/         # MongoDB models (User, World, Character)
│   ├── routes/         # API routes (auth, worlds, characters)
│   ├── middleware/     # Authentication & permissions
│   ├── server.js       # Express server setup
│   └── .env           # Backend configuration
├── client/
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── context/    # Auth context
│   │   ├── hooks/      # Custom React hooks
│   │   └── main.jsx    # Entry point
│   └── vite.config.js
├── nginx/             # Nginx configuration
├── docker-compose.yml # Docker orchestration
└── .env              # Docker environment variables
```

## API Documentation

See [API_REFERENCE.md](API_REFERENCE.md) for complete API documentation.

## Security

- JWT tokens stored in localStorage
- Password hashing with bcrypt
- Protected routes with middleware
- Permission checks on all operations
- Environment variables for sensitive data

## Contributing

This is a personal project, but suggestions and feedback are welcome!

## License

MIT License - see LICENSE file for details

