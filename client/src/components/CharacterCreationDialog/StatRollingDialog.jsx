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
  Chip,
  IconButton,
  Tooltip,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Grid
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { 
  EON_ATTRIBUTES, 
  rollStatsForMethod,
  rollT6Multiple
} from '../../utils/dice';

export default function StatRollingDialog({ 
  onClose, 
  onConfirm,
  onStateChange = null,
  savedState = null,
  statRollMethod = 'standard',
  rerolls = 0,
  selectedRace = null,
  feminineAttributes = false,
  minAttributes = null,
  maxAttributes = null
}) {
  const [statsResult, setStatsResult] = useState(null);
  const [selectedAttributes, setSelectedAttributes] = useState({}); // For anpassad method
  const [remainingRerolls, setRemainingRerolls] = useState(rerolls);
  const [freeRerollAllCount, setFreeRerollAllCount] = useState(0); // Free reroll all uses remaining
  const [initialRoll, setInitialRoll] = useState(false);
  const [draggedSet, setDraggedSet] = useState(null);
  const [dragOverAttribute, setDragOverAttribute] = useState(null);
  const [gender, setGender] = useState('man');
  const [styDecrease, setStyDecrease] = useState(0);
  const [femaleAttributeModifications, setFemaleAttributeModifications] = useState({
    TÅL: 0,
    RÖR: 0,
    PER: 0,
    PSY: 0,
    VIL: 0,
    BIL: 0
  });

  // Load saved state or initialize rolling
  useEffect(() => {
    if (savedState) {
      // Restore from saved state
      if (savedState.statsResult) setStatsResult(savedState.statsResult);
      if (savedState.selectedAttributes) setSelectedAttributes(savedState.selectedAttributes);
      if (savedState.remainingRerolls !== undefined) setRemainingRerolls(savedState.remainingRerolls);
      if (savedState.freeRerollAllCount !== undefined) setFreeRerollAllCount(savedState.freeRerollAllCount);
      if (savedState.gender) setGender(savedState.gender);
      if (savedState.styDecrease !== undefined) setStyDecrease(savedState.styDecrease);
      if (savedState.femaleAttributeModifications) setFemaleAttributeModifications(savedState.femaleAttributeModifications);
      setInitialRoll(true);
    } else if (!initialRoll) {
      // No saved state, do initial roll
      setRemainingRerolls(rerolls);
      handleInitialRoll();
      setInitialRoll(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedState, rerolls]);

  // Save state whenever it changes (using ref to avoid infinite loop)
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    if (initialRoll && onStateChangeRef.current) {
      const stateToSave = {
        statRollingState: {
          statsResult,
          selectedAttributes,
          remainingRerolls,
          freeRerollAllCount,
          gender,
          styDecrease,
          femaleAttributeModifications
        }
      };
      onStateChangeRef.current(stateToSave);
    }
  }, [statsResult, selectedAttributes, remainingRerolls, freeRerollAllCount, gender, styDecrease, femaleAttributeModifications, initialRoll]);

  // Apply min/max constraints to rolled values
  const applyAttributeConstraints = (attributes) => {
    const constrained = { ...attributes };
    Object.keys(constrained).forEach(attr => {
      // Ensure minimum of 1
      constrained[attr] = Math.max(1, constrained[attr]);
      // Apply min constraint if set
      if (minAttributes !== null && minAttributes !== undefined) {
        constrained[attr] = Math.max(minAttributes, constrained[attr]);
      }
      // Apply max constraint if set
      if (maxAttributes !== null && maxAttributes !== undefined) {
        constrained[attr] = Math.min(maxAttributes, constrained[attr]);
      }
    });
    return constrained;
  };

  const handleInitialRoll = (consumeReroll = false) => {
    const result = rollStatsForMethod(statRollMethod);
    // Apply constraints to rolled values
    result.attributes = applyAttributeConstraints(result.attributes);
    setStatsResult(result);
    if (statRollMethod === 'anpassad') {
      // Initialize selectedAttributes with nulls
      const initial = {};
      EON_ATTRIBUTES.forEach(attr => {
        initial[attr] = null;
      });
      setSelectedAttributes(initial);
    }
    if (consumeReroll && remainingRerolls > 0) {
      setRemainingRerolls(remainingRerolls - 1);
    }
  };

  const handleRerollAll = () => {
    // Check if we have free reroll all uses, or need to pay with a reroll token
    if (freeRerollAllCount > 0) {
      // Use a free reroll all
      setFreeRerollAllCount(prev => prev - 1);
      handleInitialRoll(false);
    } else if (remainingRerolls > 0) {
      // Pay 1 reroll token for reroll all, get 5 free uses
      setRemainingRerolls(prev => prev - 1);
      setFreeRerollAllCount(5);
      handleInitialRoll(false);
    }
    // If no rerolls and no free uses, do nothing
  };

  const handleRerollStat = (attribute) => {
    if (remainingRerolls <= 0) return;

    // Perform the reroll
    const newResult = { ...statsResult };
    let newRolls;

    switch (statRollMethod) {
      case 'standard':
      case 'hjälteattribut':
        newRolls = rollT6Multiple(statRollMethod === 'standard' ? 3 : 2);
        newResult.rolls[attribute] = newRolls;
        if (statRollMethod === 'standard') {
          newResult.attributes[attribute] = newRolls.reduce((a, b) => a + b, 0);
        } else {
          newResult.attributes[attribute] = newRolls.reduce((a, b) => a + b, 0) + 9;
        }
        break;
      
      case 'höga attribut': {
        const allRolls = rollT6Multiple(4);
        const sortedRolls = [...allRolls].sort((a, b) => a - b);
        const dropped = sortedRolls[0];
        const kept = sortedRolls.slice(1);
        newResult.rolls[attribute] = {
          all: allRolls,
          kept,
          dropped
        };
        newResult.attributes[attribute] = kept.reduce((a, b) => a + b, 0);
        break;
      }

      case 'anpassad':
        // For anpassad, rerolling doesn't make sense since you select from sets
        // This shouldn't be called for anpassad, but handle gracefully
        return;
    }

    // Apply constraints to the rerolled value
    const constrained = applyAttributeConstraints({ [attribute]: newResult.attributes[attribute] });
    newResult.attributes[attribute] = constrained[attribute];

    setStatsResult(newResult);
    setRemainingRerolls(prev => prev - 1);
  };

  const handleRerollAnpassadSet = (setId) => {
    if (remainingRerolls <= 0) return;

    // Perform the reroll
    const newResult = { ...statsResult };
    const setIndex = newResult.sets.findIndex(s => s.id === setId);
    
    if (setIndex === -1) return;

    // Reroll this set
    const rollResult = rollT6Multiple(3);
    let total = rollResult.reduce((a, b) => a + b, 0);
    
    // Apply constraints to the rerolled value
    const constrained = applyAttributeConstraints({ temp: total });
    total = constrained.temp;
    
    const newSet = {
      id: setId,
      rolls: rollResult,
      total: total
    };

    newResult.sets[setIndex] = newSet;

    // Update any attribute that was using this set
    const newSelected = { ...selectedAttributes };
    Object.keys(newSelected).forEach(attr => {
      if (newSelected[attr] === setId) {
        // The attribute is still assigned to this set, but the set's value has changed
        // We keep the assignment, just the set's value updates
      }
    });

    // Re-sort sets by total
    newResult.sets.sort((a, b) => b.total - a.total);

    setStatsResult(newResult);
    setRemainingRerolls(prev => prev - 1);
  };

  const handleSelectAnpassadSet = (attribute, set) => {
    const newSelected = { ...selectedAttributes };
    
    // If this set is already assigned to another attribute, don't allow it
    const alreadyUsedBy = Object.keys(newSelected).find(
      attr => attr !== attribute && newSelected[attr] === set.id
    );
    
    if (alreadyUsedBy) {
      return; // This set is already used by another attribute
    }
    
    // If clicking on the same set that's already selected, deselect it
    if (newSelected[attribute] === set.id) {
      newSelected[attribute] = null;
    } else {
      newSelected[attribute] = set.id;
    }
    
    setSelectedAttributes(newSelected);
  };

  const handleDragStart = (e, set) => {
    setDraggedSet(set);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', set.id);
  };

  const handleDragEnd = () => {
    setDraggedSet(null);
    setDragOverAttribute(null);
  };

  const handleDragOver = (e, attribute) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverAttribute(attribute);
  };

  const handleDragLeave = () => {
    setDragOverAttribute(null);
  };

  const handleDrop = (e, attribute) => {
    e.preventDefault();
    setDragOverAttribute(null);
    
    if (!draggedSet) return;
    
    // Check if this set is already used by another attribute
    const alreadyUsedBy = Object.keys(selectedAttributes).find(
      attr => attr !== attribute && selectedAttributes[attr] === draggedSet.id
    );
    
    if (alreadyUsedBy) {
      // Can't drop if already used, but allow dropping on the same attribute to move it
      if (selectedAttributes[attribute] === draggedSet.id) {
        // Already assigned to this attribute, no change needed
        return;
      }
      // Set is used by another attribute, swap them if the other attribute's set can be moved
      const newSelected = { ...selectedAttributes };
      const otherAttributeSet = selectedAttributes[attribute]; // Current set on this attribute
      newSelected[alreadyUsedBy] = otherAttributeSet; // Move current set to the other attribute
      newSelected[attribute] = draggedSet.id; // Assign dragged set to this attribute
      setSelectedAttributes(newSelected);
    } else {
      // Set is not used, assign it
      const newSelected = { ...selectedAttributes };
      newSelected[attribute] = draggedSet.id;
      setSelectedAttributes(newSelected);
    }
    
    setDraggedSet(null);
  };

  // Check if a set is currently assigned to any attribute
  const isSetUsed = (setId) => {
    return Object.values(selectedAttributes).some(selectedId => selectedId === setId);
  };

  // Get which attribute is using a set (if any)
  const getSetOwner = (setId) => {
    return Object.keys(selectedAttributes).find(attr => selectedAttributes[attr] === setId);
  };

  // Calculate final attributes with feminine modifications
  const getFinalAttributes = () => {
    let baseAttributes;
    
    if (statRollMethod === 'anpassad') {
      baseAttributes = {};
      EON_ATTRIBUTES.forEach(attr => {
        const selectedSet = statsResult.sets.find(s => s.id === selectedAttributes[attr]);
        if (selectedSet) {
          baseAttributes[attr] = selectedSet.total;
        }
      });
    } else {
      baseAttributes = { ...statsResult.attributes };
    }

    // Apply feminine attribute modifications if applicable
    if (feminineAttributes && gender === 'kvinna') {
      const finalAttributes = { ...baseAttributes };
      // Decrease STY
      finalAttributes.STY = (finalAttributes.STY || 0) - styDecrease;
      // Increase other attributes
      Object.keys(femaleAttributeModifications).forEach(attr => {
        finalAttributes[attr] = (finalAttributes[attr] || 0) + femaleAttributeModifications[attr];
      });
      return finalAttributes;
    }
    
    return baseAttributes;
  };

  const handleConfirm = () => {
    // Validate feminine modifications if applicable
    if (feminineAttributes && gender === 'kvinna') {
      const totalModifications = Object.values(femaleAttributeModifications).reduce((a, b) => a + b, 0);
      if (totalModifications !== styDecrease) {
        alert(`Du måste fördela exakt ${styDecrease} poäng. Just nu har du fördelat ${totalModifications} poäng.`);
        return;
      }
    }

    if (statRollMethod === 'anpassad') {
      // Verify all attributes have been assigned
      const allAssigned = EON_ATTRIBUTES.every(attr => selectedAttributes[attr] !== null);
      if (!allAssigned) {
        alert('Du måste välja ett värde för alla attribut!');
        return;
      }

      // Build attributes object from selected sets
      const attributes = {};
      EON_ATTRIBUTES.forEach(attr => {
        const selectedSet = statsResult.sets.find(s => s.id === selectedAttributes[attr]);
        if (selectedSet) {
          attributes[attr] = selectedSet.total;
        }
      });

      // Apply feminine modifications
      const finalAttributes = getFinalAttributes();

      // Get base attributes (pure rolled values, before race and feminine modifications)
      let baseAttributes;
      if (statRollMethod === 'anpassad') {
        baseAttributes = {};
        EON_ATTRIBUTES.forEach(attr => {
          const selectedSet = statsResult.sets.find(s => s.id === selectedAttributes[attr]);
          if (selectedSet) {
            baseAttributes[attr] = selectedSet.total;
          }
        });
      } else {
        baseAttributes = { ...statsResult.attributes };
      }

      onConfirm({
        attributes: finalAttributes,
        baseAttributes: baseAttributes, // Base rolled values (before race modifiers, before feminine modifications)
        method: statRollMethod,
        rerollsUsed: rerolls - remainingRerolls,
        gender,
        femaleAttributeModifications: (feminineAttributes && gender === 'kvinna') ? {
          styDecrease,
          modifications: femaleAttributeModifications
        } : null
      });
    } else {
      const finalAttributes = getFinalAttributes();
      // Get base attributes (pure rolled values, before race and feminine modifications)
      const baseAttributes = { ...statsResult.attributes };

      onConfirm({
        attributes: finalAttributes,
        baseAttributes: baseAttributes, // Base rolled values (before race modifiers, before feminine modifications)
        rolls: statsResult.rolls,
        method: statRollMethod,
        rerollsUsed: rerolls - remainingRerolls,
        gender,
        femaleAttributeModifications: (feminineAttributes && gender === 'kvinna') ? {
          styDecrease,
          modifications: femaleAttributeModifications
        } : null
      });
    }
  };

  // Handle STY decrease change
  const handleStyDecreaseChange = (newValue) => {
    const maxDecrease = Math.min(2, statsResult?.attributes?.STY || 0);
    const validValue = Math.max(0, Math.min(newValue, maxDecrease));
    setStyDecrease(validValue);
    
    // Recalculate modifications to ensure total points match
    const currentTotal = Object.values(femaleAttributeModifications).reduce((a, b) => a + b, 0);
    if (currentTotal > validValue) {
      // Reduce excess points proportionally
      const excess = currentTotal - validValue;
      const newMods = { ...femaleAttributeModifications };
      let remainingExcess = excess;
      Object.keys(newMods).forEach(attr => {
        if (remainingExcess > 0 && newMods[attr] > 0) {
          const reduction = Math.min(newMods[attr], remainingExcess);
          newMods[attr] -= reduction;
          remainingExcess -= reduction;
        }
      });
      setFemaleAttributeModifications(newMods);
    }
  };

  // Handle modification change for a specific attribute
  const handleModificationChange = (attr, value) => {
    const maxIncrease = styDecrease - Object.values(femaleAttributeModifications).reduce((a, b) => a + b, 0) + femaleAttributeModifications[attr];
    const validValue = Math.max(0, Math.min(value, maxIncrease));
    
    const newMods = { ...femaleAttributeModifications };
    newMods[attr] = validValue;
    setFemaleAttributeModifications(newMods);
  };

  const canReroll = remainingRerolls > 0 && statRollMethod !== 'anpassad';

  if (!statsResult) {
    return null;
  }

  return (
    <>
      <DialogTitle>
        Slå attribut
        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
          Metod: {statRollMethod === 'standard' ? 'Standard' : 
                  statRollMethod === 'anpassad' ? 'Anpassad' :
                  statRollMethod === 'höga attribut' ? 'Höga attribut' : 'Hjälteattribut'}
          {remainingRerolls > 0 && ` • ${remainingRerolls} omkastningar kvar`}
        </Typography>
      </DialogTitle>
      <DialogContent>
        {/* Gender Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Kön
          </Typography>
          <RadioGroup
            row
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <FormControlLabel value="man" control={<Radio />} label="Man" />
            <FormControlLabel value="kvinna" control={<Radio />} label="Kvinna" />
            <FormControlLabel value="obestämt" control={<Radio />} label="Obestämt" />
          </RadioGroup>
        </Box>

        {/* Feminine Attribute Modifications */}
        {feminineAttributes && gender === 'kvinna' && statsResult && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              Kvinnliga attributmodifikationer
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Du kan minska STY med 0-2 poäng. För varje minskad poäng kan du lägga till 1 poäng till TÅL, RÖR, PER, PSY, VIL eller BIL.
            </Alert>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  type="number"
                  fullWidth
                  label="Minska STY"
                  value={styDecrease}
                  onChange={(e) => handleStyDecreaseChange(parseInt(e.target.value) || 0)}
                  inputProps={{ min: 0, max: Math.min(2, statsResult?.attributes?.STY || 0) }}
                  helperText={`Max ${Math.min(2, statsResult?.attributes?.STY || 0)} poäng`}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Poäng att fördela: {styDecrease - Object.values(femaleAttributeModifications).reduce((a, b) => a + b, 0)}
                </Typography>
              </Grid>
              
              {['TÅL', 'RÖR', 'PER', 'PSY', 'VIL', 'BIL'].map(attr => (
                <Grid item xs={6} sm={4} key={attr}>
                  <TextField
                    type="number"
                    fullWidth
                    size="small"
                    label={`+${attr}`}
                    value={femaleAttributeModifications[attr]}
                    onChange={(e) => handleModificationChange(attr, parseInt(e.target.value) || 0)}
                    inputProps={{ min: 0, max: styDecrease }}
                    disabled={styDecrease === 0}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {statRollMethod === 'anpassad' ? (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Dra ett värde från poolen nedan och släpp på ett attribut, eller klicka för att välja.
            </Alert>
            
            {/* Available sets pool */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Tillgängliga värden:
                {remainingRerolls > 0 && (
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    ({remainingRerolls} omkastningar kvar)
                  </Typography>
                )}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {statsResult.sets.map(set => {
                  const isUsed = isSetUsed(set.id);
                  const owner = getSetOwner(set.id);
                  const canReroll = remainingRerolls > 0;
                  
                  return (
                    <Box key={set.id} sx={{ position: 'relative', display: 'inline-flex' }}>
                      <Chip
                        label={`${set.total} (${set.rolls.join(', ')})`}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, set)}
                        onDragEnd={handleDragEnd}
                        color={isUsed ? 'default' : 'primary'}
                        variant={isUsed ? 'outlined' : 'filled'}
                        size="medium"
                        sx={{ 
                          cursor: 'grab',
                          opacity: isUsed ? 0.6 : 1,
                          pr: canReroll ? 5 : 1, // Add padding for reroll button
                          '&:active': {
                            cursor: 'grabbing'
                          }
                        }}
                        title={isUsed ? `Används för ${owner}` : 'Dra till ett attribut'}
                      />
                      {canReroll && (
                        <Tooltip title={`Återkasta detta värde (${remainingRerolls} kvar)`}>
                          <IconButton
                            size="small"
                            onClick={() => handleRerollAnpassadSet(set.id)}
                            disabled={remainingRerolls <= 0}
                            sx={{
                              position: 'absolute',
                              right: 0,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              height: 24,
                              width: 24,
                              ml: 0.5
                            }}
                          >
                            <RefreshIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Attribut</TableCell>
                    <TableCell>Valt värde</TableCell>
                    {selectedRace?.modifiers && (
                      <TableCell align="right">Efter ras</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {EON_ATTRIBUTES.map(attr => {
                    const selectedSet = statsResult.sets.find(s => s.id === selectedAttributes[attr]);
                    const isDragOver = dragOverAttribute === attr;
                    
                    // Calculate race-modified value
                    // Get base value
                    let baseValue = selectedSet ? selectedSet.total : 0;
                    
                    // Apply feminine modifications if applicable
                    if (feminineAttributes && gender === 'kvinna') {
                      if (attr === 'STY') {
                        baseValue = baseValue - styDecrease;
                      } else if (femaleAttributeModifications[attr]) {
                        baseValue = baseValue + femaleAttributeModifications[attr];
                      }
                    }
                    
                    // Calculate race-modified value
                    let raceModifier = 0;
                    if (selectedRace?.modifiers) {
                      if (selectedRace.modifiers instanceof Map) {
                        raceModifier = selectedRace.modifiers.get(attr) || 0;
                      } else {
                        raceModifier = selectedRace.modifiers[attr] || 0;
                      }
                    }
                    const modifiedValue = selectedSet ? baseValue + raceModifier : null;
                    
                    return (
                      <TableRow 
                        key={attr}
                        onDragOver={(e) => handleDragOver(e, attr)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, attr)}
                        sx={{
                          bgcolor: isDragOver ? 'action.hover' : 'transparent',
                          '&:hover': {
                            bgcolor: 'action.hover'
                          }
                        }}
                      >
                        <TableCell><strong>{attr}</strong></TableCell>
                        <TableCell>
                          {selectedSet ? (
                            <Chip 
                              label={`${selectedSet.total} (${selectedSet.rolls.join(', ')})`}
                              color="primary"
                              size="small"
                              onDelete={() => {
                                const newSelected = { ...selectedAttributes };
                                newSelected[attr] = null;
                                setSelectedAttributes(newSelected);
                              }}
                            />
                          ) : (
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                p: 1, 
                                border: '2px dashed',
                                borderColor: 'divider',
                                borderRadius: 1,
                                textAlign: 'center'
                              }}
                            >
                              {isDragOver ? 'Släpp här' : 'Dra ett värde hit eller klicka för att välja'}
                            </Typography>
                          )}
                        </TableCell>
                        {selectedRace?.modifiers && (
                          <TableCell align="right">
                            {modifiedValue !== null ? (
                              <Typography 
                                variant="h6" 
                                sx={{ fontWeight: 'bold' }}
                              >
                                {modifiedValue}
                                {raceModifier !== 0 && (
                                  <Typography 
                                    component="span" 
                                    variant="caption" 
                                    color="text.secondary"
                                    sx={{ ml: 0.5 }}
                                  >
                                    ({raceModifier > 0 ? '+' : ''}{raceModifier})
                                  </Typography>
                                )}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary">—</Typography>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Fallback: Also show clickable chips below table for mobile/touch users */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                Eller klicka på ett attribut och välj sedan ett värde:
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                <Table size="small">
                  <TableBody>
                    {EON_ATTRIBUTES.map(attr => {
                      return (
                        <TableRow key={attr}>
                          <TableCell><strong>{attr}</strong></TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {statsResult.sets.map(set => {
                                const isSelected = selectedAttributes[attr] === set.id;
                                const isUsed = isSetUsed(set.id);
                                const owner = getSetOwner(set.id);
                                const isUsable = !isUsed || isSelected;
                                
                                return (
                                  <Chip
                                    key={set.id}
                                    label={`${set.total} (${set.rolls.join(', ')})`}
                                    onClick={() => isUsable ? handleSelectAnpassadSet(attr, set) : null}
                                    color={isSelected ? 'primary' : 'default'}
                                    variant={isSelected ? 'filled' : 'outlined'}
                                    size="small"
                                    sx={{ 
                                      cursor: isUsable ? 'pointer' : 'not-allowed',
                                      opacity: isUsed && !isSelected ? 0.5 : 1,
                                      '&:hover': {
                                        opacity: isUsable ? 1 : 0.5
                                      }
                                    }}
                                    title={isUsed && !isSelected ? `Används redan för ${owner}` : 
                                           isSelected ? 'Klicka för att ta bort' : 
                                           'Klicka för att välja'}
                                  />
                                );
                              })}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Attribut</strong></TableCell>
                  <TableCell><strong>Kast</strong></TableCell>
                  <TableCell align="right"><strong>Värde</strong></TableCell>
                  {selectedRace?.modifiers && (
                    <TableCell align="right"><strong>Efter ras</strong></TableCell>
                  )}
                  {canReroll && <TableCell align="center"><strong>Återkast</strong></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {EON_ATTRIBUTES.map(attr => {
                  // Get base value from stats result
                  let value = statsResult.attributes[attr];
                  
                  // Apply feminine modifications if applicable
                  if (feminineAttributes && gender === 'kvinna') {
                    if (attr === 'STY') {
                      value = value - styDecrease;
                    } else if (femaleAttributeModifications[attr]) {
                      value = value + femaleAttributeModifications[attr];
                    }
                  }
                  
                  const rolls = statsResult.rolls[attr];
                  
                  // Calculate race-modified value
                  // Handle both Map and plain object formats
                  let raceModifier = 0;
                  if (selectedRace?.modifiers) {
                    if (selectedRace.modifiers instanceof Map) {
                      raceModifier = selectedRace.modifiers.get(attr) || 0;
                    } else {
                      raceModifier = selectedRace.modifiers[attr] || 0;
                    }
                  }
                  const modifiedValue = value + raceModifier;
                  
                  let rollDisplay = '';
                  if (statRollMethod === 'höga attribut') {
                    rollDisplay = `${rolls.kept.join(', ')} (kastade: ${rolls.all.join(', ')}, slängd: ${rolls.dropped})`;
                  } else if (statRollMethod === 'hjälteattribut') {
                    rollDisplay = `${rolls.join(', ')} + 9`;
                  } else {
                    rollDisplay = rolls.join(', ');
                  }

                  return (
                    <TableRow key={attr}>
                      <TableCell><strong>{attr}</strong></TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {rollDisplay}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="h6">{value}</Typography>
                      </TableCell>
                      {selectedRace?.modifiers && (
                        <TableCell align="right">
                          <Typography 
                            variant="h6" 
                            sx={{ fontWeight: 'bold' }}
                          >
                            {modifiedValue}
                            {raceModifier !== 0 && (
                              <Typography 
                                component="span" 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ ml: 0.5 }}
                              >
                                ({raceModifier > 0 ? '+' : ''}{raceModifier})
                              </Typography>
                            )}
                          </Typography>
                        </TableCell>
                      )}
                      {canReroll && (
                        <TableCell align="center">
                          <Tooltip title={`Återkasta ${attr} (${remainingRerolls} kvar)`}>
                            <IconButton 
                              size="small" 
                              onClick={() => handleRerollStat(attr)}
                              disabled={remainingRerolls <= 0}
                              color="primary"
                            >
                              <RefreshIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Avbryt</Button>
        <Button 
          onClick={handleRerollAll} 
          variant="outlined"
          disabled={remainingRerolls <= 0 && freeRerollAllCount <= 0}
          startIcon={<RefreshIcon />}
        >
          Slå om allt
          {freeRerollAllCount > 0 && ` (${freeRerollAllCount} gratis kvar)`}
        </Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained"
          disabled={
            (statRollMethod === 'anpassad' && !EON_ATTRIBUTES.every(attr => selectedAttributes[attr] !== null)) ||
            (feminineAttributes && gender === 'kvinna' && 
             Object.values(femaleAttributeModifications).reduce((a, b) => a + b, 0) !== styDecrease)
          }
        >
          Bekräfta
        </Button>
      </DialogActions>
    </>
  );
}

StatRollingDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onStateChange: PropTypes.func,
  savedState: PropTypes.object,
  statRollMethod: PropTypes.string,
  rerolls: PropTypes.number,
  selectedRace: PropTypes.object,
  feminineAttributes: PropTypes.bool,
  minAttributes: PropTypes.number,
  maxAttributes: PropTypes.number
};

