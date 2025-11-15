import mongoose from 'mongoose';

const effectSchema = new mongoose.Schema({
  handlerId: {
    type: String,
    required: [true, 'Effect handlerId is required'],
    trim: true,
    minlength: [1, 'Effect handlerId must be at least 1 character'],
    maxlength: [100, 'Effect handlerId must be less than 100 characters']
  },
  type: {
    type: String,
    default: 'note',
    trim: true,
    maxlength: [50, 'Effect type must be less than 50 characters']
  },
  label: {
    type: String,
    default: '',
    trim: true,
    maxlength: [100, 'Effect label must be less than 100 characters']
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  _id: false,
  strict: false
});

const rollTableEntrySchema = new mongoose.Schema({
  minValue: {
    type: Number,
    required: true
  },
  maxValue: {
    type: Number,
    required: true
  },
  value: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  effect: {
    type: effectSchema,
    default: null
  },
  // Optional arbitrary metadata (e.g. flags, tags, lookups)
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: undefined
  },
  /**
   * Optional subtable structure.
   * - Use an object with { tableSlug } to reference another RollTable
   * - Or embed an inline table with { name, dice, entries: [...] }
   *   (entries can follow the same structure recursively)
   */
  subTable: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  _id: false
});

const rollTableSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: [1, 'Table name must be at least 1 character'],
    maxlength: [200, 'Table name must be less than 200 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  dice: {
    type: String,
    default: '1d100',
    trim: true
  },
  tags: {
    type: [String],
    default: []
  },
  source: {
    type: String,
    default: '',
    trim: true
  },
  copyrightNotice: {
    type: String,
    default: '',
    trim: true
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  entries: {
    type: [rollTableEntrySchema],
    default: []
  }
}, {
  timestamps: true
});

rollTableSchema.index({ slug: 1 }, { unique: true });
rollTableSchema.index({ name: 1 });
rollTableSchema.index({ tags: 1 });

rollTableSchema.methods.toJSON = function () {
  const obj = this.toObject({ flattenMaps: true });
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;

  if (obj.metadata && obj.metadata instanceof Map) {
    obj.metadata = Object.fromEntries(obj.metadata);
  }

  if (Array.isArray(obj.entries)) {
    obj.entries = obj.entries.map((entry) => {
      const mappedEntry = { ...entry };
      if (mappedEntry.metadata && mappedEntry.metadata instanceof Map) {
        mappedEntry.metadata = Object.fromEntries(mappedEntry.metadata);
      }
      return mappedEntry;
    });
  }
  return obj;
};

export default mongoose.model('RollTable', rollTableSchema);


