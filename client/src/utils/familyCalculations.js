import { rollObT6WithDetails, rollT6Multiple, rollT10, rollT100 } from './dice';

/**
 * Evaluate a formula string with dice notation and math operations
 * Supports: Ob1T6, 1T6, basic arithmetic, characterAge variable
 */
export function evaluateSiblingFormula(formula, characterAge = 0) {
  if (!formula || typeof formula !== 'string') {
    return 0;
  }

  let expr = formula.trim();
  
  // Replace characterAge with actual value
  expr = expr.replace(/characterAge/g, characterAge.toString());
  
  // Handle ObT6 notation (e.g., Ob1T6)
  const obT6Regex = /Ob(\d+)T6/g;
  expr = expr.replace(obT6Regex, (match, count) => {
    const result = rollObT6WithDetails(parseInt(count, 10));
    return result.total.toString();
  });
  
  // Handle T6 notation (e.g., 1T6)
  const t6Regex = /(\d+)T6/g;
  expr = expr.replace(t6Regex, (match, count) => {
    const rolls = rollT6Multiple(parseInt(count, 10));
    return rolls.reduce((a, b) => a + b, 0).toString();
  });
  
  // Handle division with rounding up (e.g., 1T6/2+1)
  // Split by operators and evaluate, handling division specially
  try {
    // Use eval for basic math operations after dice are rolled
    // In a production app, you'd want a safer math parser, but for this use case it's fine
    const result = Function(`"use strict"; return (${expr})`)();
    return typeof result === 'number' ? result : 0;
  } catch (err) {
    console.error('Error evaluating formula:', formula, err);
    return 0;
  }
}

/**
 * Evaluate a formula string with dice notation and math operations for parent age
 * Supports: Ob2T6, basic arithmetic, oldestSiblingOrCharacterApparentAge variable
 */
export function evaluateParentAgeFormula(formula, oldestSiblingOrCharacterApparentAge = 0) {
  if (!formula || typeof formula !== 'string') {
    return { result: 0, rollDetails: null };
  }

  let expr = formula.trim();
  
  // Replace oldestSiblingOrCharacterApparentAge with actual value
  expr = expr.replace(/oldestSiblingOrCharacterApparentAge/g, oldestSiblingOrCharacterApparentAge.toString());
  
  // Handle ObT6 notation (e.g., "Ob2T6")
  let obRollDetails = null;
  const obRegex = /Ob(\d+)T6/g;
  expr = expr.replace(obRegex, (match, count) => {
    const diceCount = parseInt(count, 10);
    const obResult = rollObT6WithDetails(diceCount);
    obRollDetails = {
      diceCount,
      roll: obResult,
      total: obResult.total
    };
    return obResult.total.toString();
  });
  
  // Handle T100 notation (e.g., 1T100)
  const t100Regex = /(\d+)T100/g;
  expr = expr.replace(t100Regex, (match, count) => {
    let total = 0;
    for (let i = 0; i < parseInt(count, 10); i++) {
      total += rollT100();
    }
    return total.toString();
  });
  
  // Handle T6 notation (e.g., 1T6)
  const t6Regex = /(\d+)T6/g;
  expr = expr.replace(t6Regex, (match, count) => {
    const rolls = [];
    for (let i = 0; i < parseInt(count, 10); i++) {
      rolls.push(Math.floor(Math.random() * 6) + 1);
    }
    return rolls.reduce((a, b) => a + b, 0).toString();
  });
  
  try {
    const result = Function(`"use strict"; return (${expr})`)();
    return { 
      result: typeof result === 'number' ? Math.max(0, Math.floor(result)) : 0,
      rollDetails: obRollDetails
    };
  } catch (err) {
    console.error('Error evaluating parent age formula:', formula, err);
    return { result: 0, rollDetails: null };
  }
}

/**
 * Evaluate a formula string with dice notation and math operations for parents
 * Supports: 1T100, basic arithmetic, characterApparentAge variable
 */
export function evaluateParentFormula(formula, characterApparentAge = 0) {
  if (!formula || typeof formula !== 'string') {
    return 0;
  }

  let expr = formula.trim();
  
  // Replace characterApparentAge with actual value
  expr = expr.replace(/characterApparentAge/g, characterApparentAge.toString());
  
  // Handle T100 notation (e.g., 1T100)
  const t100Regex = /(\d+)T100/g;
  expr = expr.replace(t100Regex, (match, count) => {
    let total = 0;
    for (let i = 0; i < parseInt(count, 10); i++) {
      total += rollT100();
    }
    return total.toString();
  });
  
  // Handle T6 notation (e.g., 1T6)
  const t6Regex = /(\d+)T6/g;
  expr = expr.replace(t6Regex, (match, count) => {
    const rolls = [];
    for (let i = 0; i < parseInt(count, 10); i++) {
      rolls.push(Math.floor(Math.random() * 6) + 1);
    }
    return rolls.reduce((a, b) => a + b, 0).toString();
  });
  
  try {
    const result = Function(`"use strict"; return (${expr})`)();
    return typeof result === 'number' ? result : 0;
  } catch (err) {
    console.error('Error evaluating formula:', formula, err);
    return 0;
  }
}

