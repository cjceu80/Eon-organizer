import express from 'express';
import Race from '../models/Race.js';
import World from '../models/World.js';
import { authenticateToken } from '../middleware/auth.js';
import { isWorldAdmin, canAccessWorld, checkIsWorldAdmin, checkCanAccessWorld } from '../middleware/worldPermissions.js';

const router = express.Router();

// Helper function to wrap async routes
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Get all races for a world
router.get('/world/:worldId', authenticateToken, asyncHandler(async (req, res) => {
  const { worldId } = req.params;

  // Check if world exists and user has access
  const world = await World.findById(worldId);
  if (!world) {
    return res.status(404).json({ message: 'World not found' });
  }

  // Check access
  const hasAccess = await checkCanAccessWorld(req.user.id, world);
  if (!hasAccess) {
    return res.status(403).json({ message: 'Access denied to this world' });
  }

  // Get all races for this world: both ruleset-wide (world: null) and world-specific
  const rulesetWideRaces = await Race.find({ world: null, ruleset: world.ruleset });
  const worldSpecificRaces = await Race.find({ world: worldId }).populate('world', 'name id');
  
  const races = [...rulesetWideRaces, ...worldSpecificRaces];
  
  res.json({ races });
}));

// Get a specific race
router.get('/:raceId', authenticateToken, asyncHandler(async (req, res) => {
  const { raceId } = req.params;

  const race = await Race.findById(raceId).populate('world', 'name id admin');
  
  if (!race) {
    return res.status(404).json({ message: 'Race not found' });
  }

  // Check if user has access - ruleset-wide races are accessible to all users
  if (race.world !== null) {
    const hasAccess = await checkCanAccessWorld(req.user.id, race.world);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this world' });
    }
  }

  res.json({ race });
}));

// Create a new race (world admin only)
router.post('/world/:worldId', authenticateToken, asyncHandler(async (req, res) => {
  const { worldId } = req.params;
  const { name, modifiers, category } = req.body;

  // Validation
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Race name is required' });
  }

  // Check if world exists and user is admin
  const world = await World.findById(worldId);
  if (!world) {
    return res.status(404).json({ message: 'World not found' });
  }

  const isAdmin = await checkIsWorldAdmin(req.user.id, world);
  if (!isAdmin) {
    return res.status(403).json({ message: 'Only world admin can create races' });
  }

  // Check if race with same name already exists in this world or ruleset-wide (same category)
  // For world-specific races, check world+name
  // For ruleset-wide races, check ruleset+category+name
  const categoryValue = category?.trim() || '';
  const existingRace = await Race.findOne({ 
    $or: [
      { world: worldId, name: name.trim() }, // World-specific: check world+name
      { world: null, ruleset: world.ruleset, category: categoryValue, name: name.trim() } // Ruleset-wide: check ruleset+category+name
    ]
  });

  if (existingRace) {
    return res.status(400).json({ message: 'A race with this name already exists' + (categoryValue ? ` in category '${categoryValue}'` : '') });
  }

  // Create race with modifiers and auto-populate ruleset from world
  const race = new Race({
    name: name.trim(),
    world: worldId,
    ruleset: world.ruleset, // Inherit ruleset from world
    category: category || '',
    modifiers: modifiers || {},
    metadata: req.body.metadata || {}
  });

  await race.save();
  
  res.status(201).json({
    message: 'Race created successfully',
    race
  });
}));

// Update a race (world admin only)
router.put('/:raceId', authenticateToken, asyncHandler(async (req, res) => {
  const { raceId } = req.params;
  const { name, modifiers, category } = req.body;

  const race = await Race.findById(raceId).populate('world', 'name id admin');
  
  if (!race) {
    return res.status(404).json({ message: 'Race not found' });
  }

  // Check if user can update - ruleset-wide races can only be updated by system/super admins
  // For now, only allow world admins to update their world's races
  if (race.world === null) {
    return res.status(403).json({ message: 'Ruleset-wide races cannot be updated via API' });
  }
  
  const isAdmin = await checkIsWorldAdmin(req.user.id, race.world);
  if (!isAdmin) {
    return res.status(403).json({ message: 'Only world admin can update races' });
  }

  // Update fields
  if (name !== undefined) {
    race.name = name.trim();
  }
  
  if (category !== undefined) {
    race.category = category.trim();
  }
  
  if (modifiers !== undefined) {
    // Mongoose Maps handle this automatically
    Object.entries(modifiers).forEach(([key, value]) => {
      race.modifiers.set(key, value);
    });
  }
  
  if (req.body.metadata !== undefined) {
    // Mongoose Maps handle this automatically
    Object.entries(req.body.metadata).forEach(([key, value]) => {
      race.metadata.set(key, value);
    });
  }

      // Check for duplicate name if name or category was changed
      if (name !== undefined || category !== undefined) {
        const updateName = name !== undefined ? name.trim() : race.name;
        const updateCategory = category !== undefined ? (category.trim() || '') : (race.category || '');
        
        let existingRace;
        if (race.world === null) {
          // Ruleset-wide: check ruleset+category+name
          existingRace = await Race.findOne({ 
            world: null,
            ruleset: race.ruleset,
            category: updateCategory,
            name: updateName,
            _id: { $ne: raceId }
          });
        } else {
          // World-specific: check world+name (category doesn't matter for world-specific)
          existingRace = await Race.findOne({ 
            world: race.world._id || race.world,
            name: updateName,
            _id: { $ne: raceId }
          });
        }

        if (existingRace) {
          return res.status(400).json({ 
            message: 'A race with this name already exists' + (race.world === null && updateCategory ? ` in category '${updateCategory}'` : ' in this world') 
          });
        }
      }

  await race.save();
  
  res.json({
    message: 'Race updated successfully',
    race
  });
}));

// Delete a race (world admin only)
router.delete('/:raceId', authenticateToken, asyncHandler(async (req, res) => {
  const { raceId } = req.params;

  const race = await Race.findById(raceId).populate('world', 'name id admin');
  
  if (!race) {
    return res.status(404).json({ message: 'Race not found' });
  }

  // Check if user can delete - ruleset-wide races cannot be deleted via API
  if (race.world === null) {
    return res.status(403).json({ message: 'Ruleset-wide races cannot be deleted via API' });
  }
  
  // Check if user is admin of the world
  const isAdmin = await checkIsWorldAdmin(req.user.id, race.world);
  if (!isAdmin) {
    return res.status(403).json({ message: 'Only world admin can delete races' });
  }

  await race.deleteOne();
  
  res.json({
    message: 'Race deleted successfully'
  });
}));

export default router;

