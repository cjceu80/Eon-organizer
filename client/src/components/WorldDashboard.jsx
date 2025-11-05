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
  Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import MapIcon from '@mui/icons-material/Map';
import ArticleIcon from '@mui/icons-material/Article';
import RuleIcon from '@mui/icons-material/Rule';
import RulesTab from './WorldDashboardTabs/RulesTab';
import TabPanel from './WorldDashboardTabs/TabPanel';
import PlayersTab from './WorldDashboardTabs/PlayersTab';
import ArticlesTab from './WorldDashboardTabs/ArticlesTab';
import MapsTab from './WorldDashboardTabs/MapsTab';

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

WorldDashboard.propTypes = {
  worldId: PropTypes.string,
  world: PropTypes.object,
};