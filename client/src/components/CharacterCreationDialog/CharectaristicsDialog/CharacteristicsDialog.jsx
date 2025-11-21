import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Grid
} from '@mui/material';
import { rollT6Multiple } from '../../../utils/dice';
import { useCharacteristicsData } from '../../../hooks/useCharacteristicsData';
import {
  CHARACTERISTICS,
  initializeCharacteristics
} from '../../../utils/characteristics';
import CharacteristicsTableColumn from './CharacteristicsTableColumn';

export default function CharacteristicsDialog({
  onClose,
  onConfirm,
  onStateChange = null,
  savedState = null,
  selectedRace = null
}) {
  const [characteristics, setCharacteristics] = useState({});
  const [specializations, setSpecializations] = useState({});
  const [characteristicRolls, setCharacteristicRolls] = useState({});
  
  // Load characteristics data using custom hook
  const { characteristicsData, loading } = useCharacteristicsData();

  // Initialize characteristics on mount or when selectedRace changes
  useEffect(() => {
    // Load saved state or initialize characteristics
    if (savedState?.characteristicsState) {
      if (savedState.characteristicsState.characteristics) setCharacteristics(savedState.characteristicsState.characteristics);
      if (savedState.characteristicsState.specializations) setSpecializations(savedState.characteristicsState.specializations);
    } else if (!characteristics || Object.keys(characteristics).length === 0) {
      // Only initialize if characteristics is empty
      const initial = initializeCharacteristics(selectedRace, characteristics);
      setCharacteristics(initial);
      setSpecializations({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedState, selectedRace]);

  // Save state whenever it changes (using ref to avoid infinite loop)
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    if (onStateChangeRef.current) {
      const stateToSave = {
        characteristicsState: {
          characteristics,
          specializations
        }
      };
      onStateChangeRef.current(stateToSave);
    }
  }, [characteristics, specializations]);

  const handleRoll = (characteristicKey) => {
    const rolls = rollT6Multiple(3);
    const total = rolls.reduce((a, b) => a + b, 0);
    setCharacteristics(prev => ({
      ...prev,
      [characteristicKey]: total
    }));
    setCharacteristicRolls(prev => ({
      ...prev,
      [characteristicKey]: rolls
    }));
  };

  const handleValueChange = (characteristicKey, value) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      // Allow empty string for manual input
      setCharacteristics(prev => ({
        ...prev,
        [characteristicKey]: ''
      }));
      return;
    }
    // Clamp value between 3 and 18
    const clampedValue = Math.max(3, Math.min(18, numValue));
    setCharacteristics(prev => ({
      ...prev,
      [characteristicKey]: clampedValue
    }));
  };

  const handleSpecializationChange = (characteristicKey, value) => {
    setSpecializations(prev => ({
      ...prev,
      [characteristicKey]: value
    }));
  };


  const handleConfirm = () => {
    // Validate all editable characteristics have values
    const editableChars = CHARACTERISTICS.filter(c => !c.fixed);
    const allValid = editableChars.every(char => {
      const value = characteristics[char.key];
      return typeof value === 'number' && value >= 3 && value <= 18;
    });

    if (!allValid) {
      alert('Alla karaktärsdrag måste ha ett värde mellan 3 och 18!');
      return;
    }

    // Build final characteristics object
    const finalCharacteristics = {};
    CHARACTERISTICS.forEach(char => {
      finalCharacteristics[char.key] = char.fixed ? char.value : characteristics[char.key];
    });

    onConfirm({
      characteristics: finalCharacteristics,
      specializations: { ...specializations }
    });
  };

  if (loading) {
    return (
      <>
        <DialogTitle>Karaktärsdrag</DialogTitle>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <Typography>Laddar...</Typography>
          </Box>
        </DialogContent>
      </>
    );
  }

  return (
    <>
      <DialogTitle>Karaktärsdrag</DialogTitle>
      <DialogContent dividers sx={{ minWidth: 0, overflow: 'auto' }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          Rykte är satt till 5 och Tur är satt till 11. Du kan slå de andra värdena med 3T6 (3-18) eller ange dem manuellt. 
          Vid värde ≥14 kan du ange en hög specialisering och vid värde ≤7 kan du ange en låg specialisering. Klicka på ett exempel för att fylla i textfältet.
        </Alert>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 12 }}>
            <Grid container spacing={2}>
              {/* First column of characteristics */}
              <Grid size={{ xs: 12, md: 6 }}>
                <CharacteristicsTableColumn
                  characteristics={characteristics}
                  characteristicsData={characteristicsData}
                  selectedRace={selectedRace}
                  specializations={specializations}
                  characteristicRolls={characteristicRolls}
                  onValueChange={handleValueChange}
                  onRoll={handleRoll}
                  onSpecializationChange={handleSpecializationChange}
                  startIndex={0}
                  endIndex={Math.ceil(CHARACTERISTICS.length / 2)}
                />
              </Grid>
              
              {/* Second column of characteristics */}
              <Grid size={{ xs: 12, md: 6 }}>
                <CharacteristicsTableColumn
                  characteristics={characteristics}
                  characteristicsData={characteristicsData}
                  selectedRace={selectedRace}
                  specializations={specializations}
                  characteristicRolls={characteristicRolls}
                  onValueChange={handleValueChange}
                  onRoll={handleRoll}
                  onSpecializationChange={handleSpecializationChange}
                  startIndex={Math.ceil(CHARACTERISTICS.length / 2)}
                  endIndex={CHARACTERISTICS.length}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Avbryt</Button>
        <Button onClick={handleConfirm} variant="contained">
          Bekräfta
        </Button>
      </DialogActions>
    </>
  );
}

CharacteristicsDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onStateChange: PropTypes.func,
  savedState: PropTypes.object,
  selectedRace: PropTypes.object
};

