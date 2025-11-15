import express from 'express';
import RollTable from '../models/RollTable.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all roll tables (public endpoint, no auth required for now)
router.get('/', async (req, res) => {
  try {
    const tables = await RollTable.find({}).sort({ name: 1 });
    res.json({ tables });
  } catch (error) {
    console.error('Error fetching roll tables:', error);
    res.status(500).json({ message: 'Failed to fetch roll tables' });
  }
});

// Get roll table by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const table = await RollTable.findOne({ slug });
    
    if (!table) {
      return res.status(404).json({ message: 'Roll table not found' });
    }
    
    res.json({ table });
  } catch (error) {
    console.error('Error fetching roll table:', error);
    res.status(500).json({ message: 'Failed to fetch roll table' });
  }
});

export default router;

