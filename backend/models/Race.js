import mongoose from 'mongoose';

const raceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Race name is required'],
    trim: true,
    minlength: [1, 'Race name must be at least 1 character'],
    maxlength: [100, 'Race name must be less than 100 characters']
  },
  world: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'World',
    required: false,
    default: null // null = ruleset-wide race, ObjectId = world-specific race
  },
  ruleset: {
    type: String,
    required: true,
    enum: ['EON'] // Expandable for future rulesets
  },
  category: {
    type: String,
    trim: true,
    default: ''
  },
  // Flexible modifier system - structure depends on ruleset
  // For EON: { STY, TÅL, RÖR, PER, PSY, VIL, BIL, SYN, HÖR }
  modifiers: {
    type: Map,
    of: Number,
    default: {}
  },
  // Optional: ruleset-specific metadata (abilities, traits, etc.)
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for faster queries
raceSchema.index({ world: 1 });
raceSchema.index({ ruleset: 1 });
raceSchema.index({ ruleset: 1, name: 1 }, { unique: true, partialFilterExpression: { world: null } }); // Unique ruleset-wide races
raceSchema.index({ world: 1, name: 1 }, { unique: true, partialFilterExpression: { world: { $ne: null } } }); // Unique world-specific races

// Convert _id to id for consistency and handle reference fields
raceSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  
  // Convert world ObjectId to string if not populated
  if (obj.world && typeof obj.world === 'object') {
    if (!obj.world.name && typeof obj.world.toString === 'function') {
      obj.world = obj.world.toString();
    }
    // Handle populated world - convert _id to id and handle nested admin field
    else if (obj.world._id) {
      obj.world.id = obj.world._id.toString();
      delete obj.world._id;
      // Convert admin ObjectId to string if it exists
      if (obj.world.admin && obj.world.admin.toString) {
        obj.world.admin = obj.world.admin.toString();
      }
    }
  }
  return obj;
};

export default mongoose.model('Race', raceSchema);

