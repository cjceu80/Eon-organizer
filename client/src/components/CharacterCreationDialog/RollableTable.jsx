import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Radio
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * Reusable component for rollable tables with radio selection
 */
export default function RollableTable({
  title,
  titleColor,
  rollLabel,
  rollValue,
  rollDetails,
  onRoll,
  entries,
  selectedEntry,
  onSelect,
  columns,
  getValueLabel = (entry) => entry.min === entry.max ? entry.min : `${entry.min}-${entry.max}`
}) {
  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom color={titleColor}>
          {title}
        </Typography>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={onRoll}
          >
            {rollLabel}
          </Button>
          {rollValue !== null && rollValue !== undefined && (
            <Typography variant="body2">
              <strong>{typeof rollValue === 'object' ? rollValue.value : rollValue}</strong>
              {rollDetails && (
                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  {rollDetails}
                </Typography>
              )}
            </Typography>
          )}
        </Box>
      </Box>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width="50px"></TableCell>
              <TableCell><strong>Värde</strong></TableCell>
              {columns?.map((col, idx) => (
                <TableCell key={idx}><strong>{col.header}</strong></TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {entries?.map((entry, index) => {
              const isSelected = selectedEntry && 
                selectedEntry.min === entry.min && 
                selectedEntry.max === entry.max;
              
              // Determine if entry matches roll value
              const rollValueNum = rollValue === null || rollValue === undefined 
                ? null 
                : (typeof rollValue === 'object' ? rollValue.value : rollValue);
              const isRolled = rollValueNum !== null && rollValueNum !== undefined &&
                rollValueNum >= entry.min && 
                rollValueNum <= entry.max;
              
              return (
                <TableRow 
                  key={index}
                  sx={{
                    bgcolor: isRolled ? 'action.selected' : 'transparent'
                  }}
                >
                  <TableCell>
                    <Radio
                      checked={isSelected || false}
                      onChange={() => onSelect(entry)}
                      value={`${entry.min}-${entry.max}`}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {getValueLabel(entry)}
                  </TableCell>
                  {columns?.map((col, colIdx) => (
                    <TableCell key={colIdx}>
                      <Typography variant="caption" color="text.secondary">
                        {col.getContent(entry)}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

RollableTable.propTypes = {
  title: PropTypes.string.isRequired,
  titleColor: PropTypes.string,
  rollLabel: PropTypes.string.isRequired,
  rollValue: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  rollDetails: PropTypes.string,
  onRoll: PropTypes.func.isRequired,
  entries: PropTypes.array.isRequired,
  selectedEntry: PropTypes.object,
  onSelect: PropTypes.func.isRequired,
  columns: PropTypes.arrayOf(PropTypes.shape({
    header: PropTypes.string.isRequired,
    getContent: PropTypes.func.isRequired
  })),
  getValueLabel: PropTypes.func
};

