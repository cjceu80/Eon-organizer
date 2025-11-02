import express from 'express';
import Character from '../models/Character.js';
import World from '../models/World.js';
import Invite from '../models/Invite.js';
import { authenticateToken } from '../middleware/auth.js';
import { isCharacterOwner, canModifyCharacter } from '../middleware/characterPermissions.js';

const router = express.Router();

// Helper function to wrap async routes
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Create a new character
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const { name, worldId, bio, stats, inventory } = req.body;

  // Validation
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Character name is required' });
  }

  if (!worldId) {
    return res.status(400).json({ message: 'World ID is required' });
  }

  // Check if world exists
  const world = await World.findById(worldId);
  if (!world) {
    return res.status(404).json({ message: 'World not found' });
  }

  // Check if world is accessible (public or user has access)
  if (!world.isPublic && world.admin.toString() !== req.user.id) {
    // Check if user already has a character in this world
    const existingCharacter = await Character.findOne({ 
      world: worldId, 
      owner: req.user.id 
    });
    
    if (!existingCharacter) {
      // Check if user has an accepted invite
      const acceptedInvite = await Invite.findOne({
        world: worldId,
        invitee: req.user.id,
        status: 'accepted'
      });

      if (!acceptedInvite) {
        return res.status(403).json({ 
          message: 'Access denied. You cannot create characters in this private world.' 
        });
      }
    }
  }

  // Check if user already has a character with this name in this world
  const existingCharacter = await Character.findOne({ 
    world: worldId,
    owner: req.user.id, 
    name: name.trim() 
  });

  if (existingCharacter) {
    return res.status(400).json({ 
      message: 'You already have a character with this name in this world' 
    });
  }

  // Create character
  const character = new Character({
    name: name.trim(),
    world: worldId,
    owner: req.user.id,
    bio: bio || '',
    stats: stats || {},
    inventory: inventory || [],
    isActive: true
  });

  await character.save();
  
  res.status(201).json({
    message: 'Character created successfully',
    character
  });
}));

// Get all characters for the authenticated user
router.get('/my-characters', authenticateToken, asyncHandler(async (req, res) => {
  const characters = await Character.find({ owner: req.user.id })
    .populate('world', 'name admin')
    .sort({ createdAt: -1 });

  res.json({ characters });
}));

// Get character by ID
router.get('/:characterId', authenticateToken, asyncHandler(async (req, res) => {
  const character = await Character.findById(req.params.characterId)
    .populate('world', 'name admin')
    .populate('owner', 'username email');

  if (!character) {
    return res.status(404).json({ message: 'Character not found' });
  }

  // Check access permissions
  const canView = 
    character.owner._id.toString() === req.user.id || 
    character.world.admin.toString() === req.user.id;

  if (!canView) {
    return res.status(403).json({ 
      message: 'Access denied. You do not have permission to view this character.' 
    });
  }

  res.json({ character });
}));

// Update character (owner or world admin)
router.put('/:characterId', authenticateToken, canModifyCharacter, asyncHandler(async (req, res) => {
  const { name, bio, stats, inventory, isActive } = req.body;
  
  const updateData = {};
  if (name !== undefined) updateData.name = name.trim();
  if (bio !== undefined) updateData.bio = bio;
  if (stats !== undefined) updateData.stats = stats;
  if (inventory !== undefined) updateData.inventory = inventory;
  if (isActive !== undefined) updateData.isActive = isActive;

  const character = await Character.findByIdAndUpdate(
    req.params.characterId,
    updateData,
    { new: true, runValidators: true }
  ).populate('world', 'name admin');

  res.json({
    message: 'Character updated successfully',
    character
  });
}));

// Delete character (owner or world admin)
router.delete('/:characterId', authenticateToken, canModifyCharacter, asyncHandler(async (req, res) => {
  await Character.findByIdAndDelete(req.params.characterId);

  res.json({ message: 'Character deleted successfully' });
}));

export default router;

