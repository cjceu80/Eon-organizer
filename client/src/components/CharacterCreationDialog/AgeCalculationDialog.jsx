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
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Grid
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CasinoIcon from '@mui/icons-material/Casino';
import DiceRollDisplay from '../DiceRollDisplay';
import { rollObT6WithDetails, rollT6Multiple } from '../../utils/dice';

// Age bonus table
const AGE_BONUS_TABLE = [
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
const getAgeBonus = (age) => {
  if (age < 30) return 0;
  const entry = AGE_BONUS_TABLE.find(range => age >= range.min && age <= range.max);
  return entry ? entry.bonus : 0;
};

// Kroppsbyggnad table
const KROPPSBYGGNAD_TABLE = [
  { min: 5, max: 14, type: 'Klen', skadekolumner: 4 },
  { min: 15, max: 24, type: 'Svag', skadekolumner: 5 },
  { min: 25, max: 38, type: 'Normal', skadekolumner: 6 },
  { min: 39, max: 48, type: 'Kraftig', skadekolumner: 7 },
  { min: 49, max: Infinity, type: 'Massiv', skadekolumner: 8 }
];

// Get kroppsbyggnad for a given value
const getKroppsbyggnad = (value) => {
  const entry = KROPPSBYGGNAD_TABLE.find(range => value >= range.min && value <= range.max);
  return entry || { type: 'Okänd', skadekolumner: 0 };
};

// Kroppsbyggnad weight multiplier table (for varierande vikt)
const KROPPSBYGGNAD_WEIGHT_MULTIPLIER = {
  'Klen': 0.8,
  'Svag': 0.9,
  'Normal': 1,
  'Kraftig': 1.1,
  'Massiv': 1.2
};

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
      return Math.round(apparentAge); // Round to whole number
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
      return Math.round(matchingRange.apparentAge); // Round to whole number (table values should already be integers, but ensure rounding)
    }
  }

  // Default: apparent = actual (already whole number)
  return Math.round(actualAge);
}

