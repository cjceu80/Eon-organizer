import express from 'express';
import Character from '../models/Character.js';
import World from '../models/World.js';
import Invite from '../models/Invite.js';
import Race from '../models/Race.js';
import RaceCategory from '../models/RaceCategory.js';
import { authenticateToken } from '../middleware/auth.js';
import { isCharacterOwner, canModifyCharacter } from '../middleware/characterPermissions.js';

const router = express.Router();

// Helper function to wrap async routes
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Helper function to calculate and attach apparent age to a character
 * @param {Object} character - Character document or object
 * @param {Object} world - World document (needed for ruleset)
 * @returns {Promise<Object>} - Character with apparentAge added
 */
async function enrichCharacterWithApparentAge(character, world) {
  // Convert character to plain object if needed
  // Use JSON.parse(JSON.stringify()) to properly handle Mongoose Maps and other special types
  let charObj;
  if (character.toObject) {
    charObj = character.toObject({ flattenMaps: true });
  } else if (character.toJSON) {
    charObj = JSON.parse(JSON.stringify(character));
  } else {
    charObj = JSON.parse(JSON.stringify(character));
  }
  
  // Get stats (should be plain object now)
  const statsObj = charObj.stats || {};
  
  // Get race and actual age from stats
  const raceId = statsObj.race || statsObj.raceId;
  const actualAge = statsObj.age || statsObj.actualAge;
  
  // If no race or age, return character as-is
  if (!raceId || actualAge === undefined || actualAge === null) {
    return { ...charObj, apparentAge: actualAge || null };
  }
  
  try {
    // Look up the race
    const race = await Race.findById(raceId);
    if (!race) {
      return { ...charObj, apparentAge: actualAge };
    }
    
    // Get the category from the race
    const categoryName = race.category;
    if (!categoryName) {
      return { ...charObj, apparentAge: actualAge };
    }
    
    // Look up the category
    const category = await RaceCategory.findOne({
      ruleset: world.ruleset || 'EON',
      name: categoryName
    });
    
    if (!category) {
      return { ...charObj, apparentAge: actualAge };
    }
    
    // Calculate apparent age
    const apparentAge = category.calculateApparentAge(actualAge);
    
    return { ...charObj, apparentAge };
  } catch (error) {
    console.error('Error calculating apparent age:', error);
    return { ...charObj, apparentAge: actualAge };
  }
}

/**
 * Helper function to enrich multiple characters with apparent age
 * @param {Array} characters - Array of character documents or objects
 * @returns {Promise<Array>} - Array of characters with apparentAge added
 */
async function enrichCharactersWithApparentAge(characters) {
  // Process all characters - each character should have world populated
  return Promise.all(
    characters.map(async (character) => {
      // Use the populated world from the character, or look it up
      let worldForChar = character.world;
      
      // If world is not populated but we have an ID, look it up
      if (!worldForChar && character.world) {
        const worldId = typeof character.world === 'string' 
          ? character.world 
          : (character.world._id || character.world.id);
        if (worldId) {
          worldForChar = await World.findById(worldId);
        }
      }
      
      // Default to EON ruleset if no world found
      if (!worldForChar) {
        worldForChar = { ruleset: 'EON' };
      }
      
      return enrichCharacterWithApparentAge(character, worldForChar);
    })
  );
}

// Create a new character
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const { name, worldId, bio, stats, inventory, bonuses } = req.body;

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
    bonuses: bonuses || {},
    inventory: inventory || [],
    isActive: true
  });

  await character.save();
  
  // Enrich character with apparent age
  const enrichedCharacter = await enrichCharacterWithApparentAge(character, world);
  
  res.status(201).json({
    message: 'Character created successfully',
    character: enrichedCharacter
  });
}));

// Get all characters for the authenticated user
router.get('/my-characters', authenticateToken, asyncHandler(async (req, res) => {
  const characters = await Character.find({ owner: req.user.id })
    .populate('world', 'name admin ruleset')
    .sort({ createdAt: -1 });

  // Enrich characters with apparent age
  const enrichedCharacters = await enrichCharactersWithApparentAge(characters);

  res.json({ characters: enrichedCharacters });
}));

// Get character by ID
router.get('/:characterId', authenticateToken, asyncHandler(async (req, res) => {
  const character = await Character.findById(req.params.characterId)
    .populate('world', 'name admin ruleset')
    .populate('owner', 'username email');

  if (!character) {
    return res.status(404).json({ message: 'Character not found' });
  }

  // Check access permissions
  const canView = 
    (character.owner._id ? character.owner._id.toString() : character.owner.id) === req.user.id || 
    character.world.admin.toString() === req.user.id;

  if (!canView) {
    return res.status(403).json({ 
      message: 'Access denied. You do not have permission to view this character.' 
    });
  }

  // Enrich character with apparent age
  const enrichedCharacter = await enrichCharacterWithApparentAge(character, character.world);

  res.json({ character: enrichedCharacter });
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
  ).populate('world', 'name admin ruleset');

  // Enrich character with apparent age
  const enrichedCharacter = await enrichCharacterWithApparentAge(character, character.world);

  res.json({
    message: 'Character updated successfully',
    character: enrichedCharacter
  });
}));

// Delete character (owner or world admin)
router.delete('/:characterId', authenticateToken, canModifyCharacter, asyncHandler(async (req, res) => {
  await Character.findByIdAndDelete(req.params.characterId);

  res.json({ message: 'Character deleted successfully' });
}));

export default router;

