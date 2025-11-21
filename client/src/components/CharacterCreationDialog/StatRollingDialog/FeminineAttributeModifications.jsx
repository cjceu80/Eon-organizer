import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Alert,
  Grid,
  TextField
} from '@mui/material';

export default function FeminineAttributeModifications({
  statsResult,
  gender,
  styDecrease,
  femaleAttributeModifications,
  onStyDecreaseChange,
  onModificationChange
}) {
  const handleStyDecreaseChange = (newValue) => {
    const maxDecrease = Math.min(2, statsResult?.attributes?.STY || 0);
    const validValue = Math.max(0, Math.min(newValue, maxDecrease));
    onStyDecreaseChange(validValue, femaleAttributeModifications);
  };

  const handleModificationChange = (attr, value) => {
    const maxIncrease = styDecrease - Object.values(femaleAttributeModifications).reduce((a, b) => a + b, 0) + femaleAttributeModifications[attr];
    const validValue = Math.max(0, Math.min(value, maxIncrease));
    onModificationChange(attr, validValue);
  };

  if (!statsResult?.attributes || gender !== 'kvinna') {
    return null;
  }

  return (
    <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
      <Typography variant="subtitle1" gutterBottom>
        Kvinnliga attributmodifikationer
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        Du kan minska STY med 0-2 poäng. För varje minskad poäng kan du lägga till 1 poäng till TÅL, RÖR, PER, PSY, VIL eller BIL.
      </Alert>
      
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            type="number"
            fullWidth
            label="Minska STY"
            value={styDecrease}
            onChange={(e) => handleStyDecreaseChange(parseInt(e.target.value) || 0)}
            inputProps={{ min: 0, max: Math.min(2, statsResult?.attributes?.STY || 0) }}
            helperText={`Max ${Math.min(2, statsResult?.attributes?.STY || 0)} poäng`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Poäng att fördela: {styDecrease - Object.values(femaleAttributeModifications).reduce((a, b) => a + b, 0)}
          </Typography>
        </Grid>
        
        {['TÅL', 'RÖR', 'PER', 'PSY', 'VIL', 'BIL'].map(attr => (
          <Grid size={{ xs: 6, sm: 4 }} key={attr}>
            <TextField
              type="number"
              fullWidth
              size="small"
              label={`+${attr}`}
              value={femaleAttributeModifications[attr]}
              onChange={(e) => handleModificationChange(attr, parseInt(e.target.value) || 0)}
              inputProps={{ min: 0, max: styDecrease }}
              disabled={styDecrease === 0}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

FeminineAttributeModifications.propTypes = {
  statsResult: PropTypes.object,
  gender: PropTypes.string.isRequired,
  styDecrease: PropTypes.number.isRequired,
  femaleAttributeModifications: PropTypes.object.isRequired,
  onStyDecreaseChange: PropTypes.func.isRequired,
  onModificationChange: PropTypes.func.isRequired
};

