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
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { rollT100 } from '../utils/dice';

/**
 * Evaluate a formula string with dice notation and math operations
 * Supports: 1T100, basic arithmetic, characterApparentAge variable
 */
function evaluateFormula(formula, characterApparentAge = 0) {
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

/**
 * Calculate apparent age from actual age using the apparentAgeTable
 */
function calculateApparentAge(actualAge, apparentAgeTable) {
  if (!apparentAgeTable || apparentAgeTable.length === 0) {
    return actualAge;
  }

  const matchingRange = apparentAgeTable.find(
    range => actualAge >= range.minActualAge && actualAge <= range.maxActualAge
  );

  if (!matchingRange) {
    return actualAge;
  }

  return matchingRange.apparentAge;
}

export default function ParentsDialog({
  open,
  onClose,
  onConfirm,
  ageData = null,
  selectedRace = null,
  raceCategory = null,
  rerolls = 0
}) {
  const [rollResult, setRollResult] = useState(null);
  const [parentStatus, setParentStatus] = useState(null);
  const [rollDetails, setRollDetails] = useState(null);
  const [remainingRerolls, setRemainingRerolls] = useState(rerolls);
  const [initialRoll, setInitialRoll] = useState(false);
  const [rerollUsed, setRerollUsed] = useState(false);

  // Get parent formula and table from race metadata first, then race category, then defaults
  // Supports partial overrides: you can provide only formula, only table, or both
  const getParentFormula = () => {
    // First, check if the race has parentFormula in its metadata
    if (selectedRace?.metadata) {
      const metadata = selectedRace.metadata instanceof Map 
        ? Object.fromEntries(selectedRace.metadata) 
        : selectedRace.metadata;
      
      if (metadata.parentFormula && typeof metadata.parentFormula === 'object') {
        return {
          // Use race formula if provided, otherwise use default
          formula: metadata.parentFormula.formula || '1T100 + characterApparentAge',
          // Use race table if provided, otherwise use default table
          table: metadata.parentFormula.table || getDefaultTable()
        };
      }
    }
    
    // Second, check race category
    if (raceCategory?.parentFormula) {
      return {
        // Use category formula if provided, otherwise use default
        formula: raceCategory.parentFormula.formula || '1T100 + characterApparentAge',
        // Use category table if provided, otherwise use default table
        table: raceCategory.parentFormula.table || getDefaultTable()
      };
    }
    
    // Finally, use defaults if no override exists
    return {
      formula: '1T100 + characterApparentAge',
      table: getDefaultTable()
    };
  };

  const getDefaultTable = () => [
    { min: 1, max: 60, result: 'both parents alive' },
    { min: 61, max: 80, result: 'father unknown' },
    { min: 81, max: 88, result: 'mother alive' },
    { min: 89, max: 95, result: 'father alive' },
    { min: 96, max: 999, result: 'both dead' }
  ];

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

  // Initialize rolling when dialog opens
  useEffect(() => {
    if (open && !initialRoll) {
      handleRollParents();
      setInitialRoll(true);
    }
    if (!open) {
      // Reset when dialog closes
      setInitialRoll(false);
      setRollResult(null);
      setParentStatus(null);
      setRollDetails(null);
      setRemainingRerolls(rerolls);
      setRerollUsed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rerolls]);

  const handleRollParents = () => {
    if (!ageData || !ageData.age) {
      return;
    }

    const config = getParentFormula();
    const characterActualAge = ageData.age;
    const apparentAgeTable = raceCategory?.apparentAgeTable || [];

    // Calculate character's apparent age from actual age
    const characterApparentAge = calculateApparentAge(characterActualAge, apparentAgeTable);

    // Evaluate the formula (this will roll dice and calculate)
    const result = Math.floor(evaluateFormula(config.formula, characterApparentAge));
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
  };

  const handleReroll = () => {
    if (!ageData || !ageData.age) {
      return;
    }

    // Check if we need to consume a reroll token (first time only)
    if (!rerollUsed && remainingRerolls <= 0) {
      return; // Can't use if no tokens and hasn't been used before
    }

    // Consume a reroll token only on first use
    if (!rerollUsed && remainingRerolls > 0) {
      setRemainingRerolls(prev => prev - 1);
      setRerollUsed(true);
    }

    handleRollParents();
  };

  const handleConfirm = () => {
    onConfirm({
      parentStatus: parentStatus,
      rollResult: rollResult,
      formula: getParentFormula().formula,
      table: getParentFormula().table
    });
  };

  const config = getParentFormula();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Föräldrar
        {remainingRerolls > 0 && !rerollUsed && (
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
            {remainingRerolls} omkastningar kvar
          </Typography>
        )}
        {rerollUsed && (
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
            Omkastning använd (gratis återkastningar tillgängliga)
          </Typography>
        )}
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          Föräldrars status beräknas baserat på rasens kategori-formel: <strong>{config.formula}</strong>
        </Alert>

        {rollDetails && (
          <Box sx={{ mb: 3 }}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1">
                  Resultat
                </Typography>
                {(remainingRerolls > 0 || rerollUsed) && (
                  <Tooltip title={
                    rerollUsed 
                      ? "Återkasta (gratis)" 
                      : `Återkasta (${remainingRerolls} kvar)`
                  }>
                    <IconButton
                      size="small"
                      onClick={handleReroll}
                      color="primary"
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Formel: {config.formula.replace(/characterApparentAge/g, rollDetails.apparentAge.toString())}
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
                {config.table.map((range, index) => (
                  <Typography key={index} variant="caption" display="block" color="text.secondary">
                    {range.min}-{range.max}: {getStatusLabel(range.result)}
                  </Typography>
                ))}
              </Box>
            </Paper>
          </Box>
        )}

        {!rollDetails && (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="text.secondary">
              Klicka på återkastning för att rulla.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Avbryt</Button>
        <Button onClick={handleConfirm} variant="contained" disabled={!parentStatus}>
          Bekräfta
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ParentsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  ageData: PropTypes.object,
  selectedRace: PropTypes.object,
  raceCategory: PropTypes.object,
  rerolls: PropTypes.number
};
