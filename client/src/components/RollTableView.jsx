import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';
import MinimizeIcon from '@mui/icons-material/Minimize';
import StarIcon from '@mui/icons-material/Star';
import RefreshIcon from '@mui/icons-material/Refresh';
import { rollT100WithDetails, rollT6Multiple, rollT10, rollObT6WithDetails } from '../utils/dice';

/**
 * Parse dice notation and roll
 */
function rollDice(diceString) {
  if (!diceString || typeof diceString !== 'string') {
    return { value: 0, details: null };
  }

  // Normalize dice string
  const normalized = diceString.trim().toUpperCase();

  // Handle T100 (1T100, 2T100, etc.)
  const t100Match = normalized.match(/^(\d+)T100$/);
  if (t100Match) {
    const count = parseInt(t100Match[1], 10);
    if (count === 1) {
      const result = rollT100WithDetails();
      return { value: result.value, details: result };
    } else {
      let total = 0;
      const details = [];
      for (let i = 0; i < count; i++) {
        const result = rollT100WithDetails();
        total += result.value;
        details.push(result);
      }
      return { value: total, details };
    }
  }

  // Handle T6 (1T6, 2T6, etc.)
  const t6Match = normalized.match(/^(\d+)T6$/);
  if (t6Match) {
    const count = parseInt(t6Match[1], 10);
    const rolls = rollT6Multiple(count);
    const total = rolls.reduce((a, b) => a + b, 0);
    return { value: total, details: { rolls } };
  }

  // Handle T10 (1T10, 2T10, etc.)
  const t10Match = normalized.match(/^(\d+)T10$/);
  if (t10Match) {
    const count = parseInt(t10Match[1], 10);
    let total = 0;
    const rolls = [];
    for (let i = 0; i < count; i++) {
      const roll = rollT10();
      total += roll;
      rolls.push(roll);
    }
    return { value: total, details: { rolls } };
  }

  // Handle ObT6 (Ob1T6, Ob2T6, etc.)
  const obT6Match = normalized.match(/^OB(\d+)T6$/);
  if (obT6Match) {
    const count = parseInt(obT6Match[1], 10);
    const result = rollObT6WithDetails(count);
    return { value: result.total, details: result };
  }

  // Default: try to parse as number
  const num = parseInt(normalized, 10);
  if (!isNaN(num)) {
    return { value: num, details: null };
  }

  return { value: 0, details: null };
}

/**
 * Find entry in table that matches roll value
 */
function findEntry(rollValue, entries) {
  if (!entries || !Array.isArray(entries)) {
    return null;
  }
  
  return entries.find(entry => 
    rollValue >= entry.minValue && rollValue <= entry.maxValue
  ) || null;
}

/**
 * Full table view component for roll tables
 */
