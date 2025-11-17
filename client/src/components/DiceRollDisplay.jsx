import { Box, Typography } from '@mui/material';
import PropTypes from 'prop-types';

/**
 * DiceRollDisplay - Component to visually display dice rolls
 * Shows individual dice as small boxes and the total sum
 * 
 * @param {Array<number>|Array<Object>} rolls - Array of individual dice values, or for T100: array of {tensDie, onesDie, value}
 * @param {number} total - Total sum (optional, will calculate if not provided)
 * @param {string} diceType - Type of dice: 'T6', 'T10', 'T100' (default: 'T6')
 * @param {string} size - Size variant: 'small', 'medium', 'large' (default: 'small')
 * @param {Object} sx - Additional styling
 */
export default function DiceRollDisplay({ 
  rolls = [], 
  total = null, 
  diceType = 'T6',
  size = 'small',
  sx = {}
}) {
  // Calculate total if not provided
  const calculatedTotal = total !== null ? total : (
    Array.isArray(rolls) && rolls.length > 0 && typeof rolls[0] === 'object' && rolls[0].value !== undefined
      ? rolls.reduce((sum, roll) => sum + (roll.value || 0), 0)
      : rolls.reduce((sum, roll) => sum + roll, 0)
  );

  // Size configurations
  const sizeConfig = {
    small: {
      diceSize: 24,
      diceFontSize: '0.75rem',
      gap: 0.5,
      totalFontSize: '0.875rem'
    },
    medium: {
      diceSize: 32,
      diceFontSize: '0.875rem',
      gap: 0.75,
      totalFontSize: '1rem'
    },
    large: {
      diceSize: 40,
      diceFontSize: '1rem',
      gap: 1,
      totalFontSize: '1.125rem'
    }
  };

  const config = sizeConfig[size] || sizeConfig.small;

  // For T100, we need to handle tens and ones dice separately
  if (diceType === 'T100' && rolls.length > 0) {
    // Process all T100 rolls
    const diceElements = rolls.map((roll, index) => {
      let tensDie, onesDie, value;
      
      if (typeof roll === 'object' && roll.tensDie !== undefined) {
        // We have detailed T100 object
        tensDie = roll.tensDie;
        onesDie = roll.onesDie;
        value = roll.value;
      } else {
        // We have a number value, need to split it
        value = typeof roll === 'number' ? roll : 0;
        const tens = Math.floor(value / 10) % 10;
        const ones = value % 10;
        
        // Handle special case: 00 = 100
        if (value === 100) {
          tensDie = 0;
          onesDie = 0;
        } else {
          tensDie = tens;
          onesDie = ones;
        }
      }

      return (
        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: config.gap / 2 }}>
          {/* Tens die */}
          <Box
            sx={{
              width: config.diceSize,
              height: config.diceSize,
              borderRadius: 1,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: config.diceFontSize,
              boxShadow: 1
            }}
          >
            {tensDie}
          </Box>
          
          {/* Ones die */}
          <Box
            sx={{
              width: config.diceSize,
              height: config.diceSize,
              borderRadius: 1,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: config.diceFontSize,
              boxShadow: 1
            }}
          >
            {onesDie}
          </Box>
        </Box>
      );
    });

    return (
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: config.gap,
          flexWrap: 'wrap',
          ...sx 
        }}
      >
        {diceElements}
        
        {/* Plus signs between rolls (if more than one) */}
        {rolls.length > 1 && (
          <>
            {rolls.slice(0, -1).map((_, index) => (
              <Typography 
                key={`plus-${index}`}
                variant="body2" 
                sx={{ 
                  fontSize: config.totalFontSize,
                  fontWeight: 'bold',
                  color: 'text.secondary'
                }}
              >
                +
              </Typography>
            ))}
          </>
        )}

        {/* Total */}
        {rolls.length > 1 && (
          <Typography 
            variant="body2" 
            sx={{ 
              ml: 0.5,
              fontSize: config.totalFontSize,
              fontWeight: 'bold'
            }}
          >
            = {calculatedTotal}
          </Typography>
        )}
        {rolls.length === 1 && (
          <Typography 
            variant="body2" 
            sx={{ 
              ml: 1,
              fontSize: config.totalFontSize,
              fontWeight: 'bold'
            }}
          >
            = {calculatedTotal}
          </Typography>
        )}
      </Box>
    );
  }

  // For T6 and T10, show individual dice
  if (rolls.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: config.gap, ...sx }}>
        <Typography variant="body2" color="text.secondary">
          Inga tärningar
        </Typography>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: config.gap,
        flexWrap: 'wrap',
        ...sx 
      }}
    >
      {/* Individual dice */}
      {rolls.map((roll, index) => (
        <Box
          key={index}
          sx={{
            width: config.diceSize,
            height: config.diceSize,
            borderRadius: 1,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: config.diceFontSize,
            boxShadow: 1,
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'scale(1.1)'
            }
          }}
        >
          {roll}
        </Box>
      ))}

      {/* Plus signs between dice (if more than one) */}
      {rolls.length > 1 && (
        <>
          {rolls.slice(0, -1).map((_, index) => (
            <Typography 
              key={`plus-${index}`}
              variant="body2" 
              sx={{ 
                fontSize: config.totalFontSize,
                fontWeight: 'bold',
                color: 'text.secondary'
              }}
            >
              +
            </Typography>
          ))}
        </>
      )}

      {/* Total */}
      {rolls.length > 1 && (
        <Typography 
          variant="body2" 
          sx={{ 
            ml: rolls.length > 1 ? 0.5 : 0,
            fontSize: config.totalFontSize,
            fontWeight: 'bold'
          }}
        >
          = {calculatedTotal}
        </Typography>
      )}
    </Box>
  );
}

DiceRollDisplay.propTypes = {
  rolls: PropTypes.arrayOf(PropTypes.number),
  total: PropTypes.number,
  diceType: PropTypes.oneOf(['T6', 'T10', 'T100']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  sx: PropTypes.object
};

