import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
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

export default function WorldsList() {
  const { token, user } = useAuth();
  const [worlds, setWorlds] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [worldName, setWorldName] = useState('');
  const [creating, setCreating] = useState(false);

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
        fetchInvites();
        fetchWorlds();
        alert('Invite accepted! You can now create characters in this world.');
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
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

      {/* Invites Section */}
      {invites.length > 0 && (
        <Box mb={4}>
          <Typography variant="h5" gutterBottom>
            Invitations
          </Typography>
          <Stack spacing={2}>
            {invites.map(invite => (
              <Card key={invite._id} variant="outlined" sx={{ bgcolor: 'warning.light' }}>
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
                        onClick={() => handleAcceptInvite(invite._id)}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => handleDeclineInvite(invite._id)}
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
                  component={Link}
                  to={`/world/${world._id}`}
                  sx={{
                    textDecoration: 'none',
                    display: 'block',
                    height: '100%',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                >
                  <CardContent>
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
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : null}
    </Container>
  );
}
