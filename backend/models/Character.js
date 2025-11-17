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
  basics: {
    age: { type: Number, default: null },
    gender: { type: String, default: '' },
    race: { type: String, default: '' },
    profession: { type: String, default: '' },
    height: { type: Number, default: null },
    weight: { type: Number, default: null },
    build: { type: String, default: '' },
    buildRollDetails: { type: Number, default: null },
    hair: { type: String, default: '' },
    eyes: { type: String, default: '' },
    skin: { type: String, default: '' },
    home: { type: String, default: '' },
    religion: { type: String, default: '' }
  },
  attributes: {
    STY: { type: Number, default: 10 },
    TÅL: { type: Number, default: 10 },
    RÖR: { type: Number, default: 10 },
    PER: { type: Number, default: 10 },
    PSY: { type: Number, default: 10 },
    VIL: { type: Number, default: 10 },
    BIL: { type: Number, default: 10 },
    SYN: { type: Number, default: 10 },
    HÖR: { type: Number, default: 10 }
  },
  characteristics: {
    Lojalitet: { type: Number, default: 10 },
    Heder: { type: Number, default: 10 },
    Amor: { type: Number, default: 10 },
    Aggression: { type: Number, default: 10 },
    Tro: { type: Number, default: 10 },
    Generositet: { type: Number, default: 10 },
    Rykte: { type: Number, default: 10 },
    Tur: { type: Number, default: 10 },
    Qadosh: { type: Number, default: 10 }
  },
  specializations: {
    type: Map,
    of: String,
    default: {}
  },
  advantages: [{
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }],
  disadvantages: [{
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }],
  meleeWeapons: [{
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }],
  rangedWeapons: [{
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }],
  armor: [{
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }],
  shields: [{
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }],
  inventory: [{
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }],
  ownedItems: [{
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }],
  professionalSkills: [{
    name: { type: String, required: true },
    level: { type: Number, default: 10 },
    specialization: { type: String, default: '' }
  }],
  otherSkills: [{
    name: { type: String, required: true },
    level: { type: Number, default: 10 },
    specialization: { type: String, default: '' }
  }],
  languages: [{
    name: { type: String, required: true },
    level: { type: Number, default: 10 }
  }],
  connections: [{
    id: { type: String, required: true },
    relationship: { type: String, required: true },
    description: { type: String, default: '' }
  }],
  bio: [{
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }],
  // Legacy fields for backward compatibility (will be migrated)
  stats: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  bonuses: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
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

