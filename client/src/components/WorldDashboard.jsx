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
          Back to Worlds
        </Button>
        <Typography variant="h4">{world?.name || 'Loading...'}</Typography>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="world dashboard tabs">
            <Tab icon={<PersonIcon />} label="Players" />
            <Tab icon={<MapIcon />} label="Maps" />
            <Tab icon={<ArticleIcon />} label="Articles" />
            <Tab icon={<RuleIcon />} label="Rules" />
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
        setError('Failed to load characters');
      }
    } catch (err) {
      console.error('Error fetching characters:', err);
      setError('Failed to load characters');
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
        alert('Invite sent successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to send invite');
      }
    } catch (err) {
      console.error('Error sending invite:', err);
      alert('Failed to send invite');
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
        alert('Character created successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to create character');
      }
    } catch (err) {
      console.error('Error creating character:', err);
      alert('Failed to create character');
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
        alert('Character deleted successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to delete character');
      }
    } catch (err) {
      console.error('Error deleting character:', err);
      alert('Failed to delete character');
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
        <Typography variant="h5">Characters</Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setShowCreateCharacterDialog(true)}
          >
            Create Character
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setShowInviteDialog(true)}
          >
            Send Invite
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
          <DialogTitle>Create Character</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="characterName"
              label="Character Name"
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
              label="Bio (optional)"
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
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={creating || !characterName.trim()}>
              {creating ? 'Creating...' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Send Invite Dialog */}
      <Dialog open={showInviteDialog} onClose={() => setShowInviteDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSendInvite}>
          <DialogTitle>Send Invite</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="inviteUsername"
              label="Username"
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
              label="Message (optional)"
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
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={sending || !inviteUsername.trim()}>
              {sending ? 'Sending...' : 'Send'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Character Confirmation Dialog */}
      <Dialog open={!!characterToDelete} onClose={() => setCharacterToDelete(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Character</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete <strong>{characterToDelete?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCharacterToDelete(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDeleteCharacter} 
            disabled={deleting}
            startIcon={<DeleteIcon />}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Characters List */}
      {characters.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="body1" color="text.secondary">
            No characters have been created in this world yet.
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
                      Owned by: {character.owner?.username || 'Unknown'}
                    </Typography>
                  </Box>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip
                      label={character.isActive ? 'Active' : 'Inactive'}
                      color={character.isActive ? 'success' : 'default'}
                      size="small"
                    />
                    {character.owner?.id === user?.id && (
                      <Chip
                        label="My Character"
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
                      Delete
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
      Maps feature coming soon...
    </Typography>
  );
}

function ArticlesTab() {
  return (
    <Typography variant="body1" color="text.secondary">
      Articles feature coming soon...
    </Typography>
  );
}

function RulesTab() {
  return (
    <Typography variant="body1" color="text.secondary">
      Rules feature coming soon...
    </Typography>
  );
}

PlayersTab.propTypes = {
  worldId: PropTypes.string.isRequired,
  world: PropTypes.object,
};
