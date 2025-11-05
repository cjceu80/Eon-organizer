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
  // Alternative: Use apparentAgeFormula and actualAgeFromApparentFormula for mathematical formulas
  apparentAgeTable: [{
    minActualAge: { type: Number, required: true },
    maxActualAge: { type: Number, required: true },
    apparentAge: { type: Number, required: true }
  }],
  // Apparent age formula (forward): JavaScript expression using 'actualAge' variable
  // Example: "2.5 * Math.pow(actualAge, 0.26) - 4.7"
  // Takes precedence over apparentAgeTable if both are set
  apparentAgeFormula: {
    type: String,
    required: false
  },
  // Actual age from apparent formula (inverse): JavaScript expression using 'apparentAge' variable
  // Example: "Math.pow((apparentAge + 4.7) / 2.5, 1 / 0.26)"
  // Takes precedence over apparentAgeTable if both are set
  actualAgeFromApparentFormula: {
    type: String,
    required: false
  },
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
  },
  // Parent age formula for calculating living parent age
  // Can also be set at the race level in Race.metadata.parentAgeFormula (takes precedence over category)
  // Default: 'oldestSiblingOrCharacterApparentAge + 14 + Ob2T6'
  // Formula uses the variable: oldestSiblingOrCharacterApparentAge (apparent age of oldest sibling, or character if no older siblings)
  parentAgeFormula: {
    type: String,
    required: false
  }
}, { timestamps: true });

// Unique per ruleset
raceCategorySchema.index({ ruleset: 1, name: 1 }, { unique: true });

/**
 * Calculate apparent age from actual age
 * Priority: apparentAgeFormula > apparentAgeTable > default (actual = apparent)
 * @param {Number} actualAge - The actual age of the character
 * @returns {Number} - The apparent age
 */
raceCategorySchema.methods.calculateApparentAge = function(actualAge) {
  // First, try formula if available
  if (this.apparentAgeFormula) {
    try {
      // Evaluate the formula with actualAge and Math as variables (Math needs to be passed explicitly)
      const apparentAge = Function('actualAge', 'Math', `return (${this.apparentAgeFormula})`)(actualAge, Math);
      return Math.round(apparentAge); // Round to whole number
    } catch (err) {
      console.error('Error evaluating apparentAgeFormula:', err);
      // Fall through to table or default
    }
  }

  // Second, try table if available
  if (this.apparentAgeTable && this.apparentAgeTable.length > 0) {
    const matchingRange = this.apparentAgeTable.find(
      range => actualAge >= range.minActualAge && actualAge <= range.maxActualAge
    );

    if (matchingRange) {
      return Math.round(matchingRange.apparentAge); // Round to whole number (table values should already be integers, but ensure rounding)
    }
  }

  // Default: apparent = actual (already whole number)
  return Math.round(actualAge);
};

/**
 * Calculate actual age from apparent age
 * Priority: actualAgeFromApparentFormula > apparentAgeTable > default (actual = apparent)
 * @param {Number} apparentAge - The apparent age of the character
 * @returns {Number} - The actual age
 */
raceCategorySchema.methods.calculateActualAgeFromApparent = function(apparentAge) {
  // First, try formula if available
  if (this.actualAgeFromApparentFormula) {
    try {
      // Evaluate the formula with apparentAge and Math as variables (Math needs to be passed explicitly)
      const actualAge = Function('apparentAge', 'Math', `return (${this.actualAgeFromApparentFormula})`)(apparentAge, Math);
      return Math.round(actualAge);
    } catch (err) {
      console.error('Error evaluating actualAgeFromApparentFormula:', err);
      // Fall through to table or default
    }
  }

  // Second, try table if available
  if (this.apparentAgeTable && this.apparentAgeTable.length > 0) {
    // Find all ranges that match this apparent age
    const matchingRanges = this.apparentAgeTable.filter(
      range => range.apparentAge === apparentAge
    );

    if (matchingRanges.length > 0) {
      // Pick one randomly if multiple match
      const selectedRange = matchingRanges[Math.floor(Math.random() * matchingRanges.length)];
      const minAge = selectedRange.minActualAge;
      const maxAge = selectedRange.maxActualAge;
      return Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;
    }
  }

  // Default: actual = apparent
  return apparentAge;
};

raceCategorySchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  return obj;
};

export default mongoose.model('RaceCategory', raceCategorySchema);
