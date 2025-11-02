import Character from '../models/Character.js';

// Check if user owns a character
export const isCharacterOwner = async (req, res, next) => {
  try {
    const { characterId } = req.params;
    
    const character = await Character.findById(characterId);
    if (!character) {
      return res.status(404).json({ message: 'Character not found' });
    }

    // Check if user owns the character
    if (character.owner.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'Access denied. You do not own this character.' 
      });
    }

    req.character = character;
    next();
  } catch (error) {
    console.error('Character owner check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if user can modify a character (owner or world admin)
export const canModifyCharacter = async (req, res, next) => {
  try {
    const { characterId } = req.params;
    
    const character = await Character.findById(characterId).populate('world');
    if (!character) {
      return res.status(404).json({ message: 'Character not found' });
    }

    // User owns the character
    if (character.owner.toString() === req.user.id) {
      req.character = character;
      return next();
    }

    // User is admin of the world
    if (character.world.admin.toString() === req.user.id) {
      req.character = character;
      return next();
    }

    return res.status(403).json({ 
      message: 'Access denied. You do not have permission to modify this character.' 
    });
  } catch (error) {
    console.error('Character permission check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

