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
import { KROPPSBYGGNAD_TABLE } from '../../../utils/ageCalculations';

export default function KroppsbyggnadSection({
  kroppsbyggnadResult,
  styValue,
  talValue,
  onRoll,
  onReroll,
  remainingRerolls
}) {
  const hasRolled = !!kroppsbyggnadResult?.t6Rolls;

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Kroppsbyggnad
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
                    rolls={kroppsbyggnadResult.t6Rolls} 
                    diceType="T6" 
                    size="small"
                  />
                  <Typography variant="h5" sx={{ mt: 0.5 }}>
                    = {kroppsbyggnadResult.t6Total}
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
              <Typography variant="body2" color="text.secondary">Totalt</Typography>
              <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                {kroppsbyggnadResult?.total || '-'}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Resultat:
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip 
            label={`Kroppsbyggnad: ${kroppsbyggnadResult?.type || '-'}`}
            color="primary"
            size="large"
            sx={{ fontSize: '1rem', fontWeight: 'bold', py: 1.5 }}
          />
          <Chip 
            label={`Skadekolumner: ${kroppsbyggnadResult?.skadekolumner || '-'}`}
            color="secondary"
            size="large"
            sx={{ fontSize: '1rem', fontWeight: 'bold', py: 1.5 }}
          />
        </Box>
      </Box>

      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Kroppsbyggnad-tabell:
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>STY+TÅL+3T6</strong></TableCell>
                <TableCell><strong>Kroppsbyggnad</strong></TableCell>
                <TableCell align="right"><strong>Skadekolumner</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {KROPPSBYGGNAD_TABLE.map((range, index) => {
                const isCurrentRange = kroppsbyggnadResult?.total && 
                  kroppsbyggnadResult.total >= range.min && 
                  kroppsbyggnadResult.total <= range.max;
                const valueRange = range.max === Infinity 
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
                      {isCurrentRange && <strong>{valueRange}</strong>}
                      {!isCurrentRange && valueRange}
                    </TableCell>
                    <TableCell>
                      {isCurrentRange && <strong>{range.type}</strong>}
                      {!isCurrentRange && range.type}
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2"
                        sx={{ fontWeight: isCurrentRange ? 'bold' : 'normal' }}
                      >
                        {range.skadekolumner}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
}

KroppsbyggnadSection.propTypes = {
  kroppsbyggnadResult: PropTypes.object,
  styValue: PropTypes.number.isRequired,
  talValue: PropTypes.number.isRequired,
  onRoll: PropTypes.func.isRequired,
  onReroll: PropTypes.func.isRequired,
  remainingRerolls: PropTypes.number.isRequired
};

