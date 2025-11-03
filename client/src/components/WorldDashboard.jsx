import { useState, useEffect } from 'react';
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
  Stack
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import MapIcon from '@mui/icons-material/Map';
import ArticleIcon from '@mui/icons-material/Article';
import RuleIcon from '@mui/icons-material/Rule';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';

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
          <RulesTab />
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
  const [showCreateCharacterDialog, setShowCreateCharacterDialog] = useState(false);
  const [characterName, setCharacterName] = useState('');
  const [characterBio, setCharacterBio] = useState('');
  const [creating, setCreating] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleCreateCharacter = async (e) => {
    e.preventDefault();
    if (!characterName.trim()) return;

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
          bio: characterBio
        })
      });

      if (response.ok) {
        setShowCreateCharacterDialog(false);
        setCharacterName('');
        setCharacterBio('');
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
            onClick={() => setShowCreateCharacterDialog(true)}
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

      {/* Create Character Dialog */}
      <Dialog open={showCreateCharacterDialog} onClose={() => setShowCreateCharacterDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreateCharacter}>
          <DialogTitle>Skapa karaktär</DialogTitle>
          <DialogContent>
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
            <Button onClick={() => setShowCreateCharacterDialog(false)} disabled={creating}>
              Avbryt
            </Button>
            <Button type="submit" variant="contained" disabled={creating || !characterName.trim()}>
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

function RulesTab() {
  return (
    <Typography variant="body1" color="text.secondary">
      Regler kommer snart...
    </Typography>
  );
}

PlayersTab.propTypes = {
  worldId: PropTypes.string.isRequired,
  world: PropTypes.object,
};
