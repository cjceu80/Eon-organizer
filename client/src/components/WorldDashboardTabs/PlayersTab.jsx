import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../../hooks/useAuth';
import { Box, Typography, Button, Stack, Grid, Card, CardContent, CardActions, Chip, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CharacterCreationDialog from '../CharacterCreationDialog/CharacterCreationDialog';

export default function PlayersTab({ worldId, world }) {
  const { token, user } = useAuth();
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [sending, setSending] = useState(false);

  const [showCharacterCreationDialog, setShowCharacterCreationDialog] = useState(false);
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

 

  

  

  const handleCharacterCreated = () => {
    // Character was successfully created
    fetchCharacters(); // Refresh the list
    alert('Karaktär skapad!');
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
              setShowCharacterCreationDialog(true);
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

      {/* Character Creation Dialog */}
      <CharacterCreationDialog
        open={showCharacterCreationDialog}
        onClose={() => setShowCharacterCreationDialog(false)}
        worldId={worldId}
        world={world}
        token={token}
        onConfirm={handleCharacterCreated}
      />

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
              <Card 
                component={Link}
                to={`/character/${character._id}`}
                sx={{ 
                  height: '100%',
                  textDecoration: 'none',
                  display: 'block',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
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
                  <CardActions onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={(e) => {
                        e.preventDefault();
                        setCharacterToDelete(character);
                      }}
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



PlayersTab.propTypes = {
  worldId: PropTypes.string.isRequired,
  world: PropTypes.object,
};
