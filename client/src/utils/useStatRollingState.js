import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for managing stat rolling state
 */
export const useStatRollingState = ({
  savedState,
  rerolls,
  statRollMethod,
  onStateChange
}) => {
  const [statsResult, setStatsResult] = useState(null);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [remainingRerolls, setRemainingRerolls] = useState(rerolls);
  const [freeRerollAllCount, setFreeRerollAllCount] = useState(0);
  const [initialRoll, setInitialRoll] = useState(false);
  const [gender, setGender] = useState('man');
  const [styDecrease, setStyDecrease] = useState(0);
  const [femaleAttributeModifications, setFemaleAttributeModifications] = useState({
    TÅL: 0,
    RÖR: 0,
    PER: 0,
    PSY: 0,
    VIL: 0,
    BIL: 0
  });

  // Load saved state
  useEffect(() => {
    if (savedState) {
      if (savedState.statsResult) setStatsResult(savedState.statsResult);
      if (savedState.selectedAttributes) setSelectedAttributes(savedState.selectedAttributes);
      if (savedState.remainingRerolls !== undefined) setRemainingRerolls(savedState.remainingRerolls);
      if (savedState.freeRerollAllCount !== undefined) setFreeRerollAllCount(savedState.freeRerollAllCount);
      if (savedState.gender) setGender(savedState.gender);
      if (savedState.styDecrease !== undefined) setStyDecrease(savedState.styDecrease);
      if (savedState.femaleAttributeModifications) {
        setFemaleAttributeModifications(savedState.femaleAttributeModifications);
      }
      setInitialRoll(true);
    } else if (!initialRoll) {
      setRemainingRerolls(rerolls);
      setInitialRoll(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedState, rerolls]);

  // Save state whenever it changes
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    if (initialRoll && onStateChangeRef.current) {
      const stateToSave = {
        statRollingState: {
          statsResult,
          selectedAttributes,
          remainingRerolls,
          freeRerollAllCount,
          gender,
          styDecrease,
          femaleAttributeModifications
        }
      };
      onStateChangeRef.current(stateToSave);
    }
  }, [statsResult, selectedAttributes, remainingRerolls, freeRerollAllCount, gender, styDecrease, femaleAttributeModifications, initialRoll]);

  // Initialize empty statsResult if it doesn't exist
  useEffect(() => {
    if (!statsResult) {
      const emptyResult = {
        attributes: {},
        rolls: {},
        sets: statRollMethod === 'anpassad' ? [] : undefined
      };
      setStatsResult(emptyResult);
      if (statRollMethod === 'anpassad') {
        const initial = {};
        ['STY', 'TÅL', 'RÖR', 'PER', 'PSY', 'VIL', 'BIL', 'SYN', 'HÖR'].forEach(attr => {
          initial[attr] = null;
        });
        setSelectedAttributes(initial);
      }
    }
  }, [statRollMethod, statsResult]);

  return {
    statsResult,
    setStatsResult,
    selectedAttributes,
    setSelectedAttributes,
    remainingRerolls,
    setRemainingRerolls,
    freeRerollAllCount,
    setFreeRerollAllCount,
    gender,
    setGender,
    styDecrease,
    setStyDecrease,
    femaleAttributeModifications,
    setFemaleAttributeModifications
  };
};

