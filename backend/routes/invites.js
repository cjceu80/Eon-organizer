import express from 'express';
import Invite from '../models/Invite.js';
import World from '../models/World.js';
import User from '../models/User.js';
import Character from '../models/Character.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Helper function to wrap async routes
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Create invite (world admin only)
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const { worldId, username, message } = req.body;

  // Validation
  if (!worldId) {
    return res.status(400).json({ message: 'World ID is required' });
  }

  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }

  // Check if world exists and user is admin
  const world = await World.findById(worldId);
  if (!world) {
    return res.status(404).json({ message: 'World not found' });
  }

  if (world.admin.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Only world admin can send invites' });
  }

  // Check if invitee exists
  const invitee = await User.findOne({ username: username.trim().toLowerCase() });
  if (!invitee) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Don't allow inviting yourself
  if (invitee._id.toString() === req.user.id) {
    return res.status(400).json({ message: 'You cannot invite yourself' });
  }

  // Check if user already has a character in this world
  const existingCharacter = await Character.findOne({ 
    world: worldId, 
    owner: invitee._id 
  });

  if (existingCharacter) {
    return res.status(400).json({ message: 'User already has a character in this world' });
  }

  // Check if there's already a pending invite
  const existingInvite = await Invite.findOne({
    world: worldId,
    invitee: invitee._id,
    status: 'pending'
  });

  if (existingInvite) {
    return res.status(400).json({ message: 'Invite already sent to this user' });
  }

  // Create invite
  const invite = new Invite({
    world: worldId,
    inviter: req.user.id,
    invitee: invitee._id,
    message: message || '',
    status: 'pending'
  });

  await invite.save();

  res.status(201).json({
    message: 'Invite sent successfully',
    invite: {
      ...invite.toObject(),
      invitee: {
        id: invitee._id,
        username: invitee.username,
        email: invitee.email
      }
    }
  });
}));

// Get all invites for current user (received invites)
router.get('/received', authenticateToken, asyncHandler(async (req, res) => {
  const invites = await Invite.find({ 
    invitee: req.user.id,
    status: 'pending'
  }).populate('world', 'name admin')
    .populate('inviter', 'username');

  res.json({ invites });
}));

// Accept invite
router.post('/:inviteId/accept', authenticateToken, asyncHandler(async (req, res) => {
  const invite = await Invite.findById(req.params.inviteId)
    .populate('world');

  if (!invite) {
    return res.status(404).json({ message: 'Invite not found' });
  }

  // Check if invite belongs to current user
  if (invite.invitee.toString() !== req.user.id) {
    return res.status(403).json({ message: 'This invite is not for you' });
  }

  // Check if invite is still pending
  if (invite.status !== 'pending') {
    return res.status(400).json({ message: 'This invite has already been responded to' });
  }

  // Update invite status
  invite.status = 'accepted';
  await invite.save();

  res.json({ 
    message: 'Invite accepted. You can now create characters in this world.',
    world: invite.world
  });
}));

// Decline invite
router.post('/:inviteId/decline', authenticateToken, asyncHandler(async (req, res) => {
  const invite = await Invite.findById(req.params.inviteId);

  if (!invite) {
    return res.status(404).json({ message: 'Invite not found' });
  }

  // Check if invite belongs to current user
  if (invite.invitee.toString() !== req.user.id) {
    return res.status(403).json({ message: 'This invite is not for you' });
  }

  // Check if invite is still pending
  if (invite.status !== 'pending') {
    return res.status(400).json({ message: 'This invite has already been responded to' });
  }

  // Update invite status
  invite.status = 'declined';
  await invite.save();

  res.json({ message: 'Invite declined' });
}));

export default router;

