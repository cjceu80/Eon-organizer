import { Typography } from '@mui/material';
import PropTypes from 'prop-types';

export default function MapsTab() {
  return (
    <Typography variant="body1" color="text.secondary">
      Kartor kommer snart...
    </Typography>
  );
}

MapsTab.propTypes = {
  worldId: PropTypes.string,
  world: PropTypes.object,
};