export default function AgeCalculationDialog({ 
  onClose, 
  onConfirm,
  onStateChange = null,
  savedState = null,
  attributes,
  rerolls = 0,
  selectedRace = null,
  raceCategory = null,
  gender = 'man',
  varierandeVikt = true
}) {
  const [ageResult, setAgeResult] = useState(null);
  const [kroppsbyggnadResult, setKroppsbyggnadResult] = useState(null);
  const [lengthResult, setLengthResult] = useState(null);
  const [remainingRerolls, setRemainingRerolls] = useState(rerolls);
  const [initialRoll, setInitialRoll] = useState(false);

  // Track if saved state has been loaded to prevent re-loading
  const savedStateLoadedRef = useRef(false);
  
  // Track if we're currently loading saved state to prevent saving during load
  const isLoadingSavedStateRef = useRef(false);

  // Load saved state (only once when dialog opens with saved state)
  useEffect(() => {
    if (savedState && !savedStateLoadedRef.current) {
      isLoadingSavedStateRef.current = true;
      
      // Restore from saved state
      if (savedState.ageResult) setAgeResult(savedState.ageResult);
      if (savedState.kroppsbyggnadResult) setKroppsbyggnadResult(savedState.kroppsbyggnadResult);
      if (savedState.lengthResult) setLengthResult(savedState.lengthResult);
      if (savedState.remainingRerolls !== undefined) setRemainingRerolls(savedState.remainingRerolls);
      
      savedStateLoadedRef.current = true;
      setInitialRoll(true);
      
      // Allow state saving after a brief delay to ensure all state updates are complete
      setTimeout(() => {
        isLoadingSavedStateRef.current = false;
      }, 100);
    } else if (!savedState && !initialRoll) {
      // No saved state, initialize but don't roll
      setInitialRoll(true);
    }
    // Reset flag when dialog closes (savedState becomes null)
    if (!savedState) {
      savedStateLoadedRef.current = false;
      isLoadingSavedStateRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedState, rerolls]);

  // Save state whenever it changes (using ref to avoid infinite loop)
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    // Don't save state while we're loading saved state
    if (isLoadingSavedStateRef.current) {
      return;
    }
    
    if (initialRoll && onStateChangeRef.current) {
      const stateToSave = {
        ageCalculationState: {
          ageResult,
          kroppsbyggnadResult,
          lengthResult,
          remainingRerolls
        }
      };
      onStateChangeRef.current(stateToSave);
    }
  }, [ageResult, kroppsbyggnadResult, lengthResult, remainingRerolls, initialRoll]);
  
  // Recalculate apparent age when raceCategory loads (if age was already calculated)
  // Track the last calculated combination to avoid infinite loops
  const lastCalculatedRef = useRef({ raceCategoryId: null, age: null });
  useEffect(() => {
    if (ageResult?.age && raceCategory && 
        (raceCategory.apparentAgeFormula || (raceCategory.apparentAgeTable && raceCategory.apparentAgeTable.length > 0))) {
      const raceCategoryId = raceCategory._id || raceCategory.id;
      const currentAge = ageResult.age;
      
      // Only recalculate if this is a different raceCategory or age than last time
      if (lastCalculatedRef.current.raceCategoryId !== raceCategoryId || 
          lastCalculatedRef.current.age !== currentAge) {
        const apparentAge = calculateApparentAge(currentAge, raceCategory);
        // Only update if apparent age is different from current
        if (ageResult.apparentAge !== apparentAge) {
          setAgeResult(prev => ({
            ...prev,
            apparentAge
          }));
        }
        lastCalculatedRef.current = { raceCategoryId, age: currentAge };
      }
    }
    // We intentionally don't include ageResult.apparentAge to avoid infinite loops
    // We only recalculate when raceCategory or age changes, not when apparentAge changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raceCategory, ageResult?.age]);

  // Calculate length after kroppsbyggnad is set (since weight depends on kroppsbyggnad type)
  // Note: handleRollKroppsbyggnad now calls handleRollLength directly with shared dice,
  // so this useEffect is mainly for when varierandeVikt, selectedRace, or gender changes
  // Only recalculate if kroppsbyggnad was already rolled
  useEffect(() => {
    if (kroppsbyggnadResult && initialRoll && kroppsbyggnadResult.t6Rolls) {
      // Use the same t6Rolls from kroppsbyggnad to keep them in sync
      handleRollLength(kroppsbyggnadResult.t6Rolls, kroppsbyggnadResult.type);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [varierandeVikt, selectedRace, gender]);

  const handleRollAge = () => {
    // Age calculation uses final attributes (after race modifiers)
    const bilValue = attributes?.BIL || 0;
    const ob3T6Result = rollObT6WithDetails(3);
    const age = bilValue + ob3T6Result.total;
    const bonus = getAgeBonus(age);
    
    // Calculate apparent age from actual age
    const apparentAge = calculateApparentAge(age, raceCategory);
    
    // Debug logging
    console.log('AgeCalculationDialog - handleRollAge:', {
      age,
      apparentAge,
      hasRaceCategory: !!raceCategory,
      hasApparentAgeFormula: !!raceCategory?.apparentAgeFormula,
      hasApparentAgeTable: !!raceCategory?.apparentAgeTable && raceCategory.apparentAgeTable.length > 0
    });

    setAgeResult({
      bil: bilValue,
      ob3T6: ob3T6Result,
      age,
      apparentAge,
      bonus
    });
  };

  const handleRollKroppsbyggnad = () => {
    // Use modified attributes (after race and gender modifications) for kroppsbyggnad calculation
    const styValue = attributes?.STY || 0;
    const talValue = attributes?.TÅL || 0;
    const t6Rolls = rollT6Multiple(3);
    const t6Total = t6Rolls.reduce((a, b) => a + b, 0);
    const total = styValue + talValue + t6Total;
    const kroppsbyggnad = getKroppsbyggnad(total);

    const newKroppsbyggnadResult = {
      sty: styValue,
      tal: talValue,
      t6Rolls,
      t6Total,
      total,
      type: kroppsbyggnad.type,
      skadekolumner: kroppsbyggnad.skadekolumner
    };
    
    setKroppsbyggnadResult(newKroppsbyggnadResult);
    
    // Also recalculate length with the same 3T6 roll
    // Pass the kroppsbyggnad type directly to ensure it's available for weight multiplier
    handleRollLength(t6Rolls, kroppsbyggnad.type);
  };

  const handleRollLength = (sharedT6Rolls = null, kroppsbyggnadTypeParam = null) => {
    // Use modified attributes (after race and gender modifications) for length calculation
    const styValue = attributes?.STY || 0;
    const talValue = attributes?.TÅL || 0;
    // Use shared t6Rolls if provided (from kroppsbyggnad), otherwise roll new ones
    const t6Rolls = sharedT6Rolls || rollT6Multiple(3);
    const t6Total = t6Rolls.reduce((a, b) => a + b, 0);
    
    // Default length and weight constants by gender
    const defaultLength = gender === 'kvinna' ? 135 : 145;
    const defaultWeight = 105; // Same for both genders
    
    // Get race-specific length constant from metadata
    // Check for gender-specific keys first, then fallback to generic or default
    let lengthConstant = defaultLength;
    if (selectedRace?.metadata) {
      const metadata = selectedRace.metadata instanceof Map 
        ? Object.fromEntries(selectedRace.metadata) 
        : selectedRace.metadata;
      
      if (gender === 'kvinna') {
        lengthConstant = metadata.femaleLength || metadata.lengthVariable || defaultLength;
      } else {
        lengthConstant = metadata.maleLength || metadata.lengthVariable || defaultLength;
      }
    }
    
    // Calculate length: STY + TÅL + 3T6 + race length constant
    const length = styValue + talValue + t6Total + lengthConstant;
    
    // Get race-specific weight constant from metadata
    let weightConstant = defaultWeight;
    if (selectedRace?.metadata) {
      const metadata = selectedRace.metadata instanceof Map 
        ? Object.fromEntries(selectedRace.metadata) 
        : selectedRace.metadata;
      
      if (gender === 'kvinna') {
        weightConstant = metadata.femaleWeight || metadata.weightVariable || defaultWeight;
      } else {
        weightConstant = metadata.maleWeight || metadata.weightVariable || defaultWeight;
      }
    }
    
    // Calculate base weight: length - race weight constant
    const baseWeight = length - weightConstant;
    
    // Apply kroppsbyggnad multiplier if varierande vikt is enabled
    // Use kroppsbyggnadTypeParam if provided, otherwise fallback to state
    let finalWeight = baseWeight;
    let weightMultiplier = 1;
    let kroppsbyggnadType = null;
    
    const typeToUse = kroppsbyggnadTypeParam || (kroppsbyggnadResult?.type);
    if (varierandeVikt && typeToUse) {
      kroppsbyggnadType = typeToUse;
      weightMultiplier = KROPPSBYGGNAD_WEIGHT_MULTIPLIER[kroppsbyggnadType] || 1;
      finalWeight = baseWeight * weightMultiplier;
    }

    setLengthResult({
      sty: styValue,
      tal: talValue,
      t6Rolls,
      t6Total,
      lengthConstant,
      length,
      weightConstant,
      baseWeight,
      weightMultiplier,
      kroppsbyggnadType,
      weight: finalWeight
    });
  };

  const handleRerollAge = () => {
    handleRollAge();
    // Only consume reroll token if available
    if (remainingRerolls > 0) {
      setRemainingRerolls(prev => prev - 1);
    }
  };

  const handleRerollKroppsbyggnad = () => {
    // This will also recalculate length since they share the same 3T6
    handleRollKroppsbyggnad();
    // Only consume reroll token if available
    if (remainingRerolls > 0) {
      setRemainingRerolls(prev => prev - 1);
    }
  };

  const handleRerollLength = () => {
    // Reroll both kroppsbyggnad and length together since they share the same 3T6
    handleRollKroppsbyggnad();
    // Only consume reroll token if available
    if (remainingRerolls > 0) {
      setRemainingRerolls(prev => prev - 1);
    }
  };

  const handleConfirm = () => {
    if (!ageResult || !kroppsbyggnadResult || !lengthResult) return;
    onConfirm({
      age: ageResult.age,
      apparentAge: ageResult.apparentAge,
      ageBonus: ageResult.bonus,
      ageRollDetails: {
        bil: ageResult.bil,
        ob3T6: ageResult.ob3T6
      },
      kroppsbyggnad: {
        total: kroppsbyggnadResult.total,
        type: kroppsbyggnadResult.type,
        skadekolumner: kroppsbyggnadResult.skadekolumner
      },
      kroppsbyggnadRollDetails: {
        sty: kroppsbyggnadResult.sty,
        tal: kroppsbyggnadResult.tal,
        t6Rolls: kroppsbyggnadResult.t6Rolls
      },
      length: lengthResult.length,
      weight: lengthResult.weight,
      lengthRollDetails: {
        sty: lengthResult.sty,
        tal: lengthResult.tal,
        t6Rolls: lengthResult.t6Rolls,
        lengthConstant: lengthResult.lengthConstant,
        weightConstant: lengthResult.weightConstant,
        baseWeight: lengthResult.baseWeight,
        weightMultiplier: lengthResult.weightMultiplier,
        kroppsbyggnadType: lengthResult.kroppsbyggnadType
      }
    });
  };

  // Initialize empty results if they don't exist (only once on mount or when attributes change)
  // But don't initialize if we're loading saved state or if saved state has been loaded
  useEffect(() => {
    // Don't initialize if we have saved state or if we're currently loading saved state
    if (savedState || isLoadingSavedStateRef.current || savedStateLoadedRef.current) {
      return;
    }
    
    // Only initialize if the result is completely null/undefined
    if (!ageResult) {
      setAgeResult({
        bil: attributes?.BIL || 0,
        ob3T6: null,
        age: null,
        apparentAge: null,
        bonus: 0
      });
    }
    if (!kroppsbyggnadResult) {
      setKroppsbyggnadResult({
        sty: attributes?.STY || 0,
        tal: attributes?.TÅL || 0,
        t6Rolls: null,
        t6Total: null,
        total: null,
        type: null,
        skadekolumner: null
      });
    }
    if (!lengthResult) {
      setLengthResult({
        sty: attributes?.STY || 0,
        tal: attributes?.TÅL || 0,
        t6Rolls: null,
        t6Total: null,
        length: null,
        weight: null,
        lengthConstant: null,
        weightConstant: null,
        baseWeight: null,
        weightMultiplier: null,
        kroppsbyggnadType: null
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attributes?.BIL, attributes?.STY, attributes?.TÅL, savedState]);
  
  // Use state values or provide defaults for display
  const displayAgeResult = ageResult || {
    bil: attributes?.BIL || 0,
    ob3T6: null,
    age: null,
    apparentAge: null,
    bonus: 0
  };
  
  const displayKroppsbyggnadResult = kroppsbyggnadResult || {
    sty: attributes?.STY || 0,
    tal: attributes?.TÅL || 0,
    t6Rolls: null,
    t6Total: null,
    total: null,
    type: null,
    skadekolumner: null
  };
  
  const displayLengthResult = lengthResult || {
    sty: attributes?.STY || 0,
    tal: attributes?.TÅL || 0,
    t6Rolls: null,
    t6Total: null,
    length: null,
    weight: null,
    lengthConstant: null,
    weightConstant: null,
    baseWeight: null,
    weightMultiplier: null,
    kroppsbyggnadType: null
  };

  return (
    <>
      <DialogTitle>
        Beräkna ålder, kroppsbyggnad, längd och vikt
        {remainingRerolls > 0 && (
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
            {remainingRerolls} omkastningar kvar
          </Typography>
        )}
      </DialogTitle>
      <DialogContent>
                 <Alert severity="info" sx={{ mb: 3 }}>
           Ålder beräknas som BIL + Ob3T6 (efter ras- och könmodifikationer). Kroppsbyggnad beräknas som STY + TÅL + 3T6 (efter ras- och könmodifikationer). Längd beräknas som STY + TÅL + 3T6 + (raslängdkonstant) (efter ras- och könmodifikationer). Vikt beräknas som Längd - (rasviktskonstant){varierandeVikt ? ' × (kroppsbyggnadmultiplikator)' : ''}.
         </Alert>

        <Grid container spacing={3}>
          {/* Left column: Age */}
          <Grid size={{ sm: 12, md: 6 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Ålder
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">BIL</Typography>
                    <Typography variant="h5">{displayAgeResult.bil}</Typography>
                  </Box>
                  <Typography variant="h5">+</Typography>
                  <Box sx={{ flex: '0 0 auto', minWidth: 120 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">Ob3T6</Typography>
                      {!displayAgeResult.ob3T6 ? (
                        <Button
                          size="small"
                          onClick={handleRollAge}
                          color="primary"
                          variant="outlined"
                          startIcon={<CasinoIcon />}
                        >
                          Slå
                        </Button>
                      ) : (
                        <Tooltip title={remainingRerolls > 0 ? `Återkasta Ob3T6 (${remainingRerolls} kvar)` : 'Återkasta Ob3T6'}>
                          <IconButton 
                            size="small" 
                            onClick={handleRerollAge}
                            color="primary"
                          >
                            <RefreshIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                    {displayAgeResult.ob3T6 ? (
                      <Box sx={{ mt: 1 }}>
                        <DiceRollDisplay 
                          rolls={displayAgeResult.ob3T6.initialRolls} 
                          diceType="T6" 
                          size="small"
                        />
                        {displayAgeResult.ob3T6.extraRolls.length > 0 && (
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            → {displayAgeResult.ob3T6.extraRolls.join(', ')}
                          </Typography>
                        )}
                        <Typography variant="h5" sx={{ mt: 0.5 }}>
                          = {displayAgeResult.ob3T6.total}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Klicka på "Slå" för att rulla
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="h5">=</Typography>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Verklig ålder</Typography>
                    <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                      {displayAgeResult.age || '-'}
                    </Typography>
                  </Box>
                  {displayAgeResult.apparentAge !== undefined && displayAgeResult.apparentAge !== displayAgeResult.age && (
                    <>
                      <Typography variant="h5">→</Typography>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Synlig ålder</Typography>
                        <Typography variant="h4" color="secondary.main" sx={{ fontWeight: 'bold' }}>
                          {displayAgeResult.apparentAge}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>
              </Paper>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Valfria enheter baserat på ålder:
              </Typography>
              <Chip 
                label={`+${displayAgeResult.bonus} Valfria enheter`}
                color="success"
                size="large"
                sx={{ fontSize: '1.1rem', fontWeight: 'bold', py: 2 }}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Åldersbonus-tabell:
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Faktisk ålder</strong></TableCell>
                      <TableCell align="right"><strong>Valfria enheter</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {AGE_BONUS_TABLE.map((range, index) => {
                      const isCurrentRange = displayAgeResult.age && displayAgeResult.age >= range.min && displayAgeResult.age <= range.max;
                      const ageRange = range.max === Infinity 
                        ? `${range.min}+` 
                        : `${range.min}-${range.max}`;
                      
                      return (
                        <TableRow 
                          key={index}
                          sx={{
                            bgcolor: isCurrentRange ? 'action.selected' : 'transparent'
                          }}
                        >
                          <TableCell>
                            {isCurrentRange && <strong>{ageRange}</strong>}
                            {!isCurrentRange && ageRange}
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              variant="body2"
                              sx={{ fontWeight: isCurrentRange ? 'bold' : 'normal' }}
                            >
                              +{range.bonus}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Grid>

          {/* Right column: Kroppsbyggnad */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Kroppsbyggnad
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">STY</Typography>
                    <Typography variant="h5">{displayKroppsbyggnadResult.sty}</Typography>
                  </Box>
                  <Typography variant="h5">+</Typography>
                  <Box>
                    <Typography variant="body2" color="text.secondary">TÅL</Typography>
                    <Typography variant="h5">{displayKroppsbyggnadResult.tal}</Typography>
                  </Box>
                  <Typography variant="h5">+</Typography>
                  <Box sx={{ flex: 1, minWidth: 120 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">3T6</Typography>
                      {!displayKroppsbyggnadResult.t6Rolls ? (
                        <Button
                          size="small"
                          onClick={handleRollKroppsbyggnad}
                          color="primary"
                          variant="outlined"
                          startIcon={<CasinoIcon />}
                        >
                          Slå
                        </Button>
                      ) : (
                        <Tooltip title={remainingRerolls > 0 ? `Återkasta 3T6 (${remainingRerolls} kvar)` : 'Återkasta 3T6'}>
                          <IconButton 
                            size="small" 
                            onClick={handleRerollKroppsbyggnad}
                            color="primary"
                          >
                            <RefreshIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                    {displayKroppsbyggnadResult.t6Rolls ? (
                      <Box sx={{ mt: 1 }}>
                        <DiceRollDisplay 
                          rolls={displayKroppsbyggnadResult.t6Rolls} 
                          diceType="T6" 
                          size="small"
                        />
                        <Typography variant="h5" sx={{ mt: 0.5 }}>
                          = {displayKroppsbyggnadResult.t6Total}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Klicka på "Slå" för att rulla
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="h5">=</Typography>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Totalt</Typography>
                    <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                      {displayKroppsbyggnadResult.total || '-'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Resultat:
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip 
                  label={`Kroppsbyggnad: ${displayKroppsbyggnadResult.type || '-'}`}
                  color="primary"
                  size="large"
                  sx={{ fontSize: '1rem', fontWeight: 'bold', py: 1.5 }}
                />
                <Chip 
                  label={`Skadekolumner: ${displayKroppsbyggnadResult.skadekolumner || '-'}`}
                  color="secondary"
                  size="large"
                  sx={{ fontSize: '1rem', fontWeight: 'bold', py: 1.5 }}
                />
              </Box>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Kroppsbyggnad-tabell:
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>STY+TÅL+3T6</strong></TableCell>
                      <TableCell><strong>Kroppsbyggnad</strong></TableCell>
                      <TableCell align="right"><strong>Skadekolumner</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {KROPPSBYGGNAD_TABLE.map((range, index) => {
                      const isCurrentRange = displayKroppsbyggnadResult.total && displayKroppsbyggnadResult.total >= range.min && displayKroppsbyggnadResult.total <= range.max;
                      const valueRange = range.max === Infinity 
                        ? `${range.min}+` 
                        : `${range.min}-${range.max}`;
                      
                      return (
                        <TableRow 
                          key={index}
                          sx={{
                            bgcolor: isCurrentRange ? 'action.selected' : 'transparent'
                          }}
                        >
                          <TableCell>
                            {isCurrentRange && <strong>{valueRange}</strong>}
                            {!isCurrentRange && valueRange}
                          </TableCell>
                          <TableCell>
                            {isCurrentRange && <strong>{range.type}</strong>}
                            {!isCurrentRange && range.type}
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              variant="body2"
                              sx={{ fontWeight: isCurrentRange ? 'bold' : 'normal' }}
                            >
                              {range.skadekolumner}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Grid>

          {/* Length and Weight Section */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Längd och vikt
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">STY</Typography>
                    <Typography variant="h5">{displayLengthResult.sty}</Typography>
                  </Box>
                  <Typography variant="h5">+</Typography>
                  <Box>
                    <Typography variant="body2" color="text.secondary">TÅL</Typography>
                    <Typography variant="h5">{displayLengthResult.tal}</Typography>
                  </Box>
                  <Typography variant="h5">+</Typography>
                  <Box sx={{ flex: 1, minWidth: 120 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">3T6</Typography>
                      {!displayLengthResult.t6Rolls ? (
                        <Button
                          size="small"
                          onClick={() => handleRollLength()}
                          color="primary"
                          variant="outlined"
                          startIcon={<CasinoIcon />}
                        >
                          Slå
                        </Button>
                      ) : (
                        <Tooltip title={remainingRerolls > 0 ? `Återkasta 3T6 (${remainingRerolls} kvar)` : 'Återkasta 3T6'}>
                          <IconButton 
                            size="small" 
                            onClick={handleRerollLength}
                            color="primary"
                          >
                            <RefreshIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                    {displayLengthResult.t6Rolls ? (
                      <Box sx={{ mt: 1 }}>
                        <DiceRollDisplay 
                          rolls={displayLengthResult.t6Rolls} 
                          diceType="T6" 
                          size="small"
                        />
                        <Typography variant="h5" sx={{ mt: 0.5 }}>
                          = {displayLengthResult.t6Total}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Klicka på "Slå" för att rulla
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="h5">+</Typography>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Raslängdkonstant</Typography>
                    <Typography variant="h5">{displayLengthResult.lengthConstant || '-'}</Typography>
                  </Box>
                  <Typography variant="h5">=</Typography>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Längd (cm)</Typography>
                    <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                      {displayLengthResult.length || '-'}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Längd</Typography>
                    <Typography variant="h5">{displayLengthResult.length || '-'}</Typography>
                  </Box>
                  <Typography variant="h5">-</Typography>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Rasviktskonstant</Typography>
                    <Typography variant="h5">{displayLengthResult.weightConstant || '-'}</Typography>
                  </Box>
                  <Typography variant="h5">=</Typography>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Basvikt (kg)</Typography>
                    <Typography variant="h5">{displayLengthResult.baseWeight ? Math.round(displayLengthResult.baseWeight * 10) / 10 : '-'}</Typography>
                  </Box>
                  {varierandeVikt && displayLengthResult.weightMultiplier !== 1 && displayLengthResult.weightMultiplier && (
                    <>
                      <Typography variant="h5">×</Typography>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Multiplikator ({displayLengthResult.kroppsbyggnadType})
                        </Typography>
                        <Typography variant="h5">{displayLengthResult.weightMultiplier}</Typography>
                      </Box>
                      <Typography variant="h5">=</Typography>
                    </>
                  )}
                  <Box>
                    <Typography variant="body2" color="text.secondary">Vikt (kg)</Typography>
                    <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                      {displayLengthResult.weight ? Math.round(displayLengthResult.weight * 10) / 10 : '-'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Avbryt</Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained"
        >
          Bekräfta
        </Button>
      </DialogActions>
    </>
  );
}

AgeCalculationDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onStateChange: PropTypes.func,
  savedState: PropTypes.object,
  attributes: PropTypes.object,
  rerolls: PropTypes.number,
  selectedRace: PropTypes.object,
  raceCategory: PropTypes.object,
  gender: PropTypes.string,
  varierandeVikt: PropTypes.bool
};
