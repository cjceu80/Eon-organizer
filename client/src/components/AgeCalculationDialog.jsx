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
import { rollObT6WithDetails, rollT6Multiple } from '../utils/dice';

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

export default function AgeCalculationDialog({ 
  open, 
  onClose, 
  onConfirm, 
  attributes,
  rerolls = 0,
  selectedRace = null,
  gender = 'man',
  varierandeVikt = true
}) {
  const [ageResult, setAgeResult] = useState(null);
  const [kroppsbyggnadResult, setKroppsbyggnadResult] = useState(null);
  const [lengthResult, setLengthResult] = useState(null);
  const [remainingRerolls, setRemainingRerolls] = useState(rerolls);
  const [initialRoll, setInitialRoll] = useState(false);

  // Initialize rolling when dialog opens
  useEffect(() => {
    if (open && !initialRoll) {
      handleRollAge();
      handleRollKroppsbyggnad();
      setInitialRoll(true);
    }
    if (!open) {
      // Reset when dialog closes
      setInitialRoll(false);
      setAgeResult(null);
      setKroppsbyggnadResult(null);
      setLengthResult(null);
      setRemainingRerolls(rerolls);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rerolls]);

  // Calculate length after kroppsbyggnad is set (since weight depends on kroppsbyggnad type)
  // Note: handleRollKroppsbyggnad now calls handleRollLength directly with shared dice,
  // so this useEffect is mainly for when varierandeVikt, selectedRace, or gender changes
  useEffect(() => {
    if (open && kroppsbyggnadResult && initialRoll) {
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

    setAgeResult({
      bil: bilValue,
      ob3T6: ob3T6Result,
      age,
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
    if (remainingRerolls <= 0) return;
    handleRollAge();
    setRemainingRerolls(prev => prev - 1);
  };

  const handleRerollKroppsbyggnad = () => {
    if (remainingRerolls <= 0) return;
    // This will also recalculate length since they share the same 3T6
    handleRollKroppsbyggnad();
    setRemainingRerolls(prev => prev - 1);
  };

  const handleRerollLength = () => {
    if (remainingRerolls <= 0) return;
    // Reroll both kroppsbyggnad and length together since they share the same 3T6
    handleRollKroppsbyggnad();
    setRemainingRerolls(prev => prev - 1);
  };

  const handleConfirm = () => {
    if (!ageResult || !kroppsbyggnadResult || !lengthResult) return;
    onConfirm({
      age: ageResult.age,
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

  if (!ageResult || !kroppsbyggnadResult || !lengthResult) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Ålder
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">BIL</Typography>
                    <Typography variant="h5">{ageResult.bil}</Typography>
                  </Box>
                  <Typography variant="h5">+</Typography>
                  <Box sx={{ flex: 1, minWidth: 120 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">Ob3T6</Typography>
                      {remainingRerolls > 0 && (
                        <Tooltip title={`Återkasta Ob3T6 (${remainingRerolls} kvar)`}>
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
                    <Typography variant="h5">
                      {ageResult.ob3T6.total}
                      <Typography 
                        component="span" 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ ml: 1 }}
                      >
                        ({ageResult.ob3T6.initialRolls.join(', ')}
                        {ageResult.ob3T6.extraRolls.length > 0 && ` → ${ageResult.ob3T6.extraRolls.join(', ')}`})
                      </Typography>
                    </Typography>
                  </Box>
                  <Typography variant="h5">=</Typography>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Ålder</Typography>
                    <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                      {ageResult.age}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Valfria enheter baserat på ålder:
              </Typography>
              <Chip 
                label={`+${ageResult.bonus} Valfria enheter`}
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
                      const isCurrentRange = ageResult.age >= range.min && ageResult.age <= range.max;
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
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Kroppsbyggnad
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">STY</Typography>
                    <Typography variant="h5">{kroppsbyggnadResult.sty}</Typography>
                  </Box>
                  <Typography variant="h5">+</Typography>
                  <Box>
                    <Typography variant="body2" color="text.secondary">TÅL</Typography>
                    <Typography variant="h5">{kroppsbyggnadResult.tal}</Typography>
                  </Box>
                  <Typography variant="h5">+</Typography>
                  <Box sx={{ flex: 1, minWidth: 120 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">3T6</Typography>
                      {remainingRerolls > 0 && (
                        <Tooltip title={`Återkasta 3T6 (${remainingRerolls} kvar)`}>
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
                    <Typography variant="h5">
                      {kroppsbyggnadResult.t6Total}
                      <Typography 
                        component="span" 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ ml: 1 }}
                      >
                        ({kroppsbyggnadResult.t6Rolls.join(', ')})
                      </Typography>
                    </Typography>
                  </Box>
                  <Typography variant="h5">=</Typography>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Totalt</Typography>
                    <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                      {kroppsbyggnadResult.total}
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
                  label={`Kroppsbyggnad: ${kroppsbyggnadResult.type}`}
                  color="primary"
                  size="large"
                  sx={{ fontSize: '1rem', fontWeight: 'bold', py: 1.5 }}
                />
                <Chip 
                  label={`Skadekolumner: ${kroppsbyggnadResult.skadekolumner}`}
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
                      const isCurrentRange = kroppsbyggnadResult.total >= range.min && kroppsbyggnadResult.total <= range.max;
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
          <Grid item xs={12}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Längd och vikt
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">STY</Typography>
                    <Typography variant="h5">{lengthResult.sty}</Typography>
                  </Box>
                  <Typography variant="h5">+</Typography>
                  <Box>
                    <Typography variant="body2" color="text.secondary">TÅL</Typography>
                    <Typography variant="h5">{lengthResult.tal}</Typography>
                  </Box>
                  <Typography variant="h5">+</Typography>
                  <Box sx={{ flex: 1, minWidth: 120 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">3T6</Typography>
                      {remainingRerolls > 0 && (
                        <Tooltip title={`Återkasta 3T6 (${remainingRerolls} kvar)`}>
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
                    <Typography variant="h5">
                      {lengthResult.t6Total}
                      <Typography 
                        component="span" 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ ml: 1 }}
                      >
                        ({lengthResult.t6Rolls.join(', ')})
                      </Typography>
                    </Typography>
                  </Box>
                  <Typography variant="h5">+</Typography>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Raslängdkonstant</Typography>
                    <Typography variant="h5">{lengthResult.lengthConstant}</Typography>
                  </Box>
                  <Typography variant="h5">=</Typography>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Längd (cm)</Typography>
                    <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                      {lengthResult.length}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Längd</Typography>
                    <Typography variant="h5">{lengthResult.length}</Typography>
                  </Box>
                  <Typography variant="h5">-</Typography>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Rasviktskonstant</Typography>
                    <Typography variant="h5">{lengthResult.weightConstant}</Typography>
                  </Box>
                  <Typography variant="h5">=</Typography>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Basvikt (kg)</Typography>
                    <Typography variant="h5">{Math.round(lengthResult.baseWeight * 10) / 10}</Typography>
                  </Box>
                  {varierandeVikt && lengthResult.weightMultiplier !== 1 && (
                    <>
                      <Typography variant="h5">×</Typography>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Multiplikator ({lengthResult.kroppsbyggnadType})
                        </Typography>
                        <Typography variant="h5">{lengthResult.weightMultiplier}</Typography>
                      </Box>
                      <Typography variant="h5">=</Typography>
                    </>
                  )}
                  <Box>
                    <Typography variant="body2" color="text.secondary">Vikt (kg)</Typography>
                    <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                      {Math.round(lengthResult.weight * 10) / 10}
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
    </Dialog>
  );
}

AgeCalculationDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  attributes: PropTypes.object,
  rerolls: PropTypes.number,
  selectedRace: PropTypes.object,
  gender: PropTypes.string,
  varierandeVikt: PropTypes.bool
};
