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
  ruleset: {
    type: String,
    enum: ['EON'],
    default: 'EON',
    required: true
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

// Convert _id to id for consistency and handle admin field
worldSchema.methods.toJSON = function() {
  const obj = this.toObject({ flattenMaps: true });
  obj.id = obj._id.toString();
  delete obj._id;
  // Handle admin field - could be ObjectId, populated object, or already converted
  if (obj.admin) {
    // If admin is populated (object with _id or id) - keep the object structure
    if (typeof obj.admin === 'object' && !(obj.admin instanceof mongoose.Types.ObjectId)) {
      // Populated admin object - ensure _id is converted to id
      if (obj.admin._id && !obj.admin.id) {
        obj.admin.id = obj.admin._id.toString();
        delete obj.admin._id;
      }
      // Keep the populated object as-is (it will have id, username, email)
    } else if (obj.admin instanceof mongoose.Types.ObjectId || (obj.admin.toString && typeof obj.admin.toString === 'function' && !obj.admin.username)) {
      // ObjectId - convert to string ID
      obj.admin = obj.admin.toString();
    }
    // If it's already a string, leave it as is
  }
  // Ensure settings is a plain object (not a Map)
  if (obj.settings && obj.settings instanceof Map) {
    obj.settings = Object.fromEntries(obj.settings);
  }
  return obj;
};

export default mongoose.model('World', worldSchema);

