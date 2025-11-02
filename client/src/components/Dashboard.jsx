import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import WorldsList from './WorldsList';
import CharactersList from './CharactersList';
import { Box, Container, Typography, Button, AppBar, Toolbar } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Eon Organizer
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            {user?.username}
          </Typography>
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box mb={4}>
          <Typography variant="h3" component="h1" gutterBottom>
            Welcome, {user?.username}!
          </Typography>
        </Box>
        
        <CharactersList />
        <Box mt={6}>
          <WorldsList />
        </Box>
      </Container>
    </Box>
  );
}
