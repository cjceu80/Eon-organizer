import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Radio,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Alert
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { rollT100WithDetails, rollT10 } from '../../utils/dice';

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

  // Load background data
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
    
    // Load saved state
    if (savedState) {
      if (savedState.primitiveRoll) setPrimitiveRoll(savedState.primitiveRoll);
      if (savedState.selectedPrimitive !== undefined) setSelectedPrimitive(savedState.selectedPrimitive);
      if (savedState.primitiveDescription) setPrimitiveDescription(savedState.primitiveDescription);
      if (savedState.monthRoll) setMonthRoll(savedState.monthRoll);
      if (savedState.selectedMonth !== undefined) setSelectedMonth(savedState.selectedMonth);
      if (savedState.dayRoll) setDayRoll(savedState.dayRoll);
      if (savedState.selectedDay !== undefined) setSelectedDay(savedState.selectedDay);
      if (savedState.weekRoll) setWeekRoll(savedState.weekRoll);
      if (savedState.selectedWeek !== undefined) setSelectedWeek(savedState.selectedWeek);
      if (savedState.usePrimitive !== undefined) setUsePrimitive(savedState.usePrimitive);
      if (savedState.selectedCalendar) setSelectedCalendar(savedState.selectedCalendar);
    }
  }, [savedState]);
  
  // Save state whenever it changes (using ref to avoid infinite loop)
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    if (onStateChangeRef.current && backgroundData) {
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
  }, [primitiveRoll, selectedPrimitive, primitiveDescription, monthRoll, selectedMonth, dayRoll, selectedDay, weekRoll, selectedWeek, usePrimitive, selectedCalendar, backgroundData]);

  // Update primitive description when selection changes
  useEffect(() => {
    if (selectedPrimitive && selectedPrimitive.description) {
      setPrimitiveDescription(selectedPrimitive.description);
    }
  }, [selectedPrimitive]);

  // Auto-roll month when dialog opens (if no saved state)
  useEffect(() => {
    if (backgroundData && !monthRoll && !loading && !savedState) {
      // Roll month first
      const monthRollResult = rollT100WithDetails();
      setMonthRoll(monthRollResult);
      const months = backgroundData?.civilized?.months || [];
      const month = months.find(m => monthRollResult.value >= m.min && monthRollResult.value <= m.max);
      if (month) {
        setSelectedMonth(month);
      }
    }
  }, [backgroundData, monthRoll, loading, savedState]);

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
    }
    
    // If week is 9-10, use primitive
    if (roll >= 9 && roll <= 10) {
      setUsePrimitive(true);
      // Auto-roll primitive
      const primitiveRollResult = rollT100WithDetails();
      setPrimitiveRoll(primitiveRollResult);
      const primitiveTable = backgroundData?.primitive?.table || [];
      const primitiveEntry = primitiveTable.find(e => primitiveRollResult.value >= e.min && primitiveRollResult.value <= e.max);
      if (primitiveEntry) {
        setSelectedPrimitive(primitiveEntry);
      }
    } else {
      // If week is not 9-10, roll day
      const dayRollResult = rollT10();
      setDayRoll(dayRollResult);
      const weekdays = backgroundData?.civilized?.weekdays || [];
      const day = weekdays.find(w => dayRollResult >= w.min && dayRollResult <= w.max);
      if (day) {
        setSelectedDay(day);
      }
    }
  };

  // Calculate birthdate string
  const calculateBirthdate = () => {
    if (!ageData || !ageData.age) {
      return null;
    }

    const currentYear = worldSettings.currentYear || 2967;
    const birthYear = currentYear - ageData.age;

    if (usePrimitive && selectedPrimitive && primitiveDescription) {
      // Primitive format: <string> år <birthYear>
      return `${primitiveDescription} år ${birthYear}`;
    } else if (!usePrimitive && selectedDay && selectedMonth && selectedWeek) {
      // Civilized format: <day> <week> <month> <birthYear> in selected calendar
      // If day is 8-10, skip day description and go straight to week
      const isDayUnknown = selectedDay.min >= 8 && selectedDay.min <= 10;
      
      const weekName = selectedWeek.description1 || selectedWeek.description || '';
      const monthName = selectedMonth[`description${selectedCalendar === 'Colonisk' ? '1' : selectedCalendar === 'Jargisk' ? '2' : '3'}`] || '';
      
      if (isDayUnknown) {
        // Skip day description when day is 8-10
        return `${weekName} ${monthName} ${birthYear}`;
      } else {
        // Normal format with day
        const dayName = selectedDay[`description${selectedCalendar === 'Colonisk' ? '1' : selectedCalendar === 'Jargisk' ? '2' : '3'}`] || '';
        return `${dayName} ${weekName} ${monthName} ${birthYear}`;
      }
    }
    
    return null;
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
        {/* Birthdate Display */}
        {((usePrimitive && selectedPrimitive && primitiveDescription) || (!usePrimitive && selectedDay && selectedMonth && selectedWeek)) && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Födelsedatum
            </Typography>
            
            {!usePrimitive && (
              <Box sx={{ mb: 2 }}>
                <FormControl fullWidth size="small" sx={{ maxWidth: 300 }}>
                  <InputLabel>Kalender</InputLabel>
                  <Select
                    value={selectedCalendar}
                    label="Kalender"
                    onChange={(e) => setSelectedCalendar(e.target.value)}
                  >
                    <MenuItem value="Colonisk">Colonisk</MenuItem>
                    <MenuItem value="Jargisk">Jargisk</MenuItem>
                    <MenuItem value="Asharisk">Asharisk</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}

            {ageData && ageData.age ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body1">
                  <strong>{calculateBirthdate() || 'Beräknar...'}</strong>
                </Typography>
              </Alert>
            ) : (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Ålder saknas. Födelsedatum kan inte beräknas.
                </Typography>
              </Alert>
            )}
            <Divider sx={{ mt: 2, mb: 2 }} />
          </Box>
        )}

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
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    1. Månad
                  </Typography>
                  <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<RefreshIcon />}
                      onClick={handleRollMonth}
                    >
                      Slå T100
                    </Button>
                    {monthRoll && (
                      <Typography variant="body2">
                        <strong>{monthRoll.value}</strong>
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          (T100: {monthRoll.value === 100 ? '00' : `${monthRoll.tensDie}${monthRoll.onesDie}`})
                        </Typography>
                      </Typography>
                    )}
                  </Box>
                </Box>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell width="50px"></TableCell>
                        <TableCell><strong>Värde</strong></TableCell>
                        <TableCell><strong>Colonisk</strong></TableCell>
                        <TableCell><strong>Jargisk</strong></TableCell>
                        <TableCell><strong>Asharisk</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {backgroundData.civilized?.months?.map((month, index) => {
                        const isSelected = !!(selectedMonth && 
                          selectedMonth.min === month.min && 
                          selectedMonth.max === month.max);
                        const isRolled = monthRoll && 
                          monthRoll.value >= month.min && 
                          monthRoll.value <= month.max;
                        
                        return (
                          <TableRow 
                            key={index}
                            sx={{
                              bgcolor: isRolled ? 'action.selected' : 'transparent'
                            }}
                          >
                            <TableCell>
                              <Radio
                                checked={isSelected}
                                onChange={() => setSelectedMonth(month)}
                                value={`${month.min}-${month.max}`}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {month.min === month.max ? month.min : `${month.min}-${month.max}`}
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">
                                {month.description1}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">
                                {month.description2}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">
                                {month.description3}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              {/* Week */}
              {monthRoll && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      2. Vecka
                    </Typography>
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<RefreshIcon />}
                        onClick={handleRollWeek}
                      >
                        Slå T10
                      </Button>
                      {weekRoll && (
                        <Typography variant="body2">
                          <strong>{weekRoll}</strong>
                          {weekRoll >= 9 && weekRoll <= 10 && (
                            <Typography component="span" variant="caption" color="error.main" sx={{ ml: 1 }}>
                              (Födelsedagen är okänd - använd primitiv tabell)
                            </Typography>
                          )}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell width="50px"></TableCell>
                          <TableCell><strong>Värde</strong></TableCell>
                          <TableCell><strong>Vecka i månaden</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {backgroundData.civilized?.weeks?.map((week, index) => {
                          const isSelected = !!(selectedWeek && 
                            selectedWeek.min === week.min && 
                            selectedWeek.max === week.max);
                          const isRolled = weekRoll && 
                            weekRoll >= week.min && 
                            weekRoll <= week.max;
                          
                          return (
                            <TableRow 
                              key={index}
                              sx={{
                                bgcolor: isRolled ? 'action.selected' : 'transparent'
                              }}
                            >
                              <TableCell>
                              <Radio
                                checked={isSelected}
                                onChange={() => {
                                  setSelectedWeek(week);
                                  // Set weekRoll to match the selected value for display
                                  setWeekRoll(week.min);
                                  // If week is 9-10, trigger primitive
                                  if (week.min >= 9 && week.min <= 10) {
                                    setUsePrimitive(true);
                                    // Reset day
                                    setDayRoll(null);
                                    setSelectedDay(null);
                                    // Auto-roll primitive
                                    const primitiveRollResult = rollT100WithDetails();
                                    setPrimitiveRoll(primitiveRollResult);
                                    const primitiveTable = backgroundData?.primitive?.table || [];
                                    const primitiveEntry = primitiveTable.find(e => primitiveRollResult.value >= e.min && primitiveRollResult.value <= e.max);
                                    if (primitiveEntry) {
                                      setSelectedPrimitive(primitiveEntry);
                                    }
                                  } else {
                                    setUsePrimitive(false);
                                    setPrimitiveRoll(null);
                                    setSelectedPrimitive(null);
                                    setPrimitiveDescription('');
                                    // Roll day if not already rolled
                                    if (!dayRoll) {
                                      const dayRollResult = rollT10();
                                      setDayRoll(dayRollResult);
                                      const weekdays = backgroundData?.civilized?.weekdays || [];
                                      const day = weekdays.find(w => dayRollResult >= w.min && dayRollResult <= w.max);
                                      if (day) {
                                        setSelectedDay(day);
                                      }
                                    }
                                  }
                                }}
                                value={`${week.min}-${week.max}`}
                                size="small"
                              />
                              </TableCell>
                              <TableCell>
                                {week.min === week.max ? week.min : `${week.min}-${week.max}`}
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" color="text.secondary">
                                  {week.description1 || week.description}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Day - Only shown if week is not 9-10 */}
                  {selectedWeek && selectedWeek.min < 9 && (
                    <>
                      <Box sx={{ mt: 3, mb: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          3. Dag
                        </Typography>
                        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<RefreshIcon />}
                            onClick={handleRollDay}
                          >
                            Slå T10
                          </Button>
                          {dayRoll && (
                            <Typography variant="body2">
                              <strong>{dayRoll}</strong>
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell width="50px"></TableCell>
                              <TableCell><strong>Värde</strong></TableCell>
                              <TableCell><strong>Colonisk</strong></TableCell>
                              <TableCell><strong>Jargisk</strong></TableCell>
                              <TableCell><strong>Asharisk</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {backgroundData.civilized?.weekdays?.map((weekday, index) => {
                              const isSelected = !!(selectedDay && 
                                selectedDay.min === weekday.min && 
                                selectedDay.max === weekday.max);
                              const isRolled = dayRoll && 
                                dayRoll >= weekday.min && 
                                dayRoll <= weekday.max;
                              
                              return (
                                <TableRow 
                                  key={index}
                                  sx={{
                                    bgcolor: isRolled ? 'action.selected' : 'transparent'
                                  }}
                                >
                                  <TableCell>
                                    <Radio
                                      checked={isSelected}
                                      onChange={() => {
                                        setSelectedDay(weekday);
                                        // Set dayRoll to match the selected value for display
                                        setDayRoll(weekday.min);
                                      }}
                                      value={`${weekday.min}-${weekday.max}`}
                                      size="small"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    {weekday.min === weekday.max ? weekday.min : `${weekday.min}-${weekday.max}`}
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="caption" color="text.secondary">
                                      {weekday.description1}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="caption" color="text.secondary">
                                      {weekday.description2}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="caption" color="text.secondary">
                                      {weekday.description3}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  )}

                  {/* Primitive - Only shown if week is 9-10 */}
                  {usePrimitive && (
                    <>
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle1" gutterBottom color="error">
                          3. Primitiv tabell (Födelsedagen är okänd)
                        </Typography>
                        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={handleRollPrimitive}
                          >
                            Slå T100
                          </Button>
                          {primitiveRoll && (
                            <Typography variant="body1">
                              Resultat: <strong>{primitiveRoll.value}</strong>
                              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                (T100: {primitiveRoll.value === 100 ? '00' : `${primitiveRoll.tensDie}${primitiveRoll.onesDie}`})
                              </Typography>
                            </Typography>
                          )}
                        </Box>

                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell width="80px"><strong>Välj</strong></TableCell>
                                <TableCell><strong>Värde</strong></TableCell>
                                <TableCell><strong>Beskrivning av födelsedag</strong></TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {backgroundData.primitive?.table?.map((entry, index) => {
                                const isSelected = !!(selectedPrimitive && 
                                  selectedPrimitive.min === entry.min && 
                                  selectedPrimitive.max === entry.max);
                                const isRolled = primitiveRoll && 
                                  primitiveRoll.value >= entry.min && 
                                  primitiveRoll.value <= entry.max;
                                
                                return (
                                  <TableRow 
                                    key={index}
                                    sx={{
                                      bgcolor: isRolled ? 'action.selected' : 'transparent',
                                      '&:hover': {
                                        bgcolor: 'action.hover'
                                      }
                                    }}
                                  >
                                    <TableCell>
                                      <Radio
                                        checked={isSelected}
                                        onChange={() => setSelectedPrimitive(entry)}
                                        value={`${entry.min}-${entry.max}`}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      {entry.min === entry.max ? entry.min : `${entry.min}-${entry.max}`}
                                    </TableCell>
                                    <TableCell>{entry.description}</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>

                        <Box sx={{ mt: 3 }}>
                          <Tooltip title="Dessa är förslag baserat på tabellen. Du kan redigera texten fritt enligt dina egna idéer." arrow>
                            <TextField
                              fullWidth
                              multiline
                              rows={3}
                              label="Beskrivning av födelsedag"
                              value={primitiveDescription}
                              onChange={(e) => setPrimitiveDescription(e.target.value)}
                              placeholder="Beskrivning kommer här..."
                              variant="outlined"
                            />
                          </Tooltip>
                        </Box>
                      </Box>
                    </>
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

