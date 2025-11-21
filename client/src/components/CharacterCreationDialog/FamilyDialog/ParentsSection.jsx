import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Alert,
  Button,
  Paper,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  calculateApparentAge,
  calculateActualAgeFromApparent,
  evaluateParentFormula,
  evaluateParentAgeFormula,
  determineParentStatus
} from '../../../utils/familyCalculations';
import {
  getParentFormula,
  getParentAgeFormula,
  getStatusLabel,
  getStatusColor
} from '../../../utils/familyFormulas';

/**
 * Component for managing parents section
 */
export default function ParentsSection({
  ageData,
  raceCategory,
  selectedRace,
  siblings,
  rollResult,
  setRollResult,
  parentStatus,
  setParentStatus,
  rollDetails,
  setRollDetails,
  parentRerollUsed,
  setParentRerollUsed,
  remainingRerolls,
  setRemainingRerolls,
  motherAgeResult,
  setMotherAgeResult,
  fatherAgeResult,
  setFatherAgeResult
}) {
  const parentConfig = getParentFormula(selectedRace, raceCategory);
  const parentAgeFormula = getParentAgeFormula(selectedRace, raceCategory);

  const handleRollParents = () => {
    if (!ageData || !ageData.age) {
      return;
    }

    const characterActualAge = ageData.age;
    const characterApparentAge = calculateApparentAge(characterActualAge, raceCategory);

    // Evaluate the formula (this will roll dice and calculate)
    const result = Math.floor(evaluateParentFormula(parentConfig.formula, characterApparentAge));
    const status = determineParentStatus(result, parentConfig.table);

    // Store roll details for display
    const details = {
      formula: parentConfig.formula,
      apparentAge: characterApparentAge,
      result,
      status
    };

    setRollResult(result);
    setParentStatus(status);
    setRollDetails(details);
  };

  const handleRerollParents = () => {
    if (!ageData || !ageData.age) {
      return;
    }

    // Consume a reroll token only on first use (if available)
    if (!parentRerollUsed && remainingRerolls > 0) {
      setRemainingRerolls(prev => prev - 1);
      setParentRerollUsed(true);
    }

    handleRollParents();
  };

  const handleRollMotherAge = () => {
    if (!ageData || !ageData.age || !parentStatus) {
      return;
    }

    // Only allow rolling if mother is alive or father is unknown
    if (parentStatus !== 'both parents alive' && parentStatus !== 'mother alive' && parentStatus !== 'father unknown') {
      return;
    }

    const characterActualAge = ageData.age;
    const characterApparentAge = calculateApparentAge(characterActualAge, raceCategory);

    // Find oldest sibling's apparent age (or use character's if no older siblings)
    let oldestSiblingOrCharacterApparentAge = characterApparentAge;
    if (siblings.length > 0) {
      const oldestSibling = siblings.reduce((oldest, sibling) => {
        return sibling.age > oldest.age ? sibling : oldest;
      }, siblings[0]);
      oldestSiblingOrCharacterApparentAge = calculateApparentAge(oldestSibling.age, raceCategory);
    }

    const parentAgeCalculation = evaluateParentAgeFormula(parentAgeFormula, oldestSiblingOrCharacterApparentAge);
    const parentApparentAge = Math.max(0, parentAgeCalculation.result);
    const parentActualAge = Math.max(0, calculateActualAgeFromApparent(parentApparentAge, raceCategory));
    
    setMotherAgeResult({
      formula: parentAgeFormula,
      baseAge: oldestSiblingOrCharacterApparentAge,
      apparentAge: parentApparentAge,
      actualAge: parentActualAge,
      rollDetails: parentAgeCalculation.rollDetails
    });
  };

  const handleRollFatherAge = () => {
    if (!ageData || !ageData.age || !parentStatus) {
      return;
    }

    // Only allow rolling if father is alive
    if (parentStatus !== 'both parents alive' && parentStatus !== 'father alive') {
      return;
    }

    const characterActualAge = ageData.age;
    const characterApparentAge = calculateApparentAge(characterActualAge, raceCategory);

    // Find oldest sibling's apparent age (or use character's if no older siblings)
    let oldestSiblingOrCharacterApparentAge = characterApparentAge;
    if (siblings.length > 0) {
      const oldestSibling = siblings.reduce((oldest, sibling) => {
        return sibling.age > oldest.age ? sibling : oldest;
      }, siblings[0]);
      oldestSiblingOrCharacterApparentAge = calculateApparentAge(oldestSibling.age, raceCategory);
    }

    const parentAgeCalculation = evaluateParentAgeFormula(parentAgeFormula, oldestSiblingOrCharacterApparentAge);
    const parentApparentAge = Math.max(0, parentAgeCalculation.result);
    const parentActualAge = Math.max(0, calculateActualAgeFromApparent(parentApparentAge, raceCategory));
    
    setFatherAgeResult({
      formula: parentAgeFormula,
      baseAge: oldestSiblingOrCharacterApparentAge,
      apparentAge: parentApparentAge,
      actualAge: parentActualAge,
      rollDetails: parentAgeCalculation.rollDetails
    });
  };

  return (
    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 100%', md: '1 1 50%' }, minWidth: 0 }}>
      <Typography variant="h6" gutterBottom>
        Föräldrar
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        {/* Left: Parent Status */}
        <Box sx={{ flex: '1 1 50%', minWidth: 0 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Föräldrars status beräknas baserat på rasens kategori-formel: {parentConfig.formula.replace("characterApparentAge", "skenbar ålder")}
          </Alert>

          {!rollDetails && (
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRollParents}
                disabled={!ageData || !ageData.age}
              >
                Slå föräldrar
              </Button>
            </Box>
          )}

          {rollDetails && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1">
                  Status
                </Typography>
                <Tooltip title={
                  parentRerollUsed 
                    ? "Återkasta (gratis)" 
                    : remainingRerolls > 0
                      ? `Återkasta (${remainingRerolls} kvar)`
                      : "Återkasta"
                }>
                  <span>
                    <IconButton
                      size="small"
                      onClick={handleRerollParents}
                      color="primary"
                      disabled={!ageData || !ageData.age}
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Formel: {parentConfig.formula.replace(/characterApparentAge/g, rollDetails.apparentAge.toString())}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Synlig ålder: {rollDetails.apparentAge}
                </Typography>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  Slag: {rollDetails.result}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Status:
                </Typography>
                <Chip
                  label={getStatusLabel(rollDetails.status)}
                  color={getStatusColor(rollDetails.status)}
                  size="medium"
                />
              </Box>

              {/* Show table ranges */}
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Tabell:
                </Typography>
                {parentConfig.table.map((range, index) => (
                  <Typography key={index} variant="caption" display="block" color="text.secondary">
                    {range.min}-{range.max}: {getStatusLabel(range.result)}
                  </Typography>
                ))}
              </Box>
            </Paper>
          )}

          {!rollDetails && (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                Klicka på återkastning för att rulla.
              </Typography>
            </Box>
          )}
        </Box>

        {/* Right: Living Parent Age */}
        <Box sx={{ flex: '1 1 50%', minWidth: 0 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Föräldrars ålder beräknas baserat på: {parentAgeFormula.replace("oldestSiblingOrCharacterApparentAge", "äldsta syskon eller karaktär")}
          </Alert>

          {rollDetails ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(parentStatus === 'both parents alive' || parentStatus === 'mother alive' || parentStatus === 'father unknown') && (
                <>
                  {!motherAgeResult && (
                    <Box sx={{ mb: 2 }}>
                      <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={handleRollMotherAge}
                        disabled={!ageData || !ageData.age || !parentStatus}
                      >
                        Slå mors ålder
                      </Button>
                    </Box>
                  )}
                  {motherAgeResult && (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1">
                          Mors ålder
                        </Typography>
                        <Tooltip title="Återkasta mors ålder">
                          <IconButton
                            size="small"
                            onClick={() => setMotherAgeResult(null)}
                            color="primary"
                          >
                            <RefreshIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Basålder (äldsta syskon eller karaktär): {motherAgeResult.baseAge}
                        </Typography>
                        {motherAgeResult.rollDetails && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Ob{motherAgeResult.rollDetails.diceCount}T6: {motherAgeResult.rollDetails.roll.total}
                              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                ({motherAgeResult.rollDetails.roll.initialRolls.join(', ')}
                                {motherAgeResult.rollDetails.roll.extraRolls.length > 0 && ` → ${motherAgeResult.rollDetails.roll.extraRolls.join(', ')}`})
                              </Typography>
                            </Typography>
                          </Box>
                        )}
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Skenbar ålder: {motherAgeResult.apparentAge}
                          </Typography>
                          <Typography variant="h6">
                            Ålder: {motherAgeResult.actualAge}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  )}
                </>
              )}

              {(parentStatus === 'both parents alive' || parentStatus === 'father alive') && (
                <>
                  {!fatherAgeResult && (
                    <Box sx={{ mb: 2 }}>
                      <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={handleRollFatherAge}
                        disabled={!ageData || !ageData.age || !parentStatus}
                      >
                        Slå fars ålder
                      </Button>
                    </Box>
                  )}
                  {fatherAgeResult && (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1">
                          Fars ålder
                        </Typography>
                        <Tooltip title="Återkasta fars ålder">
                          <IconButton
                            size="small"
                            onClick={() => setFatherAgeResult(null)}
                            color="primary"
                          >
                            <RefreshIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Basålder (äldsta syskon eller karaktär): {fatherAgeResult.baseAge}
                        </Typography>
                        {fatherAgeResult.rollDetails && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Ob{fatherAgeResult.rollDetails.diceCount}T6: {fatherAgeResult.rollDetails.roll.total}
                              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                ({fatherAgeResult.rollDetails.roll.initialRolls.join(', ')}
                                {fatherAgeResult.rollDetails.roll.extraRolls.length > 0 && ` → ${fatherAgeResult.rollDetails.roll.extraRolls.join(', ')}`})
                              </Typography>
                            </Typography>
                          </Box>
                        )}
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Skenbar ålder: {fatherAgeResult.apparentAge}
                          </Typography>
                          <Typography variant="h6">
                            Ålder: {fatherAgeResult.actualAge}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  )}
                </>
              )}

              {parentStatus === 'both dead' && (
                <Box textAlign="center" py={4}>
                  <Typography variant="body1" color="text.secondary">
                    Inga levande föräldrar.
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                Rulla först status.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

ParentsSection.propTypes = {
  ageData: PropTypes.object,
  raceCategory: PropTypes.object,
  selectedRace: PropTypes.object,
  siblings: PropTypes.array.isRequired,
  rollResult: PropTypes.number,
  setRollResult: PropTypes.func.isRequired,
  parentStatus: PropTypes.string,
  setParentStatus: PropTypes.func.isRequired,
  rollDetails: PropTypes.object,
  setRollDetails: PropTypes.func.isRequired,
  parentRerollUsed: PropTypes.bool.isRequired,
  setParentRerollUsed: PropTypes.func.isRequired,
  remainingRerolls: PropTypes.number.isRequired,
  setRemainingRerolls: PropTypes.func.isRequired,
  motherAgeResult: PropTypes.object,
  setMotherAgeResult: PropTypes.func.isRequired,
  fatherAgeResult: PropTypes.object,
  setFatherAgeResult: PropTypes.func.isRequired
};

