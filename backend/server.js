import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import worldRoutes from './routes/worlds.js';
import characterRoutes from './routes/characters.js';
import inviteRoutes from './routes/invites.js';
import raceRoutes from './routes/races.js';
import raceCategoryRoutes from './routes/raceCategories.js';
import npcRoutes from './routes/npcs.js';
import rollTableRoutes from './routes/rollTables.js';
import { authenticateToken } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/eon-organizer';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB with options
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    console.error('MongoDB URI:', MONGODB_URI);
  });

// Handle connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/worlds', worldRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/races', raceRoutes);
app.use('/api/race-categories', raceCategoryRoutes);
app.use('/api/npcs', npcRoutes);
app.use('/api/roll-tables', rollTableRoutes);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Example protected API route
app.get('/api/test', authenticateToken, (req, res) => {
  res.json({ message: 'Backend API is working!', user: req.user });
});

// Error handling middleware (must be after routes)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

