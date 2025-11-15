import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { rollObT6WithDetails, rollT6Multiple, rollT10, rollT100 } from '../../utils/dice';
import RollTableCard from '../RollTableCard';
import RollTableView from '../RollTableView';
import { useAuth } from '../../hooks/useAuth';

/**
 * Evaluate a formula string with dice notation and math operations
 * Supports: Ob1T6, 1T6, basic arithmetic, characterAge variable
 */
function evaluateSiblingFormula(formula, characterAge = 0) {
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
function evaluateParentAgeFormula(formula, oldestSiblingOrCharacterApparentAge = 0) {
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
function evaluateParentFormula(formula, characterApparentAge = 0) {
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
function evaluateLitterSize(formula) {
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
function calculateApparentAge(actualAge, raceCategory) {
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
function calculateActualAgeFromApparent(apparentAge, raceCategory) {
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
function determineGender(formula) {
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
function determineParentStatus(rollResult, table) {
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

export default function FamilyDialog({
  onClose,
  onConfirm,
  onStateChange = null,
  savedState = null,
  ageData = null,
  selectedRace = null,
  raceCategory = null,
  rerolls = 0,
  freeSelections = 0
}) {
  // Siblings state
  const [siblings, setSiblings] = useState([]);
  const [olderLittersRoll, setOlderLittersRoll] = useState(null);
  const [youngerLittersRoll, setYoungerLittersRoll] = useState(null);
  const [olderLitters, setOlderLitters] = useState(0);
  const [youngerLitters, setYoungerLitters] = useState(0);
  const [olderRerollUsed, setOlderRerollUsed] = useState(false);
  const [youngerRerollUsed, setYoungerRerollUsed] = useState(false);
  
  // Parents state
  const [rollResult, setRollResult] = useState(null);
  const [parentStatus, setParentStatus] = useState(null);
  const [rollDetails, setRollDetails] = useState(null);
  const [parentRerollUsed, setParentRerollUsed] = useState(false);
  const [motherAgeResult, setMotherAgeResult] = useState(null);
  const [fatherAgeResult, setFatherAgeResult] = useState(null);
  
  const [remainingRerolls, setRemainingRerolls] = useState(rerolls);
  const [remainingFreeSelections, setRemainingFreeSelections] = useState(freeSelections);
  const [initialRoll, setInitialRoll] = useState(false);

  // Roll table state
  const { token } = useAuth();
  const [familyTable, setFamilyTable] = useState(null);
  const [familyTableLoading, setFamilyTableLoading] = useState(false);
  const [familyTableRollResult, setFamilyTableRollResult] = useState(null);
  const [showFamilyTableView, setShowFamilyTableView] = useState(false);
  const [pendingFamilyTableFreeChoice, setPendingFamilyTableFreeChoice] = useState(null);
  const [familyTableSecondaryRollResult, setFamilyTableSecondaryRollResult] = useState(null);
  const [showFamilyTableSecondaryView, setShowFamilyTableSecondaryView] = useState(false);
  const [pendingFamilyTableSecondaryFreeChoice, setPendingFamilyTableSecondaryFreeChoice] = useState(null);
  const [familyTableFreeRerollUsed, setFamilyTableFreeRerollUsed] = useState(false);

  // Get sibling formula from race metadata first, then race category, then defaults
  const getSiblingFormula = () => {
    // First, check if the race has siblingFormula in its metadata
    if (selectedRace?.metadata) {
      const metadata = selectedRace.metadata instanceof Map 
        ? Object.fromEntries(selectedRace.metadata) 
        : selectedRace.metadata;
      
      if (metadata.siblingFormula && typeof metadata.siblingFormula === 'object') {
        return metadata.siblingFormula;
      }
    }
    
    // Second, check race category
    if (raceCategory?.siblingFormula) {
      return raceCategory.siblingFormula;
    }
    
    // Finally, use defaults
    return {
      numberOfLitters: 'Ob1T6-2',
      litterSize: '1',
      olderSiblingAgeFormula: 'characterAge + Ob1T6',
      youngerSiblingAgeFormula: 'characterAge - Ob1T6',
      genderFormula: '0.5'
    };
  };

  // Get parent formula and table from race metadata first, then race category, then defaults
  const getParentFormula = () => {
    // First, check if the race has parentFormula in its metadata
    if (selectedRace?.metadata) {
      const metadata = selectedRace.metadata instanceof Map 
        ? Object.fromEntries(selectedRace.metadata) 
        : selectedRace.metadata;
      
      if (metadata.parentFormula && typeof metadata.parentFormula === 'object') {
        return {
          formula: metadata.parentFormula.formula || '1T100 + characterApparentAge',
          table: metadata.parentFormula.table || getDefaultParentTable()
        };
      }
    }
    
    // Second, check race category
    if (raceCategory?.parentFormula) {
      return {
        formula: raceCategory.parentFormula.formula || '1T100 + characterApparentAge',
        table: raceCategory.parentFormula.table || getDefaultParentTable()
      };
    }
    
    // Finally, use defaults if no override exists
    return {
      formula: '1T100 + characterApparentAge',
      table: getDefaultParentTable()
    };
  };

  const getDefaultParentTable = () => [
    { min: 1, max: 60, result: 'both parents alive' },
    { min: 61, max: 80, result: 'father unknown' },
    { min: 81, max: 88, result: 'mother alive' },
    { min: 89, max: 95, result: 'father alive' },
    { min: 96, max: 999, result: 'both dead' }
  ];

  const getParentAgeFormula = () => {
    // Priority: race metadata > race category > default
    if (selectedRace?.metadata) {
      const metadata = selectedRace.metadata instanceof Map 
        ? Object.fromEntries(selectedRace.metadata) 
        : selectedRace.metadata;
      
      if (metadata.parentAgeFormula && typeof metadata.parentAgeFormula === 'string') {
        return metadata.parentAgeFormula;
      }
    }
    
    if (raceCategory?.parentAgeFormula) {
      return raceCategory.parentAgeFormula;
    }
    
    // Default: (apparent age of oldest sibling or character if no older sibling) + 14 + Ob2T6
    return 'oldestSiblingOrCharacterApparentAge + 14 + Ob2T6';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'both parents alive': 'Båda föräldrarna lever',
      'father unknown': 'Far okänd',
      'mother alive': 'Mor lever',
      'father alive': 'Far lever',
      'both dead': 'Båda döda'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      'both parents alive': 'success',
      'father unknown': 'info',
      'mother alive': 'warning',
      'father alive': 'warning',
      'both dead': 'error'
    };
    return colors[status] || 'default';
  };

  // Fetch family roll table
  useEffect(() => {
    const fetchFamilyTable = async () => {
      if (!token) return;
      
      setFamilyTableLoading(true);
      try {
        const response = await fetch('/api/roll-tables/rollpersonens-familj', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setFamilyTable(data.table);
        } else {
          console.error('Failed to fetch family table');
        }
      } catch (error) {
        console.error('Error fetching family table:', error);
      } finally {
        setFamilyTableLoading(false);
      }
    };

    fetchFamilyTable();
  }, [token]);

  // Load saved state or initialize rolling
  useEffect(() => {
    if (savedState) {
      // Restore from saved state
      if (savedState.siblings) setSiblings(savedState.siblings);
      if (savedState.olderLittersRoll) setOlderLittersRoll(savedState.olderLittersRoll);
      if (savedState.youngerLittersRoll) setYoungerLittersRoll(savedState.youngerLittersRoll);
      if (savedState.olderLitters !== undefined) setOlderLitters(savedState.olderLitters);
      if (savedState.youngerLitters !== undefined) setYoungerLitters(savedState.youngerLitters);
      if (savedState.rollResult) setRollResult(savedState.rollResult);
      if (savedState.parentStatus) setParentStatus(savedState.parentStatus);
      if (savedState.rollDetails) setRollDetails(savedState.rollDetails);
      if (savedState.motherAgeResult) setMotherAgeResult(savedState.motherAgeResult);
      if (savedState.fatherAgeResult) setFatherAgeResult(savedState.fatherAgeResult);
      if (savedState.remainingRerolls !== undefined) setRemainingRerolls(savedState.remainingRerolls);
      if (savedState.remainingFreeSelections !== undefined) setRemainingFreeSelections(savedState.remainingFreeSelections);
      if (savedState.olderRerollUsed !== undefined) setOlderRerollUsed(savedState.olderRerollUsed);
      if (savedState.youngerRerollUsed !== undefined) setYoungerRerollUsed(savedState.youngerRerollUsed);
      if (savedState.parentRerollUsed !== undefined) setParentRerollUsed(savedState.parentRerollUsed);
      setInitialRoll(true);
    } else if (!initialRoll) {
      // No saved state, do initial rolls
      handleRollSiblings();
      handleRollParents();
      setInitialRoll(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedState, rerolls]);

  // Save state whenever it changes (using ref to avoid infinite loop)
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    if (initialRoll && onStateChangeRef.current) {
      const stateToSave = {
        familyState: {
          siblings,
          olderLittersRoll,
          youngerLittersRoll,
          olderLitters,
          youngerLitters,
          rollResult,
          parentStatus,
          rollDetails,
          motherAgeResult,
          fatherAgeResult,
          remainingRerolls,
          remainingFreeSelections,
          olderRerollUsed,
          youngerRerollUsed,
          parentRerollUsed
        }
      };
      onStateChangeRef.current(stateToSave);
    }
  }, [siblings, olderLittersRoll, youngerLittersRoll, olderLitters, youngerLitters, rollResult, parentStatus, rollDetails, motherAgeResult, fatherAgeResult, remainingRerolls, remainingFreeSelections, olderRerollUsed, youngerRerollUsed, parentRerollUsed, initialRoll]);

  // Helper function to roll and calculate litters (extracted for reuse)
  const rollLittersHelper = (litterFormula, characterAge) => {
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
  };

  const handleRollSiblings = () => {
    if (!ageData || !ageData.age) {
      return;
    }

    const formula = getSiblingFormula();
    const characterActualAge = ageData.age;

    // Calculate character's apparent age from actual age
    const characterApparentAge = calculateApparentAge(characterActualAge, raceCategory);

    // Roll for older siblings (using apparent age)
    const olderResult = rollLittersHelper(formula.numberOfLitters, characterApparentAge);
    setOlderLittersRoll(olderResult.littersRollData);
    setOlderLitters(olderResult.calculatedLitters);

    // Roll for younger siblings (using apparent age)
    const youngerResult = rollLittersHelper(formula.numberOfLitters, characterApparentAge);
    setYoungerLittersRoll(youngerResult.littersRollData);
    setYoungerLitters(youngerResult.calculatedLitters);

    // Generate siblings for each litter
    const allSiblings = [];
    let litterCounter = 1;

    // Generate older siblings first
    for (let i = 0; i < olderResult.calculatedLitters; i++) {
      // Calculate litter size
      const litterSize = evaluateLitterSize(formula.litterSize);
      
      // Calculate apparent age once per litter (all siblings in same litter have same apparent age)
      const siblingApparentAge = Math.max(0, Math.floor(evaluateSiblingFormula(formula.olderSiblingAgeFormula, characterApparentAge)));
      
      // Convert apparent age back to actual age (random value within the matching range)
      const siblingActualAge = Math.max(0, calculateActualAgeFromApparent(siblingApparentAge, raceCategory));
      
      // Create siblings in this litter
      for (let j = 0; j < litterSize; j++) {
        // Determine gender (roll for each sibling, not per litter)
        const gender = determineGender(formula.genderFormula);
        
        allSiblings.push({
          litter: litterCounter,
          position: j + 1,
          age: siblingActualAge,
          gender,
          isOlder: true,
          ageFormula: formula.olderSiblingAgeFormula,
          relationship: 'Äldre syskon'
        });
      }
      litterCounter++;
    }

    // Generate younger siblings
    for (let i = 0; i < youngerResult.calculatedLitters; i++) {
      // Calculate litter size
      const litterSize = evaluateLitterSize(formula.litterSize);
      
      // Calculate apparent age once per litter (all siblings in same litter have same apparent age)
      // Ensure age cannot be negative (minimum 0)
      const calculatedApparentAge = evaluateSiblingFormula(formula.youngerSiblingAgeFormula, characterApparentAge);
      const siblingApparentAge = Math.max(0, Math.floor(calculatedApparentAge || 0));
      
      // Convert apparent age back to actual age (random value within the matching range)
      const siblingActualAge = Math.max(0, calculateActualAgeFromApparent(siblingApparentAge, raceCategory));
      
      // Create siblings in this litter
      for (let j = 0; j < litterSize; j++) {
        // Determine gender (roll for each sibling, not per litter)
        const gender = determineGender(formula.genderFormula);
        
        allSiblings.push({
          litter: litterCounter,
          position: j + 1,
          age: siblingActualAge,
          gender,
          isOlder: false,
          ageFormula: formula.youngerSiblingAgeFormula,
          relationship: 'Yngre syskon'
        });
      }
      litterCounter++;
    }

    setSiblings(allSiblings);
  };

  const handleRollParents = () => {
    if (!ageData || !ageData.age) {
      return;
    }

    const config = getParentFormula();
    const characterActualAge = ageData.age;

    // Calculate character's apparent age from actual age
    const characterApparentAge = calculateApparentAge(characterActualAge, raceCategory);

    // Evaluate the formula (this will roll dice and calculate)
    const result = Math.floor(evaluateParentFormula(config.formula, characterApparentAge));
    const status = determineParentStatus(result, config.table);

    // Store roll details for display
    const details = {
      formula: config.formula,
      apparentAge: characterApparentAge,
      result,
      status
    };

    setRollResult(result);
    setParentStatus(status);
    setRollDetails(details);

    // Calculate parent age for each living parent
    // Find oldest sibling's apparent age (or use character's if no older siblings)
    let oldestSiblingOrCharacterApparentAge = characterApparentAge;
    if (siblings.length > 0) {
      // Find oldest sibling (highest age)
      const oldestSibling = siblings.reduce((oldest, sibling) => {
        return sibling.age > oldest.age ? sibling : oldest;
      }, siblings[0]);
      
      // Convert oldest sibling's actual age to apparent age
      oldestSiblingOrCharacterApparentAge = calculateApparentAge(oldestSibling.age, raceCategory);
    }

    // Calculate parent age using formula
    const parentAgeFormula = getParentAgeFormula();
    
    // Calculate age for each living parent separately
    const calculateParentAge = () => {
      const parentAgeCalculation = evaluateParentAgeFormula(parentAgeFormula, oldestSiblingOrCharacterApparentAge);
      const parentApparentAge = Math.max(0, parentAgeCalculation.result);
      // Convert apparent age to actual age using the race category's formula or table
      const parentActualAge = Math.max(0, calculateActualAgeFromApparent(parentApparentAge, raceCategory));
      
      return {
        formula: parentAgeFormula,
        baseAge: oldestSiblingOrCharacterApparentAge,
        apparentAge: parentApparentAge,
        actualAge: parentActualAge,
        rollDetails: parentAgeCalculation.rollDetails
      };
    };

    // Calculate age for each living parent based on status
    if (status === 'both parents alive' || status === 'mother alive') {
      // Calculate mother's age
      const motherAge = calculateParentAge();
      setMotherAgeResult(motherAge);
    } else {
      setMotherAgeResult(null);
    }

    if (status === 'both parents alive' || status === 'father alive') {
      // Calculate father's age
      const fatherAge = calculateParentAge();
      setFatherAgeResult(fatherAge);
    } else {
      setFatherAgeResult(null);
    }

  };

  const handleRerollOlder = () => {
    if (!ageData || !ageData.age) {
      return;
    }

    // Check if we need to consume a reroll token (first time only)
    if (!olderRerollUsed && remainingRerolls <= 0) {
      return;
    }

    const formula = getSiblingFormula();
    const characterActualAge = ageData.age;

    // Calculate character's apparent age from actual age
    const characterApparentAge = calculateApparentAge(characterActualAge, raceCategory);

    // Consume a reroll token only on first use
    if (!olderRerollUsed && remainingRerolls > 0) {
      setRemainingRerolls(prev => prev - 1);
      setOlderRerollUsed(true);
    }

    // Reroll older siblings (using apparent age)
    const olderResult = rollLittersHelper(formula.numberOfLitters, characterApparentAge);
    setOlderLittersRoll(olderResult.littersRollData);
    setOlderLitters(olderResult.calculatedLitters);

    // Preserve existing younger siblings (don't reroll their litter sizes or genders)
    const existingYoungerSiblings = siblings.filter(s => !s.isOlder);

    // Generate new older siblings
    const newOlderSiblings = [];
    let litterCounter = 1;

    for (let i = 0; i < olderResult.calculatedLitters; i++) {
      const litterSize = evaluateLitterSize(formula.litterSize);
      
      // Calculate apparent age once per litter (all siblings in same litter have same apparent age)
      const siblingApparentAge = Math.max(0, Math.floor(evaluateSiblingFormula(formula.olderSiblingAgeFormula, characterApparentAge)));
      
      // Convert apparent age back to actual age (random value within the matching range)
      const siblingActualAge = Math.max(0, calculateActualAgeFromApparent(siblingApparentAge, raceCategory));
      
      for (let j = 0; j < litterSize; j++) {
        const gender = determineGender(formula.genderFormula);
        
        newOlderSiblings.push({
          litter: litterCounter,
          position: j + 1,
          age: siblingActualAge,
          gender,
          isOlder: true,
          ageFormula: formula.olderSiblingAgeFormula,
          relationship: 'Äldre syskon'
        });
      }
      litterCounter++;
    }

    // Preserve younger siblings exactly as they are (they already have correct litter numbers)
    // Combine: new older siblings + preserved younger siblings
    const allSiblings = [...newOlderSiblings, ...existingYoungerSiblings];

    setSiblings(allSiblings);
  };

  const handleRerollYounger = () => {
    if (!ageData || !ageData.age) {
      return;
    }

    // Check if we need to consume a reroll token (first time only)
    if (!youngerRerollUsed && remainingRerolls <= 0) {
      return;
    }

    const formula = getSiblingFormula();
    const characterActualAge = ageData.age;

    // Calculate character's apparent age from actual age
    const characterApparentAge = calculateApparentAge(characterActualAge, raceCategory);

    // Consume a reroll token only on first use
    if (!youngerRerollUsed && remainingRerolls > 0) {
      setRemainingRerolls(prev => prev - 1);
      setYoungerRerollUsed(true);
    }

    // Reroll younger siblings (using apparent age)
    const youngerResult = rollLittersHelper(formula.numberOfLitters, characterApparentAge);
    setYoungerLittersRoll(youngerResult.littersRollData);
    setYoungerLitters(youngerResult.calculatedLitters);

    // Preserve existing older siblings (don't reroll their litter sizes or genders)
    const existingOlderSiblings = siblings.filter(s => s.isOlder);

    // Find the maximum litter number from older siblings to continue numbering
    const maxOlderLitter = existingOlderSiblings.length > 0
      ? Math.max(...existingOlderSiblings.map(s => s.litter))
      : 0;

    // Generate new younger siblings
    const newYoungerSiblings = [];
    let litterCounter = maxOlderLitter + 1;

    for (let i = 0; i < youngerResult.calculatedLitters; i++) {
      const litterSize = evaluateLitterSize(formula.litterSize);
      
      // Calculate apparent age once per litter (all siblings in same litter have same apparent age)
      // Ensure age cannot be negative (minimum 0)
      const calculatedApparentAge = evaluateSiblingFormula(formula.youngerSiblingAgeFormula, characterApparentAge);
      const siblingApparentAge = Math.max(0, Math.floor(calculatedApparentAge || 0));
      
      // Convert apparent age back to actual age (random value within the matching range)
      const siblingActualAge = Math.max(0, calculateActualAgeFromApparent(siblingApparentAge, raceCategory));
      
      for (let j = 0; j < litterSize; j++) {
        const gender = determineGender(formula.genderFormula);
        
        newYoungerSiblings.push({
          litter: litterCounter,
          position: j + 1,
          age: siblingActualAge,
          gender,
          isOlder: false,
          ageFormula: formula.youngerSiblingAgeFormula,
          relationship: 'Yngre syskon'
        });
      }
      litterCounter++;
    }

    // Combine: preserved older siblings + new younger siblings
    const allSiblings = [...existingOlderSiblings, ...newYoungerSiblings];

    setSiblings(allSiblings);
  };

  const handleRerollParents = () => {
    if (!ageData || !ageData.age) {
      return;
    }

    // Check if we need to consume a reroll token (first time only)
    if (!parentRerollUsed && remainingRerolls <= 0) {
      return;
    }

    // Consume a reroll token only on first use
    if (!parentRerollUsed && remainingRerolls > 0) {
      setRemainingRerolls(prev => prev - 1);
      setParentRerollUsed(true);
    }

    handleRollParents();
  };

  // Roll table handlers
  const handleFamilyTableRoll = async (rollResult) => {
    setFamilyTableRollResult(rollResult);
    // Process effect if entry has one
    if (rollResult.entry?.effect) {
      // TODO: Process effect using effectHandlers
      console.log('Roll table effect:', rollResult.entry.effect);
    }
  };

  const handleFamilyTableReroll = async () => {
    // Free reroll is only available when 100 was rolled (secondary table is open)
    // Check if the original roll was 100 by checking if secondary view should be open
    const was100Roll = familyTableRollResult !== null && 
                       familyTable && 
                       familyTable.entries && 
                       familyTable.entries.length > 0 && 
                       (() => {
                         const maxEntry = familyTable.entries.reduce((max, entry) => 
                           entry.maxValue > max.maxValue ? entry : max
                         );
                         return familyTableRollResult.rollValue >= maxEntry.minValue && 
                                familyTableRollResult.rollValue <= maxEntry.maxValue;
                       })();
    
    const isFreeReroll = !familyTableFreeRerollUsed && 
                         familyTableRollResult !== null && 
                         was100Roll;
    
    // If not free reroll, check if we have tokens
    if (!isFreeReroll && remainingRerolls <= 0) return;
    
    // Only consume token if not free reroll
    if (!isFreeReroll) {
      setRemainingRerolls(prev => prev - 1);
    }
    
    // Mark free reroll as used
    if (isFreeReroll) {
      setFamilyTableFreeRerollUsed(true);
    }
    
    // Roll again
    if (familyTable) {
      const diceResult = rollDiceForTable(familyTable.dice || '1T100');
      const entry = findEntryInTable(diceResult.value, familyTable.entries);
      await handleFamilyTableRoll({
        rollValue: diceResult.value,
        entry,
        diceDetails: diceResult.details
      });
      
      // Check if the new roll triggers a secondary roll
      if (familyTable.entries && familyTable.entries.length > 0) {
        const maxEntry = familyTable.entries.reduce((max, entry) => 
          entry.maxValue > max.maxValue ? entry : max
        );
        // If the new roll is the maximum value, open/keep secondary roll view
        if (diceResult.value >= maxEntry.minValue && diceResult.value <= maxEntry.maxValue) {
          if (!showFamilyTableSecondaryView) {
            setShowFamilyTableSecondaryView(true);
          }
        }
        // Note: We don't close the secondary roll view if it's already open, even if the new roll doesn't trigger it
        // This allows the user to keep the secondary roll result even after rerolling the first roll
      }
    }
  };


  const handleFamilyTableUseFreeChoice = (result) => {
    // Free choice - player selected an entry
    if (result && result.entry && remainingFreeSelections > 0) {
      setRemainingFreeSelections(prev => prev - 1);
      setFamilyTableRollResult(result);
      // Process effect if entry has one
      if (result.entry?.effect) {
        // TODO: Process effect using effectHandlers
        console.log('Roll table effect:', result.entry.effect);
      }
    }
  };

  const handleFamilyTableSecondaryRoll = () => {
    // Trigger opening the secondary roll view
    setShowFamilyTableSecondaryView(true);
  };

  const handleFamilyTableSecondaryRollResult = async (rollResult) => {
    setFamilyTableSecondaryRollResult(rollResult);
    // Process effect if entry has one
    if (rollResult.entry?.effect) {
      // TODO: Process effect using effectHandlers
      console.log('Secondary roll table effect:', rollResult.entry.effect);
    }
  };

  const handleFamilyTableSecondaryReroll = async () => {
    if (remainingRerolls <= 0) return;
    
    setRemainingRerolls(prev => prev - 1);
    
    // Roll again on secondary table
    if (familyTable) {
      const diceResult = rollDiceForTable(familyTable.dice || '1T100');
      const entry = findEntryInTable(diceResult.value, familyTable.entries);
      await handleFamilyTableSecondaryRollResult({
        rollValue: diceResult.value,
        entry,
        diceDetails: diceResult.details
      });
    }
  };

  const handleFamilyTableSecondaryUseFreeChoice = (result) => {
    // Free choice - player selected an entry for secondary roll
    if (result && result.entry && remainingFreeSelections > 0) {
      setRemainingFreeSelections(prev => prev - 1);
      setFamilyTableSecondaryRollResult(result);
      // Process effect if entry has one
      if (result.entry?.effect) {
        // TODO: Process effect using effectHandlers
        console.log('Secondary roll table effect:', result.entry.effect);
      }
    }
  };

  const rollDiceForTable = (diceString) => {
    const normalized = diceString.trim().toUpperCase();
    
    const t100Match = normalized.match(/^(\d+)T100$/);
    if (t100Match) {
      const count = parseInt(t100Match[1], 10);
      if (count === 1) {
        const result = rollT100();
        return { value: result, details: null };
      } else {
        let total = 0;
        for (let i = 0; i < count; i++) {
          total += rollT100();
        }
        return { value: total, details: null };
      }
    }
    
    const t6Match = normalized.match(/^(\d+)T6$/);
    if (t6Match) {
      const count = parseInt(t6Match[1], 10);
      const rolls = rollT6Multiple(count);
      return { value: rolls.reduce((a, b) => a + b, 0), details: { rolls } };
    }
    
    const t10Match = normalized.match(/^(\d+)T10$/);
    if (t10Match) {
      const count = parseInt(t10Match[1], 10);
      let total = 0;
      for (let i = 0; i < count; i++) {
        total += rollT10();
      }
      return { value: total, details: null };
    }
    
    const obT6Match = normalized.match(/^OB(\d+)T6$/);
    if (obT6Match) {
      const count = parseInt(obT6Match[1], 10);
      const result = rollObT6WithDetails(count);
      return { value: result.total, details: result };
    }
    
    return { value: 0, details: null };
  };

  const findEntryInTable = (rollValue, entries) => {
    if (!entries || !Array.isArray(entries)) return null;
    return entries.find(entry => 
      rollValue >= entry.minValue && rollValue <= entry.maxValue
    ) || null;
  };

  const handleConfirm = () => {
    // Apply pending free choice if there is one for primary roll
    let finalFamilyTableRoll = familyTableRollResult;
    if (pendingFamilyTableFreeChoice && remainingFreeSelections > 0) {
      finalFamilyTableRoll = pendingFamilyTableFreeChoice;
      setRemainingFreeSelections(prev => prev - 1);
      // Process effect if entry has one
      if (pendingFamilyTableFreeChoice.entry?.effect) {
        // TODO: Process effect using effectHandlers
        console.log('Roll table effect:', pendingFamilyTableFreeChoice.entry.effect);
      }
    }
    
    // Apply pending free choice if there is one for secondary roll
    let finalFamilyTableSecondaryRoll = familyTableSecondaryRollResult;
    if (pendingFamilyTableSecondaryFreeChoice && remainingFreeSelections > 0) {
      finalFamilyTableSecondaryRoll = pendingFamilyTableSecondaryFreeChoice;
      setRemainingFreeSelections(prev => prev - 1);
      // Process effect if entry has one
      if (pendingFamilyTableSecondaryFreeChoice.entry?.effect) {
        // TODO: Process effect using effectHandlers
        console.log('Secondary roll table effect:', pendingFamilyTableSecondaryFreeChoice.entry.effect);
      }
    }
    
    onConfirm({
      siblings: siblings,
      olderLitters: olderLitters,
      youngerLitters: youngerLitters,
      siblingFormula: getSiblingFormula(),
      parentStatus: parentStatus,
      parentRollResult: rollResult,
      parentFormula: getParentFormula().formula,
      parentTable: getParentFormula().table,
      familyTableRoll: finalFamilyTableRoll,
      familyTableSecondaryRoll: finalFamilyTableSecondaryRoll
    });
  };

  const siblingFormula = getSiblingFormula();
  const parentConfig = getParentFormula();

  return (
    <>
      <DialogTitle>
        Familj
        {(olderLittersRoll || youngerLittersRoll) && (
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
            {olderLitters} äldre kullar, {youngerLitters} yngre kullar
          </Typography>
        )}
        {remainingRerolls > 0 && (
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
            {remainingRerolls} omkastningar kvar
          </Typography>
        )}
      </DialogTitle>
      <DialogContent sx={{ minWidth: 0, overflow: 'visible' }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'column', md: 'row' }, gap: 3 }}>
          {/* Siblings Column - Left */}
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 100%', md: '1 1 50%' }, minWidth: 0 }}>
            <Typography variant="h6" gutterBottom>
              Syskon
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Syskon beräknas baserat på rasens kategori-formel. Antal kullar: {siblingFormula.numberOfLitters} (för äldre och yngre separat), Kullstorlek: {siblingFormula.litterSize}.
            </Alert>

            {(olderLittersRoll || youngerLittersRoll) && (
              <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {olderLittersRoll && (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2">
                        Äldre syskon: {siblingFormula.numberOfLitters}
                      </Typography>
                      {(remainingRerolls > 0 || olderRerollUsed) && (
                        <Tooltip title={
                          olderRerollUsed 
                            ? "Återkasta äldre syskon (gratis)" 
                            : `Återkasta äldre syskon (${remainingRerolls} kvar)`
                        }>
                          <IconButton
                            size="small"
                            onClick={handleRerollOlder}
                            color="primary"
                          >
                            <RefreshIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {olderLittersRoll.type === 'Ob' ? 'Ob' : ''}{olderLittersRoll.diceCount}T6
                        </Typography>
                        <Typography variant="h6">
                          {olderLittersRoll.type === 'Ob' ? olderLittersRoll.roll.total : olderLittersRoll.baseResult}
                          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            {olderLittersRoll.type === 'Ob' ? (
                              <>
                                ({olderLittersRoll.roll.initialRolls.join(', ')}
                                {olderLittersRoll.roll.extraRolls.length > 0 && ` → ${olderLittersRoll.roll.extraRolls.join(', ')}`})
                              </>
                            ) : (
                              `(${olderLittersRoll.rolls.join(', ')})`
                            )}
                          </Typography>
                        </Typography>
                      </Box>
                      {olderLittersRoll.modifier && (
                        <>
                          <Typography variant="h6">{olderLittersRoll.modifier}</Typography>
                          <Typography variant="h6">=</Typography>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Efter modifier</Typography>
                            <Typography variant="h6">{olderLittersRoll.finalResult}</Typography>
                          </Box>
                        </>
                      )}
                      <Typography variant="h6">=</Typography>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Totalt</Typography>
                        <Typography variant="h5" color="primary.main" sx={{ fontWeight: 'bold' }}>
                          {olderLitters}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                )}

                {youngerLittersRoll && (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2">
                        Yngre syskon: {siblingFormula.numberOfLitters}
                      </Typography>
                      {(remainingRerolls > 0 || youngerRerollUsed) && (
                        <Tooltip title={
                          youngerRerollUsed 
                            ? "Återkasta yngre syskon (gratis)" 
                            : `Återkasta yngre syskon (${remainingRerolls} kvar)`
                        }>
                          <IconButton
                            size="small"
                            onClick={handleRerollYounger}
                            color="primary"
                          >
                            <RefreshIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {youngerLittersRoll.type === 'Ob' ? 'Ob' : ''}{youngerLittersRoll.diceCount}T6
                        </Typography>
                        <Typography variant="h6">
                          {youngerLittersRoll.type === 'Ob' ? youngerLittersRoll.roll.total : youngerLittersRoll.baseResult}
                          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            {youngerLittersRoll.type === 'Ob' ? (
                              <>
                                ({youngerLittersRoll.roll.initialRolls.join(', ')}
                                {youngerLittersRoll.roll.extraRolls.length > 0 && ` → ${youngerLittersRoll.roll.extraRolls.join(', ')}`})
                              </>
                            ) : (
                              `(${youngerLittersRoll.rolls.join(', ')})`
                            )}
                          </Typography>
                        </Typography>
                      </Box>
                      {youngerLittersRoll.modifier && (
                        <>
                          <Typography variant="h6">{youngerLittersRoll.modifier}</Typography>
                          <Typography variant="h6">=</Typography>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Efter modifier</Typography>
                            <Typography variant="h6">{youngerLittersRoll.finalResult}</Typography>
                          </Box>
                        </>
                      )}
                      <Typography variant="h6">=</Typography>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Totalt</Typography>
                        <Typography variant="h5" color="secondary.main" sx={{ fontWeight: 'bold' }}>
                          {youngerLitters}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                )}
              </Box>
            )}

            {siblings.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography variant="body1" color="text.secondary">
                  Inga syskon beräknade. Klicka på återkastning för att rulla.
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Kull</strong></TableCell>
                      <TableCell><strong>Position</strong></TableCell>
                      <TableCell><strong>Ålder</strong></TableCell>
                      <TableCell><strong>Kön</strong></TableCell>
                      <TableCell><strong>Typ</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {siblings.map((sibling, index) => (
                      <TableRow key={index}>
                        <TableCell>{sibling.litter}</TableCell>
                        <TableCell>{sibling.position}</TableCell>
                        <TableCell>{sibling.age}</TableCell>
                        <TableCell>
                          <Chip 
                            label={sibling.gender === 'male' ? 'Man' : 'Kvinna'}
                            size="small"
                            color={sibling.gender === 'male' ? 'primary' : 'secondary'}
                          />
                        </TableCell>
                        <TableCell>{sibling.relationship}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
          {/* Parents Column - Right */}
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 100%', md: '1 1 50%' }, minWidth: 0 }}>
            <Typography variant="h6" gutterBottom>
              Föräldrar
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              {/* Left: Parent Status */}
              <Box sx={{ flex: '1 1 50%', minWidth: 0 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Föräldrars status beräknas baserat på rasens kategori-formel: {parentConfig.formula.replace("characterApparentAge", "skenbar ålder")}</Alert>

                {rollDetails && (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1">
                        Status
                      </Typography>
                      {(remainingRerolls > 0 || parentRerollUsed) && (
                        <Tooltip title={
                          parentRerollUsed 
                            ? "Återkasta (gratis)" 
                            : `Återkasta (${remainingRerolls} kvar)`
                        }>
                          <IconButton
                            size="small"
                            onClick={handleRerollParents}
                            color="primary"
                          >
                            <RefreshIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Formel: {parentConfig.formula.replace(/characterApparentAge/g, rollDetails.apparentAge.toString())}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Synlig ålder: {rollDetails.apparentAge}
                      </Typography>
                      <Typography variant="h6" sx={{ mt: 1 }}>
                        Slag: {rollDetails.result}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Status:
                      </Typography>
                      <Chip
                        label={getStatusLabel(rollDetails.status)}
                        color={getStatusColor(rollDetails.status)}
                        size="medium"
                      />
                    </Box>

                    {/* Show table ranges */}
                    <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        Tabell:
                      </Typography>
                      {parentConfig.table.map((range, index) => (
                        <Typography key={index} variant="caption" display="block" color="text.secondary">
                          {range.min}-{range.max}: {getStatusLabel(range.result)}
                        </Typography>
                      ))}
                    </Box>
                  </Paper>
                )}

                {!rollDetails && (
                  <Box textAlign="center" py={4}>
                    <Typography variant="body1" color="text.secondary">
                      Klicka på återkastning för att rulla.
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Right: Living Parent Age */}
              <Box sx={{ flex: '1 1 50%', minWidth: 0 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Föräldrars ålder beräknas baserat på: {getParentAgeFormula().replace("oldestSiblingOrCharacterApparentAge", "äldsta syskon eller karaktär")}
                </Alert>

                {rollDetails ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {motherAgeResult && (
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle1" sx={{ mb: 2 }}>
                          Mors ålder
                        </Typography>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Basålder (äldsta syskon eller karaktär): {motherAgeResult.baseAge}
                          </Typography>
                          {motherAgeResult.rollDetails && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Ob{motherAgeResult.rollDetails.diceCount}T6: {motherAgeResult.rollDetails.roll.total}
                                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                  ({motherAgeResult.rollDetails.roll.initialRolls.join(', ')}
                                  {motherAgeResult.rollDetails.roll.extraRolls.length > 0 && ` → ${motherAgeResult.rollDetails.roll.extraRolls.join(', ')}`})
                                </Typography>
                              </Typography>
                            </Box>
                          )}
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Skenbar ålder: {motherAgeResult.apparentAge}
                            </Typography>
                            <Typography variant="h6">
                              Ålder: {motherAgeResult.actualAge}
                            </Typography>
                          </Box>
                        </Box>

                       
                      </Paper>
                    )}

                    {fatherAgeResult && (
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle1" sx={{ mb: 2 }}>
                          Fars ålder
                        </Typography>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Basålder (äldsta syskon eller karaktär): {fatherAgeResult.baseAge}
                          </Typography>
                          {fatherAgeResult.rollDetails && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Ob{fatherAgeResult.rollDetails.diceCount}T6: {fatherAgeResult.rollDetails.roll.total}
                                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                  ({fatherAgeResult.rollDetails.roll.initialRolls.join(', ')}
                                  {fatherAgeResult.rollDetails.roll.extraRolls.length > 0 && ` → ${fatherAgeResult.rollDetails.roll.extraRolls.join(', ')}`})
                                </Typography>
                              </Typography>
                            </Box>
                          )}
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Skenbar ålder: {fatherAgeResult.apparentAge}
                            </Typography>
                            <Typography variant="h6">
                              Ålder: {fatherAgeResult.actualAge}
                            </Typography>
                          </Box>
                        </Box>

                      </Paper>
                    )}

                    {!motherAgeResult && !fatherAgeResult && (
                      <Box textAlign="center" py={4}>
                        <Typography variant="body1" color="text.secondary">
                          Inga levande föräldrar.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box textAlign="center" py={4}>
                    <Typography variant="body1" color="text.secondary">
                      Rulla först status.
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Family Roll Table */}
        {showFamilyTableView && familyTable ? (
          <Box sx={{ mt: 3 }}>
            <RollTableView
              table={familyTable}
              rollResult={familyTableRollResult}
              onRoll={handleFamilyTableRoll}
              onReroll={handleFamilyTableReroll}
              onMinimize={() => setShowFamilyTableView(false)}
              rerolls={remainingRerolls}
              freeChoiceTokens={remainingFreeSelections}
              onUseFreeChoice={handleFamilyTableUseFreeChoice}
              onPendingFreeChoiceChange={setPendingFamilyTableFreeChoice}
              disabled={false}
              isSecondaryRoll={false}
              onSecondaryRoll={handleFamilyTableSecondaryRoll}
              isFreeReroll={!familyTableFreeRerollUsed && familyTableRollResult !== null && showFamilyTableSecondaryView}
            />
            
            {/* Secondary Roll Table (shown when first roll is 100) */}
            {showFamilyTableSecondaryView && familyTable && (
              <Box sx={{ mt: 3 }}>
                <RollTableView
                  table={familyTable}
                  rollResult={familyTableSecondaryRollResult}
                  onRoll={handleFamilyTableSecondaryRollResult}
                  onReroll={handleFamilyTableSecondaryReroll}
                  onMinimize={() => setShowFamilyTableSecondaryView(false)}
                  rerolls={remainingRerolls}
                  freeChoiceTokens={remainingFreeSelections}
                  onUseFreeChoice={handleFamilyTableSecondaryUseFreeChoice}
                  onPendingFreeChoiceChange={setPendingFamilyTableSecondaryFreeChoice}
                  disabled={false}
                  isSecondaryRoll={true}
                />
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ mt: 3 }}>
            {familyTableLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : familyTable ? (
              <RollTableCard
                tableSlug="rollpersonens-familj"
                tableName={familyTable.name}
                onRoll={async () => {
                  const diceResult = rollDiceForTable(familyTable.dice || '1T100');
                  const entry = findEntryInTable(diceResult.value, familyTable.entries);
                  await handleFamilyTableRoll({
                    rollValue: diceResult.value,
                    entry,
                    diceDetails: diceResult.details
                  });
                }}
                onView={() => setShowFamilyTableView(true)}
                rollResult={familyTableRollResult}
                rerolls={(() => {
                  // Check if original roll was 100
                  if (familyTableRollResult && familyTable && familyTable.entries) {
                    const maxEntry = familyTable.entries.reduce((max, entry) => 
                      entry.maxValue > max.maxValue ? entry : max
                    );
                    const was100Roll = familyTableRollResult.rollValue >= maxEntry.minValue && 
                                      familyTableRollResult.rollValue <= maxEntry.maxValue;
                    // If 100 was rolled and free reroll not used, show at least 1
                    if (was100Roll && !familyTableFreeRerollUsed) {
                      return Math.max(remainingRerolls, 1);
                    }
                  }
                  return remainingRerolls;
                })()}
                onReroll={handleFamilyTableReroll}
                freeChoiceTokens={remainingFreeSelections}
                onUseFreeChoice={handleFamilyTableUseFreeChoice}
                disabled={false}
              />
            ) : null}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Avbryt</Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          disabled={
            !parentStatus || 
            // Must have rolled on family table
            (familyTableRollResult === null) ||
            // If secondary roll view is open (rolled 100), must have used free reroll on original table
            (showFamilyTableSecondaryView && !familyTableFreeRerollUsed) ||
            // If secondary roll view is open, must have rolled on it
            (showFamilyTableSecondaryView && familyTableSecondaryRollResult === null)
          }
        >
          Bekräfta
        </Button>
      </DialogActions>
    </>
  );
}

FamilyDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onStateChange: PropTypes.func,
  savedState: PropTypes.object,
  ageData: PropTypes.object,
  selectedRace: PropTypes.object,
  raceCategory: PropTypes.object,
  rerolls: PropTypes.number,
  freeSelections: PropTypes.number
};

