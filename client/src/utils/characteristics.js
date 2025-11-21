/**
 * Characteristics constants and utility functions
 */

export const CHARACTERISTICS = [
  { key: 'Lojalitet', fixed: false },
  { key: 'Heder', fixed: false },
  { key: 'Amor', fixed: false },
  { key: 'Aggression', fixed: false },
  { key: 'Tro', fixed: false },
  { key: 'Generositet', fixed: false },
  { key: 'Rykte', fixed: true, value: 5 },
  { key: 'Tur', fixed: true, value: 11 }
];

/**
 * Helper to match characteristic by full name or first 3 characters
 */
export const matchesCharacteristic = (charKey, recommendation) => {
  const charLower = charKey.toLowerCase();
  const recLower = recommendation.toLowerCase();
  return charLower === recLower || charLower.substring(0, 3) === recLower.substring(0, 3);
};

/**
 * Initialize characteristics with race recommendations
 */
export const initializeCharacteristics = (selectedRace, existingCharacteristics = {}) => {
  if (existingCharacteristics && Object.keys(existingCharacteristics).length > 0) {
    return existingCharacteristics;
  }

  const highCharacteristics = selectedRace?.metadata?.highCharacteristics || [];
  const lowCharacteristics = selectedRace?.metadata?.lowCharacteristics || [];
  
  const initial = {};
  CHARACTERISTICS.forEach(char => {
    if (char.fixed) {
      initial[char.key] = char.value;
    } else {
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
  
  return initial;
};

/**
 * Get characteristic value (handles fixed vs editable)
 */
export const getCharacteristicValue = (characteristicKey, characteristics, defaultFixedValue = null) => {
  const char = CHARACTERISTICS.find(c => c.key === characteristicKey);
  if (char?.fixed) {
    return char.value;
  }
  return characteristics[characteristicKey] !== undefined && characteristics[characteristicKey] !== '' 
    ? characteristics[characteristicKey] 
    : (defaultFixedValue !== null ? defaultFixedValue : 11);
};

/**
 * Check if characteristic has high specialization (value >= 14)
 */
export const hasHighSpecialization = (characteristicKey, characteristics) => {
  const char = CHARACTERISTICS.find(c => c.key === characteristicKey);
  if (char?.fixed) return false;
  const value = getCharacteristicValue(characteristicKey, characteristics);
  return typeof value === 'number' && value >= 14;
};

/**
 * Check if characteristic has low specialization (value <= 7)
 */
export const hasLowSpecialization = (characteristicKey, characteristics) => {
  const char = CHARACTERISTICS.find(c => c.key === characteristicKey);
  if (char?.fixed) return false;
  const value = getCharacteristicValue(characteristicKey, characteristics);
  return typeof value === 'number' && value <= 7;
};

/**
 * Get race recommendations for a characteristic
 */
export const getRaceRecommendations = (characteristicKey, selectedRace) => {
  const highCharacteristics = selectedRace?.metadata?.highCharacteristics || [];
  const lowCharacteristics = selectedRace?.metadata?.lowCharacteristics || [];
  
  return {
    isHighRecommended: highCharacteristics.some(rec => matchesCharacteristic(characteristicKey, rec)),
    isLowRecommended: lowCharacteristics.some(rec => matchesCharacteristic(characteristicKey, rec))
  };
};

