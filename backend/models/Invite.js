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

// Convert _id to id for consistency and handle reference fields
inviteSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  
  // Convert ObjectId references to strings (only if raw ObjectId, not populated objects)
  if (obj.world && typeof obj.world === 'object') {
    // Check if it's an ObjectId by looking for toString method without object properties
    if (!obj.world.name && typeof obj.world.toString === 'function') {
      obj.world = obj.world.toString();
    }
    // Handle populated world - convert _id to id and handle nested admin field
    else {
      if (obj.world._id) {
        obj.world.id = obj.world._id.toString();
        delete obj.world._id;
      }
      // Convert admin ObjectId to string if it exists
      if (obj.world.admin && obj.world.admin.toString) {
        obj.world.admin = obj.world.admin.toString();
      }
    }
  }
  if (obj.inviter && typeof obj.inviter === 'object') {
    // Check if it's an ObjectId by looking for toString method without object properties
    if (!obj.inviter.username && typeof obj.inviter.toString === 'function') {
      obj.inviter = obj.inviter.toString();
    }
    // Handle populated inviter - convert _id to id
    else if (obj.inviter._id) {
      obj.inviter.id = obj.inviter._id.toString();
      delete obj.inviter._id;
    }
  }
  if (obj.invitee && typeof obj.invitee === 'object') {
    // Check if it's an ObjectId by looking for toString method without object properties
    if (!obj.invitee.username && typeof obj.invitee.toString === 'function') {
      obj.invitee = obj.invitee.toString();
    }
    // Handle populated invitee - convert _id to id
    else if (obj.invitee._id) {
      obj.invitee.id = obj.invitee._id.toString();
      delete obj.invitee._id;
    }
  }
  return obj;
};

export default mongoose.model('Invite', inviteSchema);

