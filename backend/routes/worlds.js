import express from 'express';
import World from '../models/World.js';
import Character from '../models/Character.js';
import { authenticateToken } from '../middleware/auth.js';
import { isWorldAdmin, canAccessWorld } from '../middleware/worldPermissions.js';

const router = express.Router();

// Helper function to wrap async routes
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Create a new world
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const { name, description, isPublic, ruleset, settings } = req.body;

  // Validation
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'World name is required' });
  }

  // Check if user already has a world with the same name
  const existingWorld = await World.findOne({ 
    admin: req.user.id, 
    name: name.trim() 
  });

  if (existingWorld) {
    return res.status(400).json({ message: 'You already have a world with this name' });
  }

  // Create world with default settings
  const defaultSettings = {
    statRollMethod: 'standard',
    rerolls: 0,
    freeSelections: 0,
    feminineAttributes: false,
    minAttributes: null, // null = off, or number (default: 3)
    maxAttributes: null, // null = off, or number (default: 18)
    varierandeVikt: true,
    primitiveAllowed: true, // If true, primitive culture is available
    civilizedAllowed: true, // If true, civilized culture is available
    // XOR logic: if only one is true, player is forced to that choice
    // If both are true or both are false, player can choose
    currentYear: 2967, // Current year in the game world
    defaultCalendar: 'Asharisk', // Default calendar: Colonisk, Jargisk, or Asharisk
    ...(settings || {})
  };

  const world = new World({
    name: name.trim(),
    description: description || '',
    admin: req.user.id,
    isPublic: isPublic || false,
    ruleset: ruleset || 'EON',
    settings: defaultSettings
  });

  await world.save();
  
  res.status(201).json({
    message: 'World created successfully',
    world
  });
}));

// Get all worlds for the authenticated user (worlds they admin or have characters in)
router.get('/my-worlds', authenticateToken, asyncHandler(async (req, res) => {
  // Get worlds where user is admin
  const adminWorlds = await World.find({ admin: req.user.id });
  
  // Get worlds where user has characters
  const characterWorlds = await Character.distinct('world', { owner: req.user.id });
  const worldsWithCharacters = await World.find({ 
    _id: { $in: characterWorlds },
    admin: { $ne: req.user.id } // Don't duplicate worlds where user is admin
  });

  const allWorlds = [...adminWorlds, ...worldsWithCharacters];
  
  res.json({ worlds: allWorlds });
}));

// Get world by ID
router.get('/:worldId', authenticateToken, canAccessWorld, asyncHandler(async (req, res) => {
  const world = await World.findById(req.params.worldId)
    .populate('admin', 'username email');
  
  res.json({ world });
}));

// Update world (admin only)
router.put('/:worldId', authenticateToken, isWorldAdmin, asyncHandler(async (req, res) => {
  const { name, description, isPublic, settings } = req.body;
  
  const world = await World.findById(req.params.worldId);
  if (!world) {
    return res.status(404).json({ message: 'World not found' });
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name.trim();
  if (description !== undefined) updateData.description = description;
  if (isPublic !== undefined) updateData.isPublic = isPublic;
  if (settings !== undefined) {
    // Merge with existing settings to preserve other settings
    // Handle both Map and plain object
    const currentSettings = world.settings instanceof Map 
      ? Object.fromEntries(world.settings) 
      : (world.settings || {});
    const mergedSettings = { ...currentSettings, ...settings };
    
    // Clear and rebuild the settings Map to ensure all values are updated
    world.settings.clear();
    Object.entries(mergedSettings).forEach(([k, v]) => {
      world.settings.set(k, v);
    });
  }

  // Update other fields
  if (name !== undefined) world.name = name.trim();
  if (description !== undefined) world.description = description;
  if (isPublic !== undefined) world.isPublic = isPublic;

  await world.save();

  res.json({
    message: 'World updated successfully',
    world
  });
}));

// Delete world (admin only) - also deletes all characters in the world
router.delete('/:worldId', authenticateToken, isWorldAdmin, asyncHandler(async (req, res) => {
  // Delete all characters in this world
  await Character.deleteMany({ world: req.params.worldId });
  
  // Delete the world
  await World.findByIdAndDelete(req.params.worldId);

  res.json({ message: 'World and all its characters deleted successfully' });
}));

// Get all characters in a world
router.get('/:worldId/characters', authenticateToken, canAccessWorld, asyncHandler(async (req, res) => {
  const characters = await Character.find({ world: req.params.worldId })
    .populate('owner', 'username email')
    .select('-stats -inventory'); // Don't send full character data to everyone

  res.json({ characters });
}));

export default router;

