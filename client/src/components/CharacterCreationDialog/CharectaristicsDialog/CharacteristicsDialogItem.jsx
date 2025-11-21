import PropTypes from 'prop-types';
import {
  TableRow,
  TableCell,
  Box,
  Typography,
  TextField,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';
import DiceRollDisplay from '../../DiceRollDisplay';
import SpecializationSection from './SpecializationSection';

const CharacteristicsDialogItem = ({
  char,
  value,
  isFixed,
  description,
  showHighSpec,
  showLowSpec,
  highExamples,
  lowExamples,
  isHighRecommended,
  isLowRecommended,
  specializations,
  onValueChange,
  onRoll,
  onSpecializationChange,
  rolls
}) => {
  return (
    <TableRow>
      <TableCell>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body1" fontWeight="medium">
              {char.key}
            </Typography>
            {isHighRecommended && (
              <Typography 
                variant="caption" 
                color="success.main"
                sx={{ fontWeight: 'medium' }}
              >
                Rekomenderas hög
              </Typography>
            )}
            {isLowRecommended && (
              <Typography 
                variant="caption" 
                color="error.main"
                sx={{ fontWeight: 'medium' }}
              >
                Rekomenderas låg
              </Typography>
            )}
          </Box>
          {description && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              {description}
            </Typography>
          )}
          {showHighSpec && (
            <SpecializationSection
              type="high"
              examples={highExamples}
              value={specializations[`${char.key}_high`]}
              onChange={onSpecializationChange}
              characteristicKey={char.key}
            />
          )}
          {showLowSpec && (
            <SpecializationSection
              type="low"
              examples={lowExamples}
              value={specializations[`${char.key}_low`]}
              onChange={onSpecializationChange}
              characteristicKey={char.key}
            />
          )}
        </Box>
      </TableCell>
      <TableCell align="right" sx={{ verticalAlign: 'top' }}>
        <Box sx={{ pt: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
          {isFixed ? (
            <Chip 
              label={value} 
              color="default" 
              variant="outlined"
              sx={{ fontWeight: 'bold' }}
            />
          ) : (
            <>
              <TextField
                type="number"
                value={value}
                onChange={(e) => onValueChange(char.key, e.target.value)}
                inputProps={{ min: 3, max: 18 }}
                size="small"
                sx={{ width: 80 }}
                error={value !== '' && (value < 3 || value > 18)}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                <Tooltip title="Slå 3T6">
                  <IconButton
                    size="small"
                    onClick={() => onRoll(char.key)}
                    color="primary"
                  >
                    <CasinoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {rolls && (
                  <DiceRollDisplay 
                    rolls={rolls} 
                    diceType="T6" 
                    size="small"
                  />
                )}
              </Box>
            </>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );
};

CharacteristicsDialogItem.propTypes = {
  char: PropTypes.object.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  isFixed: PropTypes.bool.isRequired,
  description: PropTypes.string,
  showHighSpec: PropTypes.bool.isRequired,
  showLowSpec: PropTypes.bool.isRequired,
  highExamples: PropTypes.array.isRequired,
  lowExamples: PropTypes.array.isRequired,
  isHighRecommended: PropTypes.bool.isRequired,
  isLowRecommended: PropTypes.bool.isRequired,
  specializations: PropTypes.object.isRequired,
  onValueChange: PropTypes.func.isRequired,
  onRoll: PropTypes.func.isRequired,
  onSpecializationChange: PropTypes.func.isRequired,
  rolls: PropTypes.array
};

export default CharacteristicsDialogItem;

