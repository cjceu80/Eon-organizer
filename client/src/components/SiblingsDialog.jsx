import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
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
  Chip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { rollObT6WithDetails, rollT6Multiple, rollT10 } from '../utils/dice';

/**
 * Evaluate a formula string with dice notation and math operations
 * Supports: Ob1T6, 1T6, basic arithmetic, characterAge variable
 */
function evaluateFormula(formula, characterAge = 0) {
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
 * Parse and evaluate litter size formula (may include rounding)
 * Examples: "1", "1T6/2+1" (round up)
 */
function evaluateLitterSize(formula) {
  if (!formula || typeof formula !== 'string') {
    return 1;
  }

  // Check if formula contains division (needs rounding)
  if (formula.includes('/')) {
    const result = evaluateFormula(formula, 0);
    return Math.ceil(result); // Round up
  }

  // Simple number
  const numMatch = formula.match(/^(\d+)$/);
  if (numMatch) {
    return parseInt(numMatch[1], 10);
  }

  // Evaluate as formula
  return Math.ceil(evaluateFormula(formula, 0));
}

/**
 * Calculate apparent age from actual age using the apparentAgeTable
 * @param {Number} actualAge - The actual age
 * @param {Array} apparentAgeTable - Array of {minActualAge, maxActualAge, apparentAge}
 * @returns {Number} - The apparent age
 */
function calculateApparentAge(actualAge, apparentAgeTable) {
  // Default behavior: if no table set, apparent = actual
  if (!apparentAgeTable || apparentAgeTable.length === 0) {
    return actualAge;
  }

  // Find matching range in the table
  const matchingRange = apparentAgeTable.find(
    range => actualAge >= range.minActualAge && actualAge <= range.maxActualAge
  );

  // If no match found, return actual age as fallback
  if (!matchingRange) {
    return actualAge;
  }

  return matchingRange.apparentAge;
}

/**
 * Calculate actual age from apparent age using the apparentAgeTable
 * Since multiple actual age ranges can map to the same apparent age,
 * find all matching ranges and pick a random actual age from them
 * @param {Number} apparentAge - The apparent age
 * @param {Array} apparentAgeTable - Array of {minActualAge, maxActualAge, apparentAge}
 * @returns {Number} - A random actual age within the matching range(s)
 */
function calculateActualAgeFromApparent(apparentAge, apparentAgeTable) {
  // Default behavior: if no table set, actual = apparent
  if (!apparentAgeTable || apparentAgeTable.length === 0) {
    return apparentAge;
  }

  // Find all ranges that match this apparent age
  const matchingRanges = apparentAgeTable.filter(
    range => range.apparentAge === apparentAge
  );

  // If no match found, return apparent age as fallback
  if (matchingRanges.length === 0) {
    return apparentAge;
  }

  // If multiple ranges match, pick one randomly
  const selectedRange = matchingRanges[Math.floor(Math.random() * matchingRanges.length)];
  
  // Pick a random actual age within the selected range
  const minAge = selectedRange.minActualAge;
  const maxAge = selectedRange.maxActualAge;
  return Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;
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

export default function SiblingsDialog({
  open,
  onClose,
  onConfirm,
  ageData = null,
  selectedRace = null,
  raceCategory = null,
  rerolls = 0
}) {
  const [siblings, setSiblings] = useState([]);
  const [olderLittersRoll, setOlderLittersRoll] = useState(null);
  const [youngerLittersRoll, setYoungerLittersRoll] = useState(null);
  const [olderLitters, setOlderLitters] = useState(0);
  const [youngerLitters, setYoungerLitters] = useState(0);
  const [remainingRerolls, setRemainingRerolls] = useState(rerolls);
  const [initialRoll, setInitialRoll] = useState(false);
  const [olderRerollUsed, setOlderRerollUsed] = useState(false); // Track if older reroll has been used
  const [youngerRerollUsed, setYoungerRerollUsed] = useState(false); // Track if younger reroll has been used

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

  // Initialize rolling when dialog opens
  useEffect(() => {
    if (open && !initialRoll) {
      handleRollSiblings();
      setInitialRoll(true);
    }
    if (!open) {
      // Reset when dialog closes
      setInitialRoll(false);
      setSiblings([]);
      setOlderLittersRoll(null);
      setYoungerLittersRoll(null);
      setOlderLitters(0);
      setYoungerLitters(0);
      setRemainingRerolls(rerolls);
      setOlderRerollUsed(false);
      setYoungerRerollUsed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rerolls]);

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
          finalResult,
          formula: litterFormula
        };
      }
    } else {
      // Handle non-Ob formulas
      const result = evaluateFormula(litterFormula, characterAge);
      calculatedLitters = Math.max(0, Math.floor(result));
    }

    return { calculatedLitters, littersRollData };
  };

  const handleRollSiblings = () => {
    if (!ageData || !ageData.age) {
      return;
    }

    const formula = getSiblingFormula();
    const characterActualAge = ageData.age;
    const apparentAgeTable = raceCategory?.apparentAgeTable || [];

    // Calculate character's apparent age from actual age
    const characterApparentAge = calculateApparentAge(characterActualAge, apparentAgeTable);

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
      const siblingApparentAge = Math.max(0, Math.floor(evaluateFormula(formula.olderSiblingAgeFormula, characterApparentAge)));
      
      // Convert apparent age back to actual age (random value within the matching range)
      const siblingActualAge = calculateActualAgeFromApparent(siblingApparentAge, apparentAgeTable);
      
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
      const calculatedApparentAge = evaluateFormula(formula.youngerSiblingAgeFormula, characterApparentAge);
      const siblingApparentAge = Math.max(0, Math.floor(calculatedApparentAge || 0));
      
      // Convert apparent age back to actual age (random value within the matching range)
      const siblingActualAge = calculateActualAgeFromApparent(siblingApparentAge, apparentAgeTable);
      
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

  const handleRerollOlder = () => {
    if (!ageData || !ageData.age) {
      return;
    }

    // Check if we need to consume a reroll token (first time only)
    if (!olderRerollUsed && remainingRerolls <= 0) {
      return; // Can't use if no tokens and hasn't been used before
    }

    const formula = getSiblingFormula();
    const characterActualAge = ageData.age;
    const apparentAgeTable = raceCategory?.apparentAgeTable || [];

    // Calculate character's apparent age from actual age
    const characterApparentAge = calculateApparentAge(characterActualAge, apparentAgeTable);

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
      const siblingApparentAge = Math.max(0, Math.floor(evaluateFormula(formula.olderSiblingAgeFormula, characterApparentAge)));
      
      // Convert apparent age back to actual age (random value within the matching range)
      const siblingActualAge = calculateActualAgeFromApparent(siblingApparentAge, apparentAgeTable);
      
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
      return; // Can't use if no tokens and hasn't been used before
    }

    const formula = getSiblingFormula();
    const characterActualAge = ageData.age;
    const apparentAgeTable = raceCategory?.apparentAgeTable || [];

    // Calculate character's apparent age from actual age
    const characterApparentAge = calculateApparentAge(characterActualAge, apparentAgeTable);

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
      const calculatedApparentAge = evaluateFormula(formula.youngerSiblingAgeFormula, characterApparentAge);
      const siblingApparentAge = Math.max(0, Math.floor(calculatedApparentAge || 0));
      
      // Convert apparent age back to actual age (random value within the matching range)
      const siblingActualAge = calculateActualAgeFromApparent(siblingApparentAge, apparentAgeTable);
      
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

  const handleConfirm = () => {
    onConfirm({
      siblings: siblings,
      olderLitters: olderLitters,
      youngerLitters: youngerLitters,
      formula: getSiblingFormula()
    });
  };

  const formula = getSiblingFormula();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Syskon
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
      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          Syskon beräknas baserat på rasens kategori-formel. Antal kullar: {formula.numberOfLitters} (för äldre och yngre separat), Kullstorlek: {formula.litterSize}.
        </Alert>

        {(olderLittersRoll || youngerLittersRoll) && (
          <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {olderLittersRoll && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2">
                    Äldre syskon: {formula.numberOfLitters}
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
                    <Typography variant="body2" color="text.secondary">Ob{olderLittersRoll.diceCount}T6</Typography>
                    <Typography variant="h6">
                      {olderLittersRoll.roll.total}
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        ({olderLittersRoll.roll.initialRolls.join(', ')}
                        {olderLittersRoll.roll.extraRolls.length > 0 && ` → ${olderLittersRoll.roll.extraRolls.join(', ')}`})
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
                    Yngre syskon: {formula.numberOfLitters}
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
                    <Typography variant="body2" color="text.secondary">Ob{youngerLittersRoll.diceCount}T6</Typography>
                    <Typography variant="h6">
                      {youngerLittersRoll.roll.total}
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        ({youngerLittersRoll.roll.initialRolls.join(', ')}
                        {youngerLittersRoll.roll.extraRolls.length > 0 && ` → ${youngerLittersRoll.roll.extraRolls.join(', ')}`})
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Avbryt</Button>
        <Button onClick={handleConfirm} variant="contained">
          Bekräfta
        </Button>
      </DialogActions>
    </Dialog>
  );
}

SiblingsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  ageData: PropTypes.object,
  selectedRace: PropTypes.object,
  raceCategory: PropTypes.object,
  rerolls: PropTypes.number
};
