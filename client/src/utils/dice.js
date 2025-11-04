/**
 * Dice rolling utilities for EON
 * Supports:
 * - xT100: x rolls of d100 (two d10s: one for tens, one for ones, 00 = 100)
 * - xT6: x rolls of d6
 * - ObxT6: Ob (open-ended) xT6 - x dice rolled, 6s trigger extra rolls
 * 
 * EON Attributes (in order):
 * STY, TÅL, RÖR, PER, PSY, VIL, BIL, SYN, HÖR
 */

/**
 * Roll a single d10 (1-10)
 */
function rollD10() {
  return Math.floor(Math.random() * 10) + 1;
}

/**
 * Roll a single d6 (1-6)
 */
function rollD6() {
  return Math.floor(Math.random() * 6) + 1;
}

/**
 * Roll a single T100 (d100 using two d10s)
 * One die for tens (0-9, representing 0, 10, 20, ..., 90)
 * One die for ones (0-9, representing 0-9)
 * Result: 1-100 where 00 = 100
 * @returns {number|Object} If called directly, returns the value. Use rollT100WithDetails() for component dice.
 */
export function rollT100() {
  const tensDie = rollD10() - 1; // 0-9
  const onesDie = rollD10() - 1; // 0-9
  
  // If both are 0, that's 00 which equals 100
  if (tensDie === 0 && onesDie === 0) {
    return 100;
  }
  
  // Otherwise: tens * 10 + ones
  // e.g., tens=2, ones=5 = 25
  // e.g., tens=0, ones=5 = 5
  return tensDie * 10 + onesDie;
}

/**
 * Roll a single T100 with details (returns component dice)
 * @returns {Object} { tensDie, onesDie, value }
 */
export function rollT100WithDetails() {
  const tensDie = rollD10() - 1; // 0-9
  const onesDie = rollD10() - 1; // 0-9
  
  let value;
  if (tensDie === 0 && onesDie === 0) {
    value = 100;
  } else {
    value = tensDie * 10 + onesDie;
  }
  
  return {
    tensDie,
    onesDie,
    value
  };
}

/**
 * Roll multiple T100 dice
 * @param {number} count - Number of T100 rolls
 * @returns {Array<number>} Array of roll results
 */
export function rollT100Multiple(count) {
  return Array.from({ length: count }, () => rollT100());
}

/**
 * Roll a single T6 (d6)
 */
export function rollT6() {
  return rollD6();
}

/**
 * Roll multiple T6 dice
 * @param {number} count - Number of T6 rolls
 * @returns {Array<number>} Array of roll results
 */
export function rollT6Multiple(count) {
  return Array.from({ length: count }, () => rollT6());
}

/**
 * Roll a single open-ended T6 (ObT6)
 * This is a convenience function for rolling Ob1T6
 * For multiple dice, use rollObT6Multiple or rollObT6WithDetails
 * @returns {number} Total result (sum of all rolls)
 */
export function rollObT6() {
  const result = rollObT6WithDetails(1);
  return result.total;
}

/**
 * Roll multiple open-ended T6 dice (ObT6) with details
 * For ObxT6, roll x dice initially (first throw), then roll extra dice for each 6
 * @param {number} count - Number of dice in the initial throw
 * @returns {Object} { initialRolls: [numbers], extraRolls: [numbers], allRolls: [numbers], total: number, potentialPerfect: boolean, potentialFumble: boolean }
 */
export function rollObT6WithDetails(count = 1) {
  // First throw: roll count dice at once
  const initialRolls = Array.from({ length: count }, () => rollD6());
  const extraRolls = [];
  const allRolls = [...initialRolls];
  
  // For each 6 in the initial throw, roll an extra die
  // If that's also 6, continue rolling
  for (let i = 0; i < initialRolls.length; i++) {
    if (initialRolls[i] === 6) {
      let extraRoll = rollD6();
      extraRolls.push(extraRoll);
      allRolls.push(extraRoll);
      
      // Continue rolling on 6s
      while (extraRoll === 6) {
        extraRoll = rollD6();
        extraRolls.push(extraRoll);
        allRolls.push(extraRoll);
      }
    }
  }
  
  const total = allRolls.reduce((a, b) => a + b, 0);
  
  // Potential Fumble: two or more 6s in the first throw (before rerolls)
  const sixesInFirstThrow = initialRolls.filter(r => r === 6).length;
  const potentialFumble = sixesInFirstThrow >= 2;
  
  // Potential Perfect: 
  // - If only one dice in initial throw: result of 1, 2, or 3
  // - If multiple dice: all but one must be 1
  let potentialPerfect = false;
  if (initialRolls.length === 1) {
    // Single dice: 1, 2, or 3 is potential perfect
    potentialPerfect = initialRolls[0] === 1 || initialRolls[0] === 2 || initialRolls[0] === 3;
  } else {
    // Multiple dice: all but one must be 1
    const ones = initialRolls.filter(r => r === 1).length;
    potentialPerfect = ones === initialRolls.length - 1;
  }
  
  return {
    initialRolls, // The first throw dice
    extraRolls,   // Additional dice rolled due to 6s
    allRolls,     // All dice rolled (initial + extra)
    total,
    potentialPerfect,
    potentialFumble
  };
}

