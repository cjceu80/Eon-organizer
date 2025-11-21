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
  Paper
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { EON_ATTRIBUTES } from '../../../utils/dice';
import { formatModifier, getModifiersFromRace } from '../../../utils/raceUtils';

/**
 * Category header component
 */
const CategoryHeader = ({ categoryName, isSelected, onClick }) => (
  <Typography
    variant="h6"
    sx={{
      cursor: 'pointer',
      p: 1,
      mb: 1,
      borderRadius: 1,
      '&:hover': { bgcolor: 'action.hover' },
      bgcolor: isSelected ? 'action.selected' : 'transparent'
    }}
    onClick={onClick}
  >
    {categoryName}
  </Typography>
);

CategoryHeader.propTypes = {
  categoryName: PropTypes.string.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired
};

/**
 * Race table row component
 */
const RaceTableRow = ({ race, isSelected, onSelect }) => {
  const modifiers = getModifiersFromRace(race);

  return (
    <TableRow
      onClick={onSelect}
      sx={{
        cursor: 'pointer',
        bgcolor: isSelected ? 'action.selected' : 'transparent',
        '&:hover': { bgcolor: 'action.hover' },
        borderLeft: isSelected ? 3 : 0,
        borderColor: isSelected ? 'primary.main' : 'transparent'
      }}
    >
      <TableCell sx={{ fontWeight: isSelected ? 'bold' : 'normal' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isSelected && <CheckCircleIcon color="primary" fontSize="small" />}
          {race.name}
        </Box>
      </TableCell>
      {EON_ATTRIBUTES.map(attr => {
        const modValue = modifiers[attr] || 0;
        return (
          <TableCell
            key={attr}
            align="center"
            sx={{
              color: modValue !== 0 ? (modValue > 0 ? 'success.main' : 'error.main') : 'text.primary',
              fontWeight: modValue !== 0 ? 'bold' : 'normal'
            }}
          >
            {formatModifier(modValue)}
          </TableCell>
        );
      })}
    </TableRow>
  );
};

RaceTableRow.propTypes = {
  race: PropTypes.object.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired
};

/**
 * Race table component for a single category
 */
const CategoryRaceTable = ({ categoryName, races, selectedRace, selectedCategory, onRaceSelect, onCategorySelect }) => {
  const isCategorySelected = selectedCategory === categoryName && !selectedRace;
  const raceId = (race) => race.id || race._id;
  const isRaceSelected = (race) => {
    if (!selectedRace) return false;
    return raceId(selectedRace) === raceId(race);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <CategoryHeader
        categoryName={categoryName}
        isSelected={isCategorySelected}
        onClick={() => onCategorySelect(categoryName)}
      />
      <TableContainer component={Paper} variant="outlined">
        <Table size="small" sx={{ '& .MuiTableCell-root': { py: 1, px: 1.5 } }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'background.default' }}>
              <TableCell sx={{ fontWeight: 'bold', width: '150px' }}>Ras</TableCell>
              {EON_ATTRIBUTES.map(attr => (
                <TableCell key={attr} align="center" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                  {attr}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {races.map(race => (
              <RaceTableRow
                key={raceId(race)}
                race={race}
                isSelected={isRaceSelected(race)}
                onSelect={() => onRaceSelect(race)}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

CategoryRaceTable.propTypes = {
  categoryName: PropTypes.string.isRequired,
  races: PropTypes.array.isRequired,
  selectedRace: PropTypes.object,
  selectedCategory: PropTypes.string,
  onRaceSelect: PropTypes.func.isRequired,
  onCategorySelect: PropTypes.func.isRequired
};

/**
 * Main race table component displaying all categories and races
 */
export default function RaceTable({ categoryList, races, selectedRace, selectedCategory, onRaceSelect, onCategorySelect, getRacesByCategory }) {
  return (
    <Box sx={{ flex: 1, overflowY: 'auto', borderRight: 1, borderColor: 'divider', pr: 2 }}>
      {categoryList.map(categoryName => {
        const categoryRaces = getRacesByCategory(categoryName);
        return (
          <CategoryRaceTable
            key={categoryName}
            categoryName={categoryName}
            races={categoryRaces}
            selectedRace={selectedRace}
            selectedCategory={selectedCategory}
            onRaceSelect={onRaceSelect}
            onCategorySelect={onCategorySelect}
          />
        );
      })}
    </Box>
  );
}

RaceTable.propTypes = {
  categoryList: PropTypes.array.isRequired,
  races: PropTypes.array.isRequired,
  selectedRace: PropTypes.object,
  selectedCategory: PropTypes.string,
  onRaceSelect: PropTypes.func.isRequired,
  onCategorySelect: PropTypes.func.isRequired,
  getRacesByCategory: PropTypes.func.isRequired
};

