import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tooltip,
  Grid,
  TextField
} from '@mui/material';
import { rollT100WithDetails, rollT10 } from '../../../utils/dice';
import RollableTable from '../RollableTable';
import BirthdateDisplay from './BirthdateDisplay';

export default function BirthDialog({
  onClose,
  onConfirm,
  onStateChange = null,
  savedState = null,
  worldSettings = {},
  ageData = null
}) {
  const [backgroundData, setBackgroundData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Primitive state
  const [primitiveRoll, setPrimitiveRoll] = useState(null);
  const [selectedPrimitive, setSelectedPrimitive] = useState(null);
  const [primitiveDescription, setPrimitiveDescription] = useState('');
  
  // Civilized state
  const [monthRoll, setMonthRoll] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [dayRoll, setDayRoll] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [weekRoll, setWeekRoll] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [usePrimitive, setUsePrimitive] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState(worldSettings.defaultCalendar || 'Asharisk');

  // Update selectedCalendar when worldSettings.defaultCalendar changes
  useEffect(() => {
    if (worldSettings.defaultCalendar) {
      setSelectedCalendar(worldSettings.defaultCalendar);
    }
  }, [worldSettings.defaultCalendar]);

  // Track if saved state has been loaded to prevent re-loading
  const savedStateLoadedRef = useRef(false);

  // Load background data (only once)
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/copyrighted/background.json');
        if (response.ok) {
          const data = await response.json();
          setBackgroundData(data);
        } else {
          console.error('Failed to load background data');
          setBackgroundData({
            primitive: { table: [] },
            civilized: { months: [], weeks: [], weekdays: [] }
          });
        }
      } catch (err) {
        console.error('Error loading background data:', err);
        setBackgroundData({
          primitive: { table: [] },
          civilized: { months: [], weeks: [], weekdays: [] }
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Load saved state (only once when dialog opens with saved state)
  useEffect(() => {
    if (savedState && !savedStateLoadedRef.current) {
      isLoadingSavedStateRef.current = true;
      
      if (savedState.primitiveRoll) setPrimitiveRoll(savedState.primitiveRoll);
      if (savedState.selectedPrimitive !== undefined) setSelectedPrimitive(savedState.selectedPrimitive);
      if (savedState.primitiveDescription !== undefined) setPrimitiveDescription(savedState.primitiveDescription || '');
      if (savedState.monthRoll) setMonthRoll(savedState.monthRoll);
      if (savedState.selectedMonth !== undefined) setSelectedMonth(savedState.selectedMonth);
      if (savedState.dayRoll) setDayRoll(savedState.dayRoll);
      if (savedState.selectedDay !== undefined) setSelectedDay(savedState.selectedDay);
      if (savedState.weekRoll) setWeekRoll(savedState.weekRoll);
      if (savedState.selectedWeek !== undefined) setSelectedWeek(savedState.selectedWeek);
      if (savedState.usePrimitive !== undefined) setUsePrimitive(savedState.usePrimitive);
      if (savedState.selectedCalendar) setSelectedCalendar(savedState.selectedCalendar);
      
      savedStateLoadedRef.current = true;
      
      // Allow state saving after a brief delay to ensure all state updates are complete
      setTimeout(() => {
        isLoadingSavedStateRef.current = false;
      }, 100);
    }
    // Reset flag when dialog closes (savedState becomes null)
    if (!savedState) {
      savedStateLoadedRef.current = false;
      isLoadingSavedStateRef.current = false;
    }
  }, [savedState]);
  
  // Save state whenever it changes (using ref to avoid infinite loop)
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  // Track if we're currently loading saved state to prevent saving during load
  const isLoadingSavedStateRef = useRef(false);

  useEffect(() => {
    // Don't save state while we're loading saved state
    if (isLoadingSavedStateRef.current) {
      return;
    }
    
    if (onStateChangeRef.current) {
      const stateToSave = {
        birthState: {
          primitiveRoll,
          selectedPrimitive,
          primitiveDescription,
          monthRoll,
          selectedMonth,
          dayRoll,
          selectedDay,
          weekRoll,
          selectedWeek,
          usePrimitive,
          selectedCalendar
        }
      };
      onStateChangeRef.current(stateToSave);
    }
  }, [primitiveRoll, selectedPrimitive, primitiveDescription, monthRoll, selectedMonth, dayRoll, selectedDay, weekRoll, selectedWeek, usePrimitive, selectedCalendar]);

  // Update primitive description when selection changes
  useEffect(() => {
    if (selectedPrimitive && selectedPrimitive.description) {
      setPrimitiveDescription(selectedPrimitive.description || '');
    }
  }, [selectedPrimitive]);

  // No automatic rolling - user must press roll buttons

  const handleRollPrimitive = () => {
    const roll = rollT100WithDetails();
    setPrimitiveRoll(roll);
    
    // Find matching entry in table
    const table = backgroundData?.primitive?.table || [];
    const entry = table.find(e => roll.value >= e.min && roll.value <= e.max);
    if (entry) {
      setSelectedPrimitive(entry);
    }
  };

  const handleRollMonth = () => {
    const roll = rollT100WithDetails();
    setMonthRoll(roll);
    
    // Find matching month
    const months = backgroundData?.civilized?.months || [];
    const month = months.find(m => roll.value >= m.min && roll.value <= m.max);
    if (month) {
      setSelectedMonth(month);
    }
  };

  const handleRollDay = () => {
    const roll = rollT10();
    setDayRoll(roll);
    
    // Find matching day
    const weekdays = backgroundData?.civilized?.weekdays || [];
    const day = weekdays.find(w => roll >= w.min && roll <= w.max);
    if (day) {
      setSelectedDay(day);
    }
  };

  const handleRollWeek = () => {
    const roll = rollT10();
    setWeekRoll(roll);
    
    // Reset primitive and day if rolling week again
    setUsePrimitive(false);
    setPrimitiveRoll(null);
    setSelectedPrimitive(null);
    setPrimitiveDescription('');
    setDayRoll(null);
    setSelectedDay(null);
    
    // Find matching week
    const weeks = backgroundData?.civilized?.weeks || [];
    const week = weeks.find(w => roll >= w.min && roll <= w.max);
    if (week) {
      setSelectedWeek(week);
      // If week is 9-10, set usePrimitive flag (user must roll primitive manually)
      if (roll >= 9 && roll <= 10) {
        setUsePrimitive(true);
      }
      // If week is not 9-10, user must roll day manually
    }
  };

  const handleSelectWeek = (week) => {
    setSelectedWeek(week);
    setWeekRoll(week.min);
    if (week.min >= 9 && week.min <= 10) {
      setUsePrimitive(true);
      setDayRoll(null);
      setSelectedDay(null);
    } else {
      setUsePrimitive(false);
      setPrimitiveRoll(null);
      setSelectedPrimitive(null);
      setPrimitiveDescription('');
      setDayRoll(null);
      setSelectedDay(null);
    }
  };

  const handleSelectDay = (day) => {
    setSelectedDay(day);
    setDayRoll(day.min);
  };

  const handleConfirm = () => {
    if (!selectedMonth || !selectedWeek) {
      alert('Du måste slå för månad och vecka!');
      return;
    }
    if (usePrimitive && !selectedPrimitive) {
      alert('Du måste välja eller slå för primitiv bakgrund när födelsedagen är okänd!');
      return;
    }
    if (!usePrimitive && !selectedDay) {
      alert('Du måste slå för dag!');
      return;
    }
    onConfirm({
      month: {
        roll: monthRoll,
        selected: selectedMonth
      },
      week: {
        roll: weekRoll,
        selected: selectedWeek
      },
      day: !usePrimitive ? {
        roll: dayRoll,
        selected: selectedDay
      } : null,
      usePrimitive: usePrimitive,
      calendar: !usePrimitive ? selectedCalendar : null,
      primitive: usePrimitive ? {
        primitiveValue: primitiveRoll?.value,
        primitiveRoll: primitiveRoll,
        selectedEntry: selectedPrimitive,
        description: primitiveDescription
      } : null
    });
  };

  if (loading) {
    return (
      <>
        <DialogTitle>Födelsedag</DialogTitle>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <Typography>Laddar...</Typography>
          </Box>
        </DialogContent>
      </>
    );
  }

  return (
    <>
      <DialogTitle>Födelsedag</DialogTitle>
      <DialogContent>
        <BirthdateDisplay
          usePrimitive={usePrimitive}
          selectedPrimitive={selectedPrimitive}
          primitiveDescription={primitiveDescription}
          selectedDay={selectedDay}
          selectedMonth={selectedMonth}
          selectedWeek={selectedWeek}
          selectedCalendar={selectedCalendar}
          onCalendarChange={setSelectedCalendar}
          ageData={ageData}
          worldSettings={worldSettings}
        />

        {/* Content */}
        {backgroundData && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Födelsedag
            </Typography>
            {backgroundData.civilized?.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {backgroundData.civilized.description}
              </Typography>
            )}

            <Grid container spacing={3}>
              {/* Month */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <RollableTable
                  title="1. Månad"
                  rollLabel="Slå T100"
                  rollValue={monthRoll}
                  rollDetails={monthRoll ? `(T100: ${monthRoll.value === 100 ? '00' : `${monthRoll.tensDie}${monthRoll.onesDie}`})` : null}
                  onRoll={handleRollMonth}
                  entries={backgroundData.civilized?.months || []}
                  selectedEntry={selectedMonth}
                  onSelect={setSelectedMonth}
                  columns={[
                    { header: 'Colonisk', getContent: (m) => m.description1 },
                    { header: 'Jargisk', getContent: (m) => m.description2 },
                    { header: 'Asharisk', getContent: (m) => m.description3 }
                  ]}
                />
              </Grid>

              {/* Week */}
              {monthRoll && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <RollableTable
                    title="2. Vecka"
                    rollLabel="Slå T10"
                    rollValue={weekRoll}
                    rollDetails={weekRoll >= 9 && weekRoll <= 10 ? '(Födelsedagen är okänd - använd primitiv tabell)' : null}
                    onRoll={handleRollWeek}
                    entries={backgroundData.civilized?.weeks || []}
                    selectedEntry={selectedWeek}
                    onSelect={handleSelectWeek}
                    columns={[
                      { header: 'Vecka i månaden', getContent: (w) => w.description1 || w.description }
                    ]}
                  />

                  {/* Day - Only shown if week is not 9-10 */}
                  {selectedWeek && selectedWeek.min < 9 && (
                    <Box sx={{ mt: 3 }}>
                      <RollableTable
                        title="3. Dag"
                        rollLabel="Slå T10"
                        rollValue={dayRoll}
                        onRoll={handleRollDay}
                        entries={backgroundData.civilized?.weekdays || []}
                        selectedEntry={selectedDay}
                        onSelect={handleSelectDay}
                        columns={[
                          { header: 'Colonisk', getContent: (d) => d.description1 },
                          { header: 'Jargisk', getContent: (d) => d.description2 },
                          { header: 'Asharisk', getContent: (d) => d.description3 }
                        ]}
                      />
                    </Box>
                  )}

                  {/* Primitive - Only shown if week is 9-10 */}
                  {usePrimitive && (
                    <Box sx={{ mt: 3 }}>
                      <RollableTable
                        title="3. Primitiv tabell (Födelsedagen är okänd)"
                        titleColor="error"
                        rollLabel="Slå T100"
                        rollValue={primitiveRoll}
                        rollDetails={primitiveRoll ? `(T100: ${primitiveRoll.value === 100 ? '00' : `${primitiveRoll.tensDie}${primitiveRoll.onesDie}`})` : null}
                        onRoll={handleRollPrimitive}
                        entries={backgroundData.primitive?.table || []}
                        selectedEntry={selectedPrimitive}
                        onSelect={setSelectedPrimitive}
                        columns={[
                          { header: 'Beskrivning av födelsedag', getContent: (e) => e.description }
                        ]}
                      />
                      <Box sx={{ mt: 3 }}>
                        <Tooltip title="Dessa är förslag baserat på tabellen. Du kan redigera texten fritt enligt dina egna idéer." arrow>
                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Beskrivning av födelsedag"
                            value={primitiveDescription || ''}
                            onChange={(e) => setPrimitiveDescription(e.target.value || '')}
                            placeholder="Beskrivning kommer här..."
                            variant="outlined"
                          />
                        </Tooltip>
                      </Box>
                    </Box>
                  )}
                </Grid>
              )}
            </Grid>
          </Box>
        )}

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Avbryt</Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained"
          disabled={
            !selectedMonth || 
            !selectedWeek || 
            (usePrimitive && !selectedPrimitive) ||
            (!usePrimitive && !selectedDay)
          }
        >
          Bekräfta
        </Button>
      </DialogActions>
    </>
  );
}

BirthDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onStateChange: PropTypes.func,
  savedState: PropTypes.object,
  worldSettings: PropTypes.object,
  ageData: PropTypes.object
};

