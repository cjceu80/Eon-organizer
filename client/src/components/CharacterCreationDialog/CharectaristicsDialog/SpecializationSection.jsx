import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  TextField
} from '@mui/material';

/**
 * Component for displaying and editing specialization (high or low)
 */
export default function SpecializationSection({
  type, // 'high' or 'low'
  examples,
  value,
  onChange,
  characteristicKey
}) {
  const isHigh = type === 'high';
  const color = isHigh ? 'success.main' : 'error.main';
  const label = isHigh ? 'Hög specialisering' : 'Låg specialisering';
  const exampleLabel = isHigh ? 'Hög specialisering exempel:' : 'Låg specialisering exempel:';
  const specializationKey = `${characteristicKey}_${type}`;

  return (
    <Box sx={{ mt: 1, display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
      {examples.length > 0 && (
        <Box sx={{ flex: '1 1 auto', minWidth: 200 }}>
          <Typography variant="caption" color={color} fontWeight="medium" display="block" sx={{ mb: 0.5 }}>
            {exampleLabel}
          </Typography>
          {examples.map((example, idx) => (
            <Typography 
              key={idx} 
              variant="caption" 
              color="text.secondary" 
              display="block" 
              sx={{ 
                ml: 1, 
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline', color }
              }}
              onClick={() => onChange(specializationKey, example)}
            >
              • {example}
            </Typography>
          ))}
        </Box>
      )}
      <TextField
        label={label}
        value={value || ''}
        onChange={(e) => onChange(specializationKey, e.target.value)}
        size="small"
        sx={{ flex: '0 0 auto', minWidth: 200 }}
      />
    </Box>
  );
}

SpecializationSection.propTypes = {
  type: PropTypes.oneOf(['high', 'low']).isRequired,
  examples: PropTypes.array.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  characteristicKey: PropTypes.string.isRequired
};

