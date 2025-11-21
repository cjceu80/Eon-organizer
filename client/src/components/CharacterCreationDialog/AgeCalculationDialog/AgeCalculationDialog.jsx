import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Grid
} from '@mui/material';
import { rollObT6WithDetails, rollT6Multiple } from '../../../utils/dice';
import { 
  getAgeBonus, 
  getKroppsbyggnad, 
  calculateApparentAge, 
  getRaceConstants,
  KROPPSBYGGNAD_WEIGHT_MULTIPLIER 
} from '../../../utils/ageCalculations';
import AgeSection from './AgeSection';
import KroppsbyggnadSection from './KroppsbyggnadSection';
import LengthWeightSection from './LengthWeightSection';

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
    const bilValue = attributes?.BIL || 0;
    const ob3T6Result = rollObT6WithDetails(3);
    const age = bilValue + ob3T6Result.total;
    const bonus = getAgeBonus(age);
    const apparentAge = calculateApparentAge(age, raceCategory);

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
    
    // Don't auto-roll length - user must click the button manually
  };

  const handleRollLength = (sharedT6Rolls = null, kroppsbyggnadTypeParam = null) => {
    const styValue = attributes?.STY || 0;
    const talValue = attributes?.TÅL || 0;
    const t6Rolls = sharedT6Rolls || rollT6Multiple(3);
    const t6Total = t6Rolls.reduce((a, b) => a + b, 0);
    
    const { lengthConstant, weightConstant } = getRaceConstants(selectedRace, gender);
    const length = styValue + talValue + t6Total + lengthConstant;
    const baseWeight = length - weightConstant;
    
    const typeToUse = kroppsbyggnadTypeParam || kroppsbyggnadResult?.type;
    let finalWeight = baseWeight;
    let weightMultiplier = 1;
    let kroppsbyggnadType = null;
    
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
    // Reroll only length - don't auto-roll kroppsbyggnad
    handleRollLength();
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

  // Initialize empty results if they don't exist
  useEffect(() => {
    if (savedState || isLoadingSavedStateRef.current || savedStateLoadedRef.current) {
      return;
    }
    
    if (!ageResult) {
      setAgeResult({ bil: attributes?.BIL || 0, ob3T6: null, age: null, apparentAge: null, bonus: 0 });
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
          <Grid size={{ sm: 12, md: 6 }}>
            <AgeSection
              ageResult={ageResult}
              bilValue={attributes?.BIL || 0}
              onRoll={handleRollAge}
              onReroll={handleRerollAge}
              remainingRerolls={remainingRerolls}
              raceCategory={raceCategory}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <KroppsbyggnadSection
              kroppsbyggnadResult={kroppsbyggnadResult}
              styValue={attributes?.STY || 0}
              talValue={attributes?.TÅL || 0}
              onRoll={handleRollKroppsbyggnad}
              onReroll={handleRerollKroppsbyggnad}
              remainingRerolls={remainingRerolls}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <LengthWeightSection
              lengthResult={lengthResult}
              styValue={attributes?.STY || 0}
              talValue={attributes?.TÅL || 0}
              onRoll={() => handleRollLength()}
              onReroll={handleRerollLength}
              remainingRerolls={remainingRerolls}
              varierandeVikt={varierandeVikt}
            />
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
