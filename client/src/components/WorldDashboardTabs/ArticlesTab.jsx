import { Typography } from '@mui/material';
import PropTypes from 'prop-types';


export default function ArticlesTab( ) {
  return (
    <Typography variant="body1" color="text.secondary">
      Artiklar kommer snart...
    </Typography>
  );
}

ArticlesTab.propTypes = {
  worldId: PropTypes.string,
  world: PropTypes.object,
};