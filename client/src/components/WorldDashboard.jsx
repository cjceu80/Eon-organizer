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
  TextField
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import MapIcon from '@mui/icons-material/Map';
import ArticleIcon from '@mui/icons-material/Article';
import RuleIcon from '@mui/icons-material/Rule';
import AddIcon from '@mui/icons-material/Add';

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
          <PlayersTab worldId={worldId} />
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
function PlayersTab({ worldId }) {
  const { token } = useAuth();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [sending, setSending] = useState(false);

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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Players</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowInviteDialog(true)}
        >
          Send Invite
        </Button>
      </Box>

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

      <Typography variant="body1" color="text.secondary">
        Player list will be displayed here
      </Typography>
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
};
