import mongoose from 'mongoose';

const characterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Character name is required'],
    trim: true,
    minlength: [1, 'Character name must be at least 1 character'],
    maxlength: [50, 'Character name must be less than 50 characters']
  },
  world: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'World',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [2000, 'Bio must be less than 2000 characters'],
    default: ''
  },
  stats: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  inventory: [{
    item: String,
    quantity: { type: Number, default: 1 },
    description: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
characterSchema.index({ world: 1, owner: 1 });
characterSchema.index({ world: 1 });

// Convert _id to id for consistency and handle reference fields
characterSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  
  // Convert ObjectId references to strings (only if raw ObjectId, not populated objects)
  if (obj.owner && typeof obj.owner === 'object') {
    // Check if it's an ObjectId by looking for toString method without object properties
    if (!obj.owner.username && typeof obj.owner.toString === 'function') {
      obj.owner = obj.owner.toString();
    }
    // Handle populated owner - convert _id to id
    else if (obj.owner._id) {
      obj.owner.id = obj.owner._id.toString();
      delete obj.owner._id;
    }
  }
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
  return obj;
};

export default mongoose.model('Character', characterSchema);

