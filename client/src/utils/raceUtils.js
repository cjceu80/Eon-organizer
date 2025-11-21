/**
 * Utility functions for race data processing
 */

/**
 * Formats a modifier value for display
 * @param {number} value - The modifier value
 * @returns {string} Formatted modifier string
 */
export const formatModifier = (value) => {
  if (value === 0) return '0';
  return value > 0 ? `+${value}` : `${value}`;
};

/**
 * Extracts modifiers from a race object, handling both Map and plain object formats
 * @param {Object} race - The race object
 * @returns {Object} Plain object with modifier key-value pairs
 */
export const getModifiersFromRace = (race) => {
  const modifiers = {};
  if (race.modifiers && typeof race.modifiers === 'object') {
    if (race.modifiers instanceof Map) {
      race.modifiers.forEach((value, key) => {
        modifiers[key] = value;
      });
    } else {
      Object.entries(race.modifiers).forEach(([key, value]) => {
        modifiers[key] = value;
      });
    }
  }
  return modifiers;
};

/**
 * Extracts description from race metadata, handling both Map and plain object formats
 * @param {Object} race - The race object
 * @returns {string} Description text or default message
 */
export const getRaceDescription = (race) => {
  const defaultDescription = 'Ingen beskrivning';
  if (!race.metadata) return defaultDescription;

  if (race.metadata instanceof Map) {
    return race.metadata.get('description') || defaultDescription;
  }
  
  if (typeof race.metadata === 'object') {
    return race.metadata.description || defaultDescription;
  }

  return defaultDescription;
};

/**
 * Formats description text into paragraphs for display
 * @param {string} text - The description text
 * @returns {string[]} Array of paragraph strings
 */
export const formatDescription = (text) => {
  if (!text) return [];
  
  // First try splitting by double line breaks (paragraph breaks)
  if (text.includes('\n\n')) {
    return text.split('\n\n').filter(p => p.trim());
  }
  
  // Then try splitting by single line breaks
  if (text.includes('\n')) {
    return text.split('\n').filter(p => p.trim());
  }
  
  // Otherwise, split by sentences (period followed by space or end of string)
  const sentences = text.split(/\.(\s+|$)/).filter(s => s.trim());
  const paragraphs = [];
  let currentParagraph = '';
  
  sentences.forEach((sentence, index) => {
    const trimmed = sentence.trim();
    if (!trimmed) return;
    
    currentParagraph += (currentParagraph ? '. ' : '') + trimmed;
    
    // Group 2-3 sentences per paragraph, or break at end
    if ((index + 1) % 2 === 0 || index === sentences.length - 1) {
      if (currentParagraph && !currentParagraph.endsWith('.')) {
        currentParagraph += '.';
      }
      paragraphs.push(currentParagraph);
      currentParagraph = '';
    }
  });
  
  return paragraphs.length > 0 ? paragraphs : [text];
};

/**
 * Groups races by category
 * @param {Array} races - Array of race objects
 * @returns {Object} Object mapping category names to arrays of races
 */
export const groupRacesByCategory = (races) => {
  const categoryMap = {};
  races.forEach(race => {
    const categoryName = race.category || 'Okategoriserade';
    if (!categoryMap[categoryName]) {
      categoryMap[categoryName] = [];
    }
    categoryMap[categoryName].push(race);
  });
  return categoryMap;
};

/**
 * Gets unique category names from races, sorted alphabetically
 * @param {Array} races - Array of race objects
 * @returns {string[]} Sorted array of unique category names
 */
export const getUniqueCategories = (races) => {
  const uniqueCategories = new Set();
  races.forEach(race => {
    uniqueCategories.add(race.category || 'Okategoriserade');
  });
  return Array.from(uniqueCategories).sort();
};

