import { rollT6Multiple } from './dice';

/**
 * Applies min/max constraints to attribute values
 * @param {Object} attributes - Object with attribute values
 * @param {number|null} minAttributes - Minimum value constraint
 * @param {number|null} maxAttributes - Maximum value constraint
 * @returns {Object} Constrained attributes
 */
export const applyAttributeConstraints = (attributes, minAttributes = null, maxAttributes = null) => {
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

/**
 * Rolls a single attribute based on the stat roll method
 * @param {string} statRollMethod - The rolling method ('standard', 'höga attribut', 'hjälteattribut')
 * @param {number|null} minAttributes - Minimum value constraint
 * @param {number|null} maxAttributes - Maximum value constraint
 * @returns {Object} { rolls, total }
 */
export const rollSingleAttribute = (statRollMethod, minAttributes = null, maxAttributes = null) => {
  let rolls;
  let total;
  
  if (statRollMethod === 'höga attribut') {
    const allRolls = rollT6Multiple(4);
    const sortedRolls = [...allRolls].sort((a, b) => a - b);
    const dropped = sortedRolls[0];
    const kept = sortedRolls.slice(1);
    rolls = { all: allRolls, kept, dropped };
    total = kept.reduce((a, b) => a + b, 0);
  } else if (statRollMethod === 'hjälteattribut') {
    rolls = rollT6Multiple(2);
    total = rolls.reduce((a, b) => a + b, 0) + 9;
  } else {
    // Standard method
    rolls = rollT6Multiple(3);
    total = rolls.reduce((a, b) => a + b, 0);
  }
  
  // Apply constraints
  const constrained = applyAttributeConstraints({ temp: total }, minAttributes, maxAttributes);
  total = constrained.temp;
  
  return { rolls, total };
};

/**
 * Gets race modifier for an attribute
 * @param {Object} selectedRace - The selected race object
 * @param {string} attr - Attribute name
 * @returns {number} Race modifier value
 */
export const getRaceModifier = (selectedRace, attr) => {
  if (!selectedRace?.modifiers) return 0;
  
  if (selectedRace.modifiers instanceof Map) {
    return selectedRace.modifiers.get(attr) || 0;
  }
  
  return selectedRace.modifiers[attr] || 0;
};

/**
 * Calculates final attribute value with feminine modifications
 * @param {number} baseValue - Base attribute value
 * @param {string} attr - Attribute name
 * @param {boolean} feminineAttributes - Whether feminine attributes are enabled
 * @param {string} gender - Current gender
 * @param {number} styDecrease - STY decrease amount
 * @param {Object} femaleAttributeModifications - Modifications object
 * @returns {number} Final attribute value
 */
export const calculateFinalAttributeValue = (
  baseValue,
  attr,
  feminineAttributes,
  gender,
  styDecrease,
  femaleAttributeModifications
) => {
  if (!feminineAttributes || gender !== 'kvinna') {
    return baseValue;
  }
  
  if (attr === 'STY') {
    return baseValue - styDecrease;
  }
  
  if (femaleAttributeModifications[attr]) {
    return baseValue + femaleAttributeModifications[attr];
  }
  
  return baseValue;
};

