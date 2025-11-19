import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  Box,
  Chip
} from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';
import VisibilityIcon from '@mui/icons-material/Visibility';

/**
 * Small card component for roll tables
 * Shows roll/view buttons and displays result when rolled
 */
export default function RollTableCard({
  tableSlug,
  tableName,
  onRoll,
  onView,
  rollResult = null,
  rerolls = 0,
  onReroll = null,
  freeChoiceTokens = 0,
  onUseFreeChoice = null,
  disabled = false
}) {
  const hasRolled = rollResult !== null;

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" component="div">
            {tableName || 'Roll Table'}
          </Typography>
          {hasRolled && (
            <Chip 
              label={`Slag: ${rollResult.rollValue}`} 
              color="primary" 
              size="small"
            />
          )}
        </Box>
        
        {hasRolled && rollResult.entry && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {rollResult.entry.value}
            </Typography>
            {rollResult.entry.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {rollResult.entry.description}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        {hasRolled ? (
          onReroll ? (
            <Button
              size="small"
              variant="outlined"
              startIcon={<CasinoIcon />}
              onClick={onReroll}
              disabled={disabled}
            >
              Slå om
            </Button>
          ) : (
            <Button
              size="small"
              variant="outlined"
              startIcon={<CasinoIcon />}
              onClick={onRoll}
              disabled={disabled}
            >
              Slå om
            </Button>
          )
        ) : (
          <Button
            size="small"
            variant="contained"
            startIcon={<CasinoIcon />}
            onClick={onRoll}
            disabled={disabled}
          >
            Slå
          </Button>
        )}
        
        <Button
          size="small"
          variant="outlined"
          startIcon={<VisibilityIcon />}
          onClick={onView}
          disabled={disabled}
        >
          Visa tabell
        </Button>
      </CardActions>
    </Card>
  );
}

RollTableCard.propTypes = {
  tableSlug: PropTypes.string.isRequired,
  tableName: PropTypes.string,
  onRoll: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
  rollResult: PropTypes.shape({
    rollValue: PropTypes.number.isRequired,
    entry: PropTypes.object
  }),
  rerolls: PropTypes.number,
  onReroll: PropTypes.func,
  freeChoiceTokens: PropTypes.number,
  onUseFreeChoice: PropTypes.func,
  disabled: PropTypes.bool
};

