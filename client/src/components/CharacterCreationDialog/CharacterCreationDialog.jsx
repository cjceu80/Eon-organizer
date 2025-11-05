import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography
} from '@mui/material';
import RaceSelectionDialog from './RaceSelectionDialog';
import StatRollingDialog from './StatRollingDialog';
import AgeCalculationDialog from './AgeCalculationDialog';
import CharacteristicsDialog from './CharacteristicsDialog';
import BirthDialog from './BirthDialog';
import FamilyDialog from './FamilyDialog';

export default function CharacterCreationDialog({ 
  open,
  onClose,
  worldId,
  world,
  token,
  onConfirm
}) {
  const [showRaceSelectionDialog, setShowRaceSelectionDialog] = useState(false);
  const [showStatRollingDialog, setShowStatRollingDialog] = useState(false);
  const [showAgeCalculationDialog, setShowAgeCalculationDialog] = useState(false);
  const [showCharacteristicsDialog, setShowCharacteristicsDialog] = useState(false);
  const [showBirthDialog, setShowBirthDialog] = useState(false);
  const [showFamilyDialog, setShowFamilyDialog] = useState(false);
  const [showCreateCharacterDialog, setShowCreateCharacterDialog] = useState(false);

  const [selectedRace, setSelectedRace] = useState(null);
  const [characterName, setCharacterName] = useState('');
  const [characterBio, setCharacterBio] = useState('');
  const [rolledStats, setRolledStats] = useState(null);
  const [characteristicsData, setCharacteristicsData] = useState(null);
  const [backgroundData, setBackgroundData] = useState(null);
  const [ageData, setAgeData] = useState(null);
  // Siblings and parents data are stored in localStorage but not needed in state
  // They're extracted from familyResult when needed
  const [raceCategory, setRaceCategory] = useState(null);
  const [creating, setCreating] = useState(false);

  // localStorage key for this world
  const getStorageKey = useCallback(() => `characterCreation_${worldId}`, [worldId]);

  // Load character creation data from localStorage
  const loadCharacterCreationData = useCallback(() => {
    try {
      const data = localStorage.getItem(getStorageKey());
      if (data) {
        return JSON.parse(data);
      }
    } catch (err) {
      console.error('Error loading character creation data:', err);
    }
    return null;
  }, [getStorageKey]);

  // Save character creation data to localStorage
  const saveCharacterCreationData = useCallback((race, name, bio, stats = null, characteristics = null, background = null) => {
    try {
      const data = {
        worldId,
        race: race ? { id: race.id || race._id, name: race.name, category: race.category } : null,
        name: name || '',
        bio: bio || '',
        stats: stats || null,
        characteristics: characteristics || null,
        background: background || null,
        timestamp: Date.now()
      };
      localStorage.setItem(getStorageKey(), JSON.stringify(data));
    } catch (err) {
      console.error('Error saving character creation data:', err);
    }
  }, [worldId, getStorageKey]);

  // Save any state to localStorage (merge with existing data)
  const saveStateToStorage = useCallback((stateData) => {
    try {
      const savedData = loadCharacterCreationData();
      const updatedData = {
        ...savedData,
        ...stateData,
        timestamp: Date.now()
      };
      localStorage.setItem(getStorageKey(), JSON.stringify(updatedData));
    } catch (err) {
      console.error('Error saving state to localStorage:', err);
    }
  }, [getStorageKey, loadCharacterCreationData]);

  // Clear character creation data from localStorage
  const clearCharacterCreationData = useCallback(() => {
    try {
      localStorage.removeItem(getStorageKey());
    } catch (err) {
      console.error('Error clearing character creation data:', err);
    }
  }, [getStorageKey]);

  // Fetch race category
  const fetchRaceCategory = async (raceOverride = null) => {
    const raceToUse = raceOverride || selectedRace;
    if (!raceToUse || !raceToUse.category || !world) {
      setRaceCategory(null);
      return;
    }
    
    try {
      const response = await fetch(`/api/race-categories/${world.ruleset || 'EON'}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const category = data.categories?.find(cat => cat.name === raceToUse.category);
        setRaceCategory(category || null);
      } else {
        setRaceCategory(null);
      }
    } catch (err) {
      console.error('Error fetching race category:', err);
      setRaceCategory(null);
    }
  };

  // Initialize when dialog opens - restore state from localStorage
  useEffect(() => {
    if (open) {
      const savedData = loadCharacterCreationData();
      if (savedData) {
        // Restore race selection
        if (savedData.race) {
          // Race is stored as { id, name, category } - we'd need to fetch full race object
          // For now, just set the show dialog state
        }
        // Restore character name and bio
        if (savedData.name) setCharacterName(savedData.name);
        if (savedData.bio) setCharacterBio(savedData.bio);
        // Restore stats
        if (savedData.stats) setRolledStats(savedData.stats);
        // Restore age data
        if (savedData.ageData) setAgeData(savedData.ageData);
        // Restore characteristics
        if (savedData.characteristics) setCharacteristicsData(savedData.characteristics);
        // Restore background
        if (savedData.background) setBackgroundData(savedData.background);
        
        // Determine which dialog to show based on what data exists
        if (savedData.background && savedData.siblings) {
          // We have family data, show create character dialog
          setShowCreateCharacterDialog(true);
        } else if (savedData.background) {
          // We have background, show family dialog
          setShowFamilyDialog(true);
        } else if (savedData.characteristics) {
          // We have characteristics, show birth dialog
          setShowBirthDialog(true);
        } else if (savedData.ageData) {
          // We have age data, show characteristics dialog
          setShowCharacteristicsDialog(true);
        } else if (savedData.stats) {
          // We have stats, show age calculation dialog
          setShowAgeCalculationDialog(true);
        } else if (savedData.race) {
          // We have race, show stat rolling dialog
          setShowStatRollingDialog(true);
        } else {
          // Start from beginning
          setShowRaceSelectionDialog(true);
        }
      } else {
        // No saved data, start from beginning
        setShowRaceSelectionDialog(true);
      }
    }
  }, [open, loadCharacterCreationData]);

  // Reset all state when dialog closes
  useEffect(() => {
    if (!open) {
      // Reset all dialog states
      setShowRaceSelectionDialog(false);
      setShowStatRollingDialog(false);
      setShowAgeCalculationDialog(false);
      setShowCharacteristicsDialog(false);
      setShowBirthDialog(false);
      setShowFamilyDialog(false);
      setShowCreateCharacterDialog(false);
      
      // Reset all data states
      setSelectedRace(null);
      setCharacterName('');
      setCharacterBio('');
      setRolledStats(null);
      setCharacteristicsData(null);
      setBackgroundData(null);
      setAgeData(null);
      setRaceCategory(null);
      setCreating(false);
      
      // Clear localStorage when closing
      clearCharacterCreationData();
    }
  }, [open, clearCharacterCreationData]);
  

  const handleRaceSelected = async (race) => {
    setSelectedRace(race);
    setShowRaceSelectionDialog(false);
    setShowStatRollingDialog(true);
    saveCharacterCreationData(race, characterName, characterBio);
    // Fetch race category early so it's available for age calculation
    await fetchRaceCategory(race);
  };

  const handleBackgroundConfirmed = async (backgroundResult) => {
    setBackgroundData(backgroundResult);
    setShowBirthDialog(false);
    // Fetch race category for family formula
    await fetchRaceCategory();
    setShowFamilyDialog(true);
    // Save background to localStorage
    const savedData = loadCharacterCreationData();
    if (savedData) {
      savedData.background = backgroundResult;
      localStorage.setItem(getStorageKey(), JSON.stringify(savedData));
    }
  };

  const handleCharacteristicsConfirmed = (characteristicsResult) => {
    setCharacteristicsData(characteristicsResult);
    setShowCharacteristicsDialog(false);
    setShowBirthDialog(true);
    // Save characteristics to localStorage
    const savedData = loadCharacterCreationData();
    if (savedData) {
      savedData.characteristics = characteristicsResult;
      localStorage.setItem(getStorageKey(), JSON.stringify(savedData));
    }
  };

  const handleFamilyConfirmed = (familyResult) => {
    setShowFamilyDialog(false);
    setShowCreateCharacterDialog(true);
    // Save family data to localStorage
    const savedData = loadCharacterCreationData();
    if (savedData) {
      savedData.siblings = {
        siblings: familyResult.siblings,
        olderLitters: familyResult.olderLitters,
        youngerLitters: familyResult.youngerLitters,
        formula: familyResult.siblingFormula
      };
      savedData.parents = {
        parentStatus: familyResult.parentStatus,
        rollResult: familyResult.parentRollResult,
        formula: familyResult.parentFormula,
        table: familyResult.parentTable
      };
      localStorage.setItem(getStorageKey(), JSON.stringify(savedData));
    }
  };

  const handleCreateCharacter = async (e) => {
    e.preventDefault();
    if (!characterName.trim() || !selectedRace || !rolledStats || !characteristicsData || !backgroundData || !ageData) return;

    setCreating(true);
    try {
      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: characterName,
          worldId,
          bio: characterBio,
          stats: {
            race: selectedRace.id || selectedRace._id,
            attributes: rolledStats.attributes,
            rollMethod: rolledStats.method,
            rerollsUsed: rolledStats.rerollsUsed || 0,
            age: ageData?.age,
            ageBonus: ageData?.ageBonus,
            ageRollDetails: ageData?.ageRollDetails,
            kroppsbyggnad: ageData?.kroppsbyggnad,
            kroppsbyggnadRollDetails: ageData?.kroppsbyggnadRollDetails,
            length: ageData?.length,
            weight: ageData?.weight,
            lengthRollDetails: ageData?.lengthRollDetails,
            characteristics: characteristicsData?.characteristics || {},
            specializations: characteristicsData?.specializations || {},
            background: backgroundData || {}
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setShowCreateCharacterDialog(false);
        clearCharacterCreationData();
        if (onConfirm) {
          onConfirm(data.character);
        }
        onClose();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Misslyckades att skapa karaktär');
      }
    } catch (err) {
      console.error('Error creating character:', err);
      alert('Misslyckades att skapa karaktär');
    } finally {
      setCreating(false);
    }
  };


  const handleStatsRolled = (statsData) => {
    setRolledStats(statsData);
    setShowStatRollingDialog(false);
    setShowAgeCalculationDialog(true);
    // Save stats to localStorage
    const savedData = loadCharacterCreationData();
    if (savedData) {
      savedData.stats = statsData;
      localStorage.setItem(getStorageKey(), JSON.stringify(savedData));
    }
  };

  const handleAgeCalculated = (ageDataResult) => {
    setAgeData(ageDataResult);
    setShowAgeCalculationDialog(false);
    setShowCharacteristicsDialog(true);
    // Save age data to localStorage
    const savedData = loadCharacterCreationData();
    if (savedData) {
      savedData.ageData = ageDataResult;
      localStorage.setItem(getStorageKey(), JSON.stringify(savedData));
    }
  };

  // Determine which dialog content to show
  const showDialog = open && (
    showRaceSelectionDialog || 
    showStatRollingDialog || 
    showAgeCalculationDialog || 
    showCharacteristicsDialog || 
    showBirthDialog || 
    showFamilyDialog || 
    showCreateCharacterDialog
  );

  const handleDialogClose = () => {
    // Close the entire character creation dialog
    onClose();
  };

  return (
    <Dialog open={showDialog} onClose={handleDialogClose} maxWidth="xl" fullWidth>
      {showRaceSelectionDialog && (
        <RaceSelectionDialog
          onClose={handleDialogClose}
          worldId={worldId}
          onRaceSelected={handleRaceSelected}
          initialRaceId={selectedRace?.id || selectedRace?._id || (() => {
            const savedData = loadCharacterCreationData();
            return savedData?.race?.id || null;
          })()}
        />
      )}

      {showStatRollingDialog && (
        <StatRollingDialog
          onClose={handleDialogClose}
          onConfirm={handleStatsRolled}
          onStateChange={saveStateToStorage}
          savedState={loadCharacterCreationData()?.statRollingState || null}
          statRollMethod={world?.settings?.statRollMethod || 'standard'}
          rerolls={world?.settings?.rerolls || 0}
          selectedRace={selectedRace}
          feminineAttributes={world?.settings?.feminineAttributes || false}
          minAttributes={world?.settings?.minAttributes !== undefined ? world?.settings?.minAttributes : null}
          maxAttributes={world?.settings?.maxAttributes !== undefined ? world?.settings?.maxAttributes : null}
        />
      )}

      {showAgeCalculationDialog && (
        <AgeCalculationDialog
          onClose={handleDialogClose}
          onConfirm={handleAgeCalculated}
          onStateChange={saveStateToStorage}
          savedState={loadCharacterCreationData()?.ageCalculationState || null}
          attributes={rolledStats?.attributes}
          rerolls={world?.settings?.rerolls || 0}
          selectedRace={selectedRace}
          raceCategory={raceCategory}
          gender={rolledStats?.gender || 'man'}
          varierandeVikt={world?.settings?.varierandeVikt !== undefined ? world?.settings?.varierandeVikt : true}
        />
      )}

      {showCharacteristicsDialog && (
        <CharacteristicsDialog
          onClose={handleDialogClose}
          onConfirm={handleCharacteristicsConfirmed}
          onStateChange={saveStateToStorage}
          savedState={loadCharacterCreationData()?.characteristicsState || null}
        />
      )}

      {showBirthDialog && (
        <BirthDialog
          onClose={handleDialogClose}
          onConfirm={handleBackgroundConfirmed}
          onStateChange={saveStateToStorage}
          savedState={loadCharacterCreationData()?.birthState || null}
          worldSettings={world?.settings || {}}
          ageData={ageData}
        />
      )}

      {showFamilyDialog && (
        <FamilyDialog
          onClose={handleDialogClose}
          onConfirm={handleFamilyConfirmed}
          onStateChange={saveStateToStorage}
          savedState={loadCharacterCreationData()?.familyState || null}
          ageData={ageData}
          selectedRace={selectedRace}
          raceCategory={raceCategory}
          rerolls={world?.settings?.rerolls || 0}
        />
      )}

      {showCreateCharacterDialog && (
        <form onSubmit={handleCreateCharacter}>
          <DialogTitle>Skapa karaktär</DialogTitle>
          <DialogContent>
            {selectedRace && (
              <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Vald ras:
                </Typography>
                <Typography variant="h6">{selectedRace.name}</Typography>
                {selectedRace.category && (
                  <Typography variant="caption" color="text.secondary">
                    Kategori: {selectedRace.category}
                  </Typography>
                )}
              </Box>
            )}
            <TextField
              autoFocus
              margin="dense"
              id="characterName"
              label="Karaktärnamn"
              type="text"
              fullWidth
              variant="outlined"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              disabled={creating}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              id="characterBio"
              label="Biografi (valfritt)"
              type="text"
              fullWidth
              variant="outlined"
              multiline
              rows={4}
              value={characterBio}
              onChange={(e) => setCharacterBio(e.target.value)}
              disabled={creating}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setShowCreateCharacterDialog(false);
              clearCharacterCreationData();
              handleDialogClose();
            }} disabled={creating}>
              Avbryt och radera
            </Button>
            <Button type="submit" variant="contained" disabled={creating || !characterName.trim() || !selectedRace}>
              {creating ? 'Skapar...' : 'Skapa'}
            </Button>
          </DialogActions>
        </form>
      )}
    </Dialog>
  );
}

CharacterCreationDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  worldId: PropTypes.string.isRequired,
  world: PropTypes.object,
  token: PropTypes.string.isRequired,
  onConfirm: PropTypes.func
};

