import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CasinoIcon from '@mui/icons-material/Casino';
import DiceRollDisplay from '../../DiceRollDisplay';
import { EON_ATTRIBUTES } from '../../../utils/dice';
import { getRaceModifier, calculateFinalAttributeValue } from '../../../utils/statRollingUtils';

export default function StandardRollingTable({
  statsResult,
  onRollAttribute,
  onRerollStat,
  selectedRace,
  canReroll,
  remainingRerolls,
  statRollMethod,
  feminineAttributes,
  gender,
  styDecrease,
  femaleAttributeModifications
}) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell><strong>Attribut</strong></TableCell>
            <TableCell><strong>Kast</strong></TableCell>
            <TableCell align="right"><strong>Värde</strong></TableCell>
            {selectedRace?.modifiers && (
              <TableCell align="right"><strong>Efter ras</strong></TableCell>
            )}
            {canReroll && <TableCell align="center"><strong>Återkast</strong></TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {EON_ATTRIBUTES.map(attr => {
            // Get base value from stats result
            let value = statsResult?.attributes?.[attr];
            
            // Apply feminine modifications if applicable
            value = calculateFinalAttributeValue(
              value,
              attr,
              feminineAttributes,
              gender,
              styDecrease,
              femaleAttributeModifications
            );
            
            const rolls = statsResult?.rolls?.[attr];
            const raceModifier = getRaceModifier(selectedRace, attr);
            const modifiedValue = (value !== undefined && value !== null && !isNaN(value)) ? value + raceModifier : undefined;
            
            return (
              <TableRow key={attr}>
                <TableCell><strong>{attr}</strong></TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {rolls ? (
                      <>
                        {statRollMethod === 'höga attribut' ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <DiceRollDisplay 
                              rolls={rolls.kept} 
                              diceType="T6" 
                              size="small"
                            />
                            <Typography variant="caption" color="text.secondary">
                              (slängd: {rolls.dropped})
                            </Typography>
                          </Box>
                        ) : statRollMethod === 'hjälteattribut' ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <DiceRollDisplay 
                              rolls={rolls} 
                              diceType="T6" 
                              size="small"
                            />
                            <Typography variant="body2">+ 9</Typography>
                          </Box>
                        ) : (
                          <DiceRollDisplay 
                            rolls={rolls} 
                            diceType="T6" 
                            size="small"
                          />
                        )}
                      </>
                    ) : null}
                    <Button
                      size="small"
                      onClick={() => onRollAttribute(attr)}
                      color="primary"
                      variant="outlined"
                      startIcon={<CasinoIcon />}
                    >
                      Slå
                    </Button>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="h6">
                    {value !== undefined && value !== null && !isNaN(value) ? value : ''}
                  </Typography>
                </TableCell>
                {selectedRace?.modifiers && (
                  <TableCell align="right">
                    {modifiedValue !== undefined && modifiedValue !== null && !isNaN(modifiedValue) ? (
                      <Typography 
                        variant="h6" 
                        sx={{ fontWeight: 'bold' }}
                      >
                        {modifiedValue}
                        {raceModifier !== 0 && (
                          <Typography 
                            component="span" 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ ml: 0.5 }}
                          >
                            ({raceModifier > 0 ? '+' : ''}{raceModifier})
                          </Typography>
                        )}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary"></Typography>
                    )}
                  </TableCell>
                )}
                {canReroll && (
                  <TableCell align="center">
                    <Tooltip title={`Återkasta ${attr} (${remainingRerolls} kvar)`}>
                      <IconButton 
                        size="small" 
                        onClick={() => onRerollStat(attr)}
                        disabled={remainingRerolls <= 0}
                        color="primary"
                      >
                        <RefreshIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

StandardRollingTable.propTypes = {
  statsResult: PropTypes.object,
  onRollAttribute: PropTypes.func.isRequired,
  onRerollStat: PropTypes.func.isRequired,
  selectedRace: PropTypes.object,
  canReroll: PropTypes.bool.isRequired,
  remainingRerolls: PropTypes.number.isRequired,
  statRollMethod: PropTypes.string.isRequired,
  feminineAttributes: PropTypes.bool,
  gender: PropTypes.string.isRequired,
  styDecrease: PropTypes.number.isRequired,
  femaleAttributeModifications: PropTypes.object.isRequired
};

