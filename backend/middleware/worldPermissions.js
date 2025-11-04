import World from '../models/World.js';
import Invite from '../models/Invite.js';
import Character from '../models/Character.js';

// Helper function to check if user is admin of a world
export const checkIsWorldAdmin = async (userId, world) => {
  if (!world) return false;
  return world.admin.toString() === userId;
};

// Helper function to check if user can access a world
export const checkCanAccessWorld = async (userId, world) => {
  if (!world) return false;

  // Public worlds can be accessed by anyone
  if (world.isPublic) {
    return true;
  }

  // Admin has full access
  if (world.admin.toString() === userId) {
    return true;
  }

  // Check if user has an accepted invite
  const acceptedInvite = await Invite.findOne({
    world: world._id || world.id || world,
    invitee: userId,
    status: 'accepted'
  });

  if (acceptedInvite) {
    return true;
  }

  // Check if user has characters in this world
  const hasCharacter = await Character.findOne({
    world: world._id || world.id || world,
    owner: userId
  });

  return !!hasCharacter;
};

// Check if user is the admin of a world (middleware)
export const isWorldAdmin = async (req, res, next) => {
  try {
    const { worldId } = req.params;
    
    const world = await World.findById(worldId);
    if (!world) {
      return res.status(404).json({ message: 'World not found' });
    }

    // Check if user is the admin
    if (!(await checkIsWorldAdmin(req.user.id, world))) {
      return res.status(403).json({ 
        message: 'Access denied. You are not the admin of this world.' 
      });
    }

    // Attach world to request for use in route handlers
    req.world = world;
    next();
  } catch (error) {
    console.error('World admin check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if user can access a world (middleware)
export const canAccessWorld = async (req, res, next) => {
  try {
    const { worldId } = req.params;
    
    const world = await World.findById(worldId);
    if (!world) {
      return res.status(404).json({ message: 'World not found' });
    }

    // Check access using helper function
    const hasAccess = await checkCanAccessWorld(req.user.id, world);
    if (!hasAccess) {
      return res.status(403).json({ 
        message: 'Access denied. This world is private.' 
      });
    }

    // Attach world to request for use in route handlers
    req.world = world;
    next();
  } catch (error) {
    console.error('World access check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