/**
 * Roll multiple open-ended T6 dice (ObT6)
 * NOTE: This function treats count as separate ObT6 rolls, not dice in one throw
 * For ObxT6 where x is the number of dice in one throw, use rollObT6WithDetails(x)
 * @param {number} count - Number of separate ObT6 rolls (each is Ob1T6)
 * @returns {Array<number>} Array of roll results (just totals)
 */
export function rollObT6Multiple(count) {
  return Array.from({ length: count }, () => rollObT6WithDetails(1).total);
}

/**
 * Roll a single ObT6 throw with multiple dice (for ObxT6 notation)
 * This is the main function for ObT6 - rolls count dice initially, then handles 6s
 * @param {number} count - Number of dice in the initial throw
 * @returns {Object} { initialRolls, extraRolls, allRolls, total, potentialPerfect, potentialFumble }
 */
export function rollObT6MultipleWithDetails(count) {
  // For ObxT6, we roll x dice in the first throw, so pass count directly
  return rollObT6WithDetails(count);
}

/**
 * Parse and execute a dice roll string
 * Supports: "xT100", "xT6", "ObxT6"
 * @param {string} diceString - Dice notation string (e.g., "3T100", "2T6", "Ob1T6")
 * @returns {Array<number>} Array of roll results
 */
export function parseAndRoll(diceString) {
  if (!diceString || typeof diceString !== 'string') {
    throw new Error('Invalid dice string');
  }

  // Match patterns: number followed by T100, T6, or ObT6
  const t100Match = diceString.match(/^(\d+)T100$/i);
  if (t100Match) {
    const count = parseInt(t100Match[1], 10);
    return rollT100Multiple(count);
  }

  const obT6Match = diceString.match(/^Ob(\d+)T6$/i);
  if (obT6Match) {
    const count = parseInt(obT6Match[1], 10);
    return rollObT6Multiple(count);
  }

  const t6Match = diceString.match(/^(\d+)T6$/i);
  if (t6Match) {
    const count = parseInt(t6Match[1], 10);
    return rollT6Multiple(count);
  }

  throw new Error(`Unsupported dice notation: ${diceString}`);
}

/**
 * Roll multiple T100 dice with details
 * @param {number} count - Number of T100 rolls
 * @returns {Array<Object>} Array of { tensDie, onesDie, value }
 */
export function rollT100MultipleWithDetails(count) {
  return Array.from({ length: count }, () => rollT100WithDetails());
}


/**
 * Get a detailed breakdown of a dice roll
 * @param {string} diceString - Dice notation string
 * @returns {Object} Detailed roll information
 */
export function rollWithDetails(diceString) {
  if (!diceString || typeof diceString !== 'string') {
    throw new Error('Invalid dice string');
  }

  // Match patterns: number followed by T100, T6, or ObT6
  const t100Match = diceString.match(/^(\d+)T100$/i);
  if (t100Match) {
    const count = parseInt(t100Match[1], 10);
    const details = rollT100MultipleWithDetails(count);
    const results = details.map(d => d.value);
    return {
      diceString,
      results,
      sum: results.reduce((a, b) => a + b, 0),
      details // Shows component dice for T100
    };
  }

  const obT6Match = diceString.match(/^Ob(\d+)T6$/i);
  if (obT6Match) {
    const count = parseInt(obT6Match[1], 10);
    // For ObxT6, count is the number of dice in one throw
    const details = rollObT6WithDetails(count);
    // Return single result (ObxT6 is one throw, not multiple separate throws)
    return {
      diceString,
      results: [details.total],
      sum: details.total,
      details: [details], // Array with one entry showing the full breakdown
      potentialPerfect: details.potentialPerfect,
      potentialFumble: details.potentialFumble
    };
  }

  const t6Match = diceString.match(/^(\d+)T6$/i);
  if (t6Match) {
    const count = parseInt(t6Match[1], 10);
    const results = rollT6Multiple(count);
    return {
      diceString,
      results,
      sum: results.reduce((a, b) => a + b, 0),
      details: null // T6 doesn't need detailed breakdown
    };
  }

  throw new Error(`Unsupported dice notation: ${diceString}`);
}

