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
  }],
  // Divisor for exhaustion columns calculation: (TÅL + VIL) / exhaustionColumnDivisor
  exhaustionColumnDivisor: {
    type: Number,
    required: false, // Optional for backward compatibility
    default: 4
  },
  // Sibling formula configuration
  // Structure: {
  //   numberOfLitters: string (e.g., "Ob1T6-2"),
  //   litterSize: string (e.g., "1" or "1T6/2+1" with rounding),
  //   olderSiblingAgeFormula: string (e.g., "characterAge + Ob1T6"),
  //   youngerSiblingAgeFormula: string (e.g., "characterAge - Ob1T6"),
  //   genderFormula: string (e.g., "0.5" for 50% male, "0.6" for 60% male, or "1T10:1-6=male,7-10=female" for dice-based)
  // }
  siblingFormula: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
    default: {
      numberOfLitters: 'Ob1T6-2',
      litterSize: '1',
      olderSiblingAgeFormula: 'characterAge + Ob1T6',
      youngerSiblingAgeFormula: 'characterAge - Ob1T6',
      genderFormula: '0.5'
    }
  },
  // Parent formula configuration
  // Can also be set at the race level in Race.metadata.parentFormula (takes precedence over category)
  // Structure: {
  //   formula: string (e.g., "1T100 + characterApparentAge" or "1T100" for Alver),
  //   table: array of { min: number, max: number, result: string } (e.g., [{ min: 1, max: 60, result: 'both parents alive' }, ...])
  // }
  // Partial overrides are supported: you can provide only formula (uses default table), only table (uses default formula), or both
  parentFormula: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
    default: {
      formula: '1T100 + characterApparentAge',
      table: [
        { min: 1, max: 60, result: 'both parents alive' },
        { min: 61, max: 80, result: 'father unknown' },
        { min: 81, max: 88, result: 'mother alive' },
        { min: 89, max: 95, result: 'father alive' },
        { min: 96, max: 999, result: 'both dead' }
      ]
    }
  }
}, { timestamps: true });

// Unique per ruleset
raceCategorySchema.index({ ruleset: 1, name: 1 }, { unique: true });

/**
 * Calculate apparent age from actual age
 * If no apparentAgeTable is set or empty, returns actual age (default behavior)
 * Otherwise, looks up the matching range in the table
 * @param {Number} actualAge - The actual age of the character
 * @returns {Number} - The apparent age
 */
raceCategorySchema.methods.calculateApparentAge = function(actualAge) {
  // Default behavior: if no table set, apparent = actual
  if (!this.apparentAgeTable || this.apparentAgeTable.length === 0) {
    return actualAge;
  }

  // Find matching range in the table
  const matchingRange = this.apparentAgeTable.find(
    range => actualAge >= range.minActualAge && actualAge <= range.maxActualAge
  );

  // If no match found, return actual age as fallback
  if (!matchingRange) {
    return actualAge;
  }

  return matchingRange.apparentAge;
};

raceCategorySchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  return obj;
};

export default mongoose.model('RaceCategory', raceCategorySchema);
