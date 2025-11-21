import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CasinoIcon from '@mui/icons-material/Casino';
import DiceRollDisplay from '../../DiceRollDisplay';
import { AGE_BONUS_TABLE, getAgeBonus } from '../../../utils/ageCalculations';

export default function AgeSection({
  ageResult,
  bilValue,
  onRoll,
  onReroll,
  remainingRerolls,
  raceCategory
}) {
  const hasRolled = !!ageResult?.ob3T6;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Ålder
      </Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
          <Box>
            <Typography variant="body2" color="text.secondary">BIL</Typography>
            <Typography variant="h5">{bilValue}</Typography>
          </Box>
          <Typography variant="h5">+</Typography>
          <Box sx={{ flex: '0 0 auto', minWidth: 120 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">Ob3T6</Typography>
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
                <Tooltip title={remainingRerolls > 0 ? `Återkasta Ob3T6 (${remainingRerolls} kvar)` : 'Återkasta Ob3T6'}>
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
                  rolls={ageResult.ob3T6.initialRolls} 
                  diceType="T6" 
                  size="small"
                />
                {ageResult.ob3T6.extraRolls.length > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    → {ageResult.ob3T6.extraRolls.join(', ')}
                  </Typography>
                )}
                <Typography variant="h5" sx={{ mt: 0.5 }}>
                  = {ageResult.ob3T6.total}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Klicka på &quot;Slå&quot; för att rulla
              </Typography>
            )}
          </Box>
          <Typography variant="h5">=</Typography>
          <Box>
            <Typography variant="body2" color="text.secondary">Verklig ålder</Typography>
            <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
              {ageResult?.age || '-'}
            </Typography>
          </Box>
          {ageResult?.apparentAge !== undefined && ageResult.apparentAge !== ageResult.age && (
            <>
              <Typography variant="h5">→</Typography>
              <Box>
                <Typography variant="body2" color="text.secondary">Synlig ålder</Typography>
                <Typography variant="h4" color="secondary.main" sx={{ fontWeight: 'bold' }}>
                  {ageResult.apparentAge}
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </Paper>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Valfria enheter baserat på ålder:
        </Typography>
        <Chip 
          label={`+${ageResult?.bonus || 0} Valfria enheter`}
          color="success"
          size="large"
          sx={{ fontSize: '1.1rem', fontWeight: 'bold', py: 2 }}
        />
      </Box>

      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Åldersbonus-tabell:
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Faktisk ålder</strong></TableCell>
                <TableCell align="right"><strong>Valfria enheter</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {AGE_BONUS_TABLE.map((range, index) => {
                const isCurrentRange = ageResult?.age && ageResult.age >= range.min && ageResult.age <= range.max;
                const ageRange = range.max === Infinity 
                  ? `${range.min}+` 
                  : `${range.min}-${range.max}`;
                
                return (
                  <TableRow 
                    key={index}
                    sx={{
                      bgcolor: isCurrentRange ? 'action.selected' : 'transparent'
                    }}
                  >
                    <TableCell>
                      {isCurrentRange && <strong>{ageRange}</strong>}
                      {!isCurrentRange && ageRange}
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2"
                        sx={{ fontWeight: isCurrentRange ? 'bold' : 'normal' }}
                      >
                        +{range.bonus}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}

AgeSection.propTypes = {
  ageResult: PropTypes.object,
  bilValue: PropTypes.number.isRequired,
  onRoll: PropTypes.func.isRequired,
  onReroll: PropTypes.func.isRequired,
  remainingRerolls: PropTypes.number.isRequired,
  raceCategory: PropTypes.object
};

