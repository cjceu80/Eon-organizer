import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Grid
} from '@mui/material';
import { rollT6Multiple } from '../../utils/dice';
import CharacteristicsDialogItem from './CharacteristicsDialogItem';

const CHARACTERISTICS = [
  { key: 'Lojalitet', fixed: false },
  { key: 'Heder', fixed: false },
  { key: 'Amor', fixed: false },
  { key: 'Aggression', fixed: false },
  { key: 'Tro', fixed: false },
  { key: 'Generositet', fixed: false },
  { key: 'Rykte', fixed: true, value: 5 },
  { key: 'Tur', fixed: true, value: 11 }
];

// Helper to match characteristic by full name or first 3 characters
const matchesCharacteristic = (charKey, recommendation) => {
  const charLower = charKey.toLowerCase();
  const recLower = recommendation.toLowerCase();
  return charLower === recLower || charLower.substring(0, 3) === recLower.substring(0, 3);
};

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
  const [characteristicsData, setCharacteristicsData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load characteristics data from JSON file
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/copyrighted/characteristics.json');
        if (response.ok) {
          const data = await response.json();
          setCharacteristicsData(data);
        } else {
          console.error('Failed to load characteristics data');
          // Set empty data as fallback
          setCharacteristicsData({
            descriptions: {},
            highSpecializationExamples: {},
            lowSpecializationExamples: {}
          });
        }
      } catch (err) {
        console.error('Error loading characteristics data:', err);
        // Set empty data as fallback
        setCharacteristicsData({
          descriptions: {},
          highSpecializationExamples: {},
          lowSpecializationExamples: {}
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [savedState, selectedRace]);

  // Initialize characteristics on mount or when selectedRace changes
  useEffect(() => {
    // Load saved state or initialize characteristics
    if (savedState?.characteristicsState) {
      if (savedState.characteristicsState.characteristics) setCharacteristics(savedState.characteristicsState.characteristics);
      if (savedState.characteristicsState.specializations) setSpecializations(savedState.characteristicsState.specializations);
    } else if (!characteristics || Object.keys(characteristics).length === 0) {
      // Only initialize if characteristics is empty
      // Get race recommendations if available
      const highCharacteristics = selectedRace?.metadata?.highCharacteristics || [];
      const lowCharacteristics = selectedRace?.metadata?.lowCharacteristics || [];
      
      // Initialize characteristics with fixed values and default non-fixed to 11
      // But apply race recommendations: 13 for high, 8 for low
      const initial = {};
      CHARACTERISTICS.forEach(char => {
        if (char.fixed) {
          initial[char.key] = char.value;
        } else {
          // Check if this characteristic is recommended as high or low
          const isHigh = highCharacteristics.some(rec => matchesCharacteristic(char.key, rec));
          const isLow = lowCharacteristics.some(rec => matchesCharacteristic(char.key, rec));
          
          if (isHigh) {
            initial[char.key] = 13;
          } else if (isLow) {
            initial[char.key] = 8;
          } else {
            initial[char.key] = 11;
          }
        }
      });
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

  const getValue = (characteristicKey) => {
    const char = CHARACTERISTICS.find(c => c.key === characteristicKey);
    if (char?.fixed) {
      return char.value;
    }
    return characteristics[characteristicKey] !== undefined && characteristics[characteristicKey] !== '' 
      ? characteristics[characteristicKey] 
      : 11;
  };

  const hasHighSpecialization = (characteristicKey) => {
    const char = CHARACTERISTICS.find(c => c.key === characteristicKey);
    if (char?.fixed) return false; // Fixed characteristics don't have specializations
    const value = getValue(characteristicKey);
    return typeof value === 'number' && value >= 14;
  };

  const hasLowSpecialization = (characteristicKey) => {
    const char = CHARACTERISTICS.find(c => c.key === characteristicKey);
    if (char?.fixed) return false; // Fixed characteristics don't have specializations
    const value = getValue(characteristicKey);
    return typeof value === 'number' && value <= 7;
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
      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          Rykte är satt till 5 och Tur är satt till 11. Du kan slå de andra värdena med 3T6 (3-18) eller ange dem manuellt. 
          Vid värde ≥14 kan du ange en hög specialisering och vid värde ≤7 kan du ange en låg specialisering. Klicka på ett exempel för att fylla i textfältet.
        </Alert>

        <Grid container spacing={3}>
          {/* Left column: Characteristics in two columns */}
          <Grid size={{ xs: 12, sm: 12 }}>
            <Grid container spacing={2}>
              {/* First column of characteristics */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Karaktärsdrag</strong></TableCell>
                        <TableCell align="right"><strong>Värde</strong></TableCell>
                        <TableCell align="center"><strong>Åtgärder</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {CHARACTERISTICS.slice(0, Math.ceil(CHARACTERISTICS.length / 2)).map(char => {
                    const value = getValue(char.key);
                    const isFixed = char.fixed;
                    const description = characteristicsData?.descriptions?.[char.key] || '';
                    const showHighSpec = hasHighSpecialization(char.key);
                    const showLowSpec = hasLowSpecialization(char.key);
                    const highExamples = characteristicsData?.highSpecializationExamples?.[char.key] || [];
                    const lowExamples = characteristicsData?.lowSpecializationExamples?.[char.key] || [];
                    
                    // Check if this characteristic is recommended as high or low by the race
                    const highCharacteristics = selectedRace?.metadata?.highCharacteristics || [];
                    const lowCharacteristics = selectedRace?.metadata?.lowCharacteristics || [];
                    const isHighRecommended = highCharacteristics.some(rec => matchesCharacteristic(char.key, rec));
                    const isLowRecommended = lowCharacteristics.some(rec => matchesCharacteristic(char.key, rec));

                    return (
                      <CharacteristicsDialogItem
                        key={char.key}
                        char={char}
                        value={value}
                        isFixed={isFixed}
                        description={description}
                        showHighSpec={showHighSpec}
                        showLowSpec={showLowSpec}
                        highExamples={highExamples}
                        lowExamples={lowExamples}
                        isHighRecommended={isHighRecommended}
                        isLowRecommended={isLowRecommended}
                        specializations={specializations}
                        onValueChange={handleValueChange}
                        onRoll={handleRoll}
                        onSpecializationChange={handleSpecializationChange}
                        rolls={characteristicRolls[char.key]}
                      />
                    );
                  })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              
              {/* Second column of characteristics */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Karaktärsdrag</strong></TableCell>
                        <TableCell align="right"><strong>Värde</strong></TableCell>
                        <TableCell align="center"><strong>Åtgärder</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {CHARACTERISTICS.slice(Math.ceil(CHARACTERISTICS.length / 2)).map(char => {
                        const value = getValue(char.key);
                        const isFixed = char.fixed;
                        const description = characteristicsData?.descriptions?.[char.key] || '';
                        const showHighSpec = hasHighSpecialization(char.key);
                        const showLowSpec = hasLowSpecialization(char.key);
                        const highExamples = characteristicsData?.highSpecializationExamples?.[char.key] || [];
                        const lowExamples = characteristicsData?.lowSpecializationExamples?.[char.key] || [];
                        
                        // Check if this characteristic is recommended as high or low by the race
                        const highCharacteristics = selectedRace?.metadata?.highCharacteristics || [];
                        const lowCharacteristics = selectedRace?.metadata?.lowCharacteristics || [];
                        const isHighRecommended = highCharacteristics.some(rec => matchesCharacteristic(char.key, rec));
                        const isLowRecommended = lowCharacteristics.some(rec => matchesCharacteristic(char.key, rec));

                        return (
                          <CharacteristicsDialogItem
                            key={char.key}
                            char={char}
                            value={value}
                            isFixed={isFixed}
                            description={description}
                            showHighSpec={showHighSpec}
                            showLowSpec={showLowSpec}
                            highExamples={highExamples}
                            lowExamples={lowExamples}
                            isHighRecommended={isHighRecommended}
                            isLowRecommended={isLowRecommended}
                            specializations={specializations}
                            onValueChange={handleValueChange}
                            onRoll={handleRoll}
                            onSpecializationChange={handleSpecializationChange}
                          />
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
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

