import World from '../models/World.js';
import Invite from '../models/Invite.js';

// Check if user is the admin of a world
export const isWorldAdmin = async (req, res, next) => {
  try {
    const { worldId } = req.params;
    
    const world = await World.findById(worldId);
    if (!world) {
      return res.status(404).json({ message: 'World not found' });
    }

    // Check if user is the admin
    if (world.admin.toString() !== req.user.id) {
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

// Check if user can access a world (admin or has characters in it)
export const canAccessWorld = async (req, res, next) => {
  try {
    const { worldId } = req.params;
    
    const world = await World.findById(worldId);
    if (!world) {
      return res.status(404).json({ message: 'World not found' });
    }

    // Public worlds can be accessed by anyone
    if (world.isPublic) {
      req.world = world;
      return next();
    }

    // Admin has full access
    if (world.admin.toString() === req.user.id) {
      req.world = world;
      return next();
    }

    // Check if user has an accepted invite
    const acceptedInvite = await Invite.findOne({
      world: worldId,
      invitee: req.user.id,
      status: 'accepted'
    });

    if (acceptedInvite) {
      req.world = world;
      return next();
    }

    // Deny access if not public, admin, or has accepted invite
    return res.status(403).json({ 
      message: 'Access denied. This world is private.' 
    });
  } catch (error) {
    console.error('World access check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

