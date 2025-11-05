import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../../hooks/useAuth';

import { EON_ATTRIBUTES } from '../../utils/dice';

export default function RaceSelectionDialog({ onClose, worldId, onRaceSelected, initialRaceId = null }) {
  const { token } = useAuth();
  const [races, setRaces] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [categoryData, setCategoryData] = useState({}); // category name -> category object
  const [selectedRace, setSelectedRace] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRacesAndCategories = useCallback(async () => {
    if (!token || !worldId) return;

    setLoading(true);
    setError('');
    try {
      // Fetch world to get ruleset
      const worldResponse = await fetch(`/api/worlds/${worldId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!worldResponse.ok) {
        throw new Error('Failed to fetch world');
      }

      const worldData = await worldResponse.json();
      const ruleset = worldData.world?.ruleset || 'EON';

      // Fetch races
      const racesResponse = await fetch(`/api/races/world/${worldId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!racesResponse.ok) {
        throw new Error('Failed to fetch races');
      }

      const racesData = await racesResponse.json();
      setRaces(racesData.races || []);

      // Group races by category and collect unique category names
      const categoryMap = {};
      const uniqueCategories = new Set();
      racesData.races.forEach(race => {
        const categoryName = race.category || 'Okategoriserade';
        uniqueCategories.add(categoryName);
        if (!categoryMap[categoryName]) {
          categoryMap[categoryName] = [];
        }
        categoryMap[categoryName].push(race);
      });

      setCategoryList(Array.from(uniqueCategories).sort());

      // Fetch category details
      try {
        const categoriesResponse = await fetch(`/api/race-categories/${ruleset}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          const categoryObj = {};
          categoriesData.categories?.forEach(cat => {
            categoryObj[cat.name] = cat;
          });
          setCategoryData(categoryObj);
        }
      } catch (catErr) {
        console.error('Error fetching categories:', catErr);
        // Non-fatal error, continue without category details
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Misslyckades att ladda data');
    } finally {
      setLoading(false);
    }
  }, [token, worldId]);

  useEffect(() => {
    if (worldId) {
      fetchRacesAndCategories();
      // Reset selection when dialog opens (unless we have an initial race)
      if (!initialRaceId) {
        setSelectedRace(null);
        setSelectedCategory(null);
      }
    }
  }, [worldId, initialRaceId, fetchRacesAndCategories]);

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

  const formatModifier = (value) => {
    if (value === 0) return '0';
    return value > 0 ? `+${value}` : `${value}`;
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

  const getModifiersFromRace = (race) => {
    const modifiers = {};
    if (race.modifiers && typeof race.modifiers === 'object') {
      // Handle both Map and plain object
      if (race.modifiers instanceof Map) {
        race.modifiers.forEach((value, key) => {
          modifiers[key] = value;
        });
      } else {
        Object.entries(race.modifiers).forEach(([key, value]) => {
          modifiers[key] = value;
        });
      }
    }
    return modifiers;
  };

  const formatDescription = (text) => {
    if (!text) return [];
    
    // First try splitting by double line breaks (paragraph breaks)
    if (text.includes('\n\n')) {
      return text.split('\n\n').filter(p => p.trim());
    }
    
    // Then try splitting by single line breaks
    if (text.includes('\n')) {
      return text.split('\n').filter(p => p.trim());
    }
    
    // Otherwise, split by sentences (period followed by space or end of string)
    const sentences = text.split(/\.(\s+|$)/).filter(s => s.trim());
    const paragraphs = [];
    let currentParagraph = '';
    
    sentences.forEach((sentence, index) => {
      const trimmed = sentence.trim();
      if (!trimmed) return;
      
      currentParagraph += (currentParagraph ? '. ' : '') + trimmed;
      
      // Group 2-3 sentences per paragraph, or break at end
      if ((index + 1) % 2 === 0 || index === sentences.length - 1) {
        if (currentParagraph && !currentParagraph.endsWith('.')) {
          currentParagraph += '.';
        }
        paragraphs.push(currentParagraph);
        currentParagraph = '';
      }
    });
    
    return paragraphs.length > 0 ? paragraphs : [text];
  };

  const renderRaceDetails = () => {
    if (selectedRace) {
      // Handle metadata - could be Map or plain object
      let description = 'Ingen beskrivning';
      if (selectedRace.metadata) {
        if (selectedRace.metadata instanceof Map) {
          description = selectedRace.metadata.get('description') || description;
        } else if (typeof selectedRace.metadata === 'object') {
          description = selectedRace.metadata.description || description;
        }
      }

      const paragraphs = formatDescription(description);
      
      // Get category info for exhaustion formula
      const categoryName = selectedRace.category || '';
      const categoryInfo = categoryName ? categoryData[categoryName] : null;

      return (
        <Paper sx={{ p: 2, height: '100%', maxHeight: '600px', overflowY: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            {selectedRace.name}
          </Typography>
          {categoryInfo?.exhaustionColumnDivisor && (
            <Box sx={{ mb: 2, mt: 1, p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Utmattningskolumner
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                (TÅL + VIL) / {categoryInfo.exhaustionColumnDivisor}
              </Typography>
            </Box>
          )}
          <Divider sx={{ my: 2 }} />
          <Box sx={{ mt: 2 }}>
            {paragraphs.map((paragraph, index) => (
              <Typography 
                key={index} 
                variant="body2" 
                color="text.secondary" 
                paragraph={index < paragraphs.length - 1}
                sx={{ mb: paragraph.length > 100 ? 2 : 1 }}
              >
                {paragraph}
              </Typography>
            ))}
          </Box>
        </Paper>
      );
    }

    if (selectedCategory) {
      const categoryInfo = categoryData[selectedCategory];
      return (
        <Paper sx={{ p: 2, height: '100%', maxHeight: '600px', overflowY: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            {selectedCategory}
          </Typography>
          {categoryInfo?.description && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" paragraph>
                {categoryInfo.description}
              </Typography>
            </Box>
          )}
          {categoryInfo?.exhaustionColumnDivisor && (
            <Box sx={{ mb: 2, mt: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Utmattningskolumner
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                (TÅL + VIL) / {categoryInfo.exhaustionColumnDivisor}
              </Typography>
            </Box>
          )}
        </Paper>
      );
    }

    return (
      <Paper sx={{ p: 2, height: '100%', maxHeight: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Välj en kategori eller ras för att se detaljer
        </Typography>
      </Paper>
    );
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
            {/* Left side: Categories and Races in Tables */}
            <Box sx={{ flex: 1, overflowY: 'auto', borderRight: 1, borderColor: 'divider', pr: 2 }}>
              {categoryList.map(categoryName => {
                const categoryRaces = getRacesByCategory(categoryName);
                return (
                  <Box key={categoryName} sx={{ mb: 4 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        cursor: 'pointer',
                        p: 1,
                        mb: 1,
                        borderRadius: 1,
                        '&:hover': { bgcolor: 'action.hover' },
                        bgcolor: selectedCategory === categoryName ? 'action.selected' : 'transparent'
                      }}
                      onClick={() => handleCategoryClick(categoryName)}
                    >
                      {categoryName}
                    </Typography>
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
                          {categoryRaces.map(race => {
                            const modifiers = getModifiersFromRace(race);
                            const isSelected = selectedRace?.id === race.id || selectedRace?._id === race._id;
                            return (
                              <TableRow
                                key={race.id || race._id}
                                onClick={() => handleRaceClick(race)}
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
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                );
              })}
            </Box>

            {/* Right side: Details sidebar - fixed position */}
            <Box sx={{ width: 350, height: '100%', position: 'sticky', top: 0, alignSelf: 'flex-start' }}>
              {renderRaceDetails()}
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

