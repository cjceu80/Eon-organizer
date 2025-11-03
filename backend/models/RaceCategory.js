import mongoose from 'mongoose';

const raceCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    minlength: [1, 'Category name must be at least 1 character'],
    maxlength: [100, 'Category name must be less than 100 characters']
  },
  ruleset: {
    type: String,
    required: true,
    enum: ['EON'] // Expand when adding new rulesets
  },
  // Optional description about the category
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description must be less than 1000 characters'],
    default: ''
  },
  // Apparent age table for this category/ruleset
  // Store ranges: [{ minActualAge, maxActualAge, apparentAge }]
  apparentAgeTable: [{
    minActualAge: { type: Number, required: true },
    maxActualAge: { type: Number, required: true },
    apparentAge: { type: Number, required: true }
  }]
}, { timestamps: true });

// Unique per ruleset
raceCategorySchema.index({ ruleset: 1, name: 1 }, { unique: true });

raceCategorySchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  return obj;
};

export default mongoose.model('RaceCategory', raceCategorySchema);
