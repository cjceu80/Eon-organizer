import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { useRaceData } from '../../../utils/useRaceData';
import RaceTable from './RaceTable';
import RaceDetailsPanel from './RaceDetailsPanel';

export default function RaceSelectionDialog({ onClose, worldId, onRaceSelected, initialRaceId = null }) {
  const { races, categoryList, categoryData, loading, error } = useRaceData(worldId, initialRaceId);
  const [selectedRace, setSelectedRace] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Reset selection when dialog opens (unless we have an initial race)
  useEffect(() => {
    if (!initialRaceId) {
      setSelectedRace(null);
      setSelectedCategory(null);
    }
  }, [initialRaceId]);

  // Pre-select race if initialRaceId is provided
  useEffect(() => {
    if (initialRaceId && races.length > 0 && !selectedRace) {
      const race = races.find(r => (r.id || r._id) === initialRaceId);
      if (race) {
        setSelectedRace(race);
      }
    }
  }, [initialRaceId, races, selectedRace]);

  const getRacesByCategory = (categoryName) => {
    return races.filter(race => (race.category || 'Okategoriserade') === categoryName);
  };

  const handleRaceClick = (race) => {
    setSelectedRace(race);
    setSelectedCategory(null);
  };

  const handleCategoryClick = (categoryName) => {
    setSelectedCategory(categoryName);
    setSelectedRace(null);
  };

  const handleSelectRace = () => {
    if (selectedRace) {
      onRaceSelected(selectedRace);
    }
  };

  return (
    <>
      <DialogTitle>Välj ras</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Box sx={{ display: 'flex', gap: 2, minHeight: '500px', maxHeight: '600px' }}>
            <RaceTable
              categoryList={categoryList}
              races={races}
              selectedRace={selectedRace}
              selectedCategory={selectedCategory}
              onRaceSelect={handleRaceClick}
              onCategorySelect={handleCategoryClick}
              getRacesByCategory={getRacesByCategory}
            />
            <Box sx={{ width: 350, height: '100%', position: 'sticky', top: 0, alignSelf: 'flex-start' }}>
              <RaceDetailsPanel
                selectedRace={selectedRace}
                selectedCategory={selectedCategory}
                categoryData={categoryData}
              />
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Avbryt</Button>
        <Button
          variant="contained"
          onClick={handleSelectRace}
          disabled={!selectedRace}
        >
          Välj ras
        </Button>
      </DialogActions>
    </>
  );
}

RaceSelectionDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  worldId: PropTypes.string.isRequired,
  onRaceSelected: PropTypes.func.isRequired,
  initialRaceId: PropTypes.string
};

