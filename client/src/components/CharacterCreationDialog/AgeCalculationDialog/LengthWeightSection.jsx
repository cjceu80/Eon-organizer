import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CasinoIcon from '@mui/icons-material/Casino';
import DiceRollDisplay from '../../DiceRollDisplay';

export default function LengthWeightSection({
  lengthResult,
  styValue,
  talValue,
  onRoll,
  onReroll,
  remainingRerolls,
  varierandeVikt
}) {
  const hasRolled = !!lengthResult?.t6Rolls;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Längd och vikt
      </Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">STY</Typography>
            <Typography variant="h5">{styValue}</Typography>
          </Box>
          <Typography variant="h5">+</Typography>
          <Box>
            <Typography variant="body2" color="text.secondary">TÅL</Typography>
            <Typography variant="h5">{talValue}</Typography>
          </Box>
          <Typography variant="h5">+</Typography>
          <Box sx={{ flex: 1, minWidth: 120 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">3T6</Typography>
              {!hasRolled ? (
                <Button
                  size="small"
                  onClick={onRoll}
                  color="primary"
                  variant="outlined"
                  startIcon={<CasinoIcon />}
                >
                  Slå
                </Button>
              ) : (
                <Tooltip title={remainingRerolls > 0 ? `Återkasta 3T6 (${remainingRerolls} kvar)` : 'Återkasta 3T6'}>
                  <IconButton 
                    size="small" 
                    onClick={onReroll}
                    color="primary"
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            {hasRolled ? (
              <Box sx={{ mt: 1 }}>
                <DiceRollDisplay 
                  rolls={lengthResult.t6Rolls} 
                  diceType="T6" 
                  size="small"
                />
                <Typography variant="h5" sx={{ mt: 0.5 }}>
                  = {lengthResult.t6Total}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Klicka på &quot;Slå&quot; för att rulla
              </Typography>
            )}
          </Box>
          <Typography variant="h5">+</Typography>
          <Box>
            <Typography variant="body2" color="text.secondary">Raslängdkonstant</Typography>
            <Typography variant="h5">{lengthResult?.lengthConstant || '-'}</Typography>
          </Box>
          <Typography variant="h5">=</Typography>
          <Box>
            <Typography variant="body2" color="text.secondary">Längd (cm)</Typography>
            <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
              {lengthResult?.length || '-'}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">Längd</Typography>
            <Typography variant="h5">{lengthResult?.length || '-'}</Typography>
          </Box>
          <Typography variant="h5">-</Typography>
          <Box>
            <Typography variant="body2" color="text.secondary">Rasviktskonstant</Typography>
            <Typography variant="h5">{lengthResult?.weightConstant || '-'}</Typography>
          </Box>
          <Typography variant="h5">=</Typography>
          <Box>
            <Typography variant="body2" color="text.secondary">Basvikt (kg)</Typography>
            <Typography variant="h5">{lengthResult?.baseWeight ? Math.round(lengthResult.baseWeight * 10) / 10 : '-'}</Typography>
          </Box>
          {varierandeVikt && lengthResult?.weightMultiplier !== 1 && lengthResult?.weightMultiplier && (
            <>
              <Typography variant="h5">×</Typography>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Multiplikator ({lengthResult.kroppsbyggnadType})
                </Typography>
                <Typography variant="h5">{lengthResult.weightMultiplier}</Typography>
              </Box>
              <Typography variant="h5">=</Typography>
            </>
          )}
          <Box>
            <Typography variant="body2" color="text.secondary">Vikt (kg)</Typography>
            <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
              {lengthResult?.weight ? Math.round(lengthResult.weight * 10) / 10 : '-'}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

LengthWeightSection.propTypes = {
  lengthResult: PropTypes.object,
  styValue: PropTypes.number.isRequired,
  talValue: PropTypes.number.isRequired,
  onRoll: PropTypes.func.isRequired,
  onReroll: PropTypes.func.isRequired,
  remainingRerolls: PropTypes.number.isRequired,
  varierandeVikt: PropTypes.bool.isRequired
};

