import mongoose from 'mongoose';

const worldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'World name is required'],
    trim: true,
    minlength: [1, 'World name must be at least 1 character'],
    maxlength: [100, 'World name must be less than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [5000, 'Description must be less than 5000 characters'],
    default: ''
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  settings: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for faster queries
worldSchema.index({ admin: 1 });
worldSchema.index({ isPublic: 1 });

export default mongoose.model('World', worldSchema);

