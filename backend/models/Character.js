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

export default mongoose.model('Character', characterSchema);

