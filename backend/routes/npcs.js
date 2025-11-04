import express from 'express';
import NPC from '../models/NPC.js';
import Character from '../models/Character.js';
import World from '../models/World.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Helper function to wrap async routes
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * GET /api/npcs/character/:characterId
 * Get all NPCs connected to a specific character
 */
router.get('/character/:characterId', authenticateToken, asyncHandler(async (req, res) => {
  const { characterId } = req.params;
  const userId = req.user.id;

  // Verify character exists and user has access
  const character = await Character.findById(characterId);
  if (!character) {
    return res.status(404).json({ message: 'Character not found' });
  }

  // Check if user owns the character or is world admin
  if (character.owner.toString() !== userId) {
    const world = await World.findById(character.world);
    if (!world || world.admin.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
  }

  const npcs = await NPC.find({ fromCharacter: characterId })
    .populate('fromCharacter', 'name')
    .populate('world', 'name');

  res.json({ npcs });
}));

/**
 * GET /api/npcs/world/:worldId
 * Get all NPCs for a world (admin only, useful for seeing all connections)
 */
router.get('/world/:worldId', authenticateToken, asyncHandler(async (req, res) => {
  const { worldId } = req.params;
  const userId = req.user.id;

  // Verify world exists and user is admin
  const world = await World.findById(worldId);
  if (!world) {
    return res.status(404).json({ message: 'World not found' });
  }

  if (world.admin.toString() !== userId) {
    return res.status(403).json({ message: 'Only world admin can view all NPCs' });
  }

  const npcs = await NPC.find({ world: worldId })
    .populate('fromCharacter', 'name owner')
    .populate('world', 'name')
    .sort({ createdAt: -1 });

  res.json({ npcs });
}));

/**
 * GET /api/npcs/world/:worldId/pending
 * Get all NPCs that haven't been fully created yet (admin only)
 */
router.get('/world/:worldId/pending', authenticateToken, asyncHandler(async (req, res) => {
  const { worldId } = req.params;
  const userId = req.user.id;

  // Verify world exists and user is admin
  const world = await World.findById(worldId);
  if (!world) {
    return res.status(404).json({ message: 'World not found' });
  }

  if (world.admin.toString() !== userId) {
    return res.status(403).json({ message: 'Only world admin can view pending NPCs' });
  }

  const npcs = await NPC.find({ 
    world: worldId, 
    isFullyCreated: false 
  })
    .populate('fromCharacter', 'name owner')
    .populate('world', 'name')
    .sort({ createdAt: -1 });

  res.json({ npcs });
}));

/**
 * POST /api/npcs
 * Create a new NPC connection
 */
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const { fromCharacterId, worldId, connectionType, description } = req.body;
  const userId = req.user.id;

  // Validate required fields
  if (!fromCharacterId || !worldId || !connectionType) {
    return res.status(400).json({ 
      message: 'fromCharacterId, worldId, and connectionType are required' 
    });
  }

  // Validate connectionType
  const validTypes = ['family', 'friend', 'enemy', 'other'];
  if (!validTypes.includes(connectionType)) {
    return res.status(400).json({ 
      message: `connectionType must be one of: ${validTypes.join(', ')}` 
    });
  }

  // Verify character exists and user owns it
  const character = await Character.findById(fromCharacterId);
  if (!character) {
    return res.status(404).json({ message: 'Character not found' });
  }

  if (character.owner.toString() !== userId) {
    return res.status(403).json({ message: 'You can only create NPCs for your own characters' });
  }

  // Verify world exists and matches character's world
  const world = await World.findById(worldId);
  if (!world) {
    return res.status(404).json({ message: 'World not found' });
  }

  if (character.world.toString() !== worldId) {
    return res.status(400).json({ message: 'Character and world do not match' });
  }

  // Create NPC
  const npc = new NPC({
    fromCharacter: fromCharacterId,
    world: worldId,
    connectionType,
    description: description || ''
  });

  await npc.save();
  await npc.populate('fromCharacter', 'name');
  await npc.populate('world', 'name');

  res.status(201).json({ npc });
}));

/**
 * GET /api/npcs/:id
 * Get a specific NPC by ID
 */
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const npc = await NPC.findById(id)
    .populate('fromCharacter', 'name owner')
    .populate('world', 'name admin');

  if (!npc) {
    return res.status(404).json({ message: 'NPC not found' });
  }

  // Check access: character owner or world admin
  const character = await Character.findById(npc.fromCharacter);
  const isOwner = character && character.owner.toString() === userId;
  const isAdmin = npc.world && npc.world.admin.toString() === userId;

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: 'Access denied' });
  }

  res.json({ npc });
}));

/**
 * PATCH /api/npcs/:id
 * Update an NPC (admin only, or character owner for basic fields)
 */
router.patch('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { connectionType, description, isFullyCreated } = req.body;
  const userId = req.user.id;

  const npc = await NPC.findById(id)
    .populate('fromCharacter', 'name owner')
    .populate('world', 'name admin');

  if (!npc) {
    return res.status(404).json({ message: 'NPC not found' });
  }

  // Check access
  const character = await Character.findById(npc.fromCharacter);
  const isOwner = character && character.owner.toString() === userId;
  const isAdmin = npc.world && npc.world.admin.toString() === userId;

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: 'Access denied' });
  }

  // Only admins can set isFullyCreated
  if (isFullyCreated !== undefined && !isAdmin) {
    return res.status(403).json({ message: 'Only world admin can set isFullyCreated' });
  }

  // Update fields
  if (connectionType !== undefined) {
    const validTypes = ['family', 'friend', 'enemy', 'other'];
    if (!validTypes.includes(connectionType)) {
      return res.status(400).json({ 
        message: `connectionType must be one of: ${validTypes.join(', ')}` 
      });
    }
    npc.connectionType = connectionType;
  }

  if (description !== undefined) {
    npc.description = description;
  }

  if (isFullyCreated !== undefined && isAdmin) {
    npc.isFullyCreated = isFullyCreated;
  }

  await npc.save();
  await npc.populate('fromCharacter', 'name');
  await npc.populate('world', 'name');

  res.json({ npc });
}));

/**
 * DELETE /api/npcs/:id
 * Delete an NPC (character owner or admin)
 */
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const npc = await NPC.findById(id)
    .populate('fromCharacter', 'name owner')
    .populate('world', 'name admin');

  if (!npc) {
    return res.status(404).json({ message: 'NPC not found' });
  }

  // Check access
  const character = await Character.findById(npc.fromCharacter);
  const isOwner = character && character.owner.toString() === userId;
  const isAdmin = npc.world && npc.world.admin.toString() === userId;

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: 'Access denied' });
  }

  await NPC.findByIdAndDelete(id);

  res.json({ message: 'NPC deleted successfully' });
}));

export default router;

