/**
 * Get sibling formula from race metadata first, then race category, then defaults
 */
export function getSiblingFormula(selectedRace, raceCategory) {
  // First, check if the race has siblingFormula in its metadata
  if (selectedRace?.metadata) {
    const metadata = selectedRace.metadata instanceof Map 
      ? Object.fromEntries(selectedRace.metadata) 
      : selectedRace.metadata;
    
    if (metadata.siblingFormula && typeof metadata.siblingFormula === 'object') {
      return metadata.siblingFormula;
    }
  }
  
  // Second, check race category
  if (raceCategory?.siblingFormula) {
    return raceCategory.siblingFormula;
  }
  
  // Finally, use defaults
  return {
    numberOfLitters: 'Ob1T6-2',
    litterSize: '1',
    olderSiblingAgeFormula: 'characterAge + Ob1T6',
    youngerSiblingAgeFormula: 'characterAge - Ob1T6',
    genderFormula: '0.5'
  };
}

/**
 * Get parent formula and table from race metadata first, then race category, then defaults
 */
export function getParentFormula(selectedRace, raceCategory) {
  const getDefaultParentTable = () => [
    { min: 1, max: 60, result: 'both parents alive' },
    { min: 61, max: 80, result: 'father unknown' },
    { min: 81, max: 88, result: 'mother alive' },
    { min: 89, max: 95, result: 'father alive' },
    { min: 96, max: 999, result: 'both dead' }
  ];

  // First, check if the race has parentFormula in its metadata
  if (selectedRace?.metadata) {
    const metadata = selectedRace.metadata instanceof Map 
      ? Object.fromEntries(selectedRace.metadata) 
      : selectedRace.metadata;
    
    if (metadata.parentFormula && typeof metadata.parentFormula === 'object') {
      return {
        formula: metadata.parentFormula.formula || '1T100 + characterApparentAge',
        table: metadata.parentFormula.table || getDefaultParentTable()
      };
    }
  }
  
  // Second, check race category
  if (raceCategory?.parentFormula) {
    return {
      formula: raceCategory.parentFormula.formula || '1T100 + characterApparentAge',
      table: raceCategory.parentFormula.table || getDefaultParentTable()
    };
  }
  
  // Finally, use defaults if no override exists
  return {
    formula: '1T100 + characterApparentAge',
    table: getDefaultParentTable()
  };
}

/**
 * Get parent age formula
 */
export function getParentAgeFormula(selectedRace, raceCategory) {
  // Priority: race metadata > race category > default
  if (selectedRace?.metadata) {
    const metadata = selectedRace.metadata instanceof Map 
      ? Object.fromEntries(selectedRace.metadata) 
      : selectedRace.metadata;
    
    if (metadata.parentAgeFormula && typeof metadata.parentAgeFormula === 'string') {
      return metadata.parentAgeFormula;
    }
  }
  
  if (raceCategory?.parentAgeFormula) {
    return raceCategory.parentAgeFormula;
  }
  
  // Default: (apparent age of oldest sibling or character if no older sibling) + 14 + Ob2T6
  return 'oldestSiblingOrCharacterApparentAge + 14 + Ob2T6';
}

/**
 * Get status label for parent status
 */
export function getStatusLabel(status) {
  const labels = {
    'both parents alive': 'Båda föräldrarna lever',
    'father unknown': 'Far okänd',
    'mother alive': 'Mor lever',
    'father alive': 'Far lever',
    'both dead': 'Båda döda'
  };
  return labels[status] || status;
}

/**
 * Get status color for parent status
 */
export function getStatusColor(status) {
  const colors = {
    'both parents alive': 'success',
    'father unknown': 'info',
    'mother alive': 'warning',
    'father alive': 'warning',
    'both dead': 'error'
  };
  return colors[status] || 'default';
}

