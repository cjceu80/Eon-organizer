import PropTypes from 'prop-types';
import {
  Paper,
  Box,
  Typography,
  IconButton,
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * Component to display litter roll results
 */
export default function LitterRollDisplay({
  title,
  formula,
  littersRollData,
  litters,
  color = 'primary',
  onReroll,
  rerollUsed,
  remainingRerolls,
  disabled
}) {
  if (!littersRollData) return null;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2">
          {title}: {formula}
        </Typography>
        <Tooltip title={
          rerollUsed 
            ? `Återkasta ${title.toLowerCase()} (gratis)` 
            : remainingRerolls > 0
              ? `Återkasta ${title.toLowerCase()} (${remainingRerolls} kvar)`
              : `Återkasta ${title.toLowerCase()}`
        }>
          <span>
            <IconButton
              size="small"
              onClick={onReroll}
              color="primary"
              disabled={disabled}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {littersRollData.type === 'Ob' ? 'Ob' : ''}{littersRollData.diceCount}T6
          </Typography>
          <Typography variant="h6">
            {littersRollData.type === 'Ob' ? littersRollData.roll.total : littersRollData.baseResult}
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              {littersRollData.type === 'Ob' ? (
                <>
                  ({littersRollData.roll.initialRolls.join(', ')}
                  {littersRollData.roll.extraRolls.length > 0 && ` → ${littersRollData.roll.extraRolls.join(', ')}`})
                </>
              ) : (
                `(${littersRollData.rolls.join(', ')})`
              )}
            </Typography>
          </Typography>
        </Box>
        {littersRollData.modifier && (
          <>
            <Typography variant="h6">{littersRollData.modifier}</Typography>
            <Typography variant="h6">=</Typography>
            <Box>
              <Typography variant="body2" color="text.secondary">Efter modifier</Typography>
              <Typography variant="h6">{littersRollData.finalResult}</Typography>
            </Box>
          </>
        )}
        <Typography variant="h6">=</Typography>
        <Box>
          <Typography variant="body2" color="text.secondary">Totalt</Typography>
          <Typography variant="h5" color={`${color}.main`} sx={{ fontWeight: 'bold' }}>
            {litters}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

LitterRollDisplay.propTypes = {
  title: PropTypes.string.isRequired,
  formula: PropTypes.string.isRequired,
  littersRollData: PropTypes.object,
  litters: PropTypes.number.isRequired,
  color: PropTypes.string,
  onReroll: PropTypes.func.isRequired,
  rerollUsed: PropTypes.bool.isRequired,
  remainingRerolls: PropTypes.number.isRequired,
  disabled: PropTypes.bool
};

