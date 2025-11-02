import mongoose from 'mongoose';

const inviteSchema = new mongoose.Schema({
  world: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'World',
    required: true
  },
  inviter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invitee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  },
  message: {
    type: String,
    maxlength: [500, 'Message must be less than 500 characters'],
    default: ''
  }
}, {
  timestamps: true
});

// Index for faster queries
inviteSchema.index({ invitee: 1, status: 1 });
inviteSchema.index({ world: 1, invitee: 1 });

// Prevent duplicate pending invites
inviteSchema.index({ world: 1, invitee: 1, status: 1 }, { 
  unique: true, 
  partialFilterExpression: { status: 'pending' } 
});

export default mongoose.model('Invite', inviteSchema);

