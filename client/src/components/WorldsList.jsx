import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

export default function WorldsList() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [worlds, setWorlds] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [worldName, setWorldName] = useState('');
  const [selectedRuleset, setSelectedRuleset] = useState('EON');
  const [statRollMethod, setStatRollMethod] = useState('standard');
  const [rerolls, setRerolls] = useState(0);
  const [freeSelections, setFreeSelections] = useState(0);
  const [creating, setCreating] = useState(false);
  const [worldToDelete, setWorldToDelete] = useState(null);
  const [deletingWorld, setDeletingWorld] = useState(false);

  const fetchWorlds = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/worlds/my-worlds', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWorlds(data.worlds);
      } else {
        setError('Misslyckades att ladda världar');
      }
    } catch (err) {
      console.error('Error fetching worlds:', err);
      setError('Misslyckades att ladda världar');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvites = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/invites/received', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInvites(data.invites || []);
      }
    } catch (err) {
      console.error('Error fetching invites:', err);
    }
  };

  useEffect(() => {
    fetchWorlds();
    fetchInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleCreateWorld = async (e) => {
    e.preventDefault();
    if (!worldName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/worlds', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: worldName, 
          ruleset: selectedRuleset,
          settings: {
            statRollMethod,
            rerolls,
            freeSelections
          }
        })
      });

      if (response.ok) {
        setShowCreateDialog(false);
        setWorldName('');
        setSelectedRuleset('EON');
        setStatRollMethod('standard');
        setRerolls(0);
        setFreeSelections(0);
        fetchWorlds();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Misslyckades att skapa värld');
      }
    } catch (err) {
      console.error('Error creating world:', err);
      alert('Misslyckades att skapa värld');
    } finally {
      setCreating(false);
    }
  };

  const handleAcceptInvite = async (inviteId) => {
    try {
      const response = await fetch(`/api/invites/${inviteId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Navigate to the world dashboard immediately using the returned world ID
        if (data.worldId) {
          navigate(`/world/${data.worldId}`);
        } else if (data.world && (data.world.id || data.world._id)) {
          navigate(`/world/${data.world.id || data.world._id}`);
        } else {
          alert('Invite accepted! Refresh the page to see the world.');
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Misslyckades att acceptera inbjudan');
      }
    } catch (err) {
      console.error('Error accepting invite:', err);
      alert('Misslyckades att acceptera inbjudan');
    }
  };

  const handleDeclineInvite = async (inviteId) => {
    try {
      const response = await fetch(`/api/invites/${inviteId}/decline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchInvites();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Misslyckades att avbryta inbjudan');
      }
    } catch (err) {
      console.error('Error declining invite:', err);
      alert('Misslyckades att avbryta inbjudan');
    }
  };

  const handleDeleteWorld = async () => {
    if (!worldToDelete) return;

    setDeletingWorld(true);
    try {
      const response = await fetch(`/api/worlds/${worldToDelete.id || worldToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setWorldToDelete(null);
        fetchWorlds(); // Refresh the list
        alert('Värld raderad!');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Misslyckades att radera värld');
      }
    } catch (err) {
      console.error('Error deleting world:', err);
      alert('Misslyckades att radera värld');
    } finally {
      setDeletingWorld(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h2">
          Mina världar
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateDialog(true)}
        > 
          Skapa värld
        </Button>
      </Box>

      {/* Create World Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreateWorld}>
          <DialogTitle>Skapa ny värld</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="worldName"
              label="Världsnamn"
              type="text"
              fullWidth
              variant="outlined"
              value={worldName}
              onChange={(e) => setWorldName(e.target.value)}
              disabled={creating}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              id="ruleset"
              label="Regelsystem"
              select
              fullWidth
              variant="outlined"
              value={selectedRuleset}
              onChange={(e) => setSelectedRuleset(e.target.value)}
              disabled={creating}
              sx={{ mb: 2 }}
            >
              <MenuItem value="EON">EON</MenuItem>
            </TextField>
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Karaktärskapande - Inställningar
            </Typography>
            <TextField
              margin="dense"
              id="statRollMethod"
              label="Attributrullning"
              select
              fullWidth
              variant="outlined"
              value={statRollMethod}
              onChange={(e) => setStatRollMethod(e.target.value)}
              disabled={creating}
              helperText="Välj metod för att rulla huvudattribut"
              sx={{ mb: 2 }}
            >
              <MenuItem value="standard">Standard</MenuItem>
              <MenuItem value="anpassad">Anpassad</MenuItem>
              <MenuItem value="höga attribut">Höga attribut</MenuItem>
              <MenuItem value="hjälteattribut">Hjälteattribut</MenuItem>
            </TextField>
            <TextField
              margin="dense"
              id="rerolls"
              label="Omrullningar"
              type="number"
              fullWidth
              variant="outlined"
              value={rerolls}
              onChange={(e) => setRerolls(Math.max(0, parseInt(e.target.value) || 0))}
              disabled={creating}
              inputProps={{ min: 0 }}
              helperText="Antal gånger spelare kan rulla om attribut"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              id="freeSelections"
              label="Fria val"
              type="number"
              fullWidth
              variant="outlined"
              value={freeSelections}
              onChange={(e) => setFreeSelections(Math.max(0, parseInt(e.target.value) || 0))}
              disabled={creating}
              inputProps={{ min: 0 }}
              helperText="Antal attribut som kan väljas fritt"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCreateDialog(false)} disabled={creating}>
              Avbryt
            </Button>
            <Button type="submit" variant="contained" disabled={creating || !worldName.trim()}>
              {creating ? 'Skapar...' : 'Skapa'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete World Confirmation Dialog */}
      <Dialog open={!!worldToDelete} onClose={() => setWorldToDelete(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Radera värld</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Är du säker på att du vill radera <strong>{worldToDelete?.name}</strong>? Denna åtgärd kan inte ångras.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWorldToDelete(null)} disabled={deletingWorld}>
            Avbryt
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDeleteWorld} 
            disabled={deletingWorld}
            startIcon={<DeleteIcon />}
          >
            {deletingWorld ? 'Radera...' : 'Radera'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invites Section */}
      {invites.length > 0 && (
        <Box mb={4}>
          <Typography variant="h5" gutterBottom>
            Inbjudan
          </Typography>
          <Stack spacing={2}>
            {invites.map((invite, index) => (
              <Card key={invite.id || invite._id || `invite-${index}`} variant="outlined" sx={{ bgcolor: 'warning.light' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6">{invite.world.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Inbjuden av {invite.inviter.username}
                      </Typography>
                      {invite.message && (
                        <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>
                          {invite.message}
                        </Typography>
                      )}
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => handleAcceptInvite(invite.id || invite._id)}
                      >
                        Acceptera inbjudan
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => handleDeclineInvite(invite.id || invite._id)}
                      >
                        Avbryta inbjudan
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>
      )}

      {/* Worlds Grid */}
      {worlds.length === 0 && invites.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="body1" color="text.secondary">
            Du har inte skapat eller accepterat några världar än.
          </Typography>
        </Box>
      ) : worlds.length > 0 ? (
        <Box>
          <Typography variant="h5" gutterBottom>
            Dina världar
          </Typography>
          <Grid container spacing={3}>
            {worlds.map((world, index) => (
              <Grid item xs={12} sm={6} md={4} key={world.id || world._id || `world-${index}`}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                >
                  <CardContent
                    component={Link}
                    to={`/world/${world.id || world._id}`}
                    sx={{ textDecoration: 'none', flexGrow: 1 }}
                  >
                    <Typography variant="h6" component="h3" gutterBottom>
                      {world.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {world.description || 'Ingen beskrivning'}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip
                        label={world.admin === user?.id ? 'Admin' : 'Medlem'}
                        color={world.admin === user?.id ? 'primary' : 'default'}
                        size="small"
                      />
                      <Chip
                        label={world.isPublic ? 'Offentlig' : 'Privat'}
                        color={world.isPublic ? 'success' : 'default'}
                        size="small"
                      />
                      <Chip
                        label={world.ruleset || 'EON'}
                        color="info"
                        size="small"
                      />
                    </Stack>
                  </CardContent>
                  {world.admin === user?.id && (
                    <CardActions>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={(e) => {
                          e.preventDefault();
                          setWorldToDelete(world);
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
        </Box>
      ) : null}
    </Box>
  );
}
