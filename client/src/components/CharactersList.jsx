import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';

export default function CharactersList() {
  const { token } = useAuth();
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCharacters = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/characters/my-characters', {
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
  }, [token]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
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
      <Box mb={3}>
        <Typography variant="h4" component="h2">
          My Characters
        </Typography>
      </Box>

      {characters.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="body1" color="text.secondary">
            You haven&apos;t created any characters yet.
          </Typography>
        </Box>
      ) : (
        <Box>
          <Grid container spacing={3}>
            {characters.map(character => (
              <Grid item xs={12} sm={6} md={4} key={character.id || character._id}>
                <Card
                  component={Link}
                  to={`/world/${character.world.id || character.world._id}`}
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
                      {character.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {character.bio || 'No bio'}
                    </Typography>
                    <Box mb={1}>
                      <Typography variant="caption" color="text.secondary">
                        World: {character.world?.name || 'Unknown'}
                      </Typography>
                    </Box>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      <Chip
                        label={character.isActive ? 'Active' : 'Inactive'}
                        color={character.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
}