/**
 * EON Attribute names in order (top to bottom)
 */
export const EON_ATTRIBUTES = ['STY', 'TÅL', 'RÖR', 'PER', 'PSY', 'VIL', 'BIL', 'SYN', 'HÖR'];

/**
 * Standard stat rolling: 3T6 for each stat in order
 * @returns {Object} { attributes: { STY: number, TÅL: number, ... }, rolls: { STY: [numbers], ... } }
 */
export function rollStandardStats() {
  const attributes = {};
  const rolls = {};
  
  EON_ATTRIBUTES.forEach(attr => {
    const rollResult = rollT6Multiple(3);
    rolls[attr] = rollResult;
    attributes[attr] = rollResult.reduce((a, b) => a + b, 0);
  });
  
  return { attributes, rolls };
}

/**
 * Anpassad (Custom) stat rolling: 9 sets of 3T6, player selects placement
 * @returns {Object} { sets: [Array<Object>], totalSets: 9 }
 * Each set: { id: number, rolls: [numbers], total: number }
 */
export function rollAnpassadStats() {
  const sets = [];
  
  // Roll 9 sets of 3T6
  for (let i = 0; i < 9; i++) {
    const rollResult = rollT6Multiple(3);
    sets.push({
      id: i + 1,
      rolls: rollResult,
      total: rollResult.reduce((a, b) => a + b, 0)
    });
  }
  
  // Sort by total (descending) for easier selection
  sets.sort((a, b) => b.total - a.total);
  
  return { sets, totalSets: 9 };
}

/**
 * Höga attribut (High attributes) stat rolling: 4T6 for each stat, drop lowest
 * @returns {Object} { attributes: { STY: number, TÅL: number, ... }, rolls: { STY: { all: [numbers], kept: [numbers], dropped: number }, ... } }
 */
export function rollHogaAttributStats() {
  const attributes = {};
  const rolls = {};
  
  EON_ATTRIBUTES.forEach(attr => {
    const allRolls = rollT6Multiple(4);
    // Sort to find lowest
    const sortedRolls = [...allRolls].sort((a, b) => a - b);
    const dropped = sortedRolls[0]; // Lowest
    const kept = sortedRolls.slice(1); // Top 3
    
    rolls[attr] = {
      all: allRolls,
      kept,
      dropped
    };
    attributes[attr] = kept.reduce((a, b) => a + b, 0);
  });
  
  return { attributes, rolls };
}

/**
 * Hjälteattribut (Hero attributes) stat rolling: 2T6+9 for each stat
 * @returns {Object} { attributes: { STY: number, TÅL: number, ... }, rolls: { STY: [numbers], ... } }
 */
export function rollHjalteattributStats() {
  const attributes = {};
  const rolls = {};
  
  EON_ATTRIBUTES.forEach(attr => {
    const rollResult = rollT6Multiple(2);
    rolls[attr] = rollResult;
    attributes[attr] = rollResult.reduce((a, b) => a + b, 0) + 9; // Sum of 2T6 + 9
  });
  
  return { attributes, rolls };
}

/**
 * Roll stats based on the selected method
 * @param {string} method - 'standard', 'anpassad', 'höga attribut', 'hjälteattribut'
 * @returns {Object} Stats roll result (format depends on method)
 */
export function rollStatsForMethod(method) {
  switch (method) {
    case 'standard':
      return rollStandardStats();
    case 'anpassad':
      return rollAnpassadStats();
    case 'höga attribut':
      return rollHogaAttributStats();
    case 'hjälteattribut':
      return rollHjalteattributStats();
    default:
      throw new Error(`Unknown stat roll method: ${method}`);
  }
}

