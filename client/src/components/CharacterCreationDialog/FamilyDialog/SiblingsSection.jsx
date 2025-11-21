import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Alert,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import LitterRollDisplay from './LitterRollDisplay';
import {
  calculateApparentAge,
  calculateActualAgeFromApparent,
  evaluateSiblingFormula,
  evaluateLitterSize,
  determineGender,
  rollLittersHelper
} from '../../../utils/familyCalculations';
import { getSiblingFormula } from '../../../utils/familyFormulas';

/**
 * Component for managing siblings section
 */
export default function SiblingsSection({
  ageData,
  raceCategory,
  selectedRace,
  siblings,
  setSiblings,
  olderLittersRoll,
  setOlderLittersRoll,
  youngerLittersRoll,
  setYoungerLittersRoll,
  olderLitters,
  setOlderLitters,
  youngerLitters,
  setYoungerLitters,
  olderRerollUsed,
  setOlderRerollUsed,
  youngerRerollUsed,
  setYoungerRerollUsed,
  remainingRerolls,
  setRemainingRerolls
}) {
  const siblingFormula = getSiblingFormula(selectedRace, raceCategory);

  const handleRollOlderSiblings = () => {
    if (!ageData || !ageData.age) {
      return;
    }

    const characterActualAge = ageData.age;
    const characterApparentAge = calculateApparentAge(characterActualAge, raceCategory);

    // Roll for older siblings (using apparent age)
    const olderResult = rollLittersHelper(siblingFormula.numberOfLitters, characterApparentAge);
    setOlderLittersRoll(olderResult.littersRollData);
    setOlderLitters(olderResult.calculatedLitters);

    // Preserve existing younger siblings
    const existingYoungerSiblings = siblings.filter(s => !s.isOlder);

    // Generate new older siblings
    const newOlderSiblings = [];
    let litterCounter = 1;

    for (let i = 0; i < olderResult.calculatedLitters; i++) {
      const litterSize = evaluateLitterSize(siblingFormula.litterSize);
      
      // Calculate apparent age once per litter (all siblings in same litter have same apparent age)
      const siblingApparentAge = Math.max(0, Math.floor(evaluateSiblingFormula(siblingFormula.olderSiblingAgeFormula, characterApparentAge)));
      
      // Convert apparent age back to actual age (random value within the matching range)
      const siblingActualAge = Math.max(0, calculateActualAgeFromApparent(siblingApparentAge, raceCategory));
      
      for (let j = 0; j < litterSize; j++) {
        const gender = determineGender(siblingFormula.genderFormula);
        
        newOlderSiblings.push({
          litter: litterCounter,
          position: j + 1,
          age: siblingActualAge,
          gender,
          isOlder: true,
          ageFormula: siblingFormula.olderSiblingAgeFormula,
          relationship: 'Äldre syskon'
        });
      }
      litterCounter++;
    }

    // Preserve younger siblings exactly as they are (they already have correct litter numbers)
    // Combine: new older siblings + preserved younger siblings
    const allSiblings = [...newOlderSiblings, ...existingYoungerSiblings];
    setSiblings(allSiblings);
  };

  const handleRollYoungerSiblings = () => {
    if (!ageData || !ageData.age) {
      return;
    }

    const characterActualAge = ageData.age;
    const characterApparentAge = calculateApparentAge(characterActualAge, raceCategory);

    // Roll for younger siblings (using apparent age)
    const youngerResult = rollLittersHelper(siblingFormula.numberOfLitters, characterApparentAge);
    setYoungerLittersRoll(youngerResult.littersRollData);
    setYoungerLitters(youngerResult.calculatedLitters);

    // Preserve existing older siblings
    const existingOlderSiblings = siblings.filter(s => s.isOlder);

    // Find the maximum litter number from older siblings to continue numbering
    const maxOlderLitter = existingOlderSiblings.length > 0
      ? Math.max(...existingOlderSiblings.map(s => s.litter))
      : 0;

    // Generate new younger siblings
    const newYoungerSiblings = [];
    let litterCounter = maxOlderLitter + 1;

    for (let i = 0; i < youngerResult.calculatedLitters; i++) {
      const litterSize = evaluateLitterSize(siblingFormula.litterSize);
      
      // Calculate apparent age once per litter (all siblings in same litter have same apparent age)
      const calculatedApparentAge = evaluateSiblingFormula(siblingFormula.youngerSiblingAgeFormula, characterApparentAge);
      const siblingApparentAge = Math.max(0, Math.floor(calculatedApparentAge || 0));
      
      // Convert apparent age back to actual age (random value within the matching range)
      const siblingActualAge = Math.max(0, calculateActualAgeFromApparent(siblingApparentAge, raceCategory));
      
      for (let j = 0; j < litterSize; j++) {
        const gender = determineGender(siblingFormula.genderFormula);
        
        newYoungerSiblings.push({
          litter: litterCounter,
          position: j + 1,
          age: siblingActualAge,
          gender,
          isOlder: false,
          ageFormula: siblingFormula.youngerSiblingAgeFormula,
          relationship: 'Yngre syskon'
        });
      }
      litterCounter++;
    }

    // Combine: preserved older siblings + new younger siblings
    const allSiblings = [...existingOlderSiblings, ...newYoungerSiblings];
    setSiblings(allSiblings);
  };

  const handleRerollOlder = () => {
    if (!ageData || !ageData.age) {
      return;
    }

    const characterActualAge = ageData.age;
    const characterApparentAge = calculateApparentAge(characterActualAge, raceCategory);

    // Consume a reroll token only on first use (if available)
    if (!olderRerollUsed && remainingRerolls > 0) {
      setRemainingRerolls(prev => prev - 1);
      setOlderRerollUsed(true);
    }

    // Reroll older siblings (using apparent age)
    const olderResult = rollLittersHelper(siblingFormula.numberOfLitters, characterApparentAge);
    setOlderLittersRoll(olderResult.littersRollData);
    setOlderLitters(olderResult.calculatedLitters);

    // Preserve existing younger siblings (don't reroll their litter sizes or genders)
    const existingYoungerSiblings = siblings.filter(s => !s.isOlder);

    // Generate new older siblings
    const newOlderSiblings = [];
    let litterCounter = 1;

    for (let i = 0; i < olderResult.calculatedLitters; i++) {
      const litterSize = evaluateLitterSize(siblingFormula.litterSize);
      
      // Calculate apparent age once per litter (all siblings in same litter have same apparent age)
      const siblingApparentAge = Math.max(0, Math.floor(evaluateSiblingFormula(siblingFormula.olderSiblingAgeFormula, characterApparentAge)));
      
      // Convert apparent age back to actual age (random value within the matching range)
      const siblingActualAge = Math.max(0, calculateActualAgeFromApparent(siblingApparentAge, raceCategory));
      
      for (let j = 0; j < litterSize; j++) {
        const gender = determineGender(siblingFormula.genderFormula);
        
        newOlderSiblings.push({
          litter: litterCounter,
          position: j + 1,
          age: siblingActualAge,
          gender,
          isOlder: true,
          ageFormula: siblingFormula.olderSiblingAgeFormula,
          relationship: 'Äldre syskon'
        });
      }
      litterCounter++;
    }

    // Preserve younger siblings exactly as they are (they already have correct litter numbers)
    // Combine: new older siblings + preserved younger siblings
    const allSiblings = [...newOlderSiblings, ...existingYoungerSiblings];

    setSiblings(allSiblings);
  };

  const handleRerollYounger = () => {
    if (!ageData || !ageData.age) {
      return;
    }

    const characterActualAge = ageData.age;
    const characterApparentAge = calculateApparentAge(characterActualAge, raceCategory);

    // Consume a reroll token only on first use (if available)
    if (!youngerRerollUsed && remainingRerolls > 0) {
      setRemainingRerolls(prev => prev - 1);
      setYoungerRerollUsed(true);
    }

    // Reroll younger siblings (using apparent age)
    const youngerResult = rollLittersHelper(siblingFormula.numberOfLitters, characterApparentAge);
    setYoungerLittersRoll(youngerResult.littersRollData);
    setYoungerLitters(youngerResult.calculatedLitters);

    // Preserve existing older siblings (don't reroll their litter sizes or genders)
    const existingOlderSiblings = siblings.filter(s => s.isOlder);

    // Find the maximum litter number from older siblings to continue numbering
    const maxOlderLitter = existingOlderSiblings.length > 0
      ? Math.max(...existingOlderSiblings.map(s => s.litter))
      : 0;

    // Generate new younger siblings
    const newYoungerSiblings = [];
    let litterCounter = maxOlderLitter + 1;

    for (let i = 0; i < youngerResult.calculatedLitters; i++) {
      const litterSize = evaluateLitterSize(siblingFormula.litterSize);
      
      // Calculate apparent age once per litter (all siblings in same litter have same apparent age)
      // Ensure age cannot be negative (minimum 0)
      const calculatedApparentAge = evaluateSiblingFormula(siblingFormula.youngerSiblingAgeFormula, characterApparentAge);
      const siblingApparentAge = Math.max(0, Math.floor(calculatedApparentAge || 0));
      
      // Convert apparent age back to actual age (random value within the matching range)
      const siblingActualAge = Math.max(0, calculateActualAgeFromApparent(siblingApparentAge, raceCategory));
      
      for (let j = 0; j < litterSize; j++) {
        const gender = determineGender(siblingFormula.genderFormula);
        
        newYoungerSiblings.push({
          litter: litterCounter,
          position: j + 1,
          age: siblingActualAge,
          gender,
          isOlder: false,
          ageFormula: siblingFormula.youngerSiblingAgeFormula,
          relationship: 'Yngre syskon'
        });
      }
      litterCounter++;
    }

    // Combine: preserved older siblings + new younger siblings
    const allSiblings = [...existingOlderSiblings, ...newYoungerSiblings];

    setSiblings(allSiblings);
  };

  return (
    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 100%', md: '1 1 50%' }, minWidth: 0 }}>
      <Typography variant="h6" gutterBottom>
        Syskon
      </Typography>
      <Alert severity="info" sx={{ mb: 3 }}>
        Syskon beräknas baserat på rasens kategori-formel. Antal kullar: {siblingFormula.numberOfLitters} (för äldre och yngre separat), Kullstorlek: {siblingFormula.litterSize}.
      </Alert>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {!olderLittersRoll && (
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRollOlderSiblings}
            disabled={!ageData || !ageData.age}
          >
            Slå äldre syskon
          </Button>
        )}
        {!youngerLittersRoll && (
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRollYoungerSiblings}
            disabled={!ageData || !ageData.age}
          >
            Slå yngre syskon
          </Button>
        )}
      </Box>

      {(olderLittersRoll || youngerLittersRoll) && (
        <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {olderLittersRoll && (
            <LitterRollDisplay
              title="Äldre syskon"
              formula={siblingFormula.numberOfLitters}
              littersRollData={olderLittersRoll}
              litters={olderLitters}
              color="primary"
              onReroll={handleRerollOlder}
              rerollUsed={olderRerollUsed}
              remainingRerolls={remainingRerolls}
              disabled={!ageData || !ageData.age}
            />
          )}

          {youngerLittersRoll && (
            <LitterRollDisplay
              title="Yngre syskon"
              formula={siblingFormula.numberOfLitters}
              littersRollData={youngerLittersRoll}
              litters={youngerLitters}
              color="secondary"
              onReroll={handleRerollYounger}
              rerollUsed={youngerRerollUsed}
              remainingRerolls={remainingRerolls}
              disabled={!ageData || !ageData.age}
            />
          )}
        </Box>
      )}

      {siblings.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            {!(olderLittersRoll || youngerLittersRoll) 
              ? 'Klicka på "Slå syskon" för att rulla.' 
              : 'Inga syskon beräknade. Klicka på återkastning för att rulla igen.'}
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Kull</strong></TableCell>
                <TableCell><strong>Position</strong></TableCell>
                <TableCell><strong>Ålder</strong></TableCell>
                <TableCell><strong>Kön</strong></TableCell>
                <TableCell><strong>Typ</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {siblings.map((sibling, index) => (
                <TableRow key={index}>
                  <TableCell>{sibling.litter}</TableCell>
                  <TableCell>{sibling.position}</TableCell>
                  <TableCell>{sibling.age}</TableCell>
                  <TableCell>
                    <Chip 
                      label={sibling.gender === 'male' ? 'Man' : 'Kvinna'}
                      size="small"
                      color={sibling.gender === 'male' ? 'primary' : 'secondary'}
                    />
                  </TableCell>
                  <TableCell>{sibling.relationship}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

SiblingsSection.propTypes = {
  ageData: PropTypes.object,
  raceCategory: PropTypes.object,
  selectedRace: PropTypes.object,
  siblings: PropTypes.array.isRequired,
  setSiblings: PropTypes.func.isRequired,
  olderLittersRoll: PropTypes.object,
  setOlderLittersRoll: PropTypes.func.isRequired,
  youngerLittersRoll: PropTypes.object,
  setYoungerLittersRoll: PropTypes.func.isRequired,
  olderLitters: PropTypes.number.isRequired,
  setOlderLitters: PropTypes.func.isRequired,
  youngerLitters: PropTypes.number.isRequired,
  setYoungerLitters: PropTypes.func.isRequired,
  olderRerollUsed: PropTypes.bool.isRequired,
  setOlderRerollUsed: PropTypes.func.isRequired,
  youngerRerollUsed: PropTypes.bool.isRequired,
  setYoungerRerollUsed: PropTypes.func.isRequired,
  remainingRerolls: PropTypes.number.isRequired,
  setRemainingRerolls: PropTypes.func.isRequired
};

