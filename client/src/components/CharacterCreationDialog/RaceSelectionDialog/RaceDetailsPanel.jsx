import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Divider,
  Paper
} from '@mui/material';
import { getRaceDescription, formatDescription } from '../../../utils/raceUtils';

/**
 * Exhaustion column formula display component
 */
const ExhaustionFormula = ({ divisor }) => (
  <Box sx={{ mb: 2, mt: 1, p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
      Utmattningskolumner
    </Typography>
    <Typography variant="body2" fontWeight="medium">
      (TÅL + VIL) / {divisor}
    </Typography>
  </Box>
);

ExhaustionFormula.propTypes = {
  divisor: PropTypes.number.isRequired
};

/**
 * Race details view
 */
const RaceDetails = ({ race, categoryInfo }) => {
  const description = getRaceDescription(race);
  const paragraphs = formatDescription(description);

  return (
    <Paper sx={{ p: 2, height: '100%', maxHeight: '600px', overflowY: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        {race.name}
      </Typography>
      {categoryInfo?.exhaustionColumnDivisor && (
        <ExhaustionFormula divisor={categoryInfo.exhaustionColumnDivisor} />
      )}
      <Divider sx={{ my: 2 }} />
      <Box sx={{ mt: 2 }}>
        {paragraphs.map((paragraph, index) => (
          <Typography
            key={index}
            variant="body2"
            color="text.secondary"
            paragraph={index < paragraphs.length - 1}
            sx={{ mb: paragraph.length > 100 ? 2 : 1 }}
          >
            {paragraph}
          </Typography>
        ))}
      </Box>
    </Paper>
  );
};

RaceDetails.propTypes = {
  race: PropTypes.object.isRequired,
  categoryInfo: PropTypes.object
};

/**
 * Category details view
 */
const CategoryDetails = ({ categoryName, categoryInfo }) => (
  <Paper sx={{ p: 2, height: '100%', maxHeight: '600px', overflowY: 'auto' }}>
    <Typography variant="h6" gutterBottom>
      {categoryName}
    </Typography>
    {categoryInfo?.description && (
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary" paragraph>
          {categoryInfo.description}
        </Typography>
      </Box>
    )}
    {categoryInfo?.exhaustionColumnDivisor && (
      <Box sx={{ mb: 2, mt: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          Utmattningskolumner
        </Typography>
        <Typography variant="body2" fontWeight="medium">
          (TÅL + VIL) / {categoryInfo.exhaustionColumnDivisor}
        </Typography>
      </Box>
    )}
  </Paper>
);

CategoryDetails.propTypes = {
  categoryName: PropTypes.string.isRequired,
  categoryInfo: PropTypes.object
};

/**
 * Empty state view
 */
const EmptyState = () => (
  <Paper sx={{ p: 2, height: '100%', maxHeight: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Typography variant="body2" color="text.secondary">
      Välj en kategori eller ras för att se detaljer
    </Typography>
  </Paper>
);

/**
 * Main details panel component
 */
export default function RaceDetailsPanel({ selectedRace, selectedCategory, categoryData }) {
  if (selectedRace) {
    const categoryName = selectedRace.category || '';
    const categoryInfo = categoryName ? categoryData[categoryName] : null;
    return <RaceDetails race={selectedRace} categoryInfo={categoryInfo} />;
  }

  if (selectedCategory) {
    const categoryInfo = categoryData[selectedCategory];
    return <CategoryDetails categoryName={selectedCategory} categoryInfo={categoryInfo} />;
  }

  return <EmptyState />;
}

RaceDetailsPanel.propTypes = {
  selectedRace: PropTypes.object,
  selectedCategory: PropTypes.string,
  categoryData: PropTypes.object.isRequired
};

