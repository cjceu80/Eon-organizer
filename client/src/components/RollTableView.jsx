import { useState, useEffect } from 'react';
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
import { useAuth } from '../hooks/useAuth';

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
  rerolls = 0, // eslint-disable-line no-unused-vars
  freeChoiceTokens = 0,
  onPendingFreeChoiceChange = null,
  disabled = false,
  isSecondaryRoll = false,
  onSecondaryRoll = null,
  isFreeReroll = false,
  subTableRollResult: externalSubTableRollResult = null,
  onSubTableRollChange = null
}) {
  const [loading, setLoading] = useState(false);
  const [freeChoiceMode, setFreeChoiceMode] = useState(false);
  const [pendingFreeChoiceEntry, setPendingFreeChoiceEntry] = useState(null);
  const [subTable, setSubTable] = useState(null);
  const [subTableLoading, setSubTableLoading] = useState(false);
  const [internalSubTableRollResult, setInternalSubTableRollResult] = useState(null);
  const { token } = useAuth();

  // Use external subTableRollResult if provided, otherwise use internal state
  const subTableRollResult = externalSubTableRollResult !== null ? externalSubTableRollResult : internalSubTableRollResult;
  
  const setSubTableRollResult = (value) => {
    if (onSubTableRollChange) {
      onSubTableRollChange(value);
    } else {
      setInternalSubTableRollResult(value);
    }
  };

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
    if (disabled || loading) return;
    
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
    if (disabled) return;
    
    // Ensure we have the full entry object from the table (with all properties including subTable)
    const fullEntry = table.entries?.find(e => 
      e.minValue === entry.minValue && e.maxValue === entry.maxValue
    ) || entry;
    
    console.log('RollTableView - handleEntryClick:', {
      entry,
      fullEntry,
      hasSubTable: !!fullEntry.subTable,
      subTable: fullEntry.subTable
    });
    
    if (freeChoiceMode) {
      // Free choice mode: set pending selection
      setPendingFreeChoiceEntry(fullEntry);
      if (onPendingFreeChoiceChange) {
        onPendingFreeChoiceChange({
          rollValue: null,
          entry: fullEntry,
          diceDetails: null,
          isFreeChoice: true
        });
      }
    } else {
      // Manual selection: apply immediately by calling onRoll with the selected entry
      // Calculate a roll value that would match this entry (use the middle of the range)
      const rollValue = Math.floor((fullEntry.minValue + fullEntry.maxValue) / 2);
      if (onRoll) {
        onRoll({
          rollValue,
          entry: fullEntry, // Use fullEntry to ensure all properties are included
          diceDetails: null,
          isFreeChoice: true
        });
      }
    }
  };

  const isRolled = rollResult !== null;
  const rolledEntry = rollResult?.entry;

  // Find the full entry from the table (to ensure we have all properties including subTable)
  const fullRolledEntry = rolledEntry && table?.entries ? 
    table.entries.find(e => 
      e.minValue === rolledEntry.minValue && e.maxValue === rolledEntry.maxValue
    ) || rolledEntry
    : rolledEntry;

  // Fetch sub table when entry with subTable is rolled
  useEffect(() => {
    const fetchSubTable = async () => {
      // Use fullRolledEntry to ensure we have all properties
      const entryToCheck = fullRolledEntry || rolledEntry;
      
      // Debug logging
      console.log('RollTableView - Checking for subTable:', {
        hasRolledEntry: !!rolledEntry,
        hasFullRolledEntry: !!fullRolledEntry,
        hasSubTable: !!entryToCheck?.subTable,
        subTable: entryToCheck?.subTable,
        entry: entryToCheck,
        tableEntries: table?.entries?.length
      });

      if (!entryToCheck?.subTable) {
        setSubTable(null);
        setSubTableRollResult(null);
        return;
      }

      // Check if subTable is a reference (has tableSlug)
      if (entryToCheck.subTable.tableSlug) {
        console.log('RollTableView - Fetching referenced sub table:', entryToCheck.subTable.tableSlug);
        setSubTableLoading(true);
        try {
          const response = await fetch(`/api/roll-tables/${entryToCheck.subTable.tableSlug}`, {
            headers: token ? {
              'Authorization': `Bearer ${token}`
            } : {}
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('RollTableView - Fetched sub table:', data.table);
            setSubTable(data.table);
          } else {
            console.error('Failed to fetch sub table:', response.status, response.statusText);
            setSubTable(null);
          }
        } catch (error) {
          console.error('Error fetching sub table:', error);
          setSubTable(null);
        } finally {
          setSubTableLoading(false);
        }
      } else if (entryToCheck.subTable.entries && Array.isArray(entryToCheck.subTable.entries)) {
        // Inline sub table (can have name or type: "inline")
        console.log('RollTableView - Using inline sub table:', entryToCheck.subTable);
        // Ensure the inline table has a name for display
        const inlineTable = {
          ...entryToCheck.subTable,
          name: entryToCheck.subTable.name || entryToCheck.subTable.value || 'Undertabell',
          dice: entryToCheck.subTable.dice || '1T100'
        };
        setSubTable(inlineTable);
      } else {
        console.warn('RollTableView - subTable exists but has invalid structure:', entryToCheck.subTable);
        setSubTable(null);
      }
    };

    fetchSubTable();
  }, [fullRolledEntry, rolledEntry, token, table]);

  const handleSubTableRoll = async () => {
    if (!subTable || disabled || loading) return;
    
    setLoading(true);
    try {
      const diceResult = rollDice(subTable.dice || '1T100');
      const entry = findEntry(diceResult.value, subTable.entries);
      
      setSubTableRollResult({
        rollValue: diceResult.value,
        entry,
        diceDetails: diceResult.details
      });
    } catch (error) {
      console.error('Error rolling sub table:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubTableReroll = async () => {
    await handleSubTableRoll();
  };

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
                {!freeChoiceMode && (
                  <Button
                    variant={isFreeReroll ? "contained" : "outlined"}
                    startIcon={<RefreshIcon />}
                    onClick={handleReroll}
                    disabled={disabled || loading}
                  >
                    Slå om
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

      {/* Sub Table */}
      {isRolled && (fullRolledEntry?.subTable || rolledEntry?.subTable) && (
        <Box sx={{ mt: 3, mb: 3 }}>
          {subTableLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : subTable ? (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Undertabell: {subTable.name || 'Undertabell'}
              </Typography>
              
              {subTable.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {subTable.description}
                </Typography>
              )}

              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                {!subTableRollResult ? (
                  <Button
                    variant="contained"
                    startIcon={<CasinoIcon />}
                    onClick={handleSubTableRoll}
                    disabled={disabled || loading}
                  >
                    Slå på undertabell
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={handleSubTableReroll}
                    disabled={disabled || loading}
                  >
                    Slå om på undertabell
                  </Button>
                )}
                {loading && <CircularProgress size={24} />}
              </Box>

              {subTableRollResult && subTableRollResult.entry && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Slag: {subTableRollResult.rollValue} - {subTableRollResult.entry.value}
                  </Typography>
                  {subTableRollResult.entry.description && (
                    <Typography variant="body2">
                      {subTableRollResult.entry.description}
                    </Typography>
                  )}
                </Alert>
              )}

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
                    {subTable.entries && subTable.entries.map((entry, index) => {
                      const isRolledEntry = subTableRollResult && subTableRollResult.entry &&
                        entry.minValue === subTableRollResult.entry.minValue &&
                        entry.maxValue === subTableRollResult.entry.maxValue;
                      
                      return (
                        <TableRow
                          key={`${entry.minValue}-${entry.maxValue}`}
                          onClick={() => {
                            if (!disabled) {
                              const rollValue = Math.floor((entry.minValue + entry.maxValue) / 2);
                              setSubTableRollResult({
                                rollValue,
                                entry,
                                diceDetails: null,
                                isFreeChoice: true
                              });
                            }
                          }}
                          sx={{
                            bgcolor: isRolledEntry ? 'action.selected' : (index % 2 === 0 ? 'background.paper' : 'action.hover'),
                            cursor: !disabled ? 'pointer' : 'default',
                            '&:hover': {
                              bgcolor: !disabled ? (isRolledEntry ? 'action.selected' : 'action.hover') : undefined
                            },
                            '&:active': {
                              bgcolor: !disabled ? 'action.selected' : undefined
                            }
                          }}
                        >
                          <TableCell sx={{ width: '100px', whiteSpace: 'nowrap' }}>
                            {entry.minValue === entry.maxValue
                              ? entry.minValue
                              : `${entry.minValue}-${entry.maxValue}`}
                          </TableCell>
                          <TableCell sx={{ width: '250px' }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: isRolledEntry ? 'bold' : 'normal',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {entry.value}
                            </Typography>
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
          ) : null}
        </Box>
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
              
              const isSelectable = !disabled;
              
              // Check if this entry has a subTable (for visual indication)
              const hasSubTable = !!entry.subTable;
              
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
                  onClick={() => {
                    // Make sure we pass the full entry object with all properties
                    console.log('RollTableView - Entry clicked:', entry);
                    handleEntryClick(entry);
                  }}
                  sx={{
                    bgcolor: bgColor,
                    cursor: isSelectable ? 'pointer' : 'default',
                    '&:active': {
                      bgcolor: isSelectable ? 'action.selected' : undefined
                    },
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


