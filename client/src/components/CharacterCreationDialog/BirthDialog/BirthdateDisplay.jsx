import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { calculateBirthdate } from '../../../utils/birthCalculations';

export default function BirthdateDisplay({
  usePrimitive,
  selectedPrimitive,
  primitiveDescription,
  selectedDay,
  selectedMonth,
  selectedWeek,
  selectedCalendar,
  onCalendarChange,
  ageData,
  worldSettings
}) {
  const hasData = (usePrimitive && selectedPrimitive && primitiveDescription) || 
                  (!usePrimitive && selectedDay && selectedMonth && selectedWeek);

  if (!hasData) {
    return null;
  }

  const birthdate = calculateBirthdate({
    usePrimitive,
    selectedPrimitive,
    primitiveDescription,
    selectedDay,
    selectedMonth,
    selectedWeek,
    selectedCalendar,
    ageData,
    worldSettings
  });

  return (
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
              onChange={(e) => onCalendarChange(e.target.value)}
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
            <strong>{birthdate || 'Beräknar...'}</strong>
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
  );
}

BirthdateDisplay.propTypes = {
  usePrimitive: PropTypes.bool.isRequired,
  selectedPrimitive: PropTypes.object,
  primitiveDescription: PropTypes.string,
  selectedDay: PropTypes.object,
  selectedMonth: PropTypes.object,
  selectedWeek: PropTypes.object,
  selectedCalendar: PropTypes.string.isRequired,
  onCalendarChange: PropTypes.func.isRequired,
  ageData: PropTypes.object,
  worldSettings: PropTypes.object
};

