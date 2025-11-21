import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert
} from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';
import { EON_ATTRIBUTES, rollT6Multiple } from '../../../utils/dice';
import { useStatRollingState } from '../../../utils/useStatRollingState';
import { rollSingleAttribute, applyAttributeConstraints } from '../../../utils/statRollingUtils';
import GenderSelection from './GenderSelection';
import FeminineAttributeModifications from './FeminineAttributeModifications';
import AnpassadRollingTable from './AnpassadRollingTable';
import StandardRollingTable from './StandardRollingTable';

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
  const {
    statsResult,
    setStatsResult,
    selectedAttributes,
    setSelectedAttributes,
    remainingRerolls,
    setRemainingRerolls,
    gender,
    setGender,
    styDecrease,
    setStyDecrease,
    femaleAttributeModifications,
    setFemaleAttributeModifications
  } = useStatRollingState({
    savedState,
    rerolls,
    statRollMethod,
    onStateChange
  });

  const [draggedSet, setDraggedSet] = useState(null);
  const [dragOverAttribute, setDragOverAttribute] = useState(null);

  const handleRollAttribute = (attr) => {
    if (!statsResult) {
      const result = {
        attributes: {},
        rolls: {}
      };
      setStatsResult(result);
    }
    
    const { rolls, total } = rollSingleAttribute(statRollMethod, minAttributes, maxAttributes);
    
    const newResult = { ...statsResult };
    newResult.attributes[attr] = total;
    newResult.rolls[attr] = rolls;
    setStatsResult(newResult);
  };

  const handleRollAll = () => {
    if (!statsResult) {
      const result = {
        attributes: {},
        rolls: {},
        sets: statRollMethod === 'anpassad' ? [] : undefined
      };
      setStatsResult(result);
    }
    
    const newResult = { ...statsResult };
    newResult.attributes = {};
    newResult.rolls = {};
    
    EON_ATTRIBUTES.forEach(attr => {
      const { rolls, total } = rollSingleAttribute(statRollMethod, minAttributes, maxAttributes);
      newResult.attributes[attr] = total;
      newResult.rolls[attr] = rolls;
    });
    
    setStatsResult(newResult);
  };

  const handleRerollStat = (attribute) => {
    if (remainingRerolls <= 0) return;

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
        return;
    }

    const constrained = applyAttributeConstraints({ [attribute]: newResult.attributes[attribute] }, minAttributes, maxAttributes);
    newResult.attributes[attribute] = constrained[attribute];

    setStatsResult(newResult);
    setRemainingRerolls(prev => prev - 1);
  };

  const handleRerollAnpassadSet = (setId) => {
    if (remainingRerolls <= 0) return;

    const newResult = { ...statsResult };
    const setIndex = newResult.sets.findIndex(s => s.id === setId);
    
    if (setIndex === -1) return;

    const rollResult = rollT6Multiple(3);
    let total = rollResult.reduce((a, b) => a + b, 0);
    
    const constrained = applyAttributeConstraints({ temp: total }, minAttributes, maxAttributes);
    total = constrained.temp;
    
    const newSet = {
      id: setId,
      rolls: rollResult,
      total: total
    };

    newResult.sets[setIndex] = newSet;
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
        const selectedSet = statsResult?.sets?.find(s => s.id === selectedAttributes[attr]);
        if (selectedSet) {
          baseAttributes[attr] = selectedSet.total;
        }
      });
    } else {
      baseAttributes = { ...(statsResult?.attributes || {}) };
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
        const selectedSet = statsResult?.sets?.find(s => s.id === selectedAttributes[attr]);
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
          const selectedSet = statsResult?.sets?.find(s => s.id === selectedAttributes[attr]);
          if (selectedSet) {
            baseAttributes[attr] = selectedSet.total;
          }
        });
      } else {
        baseAttributes = { ...(statsResult?.attributes || {}) };
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
      const baseAttributes = { ...(statsResult?.attributes || {}) };

      onConfirm({
        attributes: finalAttributes,
        baseAttributes: baseAttributes, // Base rolled values (before race modifiers, before feminine modifications)
        rolls: statsResult?.rolls || {},
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

  const handleStyDecreaseChange = (newValue, currentMods) => {
    const maxDecrease = Math.min(2, statsResult?.attributes?.STY || 0);
    const validValue = Math.max(0, Math.min(newValue, maxDecrease));
    setStyDecrease(validValue);
    
    const currentTotal = Object.values(currentMods).reduce((a, b) => a + b, 0);
    if (currentTotal > validValue) {
      const excess = currentTotal - validValue;
      const newMods = { ...currentMods };
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

  const handleModificationChange = (attr, value) => {
    const maxIncrease = styDecrease - Object.values(femaleAttributeModifications).reduce((a, b) => a + b, 0) + femaleAttributeModifications[attr];
    const validValue = Math.max(0, Math.min(value, maxIncrease));
    
    const newMods = { ...femaleAttributeModifications };
    newMods[attr] = validValue;
    setFemaleAttributeModifications(newMods);
  };

  const canReroll = remainingRerolls > 0 && statRollMethod !== 'anpassad';

  return (
    <>
      <DialogTitle>
        Slå attribut
        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
          Metod: {statRollMethod === 'standard' ? 'Standard' : 
                  statRollMethod === 'anpassad' ? 'Anpassad' :
                  statRollMethod === 'höga attribut' ? 'Höga attribut' : 'Hjälteattribut'}
        </Typography>
        <Alert severity="info" sx={{ mt: 1, mb: 0 }}>
          Klicka på tärningsikonen för varje attribut för att rulla det individuellt.
        </Alert>
      </DialogTitle>
      <DialogContent>
        <GenderSelection gender={gender} onChange={setGender} />

        <FeminineAttributeModifications
          statsResult={statsResult}
          gender={gender}
          styDecrease={styDecrease}
          femaleAttributeModifications={femaleAttributeModifications}
          onStyDecreaseChange={handleStyDecreaseChange}
          onModificationChange={handleModificationChange}
        />

        {statRollMethod === 'anpassad' ? (
          <AnpassadRollingTable
            statsResult={statsResult}
            setStatsResult={setStatsResult}
            selectedAttributes={selectedAttributes}
            setSelectedAttributes={setSelectedAttributes}
            selectedRace={selectedRace}
            remainingRerolls={remainingRerolls}
            onRerollSet={handleRerollAnpassadSet}
            draggedSet={draggedSet}
            setDraggedSet={setDraggedSet}
            dragOverAttribute={dragOverAttribute}
            setDragOverAttribute={setDragOverAttribute}
            handleSelectSet={handleSelectAnpassadSet}
            handleDragStart={handleDragStart}
            handleDragEnd={handleDragEnd}
            handleDragOver={handleDragOver}
            handleDragLeave={handleDragLeave}
            handleDrop={handleDrop}
            isSetUsed={isSetUsed}
            getSetOwner={getSetOwner}
            feminineAttributes={feminineAttributes}
            gender={gender}
            styDecrease={styDecrease}
            femaleAttributeModifications={femaleAttributeModifications}
          />
        ) : (
          <StandardRollingTable
            statsResult={statsResult}
            onRollAttribute={handleRollAttribute}
            onRerollStat={handleRerollStat}
            selectedRace={selectedRace}
            canReroll={canReroll}
            remainingRerolls={remainingRerolls}
            statRollMethod={statRollMethod}
            feminineAttributes={feminineAttributes}
            gender={gender}
            styDecrease={styDecrease}
            femaleAttributeModifications={femaleAttributeModifications}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Avbryt</Button>
        {statRollMethod !== 'anpassad' && (
          <Button 
            onClick={handleRollAll}
            variant="outlined"
            startIcon={<CasinoIcon />}
          >
            Rulla alla
          </Button>
        )}
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

