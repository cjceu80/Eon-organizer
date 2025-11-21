import PropTypes from 'prop-types';
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper
} from '@mui/material';
import CharacteristicsDialogItem from './CharacteristicsDialogItem';
import {
  CHARACTERISTICS,
  getCharacteristicValue,
  hasHighSpecialization,
  hasLowSpecialization,
  getRaceRecommendations
} from '../../../utils/characteristics';

/**
 * Reusable component for rendering a column of characteristics
 */
export default function CharacteristicsTableColumn({
  characteristics,
  characteristicsData,
  selectedRace,
  specializations,
  characteristicRolls,
  onValueChange,
  onRoll,
  onSpecializationChange,
  startIndex,
  endIndex
}) {
  const characteristicsToRender = CHARACTERISTICS.slice(startIndex, endIndex);

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table stickyHeader={false}>
        <TableHead>
          <TableRow>
            <TableCell><strong>Karaktärsdrag</strong></TableCell>
            <TableCell align="right"><strong>Värde</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {characteristicsToRender.map(char => {
            const value = getCharacteristicValue(char.key, characteristics);
            const isFixed = char.fixed;
            const description = characteristicsData?.descriptions?.[char.key] || '';
            const showHighSpec = hasHighSpecialization(char.key, characteristics);
            const showLowSpec = hasLowSpecialization(char.key, characteristics);
            const highExamples = characteristicsData?.highSpecializationExamples?.[char.key] || [];
            const lowExamples = characteristicsData?.lowSpecializationExamples?.[char.key] || [];
            const { isHighRecommended, isLowRecommended } = getRaceRecommendations(char.key, selectedRace);

            return (
              <CharacteristicsDialogItem
                key={char.key}
                char={char}
                value={value}
                isFixed={isFixed}
                description={description}
                showHighSpec={showHighSpec}
                showLowSpec={showLowSpec}
                highExamples={highExamples}
                lowExamples={lowExamples}
                isHighRecommended={isHighRecommended}
                isLowRecommended={isLowRecommended}
                specializations={specializations}
                onValueChange={onValueChange}
                onRoll={onRoll}
                onSpecializationChange={onSpecializationChange}
                rolls={characteristicRolls[char.key]}
              />
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

CharacteristicsTableColumn.propTypes = {
  characteristics: PropTypes.object.isRequired,
  characteristicsData: PropTypes.object,
  selectedRace: PropTypes.object,
  specializations: PropTypes.object.isRequired,
  characteristicRolls: PropTypes.object.isRequired,
  onValueChange: PropTypes.func.isRequired,
  onRoll: PropTypes.func.isRequired,
  onSpecializationChange: PropTypes.func.isRequired,
  startIndex: PropTypes.number.isRequired,
  endIndex: PropTypes.number.isRequired
};

