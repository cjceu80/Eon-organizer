import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import { rollT100, rollT10, rollT6Multiple, rollObT6WithDetails } from '../../../utils/dice';
import RollTableCard from '../../RollTableCard';
import RollTableView from '../../RollTableView';
import { useAuth } from '../../../hooks/useAuth';
import SiblingsSection from './SiblingsSection';
import ParentsSection from './ParentsSection';
import { getSiblingFormula, getParentFormula } from '../../../utils/familyFormulas';


export default function FamilyDialog({
  onClose,
  onConfirm,
  onStateChange = null,
  savedState = null,
  ageData = null,
  selectedRace = null,
  raceCategory = null,
  rerolls = 0,
  freeSelections = 0
}) {
  // Siblings state
  const [siblings, setSiblings] = useState([]);
  const [olderLittersRoll, setOlderLittersRoll] = useState(null);
  const [youngerLittersRoll, setYoungerLittersRoll] = useState(null);
  const [olderLitters, setOlderLitters] = useState(0);
  const [youngerLitters, setYoungerLitters] = useState(0);
  const [olderRerollUsed, setOlderRerollUsed] = useState(false);
  const [youngerRerollUsed, setYoungerRerollUsed] = useState(false);
  
  // Parents state
  const [rollResult, setRollResult] = useState(null);
  const [parentStatus, setParentStatus] = useState(null);
  const [rollDetails, setRollDetails] = useState(null);
  const [parentRerollUsed, setParentRerollUsed] = useState(false);
  const [motherAgeResult, setMotherAgeResult] = useState(null);
  const [fatherAgeResult, setFatherAgeResult] = useState(null);
  
  const [remainingRerolls, setRemainingRerolls] = useState(rerolls);
  const [remainingFreeSelections, setRemainingFreeSelections] = useState(freeSelections);
  const [initialRoll, setInitialRoll] = useState(false);

  // Roll table state
  const { token } = useAuth();
  const [familyTable, setFamilyTable] = useState(null);
  const [familyTableLoading, setFamilyTableLoading] = useState(false);
  const [familyTableRollResult, setFamilyTableRollResult] = useState(null);
  const [showFamilyTableView, setShowFamilyTableView] = useState(false);
  const [familyTableSecondaryRollResult, setFamilyTableSecondaryRollResult] = useState(null);
  const [showFamilyTableSecondaryView, setShowFamilyTableSecondaryView] = useState(false);
  const [familyTableFreeRerollUsed, setFamilyTableFreeRerollUsed] = useState(false);
  const [familyTableSubTableRollResult, setFamilyTableSubTableRollResult] = useState(null);
  const [familyTableSecondarySubTableRollResult, setFamilyTableSecondarySubTableRollResult] = useState(null);


  // Fetch family roll table
  useEffect(() => {
    const fetchFamilyTable = async () => {
      if (!token) return;
      
      setFamilyTableLoading(true);
      try {
        const response = await fetch('/api/roll-tables/rollpersonens-familj', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setFamilyTable(data.table);
        } else {
          console.error('Failed to fetch family table');
        }
      } catch (error) {
        console.error('Error fetching family table:', error);
      } finally {
        setFamilyTableLoading(false);
      }
    };

    fetchFamilyTable();
  }, [token]);

  // Load saved state (no automatic rolling)
  useEffect(() => {
    if (savedState) {
      // Restore from saved state
      if (savedState.siblings) setSiblings(savedState.siblings);
      if (savedState.olderLittersRoll) setOlderLittersRoll(savedState.olderLittersRoll);
      if (savedState.youngerLittersRoll) setYoungerLittersRoll(savedState.youngerLittersRoll);
      if (savedState.olderLitters !== undefined) setOlderLitters(savedState.olderLitters);
      if (savedState.youngerLitters !== undefined) setYoungerLitters(savedState.youngerLitters);
      if (savedState.rollResult) setRollResult(savedState.rollResult);
      if (savedState.parentStatus) setParentStatus(savedState.parentStatus);
      if (savedState.rollDetails) setRollDetails(savedState.rollDetails);
      if (savedState.motherAgeResult) setMotherAgeResult(savedState.motherAgeResult);
      if (savedState.fatherAgeResult) setFatherAgeResult(savedState.fatherAgeResult);
      if (savedState.remainingRerolls !== undefined) setRemainingRerolls(savedState.remainingRerolls);
      if (savedState.remainingFreeSelections !== undefined) setRemainingFreeSelections(savedState.remainingFreeSelections);
      if (savedState.olderRerollUsed !== undefined) setOlderRerollUsed(savedState.olderRerollUsed);
      if (savedState.youngerRerollUsed !== undefined) setYoungerRerollUsed(savedState.youngerRerollUsed);
      if (savedState.parentRerollUsed !== undefined) setParentRerollUsed(savedState.parentRerollUsed);
      if (savedState.familyTableRollResult) setFamilyTableRollResult(savedState.familyTableRollResult);
      if (savedState.familyTableSecondaryRollResult) setFamilyTableSecondaryRollResult(savedState.familyTableSecondaryRollResult);
      if (savedState.showFamilyTableView !== undefined) setShowFamilyTableView(savedState.showFamilyTableView);
      if (savedState.showFamilyTableSecondaryView !== undefined) setShowFamilyTableSecondaryView(savedState.showFamilyTableSecondaryView);
      if (savedState.familyTableFreeRerollUsed !== undefined) setFamilyTableFreeRerollUsed(savedState.familyTableFreeRerollUsed);
      if (savedState.familyTableSubTableRollResult !== undefined) setFamilyTableSubTableRollResult(savedState.familyTableSubTableRollResult);
      if (savedState.familyTableSecondarySubTableRollResult !== undefined) setFamilyTableSecondarySubTableRollResult(savedState.familyTableSecondarySubTableRollResult);
      setInitialRoll(true);
    } else if (!initialRoll) {
      // No saved state, initialize but don't roll - user must press roll buttons
      setInitialRoll(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedState, rerolls]);

  // Save state whenever it changes (using ref to avoid infinite loop)
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    if (initialRoll && onStateChangeRef.current) {
      const stateToSave = {
        familyState: {
          siblings,
          olderLittersRoll,
          youngerLittersRoll,
          olderLitters,
          youngerLitters,
          rollResult,
          parentStatus,
          rollDetails,
          motherAgeResult,
          fatherAgeResult,
          remainingRerolls,
          remainingFreeSelections,
          olderRerollUsed,
          youngerRerollUsed,
          parentRerollUsed,
          familyTableRollResult,
          familyTableSecondaryRollResult,
          showFamilyTableView,
          showFamilyTableSecondaryView,
          familyTableFreeRerollUsed,
          familyTableSubTableRollResult,
          familyTableSecondarySubTableRollResult
        }
      };
      onStateChangeRef.current(stateToSave);
    }
  }, [siblings, olderLittersRoll, youngerLittersRoll, olderLitters, youngerLitters, rollResult, parentStatus, rollDetails, motherAgeResult, fatherAgeResult, remainingRerolls, remainingFreeSelections, olderRerollUsed, youngerRerollUsed, parentRerollUsed, familyTableRollResult, familyTableSecondaryRollResult, showFamilyTableView, showFamilyTableSecondaryView, familyTableFreeRerollUsed, familyTableSubTableRollResult, familyTableSecondarySubTableRollResult, initialRoll]);


  // Roll table handlers
  const handleFamilyTableRoll = async (rollResult) => {
    setFamilyTableRollResult(rollResult);
    // Process effect if entry has one
    if (rollResult.entry?.effect) {
      // TODO: Process effect using effectHandlers
      console.log('Roll table effect:', rollResult.entry.effect);
    }
  };

  const handleFamilyTableReroll = async () => {
    // Free reroll is only available when 100 was rolled (secondary table is open)
    // Check if the original roll was 100 by checking if secondary view should be open
    const was100Roll = familyTableRollResult !== null && 
                       familyTable && 
                       familyTable.entries && 
                       familyTable.entries.length > 0 && 
                       (() => {
                         const maxEntry = familyTable.entries.reduce((max, entry) => 
                           entry.maxValue > max.maxValue ? entry : max
                         );
                         return familyTableRollResult.rollValue >= maxEntry.minValue && 
                                familyTableRollResult.rollValue <= maxEntry.maxValue;
                       })();
    
    const isFreeReroll = !familyTableFreeRerollUsed && 
                         familyTableRollResult !== null && 
                         was100Roll;
    
    // Only consume token if not free reroll and if available
    if (!isFreeReroll && remainingRerolls > 0) {
      setRemainingRerolls(prev => prev - 1);
    }
    
    // Mark free reroll as used
    if (isFreeReroll) {
      setFamilyTableFreeRerollUsed(true);
    }
    
    // Roll again
    if (familyTable) {
      const diceResult = rollDiceForTable(familyTable.dice || '1T100');
      const entry = findEntryInTable(diceResult.value, familyTable.entries);
      await handleFamilyTableRoll({
        rollValue: diceResult.value,
        entry,
        diceDetails: diceResult.details
      });
      
      // Check if the new roll triggers a secondary roll
      if (familyTable.entries && familyTable.entries.length > 0) {
        const maxEntry = familyTable.entries.reduce((max, entry) => 
          entry.maxValue > max.maxValue ? entry : max
        );
        // If the new roll is the maximum value, open/keep secondary roll view
        if (diceResult.value >= maxEntry.minValue && diceResult.value <= maxEntry.maxValue) {
          if (!showFamilyTableSecondaryView) {
            setShowFamilyTableSecondaryView(true);
          }
        }
        // Note: We don't close the secondary roll view if it's already open, even if the new roll doesn't trigger it
        // This allows the user to keep the secondary roll result even after rerolling the first roll
      }
    }
  };



  const handleFamilyTableSecondaryRoll = () => {
    // Trigger opening the secondary roll view
    setShowFamilyTableSecondaryView(true);
  };

  const handleFamilyTableSecondaryRollResult = async (rollResult) => {
    setFamilyTableSecondaryRollResult(rollResult);
    // Process effect if entry has one
    if (rollResult.entry?.effect) {
      // TODO: Process effect using effectHandlers
      console.log('Secondary roll table effect:', rollResult.entry.effect);
    }
  };

  const handleFamilyTableSecondaryReroll = async () => {
    // Only consume token if available
    if (remainingRerolls > 0) {
      setRemainingRerolls(prev => prev - 1);
    }
    
    // Roll again on secondary table (always allowed)
    if (familyTable) {
      const diceResult = rollDiceForTable(familyTable.dice || '1T100');
      const entry = findEntryInTable(diceResult.value, familyTable.entries);
      await handleFamilyTableSecondaryRollResult({
        rollValue: diceResult.value,
        entry,
        diceDetails: diceResult.details
      });
    }
  };

  const rollDiceForTable = (diceString) => {
    const normalized = diceString.trim().toUpperCase();
    
    const t100Match = normalized.match(/^(\d+)T100$/);
    if (t100Match) {
      const count = parseInt(t100Match[1], 10);
      if (count === 1) {
        const result = rollT100();
        return { value: result, details: null };
      } else {
        let total = 0;
        for (let i = 0; i < count; i++) {
          total += rollT100();
        }
        return { value: total, details: null };
      }
    }
    
    const t6Match = normalized.match(/^(\d+)T6$/);
    if (t6Match) {
      const count = parseInt(t6Match[1], 10);
      const rolls = rollT6Multiple(count);
      return { value: rolls.reduce((a, b) => a + b, 0), details: { rolls } };
    }
    
    const t10Match = normalized.match(/^(\d+)T10$/);
    if (t10Match) {
      const count = parseInt(t10Match[1], 10);
      let total = 0;
      for (let i = 0; i < count; i++) {
        total += rollT10();
      }
      return { value: total, details: null };
    }
    
    const obT6Match = normalized.match(/^OB(\d+)T6$/);
    if (obT6Match) {
      const count = parseInt(obT6Match[1], 10);
      const result = rollObT6WithDetails(count);
      return { value: result.total, details: result };
    }
    
    return { value: 0, details: null };
  };

  const findEntryInTable = (rollValue, entries) => {
    if (!entries || !Array.isArray(entries)) return null;
    return entries.find(entry => 
      rollValue >= entry.minValue && rollValue <= entry.maxValue
    ) || null;
  };

  const handleConfirm = () => {
    onConfirm({
      siblings: siblings,
      olderLitters: olderLitters,
      youngerLitters: youngerLitters,
      siblingFormula: getSiblingFormula(selectedRace, raceCategory),
      parentStatus: parentStatus,
      parentRollResult: rollResult,
      parentFormula: getParentFormula(selectedRace, raceCategory).formula,
      parentTable: getParentFormula(selectedRace, raceCategory).table,
      familyTableRoll: familyTableRollResult,
      familyTableSecondaryRoll: familyTableSecondaryRollResult
    });
  };

  return (
    <>
      <DialogTitle>
        Familj
        {(olderLittersRoll || youngerLittersRoll) && (
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
            {olderLitters} äldre kullar, {youngerLitters} yngre kullar
          </Typography>
        )}
        {remainingRerolls > 0 && (
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
            {remainingRerolls} omkastningar kvar
          </Typography>
        )}
      </DialogTitle>
      <DialogContent sx={{ minWidth: 0, overflow: 'visible' }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'column', md: 'row' }, gap: 3 }}>
          <SiblingsSection
            ageData={ageData}
            raceCategory={raceCategory}
            selectedRace={selectedRace}
            siblings={siblings}
            setSiblings={setSiblings}
            olderLittersRoll={olderLittersRoll}
            setOlderLittersRoll={setOlderLittersRoll}
            youngerLittersRoll={youngerLittersRoll}
            setYoungerLittersRoll={setYoungerLittersRoll}
            olderLitters={olderLitters}
            setOlderLitters={setOlderLitters}
            youngerLitters={youngerLitters}
            setYoungerLitters={setYoungerLitters}
            olderRerollUsed={olderRerollUsed}
            setOlderRerollUsed={setOlderRerollUsed}
            youngerRerollUsed={youngerRerollUsed}
            setYoungerRerollUsed={setYoungerRerollUsed}
            remainingRerolls={remainingRerolls}
            setRemainingRerolls={setRemainingRerolls}
          />
          
          <ParentsSection
            ageData={ageData}
            raceCategory={raceCategory}
            selectedRace={selectedRace}
            siblings={siblings}
            rollResult={rollResult}
            setRollResult={setRollResult}
            parentStatus={parentStatus}
            setParentStatus={setParentStatus}
            rollDetails={rollDetails}
            setRollDetails={setRollDetails}
            parentRerollUsed={parentRerollUsed}
            setParentRerollUsed={setParentRerollUsed}
            remainingRerolls={remainingRerolls}
            setRemainingRerolls={setRemainingRerolls}
            motherAgeResult={motherAgeResult}
            setMotherAgeResult={setMotherAgeResult}
            fatherAgeResult={fatherAgeResult}
            setFatherAgeResult={setFatherAgeResult}
          />
        </Box>

        {/* Family Roll Table */}
        {showFamilyTableView && familyTable ? (
          <Box sx={{ mt: 3 }}>
            <RollTableView
              table={familyTable}
              rollResult={familyTableRollResult}
              onRoll={handleFamilyTableRoll}
              onReroll={handleFamilyTableReroll}
              onMinimize={() => setShowFamilyTableView(false)}
              rerolls={remainingRerolls}
              freeChoiceTokens={0}
              onUseFreeChoice={null}
              onPendingFreeChoiceChange={null}
              disabled={false}
              isSecondaryRoll={false}
              onSecondaryRoll={handleFamilyTableSecondaryRoll}
              isFreeReroll={!familyTableFreeRerollUsed && familyTableRollResult !== null && showFamilyTableSecondaryView}
              subTableRollResult={familyTableSubTableRollResult}
              onSubTableRollChange={setFamilyTableSubTableRollResult}
            />
            
            {/* Secondary Roll Table (shown when first roll is 100) */}
            {showFamilyTableSecondaryView && familyTable && (
              <Box sx={{ mt: 3 }}>
                <RollTableView
                  table={familyTable}
                  rollResult={familyTableSecondaryRollResult}
                  onRoll={handleFamilyTableSecondaryRollResult}
                  onReroll={handleFamilyTableSecondaryReroll}
                  onMinimize={() => setShowFamilyTableSecondaryView(false)}
                  rerolls={remainingRerolls}
                  freeChoiceTokens={0}
                  onUseFreeChoice={null}
                  onPendingFreeChoiceChange={null}
                  disabled={false}
                  isSecondaryRoll={true}
                  subTableRollResult={familyTableSecondarySubTableRollResult}
                  onSubTableRollChange={setFamilyTableSecondarySubTableRollResult}
                />
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ mt: 3 }}>
            {familyTableLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : familyTable ? (
              <RollTableCard
                tableSlug="rollpersonens-familj"
                tableName={familyTable.name}
                onRoll={async () => {
                  const diceResult = rollDiceForTable(familyTable.dice || '1T100');
                  const entry = findEntryInTable(diceResult.value, familyTable.entries);
                  await handleFamilyTableRoll({
                    rollValue: diceResult.value,
                    entry,
                    diceDetails: diceResult.details
                  });
                }}
                onView={() => setShowFamilyTableView(true)}
                rollResult={familyTableRollResult}
                rerolls={Math.max(remainingRerolls, 1)}
                onReroll={handleFamilyTableReroll}
                freeChoiceTokens={0}
                onUseFreeChoice={null}
                disabled={false}
              />
            ) : null}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Avbryt</Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          disabled={
            !parentStatus || 
            // Must have rolled on family table
            (familyTableRollResult === null) ||
            // If secondary roll view is open (rolled 100), must have used free reroll on original table
            (showFamilyTableSecondaryView && !familyTableFreeRerollUsed) ||
            // If secondary roll view is open, must have rolled on it
            (showFamilyTableSecondaryView && familyTableSecondaryRollResult === null)
          }
        >
          Bekräfta
        </Button>
      </DialogActions>
    </>
  );
}

FamilyDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onStateChange: PropTypes.func,
  savedState: PropTypes.object,
  ageData: PropTypes.object,
  selectedRace: PropTypes.object,
  raceCategory: PropTypes.object,
  rerolls: PropTypes.number,
  freeSelections: PropTypes.number
};