export default function RollTableView({
  table,
  rollResult = null,
  onRoll,
  onReroll = null,
  onMinimize,
  rerolls = 0,
  freeChoiceTokens = 0,
  onPendingFreeChoiceChange = null,
  disabled = false,
  isSecondaryRoll = false,
  onSecondaryRoll = null,
  isFreeReroll = false
}) {
  const [loading, setLoading] = useState(false);
  const [freeChoiceMode, setFreeChoiceMode] = useState(false);
  const [pendingFreeChoiceEntry, setPendingFreeChoiceEntry] = useState(null);

  if (!table) {
    return (
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Alert severity="error">Ingen tabell data tillgänglig</Alert>
      </Paper>
    );
  }

  const handleRoll = async () => {
    if (disabled || loading) return;
    
    setLoading(true);
    try {
      const diceResult = rollDice(table.dice || '1T100');
      const entry = findEntry(diceResult.value, table.entries);
      
      if (onRoll) {
        await onRoll({
          rollValue: diceResult.value,
          entry,
          diceDetails: diceResult.details
        });
      }
      
      // Check if this roll triggers a second roll (e.g., rolled 100 on a 1T100 table)
      // Only check if this is NOT already a secondary roll (to prevent infinite recursion)
      if (!isSecondaryRoll && onSecondaryRoll && table.entries && table.entries.length > 0) {
        const maxEntry = table.entries.reduce((max, entry) => 
          entry.maxValue > max.maxValue ? entry : max
        );
        // If we rolled the maximum value, trigger a second roll
        if (diceResult.value >= maxEntry.minValue && diceResult.value <= maxEntry.maxValue) {
          onSecondaryRoll();
        }
      }
    } catch (error) {
      console.error('Error rolling:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReroll = async () => {
    if (disabled || loading || rerolls <= 0) return;
    
    if (onReroll) {
      await onReroll();
    } else {
      await handleRoll();
    }
  };

  const handleUseFreeChoice = () => {
    if (disabled || freeChoiceTokens <= 0) return;
    setFreeChoiceMode(true);
    setPendingFreeChoiceEntry(null);
    if (onPendingFreeChoiceChange) {
      onPendingFreeChoiceChange(null);
    }
  };

  const handleCancelFreeChoice = () => {
    setFreeChoiceMode(false);
    setPendingFreeChoiceEntry(null);
    if (onPendingFreeChoiceChange) {
      onPendingFreeChoiceChange(null);
    }
  };

  const handleEntryClick = (entry) => {
    if (freeChoiceMode && !disabled) {
      setPendingFreeChoiceEntry(entry);
      if (onPendingFreeChoiceChange) {
        onPendingFreeChoiceChange({
          rollValue: null,
          entry,
          diceDetails: null,
          isFreeChoice: true
        });
      }
    }
  };

  const isRolled = rollResult !== null;
  const rolledEntry = rollResult?.entry;

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" component="h2">
            {table.name || 'Roll Table'}
          </Typography>
          {table.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {table.description}
            </Typography>
          )}
          {table.dice && (
            <Chip 
              label={`Tärning: ${table.dice}`} 
              size="small" 
              sx={{ mt: 1 }}
            />
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {isRolled && (
            <Chip 
              label={`Slag: ${rollResult.rollValue}`} 
              color="primary" 
              size="medium"
            />
          )}
          <Tooltip title="Minimera">
            <IconButton onClick={onMinimize} size="small">
              <MinimizeIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Action buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', flexDirection: 'column' }}>
        {freeChoiceMode ? (
          <>
            <Alert severity="info" sx={{ width: '100%' }}>
              Du använder ett fritt val-token. Klicka på ett resultat i tabellen för att välja det. Du kan byta val tills du bekräftar i dialogens bekräfta-knapp.
            </Alert>
            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Button
                variant="outlined"
                onClick={handleCancelFreeChoice}
                disabled={disabled}
                sx={{ width: 'auto' }}
              >
                Avbryt
              </Button>
            </Box>
          </>
        ) : (
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {!isRolled ? (
              <Button
                variant="contained"
                startIcon={<CasinoIcon />}
                onClick={handleRoll}
                disabled={disabled || loading || freeChoiceMode}
              >
                Slå
              </Button>
            ) : (
              <>
                {((rerolls > 0) || isFreeReroll) && !freeChoiceMode && (
                  <Button
                    variant={isFreeReroll ? "contained" : "outlined"}
                    startIcon={<RefreshIcon />}
                    onClick={handleReroll}
                    disabled={disabled || loading}
                  >
                    {isFreeReroll ? 'Slå om' : `Slå om (${rerolls} kvar)`}
                  </Button>
                )}
                
                {freeChoiceTokens > 0 && !freeChoiceMode && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<StarIcon />}
                    onClick={handleUseFreeChoice}
                    disabled={disabled || loading}
                  >
                    Välj fritt ({freeChoiceTokens} kvar)
                  </Button>
                )}
              </>
            )}
            
            {loading && <CircularProgress size={24} />}
          </Box>
        )}
      </Box>

      {/* Roll result display */}
      {isRolled && rolledEntry && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            {rolledEntry.value}
          </Typography>
          {rolledEntry.description && (
            <Typography variant="body2">
              {rolledEntry.description}
            </Typography>
          )}
        </Alert>
      )}

      {/* Table */}
      <TableContainer>
        <Table size="small" sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '100px' }}><strong>Värde</strong></TableCell>
              <TableCell sx={{ width: '250px' }}><strong>Resultat</strong></TableCell>
              <TableCell><strong>Beskrivning</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {table.entries && table.entries.map((entry, index) => {
              const isRolledEntry = isRolled && rolledEntry && 
                entry.minValue === rolledEntry.minValue && 
                entry.maxValue === rolledEntry.maxValue;
              
              const isPendingFreeChoice = freeChoiceMode && pendingFreeChoiceEntry &&
                entry.minValue === pendingFreeChoiceEntry.minValue &&
                entry.maxValue === pendingFreeChoiceEntry.maxValue;
              
              const isSelectable = freeChoiceMode && !disabled;
              
              let bgColor;
              if (isRolledEntry && !freeChoiceMode) {
                bgColor = 'action.selected';
              } else if (isPendingFreeChoice) {
                bgColor = 'primary.light';
              } else {
                bgColor = index % 2 === 0 ? 'background.paper' : 'action.hover';
              }
              
              return (
                <TableRow 
                  key={`${entry.minValue}-${entry.maxValue}`}
                  onClick={() => handleEntryClick(entry)}
                  sx={{
                    bgcolor: bgColor,
                    cursor: isSelectable ? 'pointer' : 'default',
                    height: '48px',
                    '&:hover': {
                      bgcolor: isSelectable 
                        ? (isPendingFreeChoice ? 'primary.light' : 'action.hover')
                        : (isRolledEntry ? 'action.selected' : 'action.hover')
                    }
                  }}
                >
                  <TableCell sx={{ width: '100px', whiteSpace: 'nowrap' }}>
                    {entry.minValue === entry.maxValue 
                      ? entry.minValue 
                      : `${entry.minValue}-${entry.maxValue}`}
                  </TableCell>
                  <TableCell sx={{ width: '250px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: '24px' }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: (isRolledEntry || isPendingFreeChoice) ? 'bold' : 'normal',
                          flex: 1,
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {entry.value}
                      </Typography>
                      <Box sx={{ width: '50px', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                        {isRolledEntry && (
                          <Chip 
                            label="Vald" 
                            color="primary" 
                            size="small"
                          />
                        )}
                        {isPendingFreeChoice && (
                          <Chip 
                            label="Väljs" 
                            color="secondary" 
                            size="small"
                          />
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {entry.description || ''}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

RollTableView.propTypes = {
  table: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    dice: PropTypes.string,
    entries: PropTypes.arrayOf(PropTypes.shape({
      minValue: PropTypes.number.isRequired,
      maxValue: PropTypes.number.isRequired,
      value: PropTypes.string.isRequired,
      description: PropTypes.string
    }))
  }),
  rollResult: PropTypes.shape({
    rollValue: PropTypes.number.isRequired,
    entry: PropTypes.object,
    diceDetails: PropTypes.object
  }),
  onRoll: PropTypes.func.isRequired,
  onReroll: PropTypes.func,
  onMinimize: PropTypes.func.isRequired,
  rerolls: PropTypes.number,
  freeChoiceTokens: PropTypes.number,
  onUseFreeChoice: PropTypes.func,
  onPendingFreeChoiceChange: PropTypes.func,
  disabled: PropTypes.bool,
  isSecondaryRoll: PropTypes.bool,
  onSecondaryRoll: PropTypes.func,
  isFreeReroll: PropTypes.bool
};


