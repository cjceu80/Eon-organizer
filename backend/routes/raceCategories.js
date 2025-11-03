import express from 'express';
import RaceCategory from '../models/RaceCategory.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Get all categories for a ruleset
router.get('/:ruleset', authenticateToken, asyncHandler(async (req, res) => {
  const { ruleset } = req.params;
  const categories = await RaceCategory.find({ ruleset });
  res.json({ categories });
}));

// Optionally fetch one category by id
router.get('/id/:categoryId', authenticateToken, asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const category = await RaceCategory.findById(categoryId);
  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }
  res.json({ category });
}));

export default router;