/**
 * Parse and evaluate litter size formula (may include rounding)
 * Examples: "1", "1T6/2+1" (round up)
 */
export function evaluateLitterSize(formula) {
  if (!formula || typeof formula !== 'string') {
    return 1;
  }

  // Check if formula contains division (needs rounding)
  if (formula.includes('/')) {
    const result = evaluateSiblingFormula(formula, 0);
    return Math.ceil(result); // Round up
  }

  // Simple number
  const numMatch = formula.match(/^(\d+)$/);
  if (numMatch) {
    return parseInt(numMatch[1], 10);
  }

  // Evaluate as formula
  return Math.ceil(evaluateSiblingFormula(formula, 0));
}

/**
 * Calculate apparent age from actual age
 * Priority: apparentAgeFormula > apparentAgeTable > default (actual = apparent)
 * @param {Number} actualAge - The actual age
 * @param {Object} raceCategory - Race category object with apparentAgeFormula, actualAgeFromApparentFormula, or apparentAgeTable
 * @returns {Number} - The apparent age
 */
export function calculateApparentAge(actualAge, raceCategory) {
  // First, try formula if available
  if (raceCategory?.apparentAgeFormula) {
    try {
      // Evaluate the formula with actualAge and Math as variables (Math needs to be passed explicitly)
      const apparentAge = Function('actualAge', 'Math', `return (${raceCategory.apparentAgeFormula})`)(actualAge, Math);
      return Math.max(0, Math.round(apparentAge)); // Round to whole number, minimum 0
    } catch (err) {
      console.error('Error evaluating apparentAgeFormula:', err);
      // Fall through to table or default
    }
  }

  // Second, try table if available
  const apparentAgeTable = raceCategory?.apparentAgeTable || [];
  if (apparentAgeTable.length > 0) {
    const matchingRange = apparentAgeTable.find(
      range => actualAge >= range.minActualAge && actualAge <= range.maxActualAge
    );

    if (matchingRange) {
      return Math.max(0, Math.round(matchingRange.apparentAge)); // Round to whole number, minimum 0
    }
  }

  // Default: apparent = actual (already whole number)
  return Math.max(0, Math.round(actualAge)); // Minimum 0
}

/**
 * Calculate actual age from apparent age
 * Priority: actualAgeFromApparentFormula > apparentAgeTable > default (actual = apparent)
 * @param {Number} apparentAge - The apparent age
 * @param {Object} raceCategory - Race category object with actualAgeFromApparentFormula or apparentAgeTable
 * @returns {Number} - The actual age
 */
export function calculateActualAgeFromApparent(apparentAge, raceCategory) {
  // First, try formula if available
  if (raceCategory?.actualAgeFromApparentFormula) {
    try {
      // Evaluate the formula with apparentAge and Math as variables (Math needs to be passed explicitly)
      const actualAge = Function('apparentAge', 'Math', `return (${raceCategory.actualAgeFromApparentFormula})`)(apparentAge, Math);
      return Math.max(0, Math.round(actualAge)); // Minimum 0
    } catch (err) {
      console.error('Error evaluating actualAgeFromApparentFormula:', err);
      // Fall through to table or default
    }
  }

  // Second, try table if available
  const apparentAgeTable = raceCategory?.apparentAgeTable || [];
  if (apparentAgeTable.length > 0) {
    // Find all ranges that match this apparent age
    const matchingRanges = apparentAgeTable.filter(
      range => range.apparentAge === apparentAge
    );

    if (matchingRanges.length > 0) {
      // Pick one randomly if multiple match
      const selectedRange = matchingRanges[Math.floor(Math.random() * matchingRanges.length)];
      const minAge = Math.max(0, selectedRange.minActualAge); // Ensure minimum is not negative
      const maxAge = Math.max(minAge, selectedRange.maxActualAge); // Ensure max is at least min
      return Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;
    }
  }

  // Default: actual = apparent
  return Math.max(0, apparentAge); // Minimum 0
}

/**
 * Determine gender based on formula
 * Supports: "0.5", "0.6" (decimal 0-1, where value is male chance), "1T10:1-6=male,7-10=female"
 * Also supports legacy "50-50", "60-40" format for backward compatibility
 */
