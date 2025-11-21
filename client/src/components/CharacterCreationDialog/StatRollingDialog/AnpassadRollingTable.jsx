import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CasinoIcon from '@mui/icons-material/Casino';
import DiceRollDisplay from '../../DiceRollDisplay';
import { EON_ATTRIBUTES } from '../../../utils/dice';
import { rollT6Multiple } from '../../../utils/dice';
import { applyAttributeConstraints, getRaceModifier, calculateFinalAttributeValue } from '../../../utils/statRollingUtils';

/**
 * Available sets pool component
 */
const AvailableSetsPool = ({ sets, statsResult, setStatsResult, remainingRerolls, onRerollSet, isSetUsed, getSetOwner, handleDragStart, handleDragEnd }) => {
  const handleRollNewValue = () => {
    const rollResult = rollT6Multiple(3);
    const total = rollResult.reduce((a, b) => a + b, 0);
    const constrained = applyAttributeConstraints({ temp: total });
    const newSet = {
      id: Date.now(),
      rolls: rollResult,
      total: constrained.temp
    };
    const newResult = { ...statsResult };
    newResult.sets = [...(newResult.sets || []), newSet];
    newResult.sets.sort((a, b) => b.total - a.total);
    setStatsResult(newResult);
  };

  return (
    <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2">
          Tillgängliga värden:
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<CasinoIcon />}
          onClick={handleRollNewValue}
        >
          Rulla nytt värde
        </Button>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {(sets || []).map(set => {
          const isUsed = isSetUsed(set.id);
          const owner = getSetOwner(set.id);
          const canReroll = remainingRerolls > 0;
          
          return (
            <Box key={set.id} sx={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <Chip
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <DiceRollDisplay 
                      rolls={set.rolls} 
                      diceType="T6" 
                      size="small"
                    />
                    <Typography variant="body2" sx={{ ml: 0.5, fontWeight: 'bold' }}>
                      = {set.total}
                    </Typography>
                  </Box>
                }
                draggable={true}
                onDragStart={(e) => handleDragStart(e, set)}
                onDragEnd={handleDragEnd}
                color={isUsed ? 'default' : 'primary'}
                variant={isUsed ? 'outlined' : 'filled'}
                size="medium"
                sx={{ 
                  cursor: 'grab',
                  opacity: isUsed ? 0.6 : 1,
                  pr: canReroll ? 5 : 1,
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
                    onClick={() => onRerollSet(set.id)}
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
  );
};

AvailableSetsPool.propTypes = {
  sets: PropTypes.array,
  statsResult: PropTypes.object.isRequired,
  setStatsResult: PropTypes.func.isRequired,
  remainingRerolls: PropTypes.number.isRequired,
  onRerollSet: PropTypes.func.isRequired,
  isSetUsed: PropTypes.func.isRequired,
  getSetOwner: PropTypes.func.isRequired,
  handleDragStart: PropTypes.func.isRequired,
  handleDragEnd: PropTypes.func.isRequired
};

/**
 * Attribute selection table for anpassad method
 */
const AttributeSelectionTable = ({ 
  statsResult, 
  selectedAttributes, 
  setSelectedAttributes,
  selectedRace,
  dragOverAttribute,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  feminineAttributes,
  gender,
  styDecrease,
  femaleAttributeModifications
}) => {
  return (
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
            const selectedSet = statsResult?.sets?.find(s => s.id === selectedAttributes[attr]);
            const isDragOver = dragOverAttribute === attr;
            
            let baseValue = selectedSet ? selectedSet.total : 0;
            
            // Apply feminine modifications if applicable
            baseValue = calculateFinalAttributeValue(
              baseValue,
              attr,
              feminineAttributes,
              gender,
              styDecrease,
              femaleAttributeModifications
            );
            
            const raceModifier = getRaceModifier(selectedRace, attr);
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <DiceRollDisplay 
                        rolls={selectedSet.rolls} 
                        diceType="T6" 
                        size="small"
                      />
                      <Chip 
                        label={`= ${selectedSet.total}`}
                        color="primary"
                        size="small"
                        onDelete={() => {
                          const newSelected = { ...selectedAttributes };
                          newSelected[attr] = null;
                          setSelectedAttributes(newSelected);
                        }}
                      />
                    </Box>
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
  );
};

AttributeSelectionTable.propTypes = {
  statsResult: PropTypes.object.isRequired,
  selectedAttributes: PropTypes.object.isRequired,
  setSelectedAttributes: PropTypes.func.isRequired,
  selectedRace: PropTypes.object,
  dragOverAttribute: PropTypes.string,
  handleDragOver: PropTypes.func.isRequired,
  handleDragLeave: PropTypes.func.isRequired,
  handleDrop: PropTypes.func.isRequired,
  feminineAttributes: PropTypes.bool,
  gender: PropTypes.string.isRequired,
  styDecrease: PropTypes.number.isRequired,
  femaleAttributeModifications: PropTypes.object.isRequired
};

/**
 * Clickable chips fallback table for mobile/touch users
 */
const ClickableChipsTable = ({ 
  statsResult, 
  selectedAttributes, 
  onSelectSet,
  isSetUsed,
  getSetOwner
}) => {
  return (
    <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
      <Typography variant="caption" color="text.secondary" gutterBottom display="block">
        Eller klicka på ett attribut och välj sedan ett värde:
      </Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
        <Table size="small">
          <TableBody>
            {EON_ATTRIBUTES.map(attr => (
              <TableRow key={attr}>
                <TableCell><strong>{attr}</strong></TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(statsResult.sets || []).map(set => {
                      const isSelected = selectedAttributes[attr] === set.id;
                      const isUsed = isSetUsed(set.id);
                      const owner = getSetOwner(set.id);
                      const isUsable = !isUsed || isSelected;
                      
                      return (
                        <Chip
                          key={set.id}
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <DiceRollDisplay 
                                rolls={set.rolls} 
                                diceType="T6" 
                                size="small"
                              />
                              <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 'bold' }}>
                                = {set.total}
                              </Typography>
                            </Box>
                          }
                          onClick={() => isUsable ? onSelectSet(attr, set) : null}
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
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

ClickableChipsTable.propTypes = {
  statsResult: PropTypes.object.isRequired,
  selectedAttributes: PropTypes.object.isRequired,
  onSelectSet: PropTypes.func.isRequired,
  isSetUsed: PropTypes.func.isRequired,
  getSetOwner: PropTypes.func.isRequired
};

/**
 * Main AnpassadRollingTable component
 */
export default function AnpassadRollingTable({
  statsResult,
  setStatsResult,
  selectedAttributes,
  setSelectedAttributes,
  selectedRace,
  remainingRerolls,
  onRerollSet,
  draggedSet,
  setDraggedSet,
  dragOverAttribute,
  setDragOverAttribute,
  handleSelectSet,
  handleDragStart,
  handleDragEnd,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  isSetUsed,
  getSetOwner,
  feminineAttributes,
  gender,
  styDecrease,
  femaleAttributeModifications
}) {
  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Klicka på &quot;Rulla nytt värde&quot; för att skapa värden. Dra ett värde från poolen och släpp på ett attribut, eller klicka för att välja.
      </Alert>
      
      <AvailableSetsPool
        sets={statsResult?.sets}
        statsResult={statsResult}
        setStatsResult={setStatsResult}
        remainingRerolls={remainingRerolls}
        onRerollSet={onRerollSet}
        isSetUsed={isSetUsed}
        getSetOwner={getSetOwner}
        handleDragStart={handleDragStart}
        handleDragEnd={handleDragEnd}
      />

      <AttributeSelectionTable
        statsResult={statsResult}
        selectedAttributes={selectedAttributes}
        setSelectedAttributes={setSelectedAttributes}
        selectedRace={selectedRace}
        dragOverAttribute={dragOverAttribute}
        handleDragOver={handleDragOver}
        handleDragLeave={handleDragLeave}
        handleDrop={handleDrop}
        feminineAttributes={feminineAttributes}
        gender={gender}
        styDecrease={styDecrease}
        femaleAttributeModifications={femaleAttributeModifications}
      />
      
      <ClickableChipsTable
        statsResult={statsResult}
        selectedAttributes={selectedAttributes}
        onSelectSet={handleSelectSet}
        isSetUsed={isSetUsed}
        getSetOwner={getSetOwner}
      />
    </Box>
  );
}

AnpassadRollingTable.propTypes = {
  statsResult: PropTypes.object.isRequired,
  setStatsResult: PropTypes.func.isRequired,
  selectedAttributes: PropTypes.object.isRequired,
  setSelectedAttributes: PropTypes.func.isRequired,
  selectedRace: PropTypes.object,
  remainingRerolls: PropTypes.number.isRequired,
  onRerollSet: PropTypes.func.isRequired,
  draggedSet: PropTypes.object,
  setDraggedSet: PropTypes.func.isRequired,
  dragOverAttribute: PropTypes.string,
  setDragOverAttribute: PropTypes.func.isRequired,
  handleSelectSet: PropTypes.func.isRequired,
  handleDragStart: PropTypes.func.isRequired,
  handleDragEnd: PropTypes.func.isRequired,
  handleDragOver: PropTypes.func.isRequired,
  handleDragLeave: PropTypes.func.isRequired,
  handleDrop: PropTypes.func.isRequired,
  isSetUsed: PropTypes.func.isRequired,
  getSetOwner: PropTypes.func.isRequired,
  feminineAttributes: PropTypes.bool,
  gender: PropTypes.string.isRequired,
  styDecrease: PropTypes.number.isRequired,
  femaleAttributeModifications: PropTypes.object.isRequired
};

