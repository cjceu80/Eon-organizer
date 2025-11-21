// Age bonus table
export const AGE_BONUS_TABLE = [
  { min: 30, max: 39, bonus: 10 },
  { min: 40, max: 49, bonus: 15 },
  { min: 50, max: 59, bonus: 20 },
  { min: 60, max: 69, bonus: 25 },
  { min: 70, max: 79, bonus: 30 },
  { min: 80, max: 89, bonus: 35 },
  { min: 90, max: 99, bonus: 40 },
  { min: 100, max: Infinity, bonus: 45 }
];

// Get bonus for a given age (for ages below 30, return 0)
export const getAgeBonus = (age) => {
  if (age < 30) return 0;
  const entry = AGE_BONUS_TABLE.find(range => age >= range.min && age <= range.max);
  return entry ? entry.bonus : 0;
};

// Kroppsbyggnad table
export const KROPPSBYGGNAD_TABLE = [
  { min: 5, max: 14, type: 'Klen', skadekolumner: 4 },
  { min: 15, max: 24, type: 'Svag', skadekolumner: 5 },
  { min: 25, max: 38, type: 'Normal', skadekolumner: 6 },
  { min: 39, max: 48, type: 'Kraftig', skadekolumner: 7 },
  { min: 49, max: Infinity, type: 'Massiv', skadekolumner: 8 }
];

// Get kroppsbyggnad for a given value
export const getKroppsbyggnad = (value) => {
  const entry = KROPPSBYGGNAD_TABLE.find(range => value >= range.min && value <= range.max);
  return entry || { type: 'Okänd', skadekolumner: 0 };
};

// Kroppsbyggnad weight multiplier table (for varierande vikt)
export const KROPPSBYGGNAD_WEIGHT_MULTIPLIER = {
  'Klen': 0.8,
  'Svag': 0.9,
  'Normal': 1,
  'Kraftig': 1.1,
  'Massiv': 1.2
};

/**
 * Calculate apparent age from actual age
 * Priority: apparentAgeFormula > apparentAgeTable > default (actual = apparent)
 */
export function calculateApparentAge(actualAge, raceCategory) {
  // First, try formula if available
  if (raceCategory?.apparentAgeFormula) {
    try {
      const apparentAge = Function('actualAge', 'Math', `return (${raceCategory.apparentAgeFormula})`)(actualAge, Math);
      return Math.round(apparentAge);
    } catch (err) {
      console.error('Error evaluating apparentAgeFormula:', err);
    }
  }

  // Second, try table if available
  const apparentAgeTable = raceCategory?.apparentAgeTable || [];
  if (apparentAgeTable.length > 0) {
    const matchingRange = apparentAgeTable.find(
      range => actualAge >= range.minActualAge && actualAge <= range.maxActualAge
    );

    if (matchingRange) {
      return Math.round(matchingRange.apparentAge);
    }
  }

  // Default: apparent = actual
  return Math.round(actualAge);
}

/**
 * Get race-specific constants for length and weight calculations
 */
export function getRaceConstants(selectedRace, gender) {
  const defaultLength = gender === 'kvinna' ? 135 : 145;
  const defaultWeight = 105;

  if (!selectedRace?.metadata) {
    return { lengthConstant: defaultLength, weightConstant: defaultWeight };
  }

  const metadata = selectedRace.metadata instanceof Map 
    ? Object.fromEntries(selectedRace.metadata) 
    : selectedRace.metadata;

  let lengthConstant = defaultLength;
  if (gender === 'kvinna') {
    lengthConstant = metadata.femaleLength || metadata.lengthVariable || defaultLength;
  } else {
    lengthConstant = metadata.maleLength || metadata.lengthVariable || defaultLength;
  }

  let weightConstant = defaultWeight;
  if (gender === 'kvinna') {
    weightConstant = metadata.femaleWeight || metadata.weightVariable || defaultWeight;
  } else {
    weightConstant = metadata.maleWeight || metadata.weightVariable || defaultWeight;
  }

  return { lengthConstant, weightConstant };
}

