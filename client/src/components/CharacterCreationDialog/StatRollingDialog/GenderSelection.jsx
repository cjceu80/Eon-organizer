import PropTypes from 'prop-types';
import { Box, Typography, RadioGroup, FormControlLabel, Radio } from '@mui/material';

export default function GenderSelection({ gender, onChange }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        Kön
      </Typography>
      <RadioGroup
        row
        value={gender}
        onChange={(e) => onChange(e.target.value)}
      >
        <FormControlLabel value="man" control={<Radio />} label="Man" />
        <FormControlLabel value="kvinna" control={<Radio />} label="Kvinna" />
        <FormControlLabel value="obestämt" control={<Radio />} label="Obestämt" />
      </RadioGroup>
    </Box>
  );
}

GenderSelection.propTypes = {
  gender: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
};

