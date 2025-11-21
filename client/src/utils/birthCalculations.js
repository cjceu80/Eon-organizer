/**
 * Calculate birthdate string from birth data
 */
export function calculateBirthdate({
  usePrimitive,
  selectedPrimitive,
  primitiveDescription,
  selectedDay,
  selectedMonth,
  selectedWeek,
  selectedCalendar,
  ageData,
  worldSettings
}) {
  if (!ageData || !ageData.age) {
    return null;
  }

  const currentYear = worldSettings?.currentYear || 2967;
  const birthYear = currentYear - ageData.age;

  if (usePrimitive && selectedPrimitive && primitiveDescription) {
    // Primitive format: <string> år <birthYear>
    return `${primitiveDescription} år ${birthYear}`;
  } else if (!usePrimitive && selectedDay && selectedMonth && selectedWeek) {
    // Civilized format: <day> <week> <month> <birthYear> in selected calendar
    // If day is 8-10, skip day description and go straight to week
    const isDayUnknown = selectedDay.min >= 8 && selectedDay.min <= 10;
    
    const weekName = selectedWeek.description1 || selectedWeek.description || '';
    const calendarIndex = selectedCalendar === 'Colonisk' ? '1' : selectedCalendar === 'Jargisk' ? '2' : '3';
    const monthName = selectedMonth[`description${calendarIndex}`] || '';
    
    if (isDayUnknown) {
      // Skip day description when day is 8-10
      return `${weekName} ${monthName} ${birthYear}`;
    } else {
      // Normal format with day
      const dayName = selectedDay[`description${calendarIndex}`] || '';
      return `${dayName} ${weekName} ${monthName} ${birthYear}`;
    }
  }
  
  return null;
}

