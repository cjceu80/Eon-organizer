import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../hooks/useAuth';
import {
  Box,
  Container,
  Typography,
  Button,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  Stack,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import MapIcon from '@mui/icons-material/Map';
import ArticleIcon from '@mui/icons-material/Article';
import RuleIcon from '@mui/icons-material/Rule';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import RaceSelectionDialog from './RaceSelectionDialog';
import StatRollingDialog from './StatRollingDialog';
import AgeCalculationDialog from './AgeCalculationDialog';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

export default function WorldDashboard() {
  const { worldId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [world, setWorld] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchWorld = async () => {
      try {
        const response = await fetch(`/api/worlds/${worldId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setWorld(data.world);
        } else {
          navigate('/');
        }
      } catch (err) {
        console.error('Error fetching world:', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchWorld();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, worldId]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          variant="outlined"
        >
          Tillbaka till världar
        </Button>
        <Typography variant="h4">{world?.name || 'Laddar...'}</Typography>
        {world?.ruleset && (
          <Chip
            label={world.ruleset}
            color="info"
            size="medium"
            sx={{ ml: 2 }}
          />
        )}
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="world dashboard tabs">
            <Tab icon={<PersonIcon />} label="Spelare" />
            <Tab icon={<MapIcon />} label="Kartor" />
            <Tab icon={<ArticleIcon />} label="Artiklar" />
            <Tab icon={<RuleIcon />} label="Regler" />
          </Tabs>
        </Box>
        <TabPanel value={activeTab} index={0}>
          <PlayersTab worldId={worldId} world={world} />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <MapsTab />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <ArticlesTab />
        </TabPanel>
            <TabPanel value={activeTab} index={3}>
              <RulesTab worldId={worldId} world={world} onWorldUpdate={setWorld} />
            </TabPanel>
      </Paper>
    </Container>
  );
}

// Players Tab Component
function PlayersTab({ worldId, world }) {
  const { token, user } = useAuth();
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showRaceSelectionDialog, setShowRaceSelectionDialog] = useState(false);
  const [showStatRollingDialog, setShowStatRollingDialog] = useState(false);
  const [showAgeCalculationDialog, setShowAgeCalculationDialog] = useState(false);
  const [showCreateCharacterDialog, setShowCreateCharacterDialog] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [characterName, setCharacterName] = useState('');
  const [characterBio, setCharacterBio] = useState('');
  const [selectedRace, setSelectedRace] = useState(null);
  const [rolledStats, setRolledStats] = useState(null);
  const [ageData, setAgeData] = useState(null);
  const [creating, setCreating] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
  const saveCharacterCreationData = useCallback((race, name, bio, stats = null) => {
    try {
      const data = {
        worldId,
        race: race ? { id: race.id || race._id, name: race.name, category: race.category } : null,
        name: name || '',
        bio: bio || '',
        stats: stats || null,
        timestamp: Date.now()
      };
      localStorage.setItem(getStorageKey(), JSON.stringify(data));
    } catch (err) {
      console.error('Error saving character creation data:', err);
    }
  }, [worldId, getStorageKey]);

  // Clear character creation data from localStorage
  const clearCharacterCreationData = useCallback(() => {
    try {
      localStorage.removeItem(getStorageKey());
    } catch (err) {
      console.error('Error clearing character creation data:', err);
    }
  }, [getStorageKey]);

  // Check for incomplete character creation on component mount
  useEffect(() => {
    const savedData = loadCharacterCreationData();
    if (savedData && savedData.race) {
      // Incomplete creation found - show resume dialog
      setShowResumeDialog(true);
    }
  }, [worldId, loadCharacterCreationData]);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (selectedRace || characterName || characterBio) {
      saveCharacterCreationData(selectedRace, characterName, characterBio);
    }
  }, [selectedRace, characterName, characterBio, saveCharacterCreationData]);

  const fetchCharacters = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/worlds/${worldId}/characters`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCharacters(data.characters || []);
      } else {
        setError('Misslyckades att ladda karaktärer');
      }
    } catch (err) {
      console.error('Error fetching characters:', err);
      setError('Misslyckades att ladda karaktärer');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, worldId]);

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteUsername.trim()) return;

    setSending(true);
    try {
      const response = await fetch('/api/invites', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          worldId,
          username: inviteUsername,
          message: inviteMessage
        })
      });

      if (response.ok) {
        setShowInviteDialog(false);
        setInviteUsername('');
        setInviteMessage('');
        alert('Injudan skickades!');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Misslyckades att skicka inbjudan');
      }
    } catch (err) {
      console.error('Error sending invite:', err);
      alert('Misslyckades att skicka inbjudan');
    } finally {
      setSending(false);
    }
  };

  const handleRaceSelected = (race) => {
    setSelectedRace(race);
    setShowRaceSelectionDialog(false);
    setShowStatRollingDialog(true);
    saveCharacterCreationData(race, characterName, characterBio);
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
    setShowCreateCharacterDialog(true);
    // Save age data to localStorage
    const savedData = loadCharacterCreationData();
    if (savedData) {
      savedData.ageData = ageDataResult;
      localStorage.setItem(getStorageKey(), JSON.stringify(savedData));
    }
  };

  const handleResumeCreation = useCallback(async () => {
    const savedData = loadCharacterCreationData();
    if (savedData) {
      setCharacterName(savedData.name || '');
      setCharacterBio(savedData.bio || '');
      
      // If we have a race, fetch the full race object
      if (savedData.race && savedData.race.id) {
        try {
          const response = await fetch(`/api/races/${savedData.race.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setSelectedRace(data.race);
            // If we have stats, continue to next step
            if (savedData.stats) {
              setRolledStats(savedData.stats);
              // If we have age data, go to final dialog, otherwise go to age calculation
              if (savedData.ageData) {
                setAgeData(savedData.ageData);
                setShowCreateCharacterDialog(true);
              } else {
                setShowAgeCalculationDialog(true);
              }
            } else {
              setShowStatRollingDialog(true);
            }
          } else {
            // Race not found, go back to race selection
            setShowRaceSelectionDialog(true);
          }
        } catch (err) {
          console.error('Error fetching race:', err);
          // On error, go back to race selection
          setShowRaceSelectionDialog(true);
        }
      } else {
        // No race selected yet, go to race selection
        setShowRaceSelectionDialog(true);
      }
    }
    setShowResumeDialog(false);
  }, [loadCharacterCreationData, token]);

  const handleAbandonCreation = () => {
    clearCharacterCreationData();
    setSelectedRace(null);
    setCharacterName('');
    setCharacterBio('');
    setShowResumeDialog(false);
    setShowRaceSelectionDialog(true);
  };

  const handleKeepForLater = () => {
    setShowResumeDialog(false);
  };

  const handleCreateCharacter = async (e) => {
    e.preventDefault();
    if (!characterName.trim() || !selectedRace || !rolledStats || !ageData) return;

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
             lengthRollDetails: ageData?.lengthRollDetails
           }
        })
      });

      if (response.ok) {
        setShowCreateCharacterDialog(false);
        setCharacterName('');
        setCharacterBio('');
        setSelectedRace(null);
        setRolledStats(null);
        setAgeData(null);
        clearCharacterCreationData(); // Clear localStorage on successful creation
        fetchCharacters(); // Refresh the list
        alert('Karaktär skapad!');
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

  const handleDeleteCharacter = async () => {
    if (!characterToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/characters/${characterToDelete.id || characterToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setCharacterToDelete(null);
        fetchCharacters(); // Refresh the list
        alert('Karaktär raderad!');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Misslyckades att radera karaktär');
      }
    } catch (err) {
      console.error('Error deleting character:', err);
      alert('Misslyckades att radera karaktär');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Karaktärer</Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => {
              const savedData = loadCharacterCreationData();
              if (savedData && savedData.race) {
                setShowResumeDialog(true);
              } else {
                setShowRaceSelectionDialog(true);
              }
            }}
          >
            Skapa karaktär
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setShowInviteDialog(true)}
          >
            Skicka inbjudan
          </Button>
        </Stack>
      </Box>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      {/* Resume Creation Dialog */}
      <Dialog open={showResumeDialog} onClose={handleKeepForLater} maxWidth="sm" fullWidth>
        <DialogTitle>Ofullständig karaktärskapande</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Du har en påbörjad karaktärsskapande för denna värld. Vill du fortsätta där du slutade?
          </Typography>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Sparad data:</strong>
            </Typography>
            {(() => {
              const savedData = loadCharacterCreationData();
              if (!savedData) return null;
              return (
                <>
                  {savedData.race && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Ras: {savedData.race.name}
                    </Typography>
                  )}
                  {savedData.name && (
                    <Typography variant="body2">
                      Namn: {savedData.name}
                    </Typography>
                  )}
                  {savedData.bio && (
                    <Typography variant="body2">
                      Bio: {savedData.bio.substring(0, 50)}{savedData.bio.length > 50 ? '...' : ''}
                    </Typography>
                  )}
                </>
              );
            })()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleKeepForLater}>
            Behåll för senare
          </Button>
          <Button onClick={handleAbandonCreation} color="error">
            Avbryt skapande
          </Button>
          <Button onClick={handleResumeCreation} variant="contained">
            Fortsätt skapa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Race Selection Dialog */}
      <RaceSelectionDialog
        open={showRaceSelectionDialog}
        onClose={() => {
          setShowRaceSelectionDialog(false);
          // Save current state when closing (user might have selected a race)
          saveCharacterCreationData(selectedRace, characterName, characterBio);
        }}
        worldId={worldId}
        onRaceSelected={handleRaceSelected}
        initialRaceId={selectedRace?.id || selectedRace?._id || (() => {
          const savedData = loadCharacterCreationData();
          return savedData?.race?.id || null;
        })()}
      />

      <StatRollingDialog
        open={showStatRollingDialog}
        onClose={() => {
          setShowStatRollingDialog(false);
          // Go back to race selection if user cancels
        }}
        onConfirm={handleStatsRolled}
        statRollMethod={world?.settings?.statRollMethod || 'standard'}
        rerolls={world?.settings?.rerolls || 0}
        selectedRace={selectedRace}
        feminineAttributes={world?.settings?.feminineAttributes || false}
        minAttributes={world?.settings?.minAttributes !== undefined ? world?.settings?.minAttributes : null}
        maxAttributes={world?.settings?.maxAttributes !== undefined ? world?.settings?.maxAttributes : null}
      />

             <AgeCalculationDialog
         open={showAgeCalculationDialog}
         onClose={() => {
           setShowAgeCalculationDialog(false);
           // Go back to stat rolling if user cancels
         }}
         onConfirm={handleAgeCalculated}
         attributes={rolledStats?.attributes}
         rerolls={world?.settings?.rerolls || 0}
         selectedRace={selectedRace}
         gender={rolledStats?.gender || 'man'}
         varierandeVikt={world?.settings?.varierandeVikt !== undefined ? world?.settings?.varierandeVikt : true}
       />

      {/* Create Character Dialog */}
      <Dialog open={showCreateCharacterDialog} onClose={() => {
        setShowCreateCharacterDialog(false);
        // Don't clear data when closing - keep it in localStorage
      }} maxWidth="sm" fullWidth>
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
              setSelectedRace(null);
              setCharacterName('');
              setCharacterBio('');
            }} disabled={creating}>
              Avbryt och radera
            </Button>
            <Button
              onClick={() => {
                setShowCreateCharacterDialog(false);
                setShowRaceSelectionDialog(true);
              }}
              disabled={creating}
            >
              Tillbaka till rasval
            </Button>
            <Button type="submit" variant="contained" disabled={creating || !characterName.trim() || !selectedRace}>
              {creating ? 'Skapar...' : 'Skapa'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Send Invite Dialog */}
      <Dialog open={showInviteDialog} onClose={() => setShowInviteDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSendInvite}>
          <DialogTitle>Skicka inbjudan</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="inviteUsername"
              label="Användarnamn"
              type="text"
              fullWidth
              variant="outlined"
              value={inviteUsername}
              onChange={(e) => setInviteUsername(e.target.value)}
              disabled={sending}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              id="inviteMessage"
              label="Meddelande (valfritt)"
              type="text"
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              disabled={sending}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowInviteDialog(false)} disabled={sending}>
              Avbryt
            </Button>
            <Button type="submit" variant="contained" disabled={sending || !inviteUsername.trim()}>
              {sending ? 'Skickar...' : 'Skicka'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Character Confirmation Dialog */}
      <Dialog open={!!characterToDelete} onClose={() => setCharacterToDelete(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Radera karaktär</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Är du säker på att du vill radera <strong>{characterToDelete?.name}</strong>? Denna åtgärd kan inte ångras.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCharacterToDelete(null)} disabled={deleting}>
            Avbryt
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDeleteCharacter} 
            disabled={deleting}
            startIcon={<DeleteIcon />}
          >
            {deleting ? 'Radera...' : 'Radera'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Characters List */}
      {characters.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="body1" color="text.secondary">
            Inga karaktärer har skapats i denna värld än.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {characters.map(character => (
            <Grid item xs={12} sm={6} md={4} key={character._id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {character.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {character.bio || 'No bio'}
                  </Typography>
                  <Box mb={1}>
                    <Typography variant="caption" color="text.secondary">
                      Ägare: {character.owner?.username || 'Okänd'}
                    </Typography>
                  </Box>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip
                      label={character.isActive ? 'Aktiv' : 'Inaktiv'}
                      color={character.isActive ? 'success' : 'default'}
                      size="small"
                    />
                    {character.owner?.id === user?.id && (
                      <Chip
                        label="Min karaktär"
                        color="primary"
                        size="small"
                      />
                    )}
                  </Box>
                </CardContent>
                {(character.owner?.id === user?.id || world?.admin === user?.id) && (
                  <CardActions>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => setCharacterToDelete(character)}
                    >
                      Radera
                    </Button>
                  </CardActions>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

// Placeholder Tab Components
function MapsTab() {
  return (
    <Typography variant="body1" color="text.secondary">
      Kartor kommer snart...
    </Typography>
  );
}

function ArticlesTab() {
  return (
    <Typography variant="body1" color="text.secondary">
      Artiklar kommer snart...
    </Typography>
  );
}

function RulesTab({ worldId, world, onWorldUpdate }) {
  const { token, user } = useAuth();
  const [statRollMethod, setStatRollMethod] = useState('standard');
  const [rerolls, setRerolls] = useState(0);
  const [freeSelections, setFreeSelections] = useState(0);
  const [feminineAttributes, setFeminineAttributes] = useState(false);
  const [minAttributes, setMinAttributes] = useState(null);
  const [maxAttributes, setMaxAttributes] = useState(null);
  const [varierandeVikt, setVarierandeVikt] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load settings from world when component mounts or world changes
  useEffect(() => {
    if (world && world.settings) {
      setStatRollMethod(world.settings.statRollMethod || 'standard');
      setRerolls(world.settings.rerolls || 0);
      setFreeSelections(world.settings.freeSelections || 0);
      setFeminineAttributes(world.settings.feminineAttributes || false);
      setMinAttributes(world.settings.minAttributes !== undefined ? world.settings.minAttributes : null);
      setMaxAttributes(world.settings.maxAttributes !== undefined ? world.settings.maxAttributes : null);
      setVarierandeVikt(world.settings.varierandeVikt !== undefined ? world.settings.varierandeVikt : true);
    } else if (world && !world.settings) {
      setStatRollMethod('standard');
      setRerolls(0);
      setFreeSelections(0);
      setFeminineAttributes(false);
      setMinAttributes(null);
      setMaxAttributes(null);
      setVarierandeVikt(true);
    }
  }, [world]);

  const handleSave = async () => {
    if (!world) return;
    
    // Check admin with string conversion to handle both string and ObjectId
    // Admin can be: string ID, ObjectId, or populated object { id, username, email }
    let worldAdminId = '';
    if (world.admin) {
      if (typeof world.admin === 'object' && world.admin !== null && world.admin.id) {
        // Populated admin object
        worldAdminId = String(world.admin.id);
      } else if (typeof world.admin === 'string' && world.admin !== '[object Object]') {
        // String ID (but not the string representation of an object)
        worldAdminId = world.admin;
      } else {
        // Try to get ID from object or use toString
        worldAdminId = String(world.admin);
      }
    }
    const userId = user?.id ? String(user.id) : '';
    
    if (worldAdminId !== userId) {
      return;
    }

    setSaving(true);
    setError('');
    try {
      const settingsPayload = {
        ...world.settings,
        statRollMethod,
        rerolls,
        freeSelections,
        feminineAttributes,
        minAttributes: minAttributes === '' ? null : minAttributes,
        maxAttributes: maxAttributes === '' ? null : maxAttributes,
        varierandeVikt
      };
      
      const response = await fetch(`/api/worlds/${worldId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          settings: settingsPayload
        })
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        setError(errorData.message || 'Misslyckades att spara inställningar');
        console.error('Save failed:', response.status, errorData);
        return;
      }

      const data = await response.json();
      
      // Update local state with saved values
      if (data.world && data.world.settings) {
        setStatRollMethod(data.world.settings.statRollMethod || 'standard');
        setRerolls(data.world.settings.rerolls || 0);
        setFreeSelections(data.world.settings.freeSelections || 0);
        setFeminineAttributes(data.world.settings.feminineAttributes || false);
        setMinAttributes(data.world.settings.minAttributes !== undefined ? data.world.settings.minAttributes : null);
        setMaxAttributes(data.world.settings.maxAttributes !== undefined ? data.world.settings.maxAttributes : null);
        setVarierandeVikt(data.world.settings.varierandeVikt !== undefined ? data.world.settings.varierandeVikt : true);
      }
      
      onWorldUpdate(data.world);
      alert('Inställningar sparade!');
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Misslyckades att spara inställningar');
    } finally {
      setSaving(false);
    }
  };

  // Check admin with string conversion to handle both string and ObjectId
  // Admin can be: string ID, ObjectId, or populated object { id, username, email }
  let worldAdminId = '';
  if (world?.admin) {
    if (typeof world.admin === 'object' && world.admin !== null && world.admin.id) {
      // Populated admin object
      worldAdminId = String(world.admin.id);
    } else if (typeof world.admin === 'string' && world.admin !== '[object Object]') {
      // String ID (but not the string representation of an object)
      worldAdminId = world.admin;
    } else {
      // Try to get ID from object or use toString
      worldAdminId = String(world.admin);
    }
  }
  const userId = user?.id ? String(user.id) : '';
  const isAdmin = worldAdminId && userId && worldAdminId !== '[object Object]' && worldAdminId === userId;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Karaktärskapande - Inställningar
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Konfigurera hur attribut ska rullas för nya karaktärer i denna värld.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      <Box sx={{ maxWidth: 600 }}>
        <TextField
          select
          fullWidth
          label="Attributrullning"
          value={statRollMethod}
          onChange={(e) => setStatRollMethod(e.target.value)}
          disabled={!isAdmin || saving}
          sx={{ mb: 3 }}
          helperText="Välj metod för att rulla huvudattribut"
        >
          <MenuItem value="standard">Standard</MenuItem>
          <MenuItem value="anpassad">Anpassad</MenuItem>
          <MenuItem value="höga attribut">Höga attribut</MenuItem>
          <MenuItem value="hjälteattribut">Hjälteattribut</MenuItem>
        </TextField>

        <TextField
          type="number"
          fullWidth
          label="Omrullningar"
          value={rerolls}
          onChange={(e) => setRerolls(Math.max(0, parseInt(e.target.value) || 0))}
          disabled={!isAdmin || saving}
          sx={{ mb: 3 }}
          inputProps={{ min: 0 }}
          helperText="Antal gånger spelare kan rulla om attribut"
        />

        <TextField
          type="number"
          fullWidth
          label="Fria val"
          value={freeSelections}
          onChange={(e) => setFreeSelections(Math.max(0, parseInt(e.target.value) || 0))}
          disabled={!isAdmin || saving}
          sx={{ mb: 3 }}
          inputProps={{ min: 0 }}
          helperText="Antal attribut som kan väljas fritt"
        />

        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={feminineAttributes}
                onChange={(e) => setFeminineAttributes(e.target.checked)}
                disabled={!isAdmin || saving}
              />
            }
            label="Kvinnliga attribut"
          />
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
            Aktivera kvinnliga attribut för denna värld
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Minimum attribut
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={minAttributes !== null}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setMinAttributes(3);
                    } else {
                      setMinAttributes(null);
                    }
                  }}
                  disabled={!isAdmin || saving}
                />
              }
              label="Aktivera"
            />
            {minAttributes !== null && (
              <TextField
                type="number"
                size="small"
                label="Minimum värde"
                value={minAttributes}
                onChange={(e) => setMinAttributes(parseInt(e.target.value) || 3)}
                disabled={!isAdmin || saving}
                inputProps={{ min: 1, max: 20 }}
                sx={{ width: 150 }}
              />
            )}
          </Box>
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
            Minimum värde för rullade attribut. Ras- och könmodifikationer kan överskrida detta.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Maximum attribut
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={maxAttributes !== null}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setMaxAttributes(18);
                    } else {
                      setMaxAttributes(null);
                    }
                  }}
                  disabled={!isAdmin || saving}
                />
              }
              label="Aktivera"
            />
            {maxAttributes !== null && (
              <TextField
                type="number"
                size="small"
                label="Maximum värde"
                value={maxAttributes}
                onChange={(e) => setMaxAttributes(parseInt(e.target.value) || 18)}
                disabled={!isAdmin || saving}
                inputProps={{ min: 1, max: 30 }}
                sx={{ width: 150 }}
              />
            )}
          </Box>
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
            Maximum värde för rullade attribut. Ras- och könmodifikationer kan överskrida detta.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={varierandeVikt}
                onChange={(e) => setVarierandeVikt(e.target.checked)}
                disabled={!isAdmin || saving}
              />
            }
            label="Varierande vikt"
          />
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
            Aktivera varierande vikt för denna värld
          </Typography>
        </Box>

        {isAdmin && (
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{ mt: 2 }}
          >
            {saving ? 'Sparar...' : 'Spara inställningar'}
          </Button>
        )}

        {!isAdmin && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Endast världsadministratören kan ändra dessa inställningar.
          </Alert>
        )}
      </Box>
    </Box>
  );
}

RulesTab.propTypes = {
  worldId: PropTypes.string.isRequired,
  world: PropTypes.object,
  onWorldUpdate: PropTypes.func.isRequired,
};

PlayersTab.propTypes = {
  worldId: PropTypes.string.isRequired,
  world: PropTypes.object,
};
