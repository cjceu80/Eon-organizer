import mongoose from 'mongoose';

const npcSchema = new mongoose.Schema({
  fromCharacter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Character',
    required: [true, 'From character is required']
  },
  world: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'World',
    required: [true, 'World is required']
  },
  connectionType: {
    type: String,
    required: [true, 'Connection type is required'],
    trim: true,
    enum: ['family', 'friend', 'enemy', 'other'],
    default: 'other'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description must be less than 500 characters'],
    default: ''
  },
  isFullyCreated: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

npcSchema.index({ fromCharacter: 1 });
npcSchema.index({ world: 1 });
npcSchema.index({ world: 1, isFullyCreated: 1 });

npcSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  
  if (obj.fromCharacter && typeof obj.fromCharacter === 'object') {
    if (!obj.fromCharacter.name && typeof obj.fromCharacter.toString === 'function') {
      obj.fromCharacter = obj.fromCharacter.toString();
    } else if (obj.fromCharacter._id) {
      obj.fromCharacter.id = obj.fromCharacter._id.toString();
      delete obj.fromCharacter._id;
    }
  }
  if (obj.world && typeof obj.world === 'object') {
    if (!obj.world.name && typeof obj.world.toString === 'function') {
      obj.world = obj.world.toString();
    } else if (obj.world._id) {
      obj.world.id = obj.world._id.toString();
      delete obj.world._id;
    }
  }
  return obj;
};

export default mongoose.model('NPC', npcSchema);
