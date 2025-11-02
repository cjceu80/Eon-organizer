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
  Stack
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
        setError('Failed to load worlds');
      }
    } catch (err) {
      console.error('Error fetching worlds:', err);
      setError('Failed to load worlds');
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
        body: JSON.stringify({ name: worldName })
      });

      if (response.ok) {
        setShowCreateDialog(false);
        setWorldName('');
        fetchWorlds();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to create world');
      }
    } catch (err) {
      console.error('Error creating world:', err);
      alert('Failed to create world');
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
        alert(errorData.message || 'Failed to accept invite');
      }
    } catch (err) {
      console.error('Error accepting invite:', err);
      alert('Failed to accept invite');
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
        alert(errorData.message || 'Failed to decline invite');
      }
    } catch (err) {
      console.error('Error declining invite:', err);
      alert('Failed to decline invite');
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
        alert('World deleted successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to delete world');
      }
    } catch (err) {
      console.error('Error deleting world:', err);
      alert('Failed to delete world');
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
          My Worlds
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateDialog(true)}
        >
          Create World
        </Button>
      </Box>

      {/* Create World Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreateWorld}>
          <DialogTitle>Create New World</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="worldName"
              label="World Name"
              type="text"
              fullWidth
              variant="outlined"
              value={worldName}
              onChange={(e) => setWorldName(e.target.value)}
              disabled={creating}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCreateDialog(false)} disabled={creating}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={creating || !worldName.trim()}>
              {creating ? 'Creating...' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete World Confirmation Dialog */}
      <Dialog open={!!worldToDelete} onClose={() => setWorldToDelete(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete World</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete <strong>{worldToDelete?.name}</strong>? This will permanently delete the world and all characters in it. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWorldToDelete(null)} disabled={deletingWorld}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDeleteWorld} 
            disabled={deletingWorld}
            startIcon={<DeleteIcon />}
          >
            {deletingWorld ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invites Section */}
      {invites.length > 0 && (
        <Box mb={4}>
          <Typography variant="h5" gutterBottom>
            Invitations
          </Typography>
          <Stack spacing={2}>
            {invites.map(invite => (
              <Card key={invite.id || invite._id} variant="outlined" sx={{ bgcolor: 'warning.light' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6">{invite.world.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Invited by {invite.inviter.username}
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
                        Accept
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => handleDeclineInvite(invite.id || invite._id)}
                      >
                        Decline
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
            You haven&apos;t created or joined any worlds yet.
          </Typography>
        </Box>
      ) : worlds.length > 0 ? (
        <Box>
          <Typography variant="h5" gutterBottom>
            Your Worlds
          </Typography>
          <Grid container spacing={3}>
            {worlds.map(world => (
              <Grid item xs={12} sm={6} md={4} key={world._id}>
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
                    to={`/world/${world._id}`}
                    sx={{ textDecoration: 'none', flexGrow: 1 }}
                  >
                    <Typography variant="h6" component="h3" gutterBottom>
                      {world.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {world.description || 'No description'}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip
                        label={world.admin === user?.id ? 'Admin' : 'Member'}
                        color={world.admin === user?.id ? 'primary' : 'default'}
                        size="small"
                      />
                      <Chip
                        label={world.isPublic ? 'Public' : 'Private'}
                        color={world.isPublic ? 'success' : 'default'}
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
                        Delete
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