export function determineGender(formula) {
  if (!formula || typeof formula !== 'string') {
    return Math.random() < 0.5 ? 'male' : 'female';
  }

  // Decimal value between 0 and 1 (e.g., "0.5", "0.6", "0.7")
  // Value represents the chance of male (0.5 = 50% male, 0.6 = 60% male, etc.)
  const decimalMatch = formula.match(/^(0(\.\d+)?|1(\.0+)?)$/);
  if (decimalMatch) {
    const maleChance = parseFloat(formula);
    if (maleChance >= 0 && maleChance <= 1) {
      return Math.random() < maleChance ? 'male' : 'female';
    }
  }

  // Legacy percentage split pattern (e.g., "50-50", "60-40", "70-30") for backward compatibility
  // First number is male percentage, second is female percentage
  const percentageMatch = formula.match(/^(\d+)-(\d+)$/);
  if (percentageMatch) {
    const [, malePercent] = percentageMatch;
    const maleChance = parseInt(malePercent, 10) / 100;
    return Math.random() < maleChance ? 'male' : 'female';
  }

  // Pattern: diceRoll:range1=gender1,range2=gender2
  const patternMatch = formula.match(/^(\d+)T(\d+):(.+)$/);
  if (patternMatch) {
    const [, diceCount, diceType, ranges] = patternMatch;
    const count = parseInt(diceCount, 10);
    const type = parseInt(diceType, 10);
    
    // Roll the dice
    let roll;
    if (type === 6) {
      const rolls = rollT6Multiple(count);
      roll = rolls.reduce((a, b) => a + b, 0);
    } else if (type === 10) {
      let total = 0;
      for (let i = 0; i < count; i++) {
        total += rollT10();
      }
      roll = total;
    } else {
      // Default to 0.5 if unsupported dice type
      return Math.random() < 0.5 ? 'male' : 'female';
    }

    // Parse ranges (e.g., "1-6=male,7-10=female")
    const rangeParts = ranges.split(',');
    for (const part of rangeParts) {
      const rangeMatch = part.match(/(\d+)-(\d+)=(.+)/);
      if (rangeMatch) {
        const [, min, max, gender] = rangeMatch;
        if (roll >= parseInt(min, 10) && roll <= parseInt(max, 10)) {
          return gender.trim();
        }
      }
    }
  }

  // Default to 0.5 (50-50) if formula not recognized
  return Math.random() < 0.5 ? 'male' : 'female';
}

/**
 * Determine parent status based on roll result and table
 */
export function determineParentStatus(rollResult, table) {
  // Sort table by max value (descending) to check from highest range first
  const sortedTable = [...table].sort((a, b) => b.max - a.max);
  
  for (const range of sortedTable) {
    if (rollResult >= range.min && rollResult <= range.max) {
      return range.result;
    }
  }
  
  // Fallback to last entry or default
  return table[table.length - 1]?.result || 'both parents alive';
}

/**
 * Roll and calculate litters based on formula
 * Returns both the calculated number of litters and roll data for display
 */
export function rollLittersHelper(litterFormula, characterAge) {
  let calculatedLitters = 0;
  let littersRollData = null;

  if (litterFormula.includes('Ob')) {
    // Handle ObT6 notation (e.g., "Ob1T6-2")
    const match = litterFormula.match(/Ob(\d+)T6(.*)/);
    if (match) {
      const diceCount = parseInt(match[1], 10);
      const modifierStr = match[2] || '';
      const obResult = rollObT6WithDetails(diceCount);
      const baseResult = obResult.total;
      
      // Evaluate modifier (e.g., "-2" becomes -2)
      let modifierValue = 0;
      if (modifierStr) {
        try {
          modifierValue = Function(`"use strict"; return (${modifierStr})`)();
        } catch {
          console.error('Error parsing modifier:', modifierStr);
        }
      }
      
      const finalResult = baseResult + modifierValue;
      calculatedLitters = Math.max(0, Math.floor(finalResult));
      
      littersRollData = {
        type: 'Ob',
        diceCount,
        roll: obResult,
        baseResult,
        modifier: modifierStr.trim() || null,
        modifierValue,
        finalResult: Math.max(0, finalResult),
        formula: litterFormula
      };
    }
  } else {
    // Handle non-Ob dice rolls (e.g., "1T6-4", "2T6", "3T6+2")
    // Try to match patterns like: xT6, xT6+modifier, xT6-modifier
    const t6Match = litterFormula.match(/^(\d+)T6(.*)$/);
    if (t6Match) {
      const diceCount = parseInt(t6Match[1], 10);
      const modifierStr = t6Match[2] || '';
      
      // Roll the dice
      const rolls = rollT6Multiple(diceCount);
      const baseResult = rolls.reduce((a, b) => a + b, 0);
      
      // Evaluate modifier (e.g., "-4" becomes -4, "+2" becomes +2)
      let modifierValue = 0;
      if (modifierStr.trim()) {
        try {
          modifierValue = Function(`"use strict"; return (${modifierStr})`)();
        } catch {
          console.error('Error parsing modifier:', modifierStr);
        }
      }
      
      const finalResult = baseResult + modifierValue;
      calculatedLitters = Math.max(0, Math.floor(finalResult));
      
      littersRollData = {
        type: 'T6',
        diceCount,
        rolls,
        baseResult,
        modifier: modifierStr.trim() || null,
        modifierValue,
        finalResult,
        formula: litterFormula
      };
    } else {
      // Handle other formulas (fallback to evaluateSiblingFormula)
      const result = evaluateSiblingFormula(litterFormula, characterAge);
      calculatedLitters = Math.max(0, Math.floor(result));
    }
  }

  return { calculatedLitters, littersRollData };
}

