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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  TextField,
  Alert,
  Grid,
  Chip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { rollT6Multiple } from '../utils/dice';

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

export default function CharacteristicsDialog({
  open,
  onClose,
  onConfirm
}) {
  const [characteristics, setCharacteristics] = useState({});
  const [specializations, setSpecializations] = useState({});
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

    if (open) {
      loadData();
      // Initialize characteristics with fixed values
      const initial = {};
      CHARACTERISTICS.forEach(char => {
        if (char.fixed) {
          initial[char.key] = char.value;
        }
      });
      setCharacteristics(initial);
      setSpecializations({});
    }
  }, [open]);

  const handleRoll = (characteristicKey) => {
    const rolls = rollT6Multiple(3);
    const total = rolls.reduce((a, b) => a + b, 0);
    setCharacteristics(prev => ({
      ...prev,
      [characteristicKey]: total
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
    return characteristics[characteristicKey] || '';
  };

  const hasHighSpecialization = (characteristicKey) => {
    const value = getValue(characteristicKey);
    return typeof value === 'number' && value >= 14;
  };

  const hasLowSpecialization = (characteristicKey) => {
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
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Karaktärsdrag</DialogTitle>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <Typography>Laddar...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Karaktärsdrag</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          Rykte är satt till 5 och Tur är satt till 11. Du kan slå de andra värdena med 3T6 (3-18) eller ange dem manuellt. 
          Vid värde ≥14 kan du ange en hög specialisering och vid värde ≤7 kan du ange en låg specialisering.
        </Alert>

        <Grid container spacing={3}>
          {/* Left column: Characteristics table */}
          <Grid item xs={12} md={7}>
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
                  {CHARACTERISTICS.map(char => {
                    const value = getValue(char.key);
                    const isFixed = char.fixed;
                    const description = characteristicsData?.descriptions?.[char.key] || '';
                    const showHighSpec = hasHighSpecialization(char.key);
                    const showLowSpec = hasLowSpecialization(char.key);
                    const highExamples = characteristicsData?.highSpecializationExamples?.[char.key] || [];
                    const lowExamples = characteristicsData?.lowSpecializationExamples?.[char.key] || [];

                    return (
                      <TableRow key={char.key}>
                        <TableCell>
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              {char.key}
                            </Typography>
                            {description && (
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                {description}
                              </Typography>
                            )}
                            {showHighSpec && highExamples.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" color="success.main" fontWeight="medium" display="block">
                                  Hög specialisering exempel:
                                </Typography>
                                {highExamples.map((example, idx) => (
                                  <Typography key={idx} variant="caption" color="text.secondary" display="block" sx={{ ml: 1 }}>
                                    • {example}
                                  </Typography>
                                ))}
                              </Box>
                            )}
                            {showLowSpec && lowExamples.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" color="error.main" fontWeight="medium" display="block">
                                  Låg specialisering exempel:
                                </Typography>
                                {lowExamples.map((example, idx) => (
                                  <Typography key={idx} variant="caption" color="text.secondary" display="block" sx={{ ml: 1 }}>
                                    • {example}
                                  </Typography>
                                ))}
                              </Box>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ verticalAlign: 'top' }}>
                          <Box sx={{ pt: 0.5 }}>
                            {isFixed ? (
                              <Chip 
                                label={value} 
                                color="default" 
                                variant="outlined"
                                sx={{ fontWeight: 'bold' }}
                              />
                            ) : (
                              <TextField
                                type="number"
                                value={value}
                                onChange={(e) => handleValueChange(char.key, e.target.value)}
                                inputProps={{ min: 3, max: 18 }}
                                size="small"
                                sx={{ width: 80 }}
                                error={value !== '' && (value < 3 || value > 18)}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center" sx={{ verticalAlign: 'top' }}>
                          <Box sx={{ pt: 0.5 }}>
                            {!isFixed && (
                              <Tooltip title="Slå 3T6">
                                <IconButton
                                  size="small"
                                  onClick={() => handleRoll(char.key)}
                                  color="primary"
                                >
                                  <RefreshIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Right column: Specializations */}
          <Grid item xs={12} md={5}>
            <Box sx={{ position: 'sticky', top: 0 }}>
              <Typography variant="h6" gutterBottom>
                Specialiseringar
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Ange specialiseringar för karaktärsdrag med värde ≥14 (hög) eller ≤7 (låg).
              </Alert>
              
              {CHARACTERISTICS.filter(char => !char.fixed).map(char => {
                const value = getValue(char.key);
                const showHighSpec = hasHighSpecialization(char.key);
                const showLowSpec = hasLowSpecialization(char.key);
                
                if (!showHighSpec && !showLowSpec) {
                  return null;
                }

                return (
                  <Box key={char.key} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {char.key} ({value})
                    </Typography>
                    {showHighSpec && (
                      <TextField
                        fullWidth
                        label="Hög specialisering"
                        value={specializations[`${char.key}_high`] || ''}
                        onChange={(e) => handleSpecializationChange(`${char.key}_high`, e.target.value)}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                    )}
                    {showLowSpec && (
                      <TextField
                        fullWidth
                        label="Låg specialisering"
                        value={specializations[`${char.key}_low`] || ''}
                        onChange={(e) => handleSpecializationChange(`${char.key}_low`, e.target.value)}
                        size="small"
                      />
                    )}
                  </Box>
                );
              })}
              
              {CHARACTERISTICS.filter(char => !char.fixed).every(char => {
                const value = getValue(char.key);
                return !(hasHighSpecialization(char.key) || hasLowSpecialization(char.key));
              }) && (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Inga specialiseringar tillgängliga än. Slå värden ≥14 eller ≤7 för att aktivera specialiseringar.
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
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

CharacteristicsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired
};

