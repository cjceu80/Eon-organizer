import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  useMediaQuery,
  useTheme,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CasinoIcon from '@mui/icons-material/Casino';
import RaceSelectionDialog from './RaceSelectionDialog/RaceSelectionDialog';
import AgeCalculationDialog from './AgeCalculationDialog/AgeCalculationDialog';
import CharacteristicsDialogItem from './CharectaristicsDialog/CharacteristicsDialogItem';
import BirthDialog from './BirthDialog/BirthDialog';
import FamilyDialog from './FamilyDialog/FamilyDialog';
import { rollT6Multiple } from '../../utils/dice';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}
TabPanel.propTypes = {
  children: PropTypes.node.isRequired,
  value: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired
};

export default function CharacterCreationDialog({ 
  open,
  onClose,
  worldId,
  world,
  token,
  onConfirm
}) {
  // Storage key for this dialog's state
  const storageKey = `characterCreation_${worldId}`;
  
  const [characterName, setCharacterName] = useState('');
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  const [basics, setBasics] = useState({
    profession: '',
    hair: '',
    eyes: '',
    skin: '',
    home: '',
    religion: '',
    build: ''
  });
  
  const [attributes, setAttributes] = useState({});
  
  // Store dice rolls for each attribute
  const [attributeRolls, setAttributeRolls] = useState({});
  
  // For anpassad method: store rolled sets and their assignments
  const [anpassadSets, setAnpassadSets] = useState([]);
  const [selectedAnpassadSet, setSelectedAnpassadSet] = useState(null);
  const [dragOverAttribute, setDragOverAttribute] = useState(null);
  
  const [characteristics, setCharacteristics] = useState({});
  
  // Store dice rolls for each characteristic
  const [characteristicRolls, setCharacteristicRolls] = useState({});
  
  // Characteristics data from JSON
  const [characteristicsData, setCharacteristicsData] = useState(null);
  const [characteristicsLoading, setCharacteristicsLoading] = useState(true);
  
  // Characteristics constants
  const CHARACTERISTICS = [
    { key: 'Lojalitet', fixed: false },
    { key: 'Heder', fixed: false },
    { key: 'Amor', fixed: false },
    { key: 'Aggression', fixed: false },
    { key: 'Tro', fixed: false },
    { key: 'Generositet', fixed: false },
    { key: 'Rykte', fixed: true, value: 5 },
    { key: 'Tur', fixed: true, value: 11 },
    { key: 'Qadosh', fixed: false }
  ];
  
  // Helper to match characteristic by full name or first 3 characters
  const matchesCharacteristic = (charKey, recommendation) => {
    const charLower = charKey.toLowerCase();
    const recLower = recommendation.toLowerCase();
    return charLower === recLower || charLower.substring(0, 3) === recLower.substring(0, 3);
  };
  
  // Data collected from optional tools (declared early so it can be used in useEffect)
  const [selectedRace, setSelectedRace] = useState(null);
  
  // Load characteristics data
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/copyrighted/characteristics.json');
        if (response.ok) {
          const data = await response.json();
          setCharacteristicsData(data);
        } else {
          console.error('Failed to load characteristics data');
          setCharacteristicsData({
            descriptions: {},
            highSpecializationExamples: {},
            lowSpecializationExamples: {}
          });
        }
    } catch (err) {
        console.error('Error loading characteristics data:', err);
        setCharacteristicsData({
          descriptions: {},
          highSpecializationExamples: {},
          lowSpecializationExamples: {}
        });
      } finally {
        setCharacteristicsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Initialize characteristics with race recommendations
  useEffect(() => {
    if (selectedRace && !characteristicsLoading && Object.keys(characteristics).length === 0) {
      const highCharacteristics = selectedRace?.metadata?.highCharacteristics || [];
      const lowCharacteristics = selectedRace?.metadata?.lowCharacteristics || [];
      
      const initial = {};
      CHARACTERISTICS.forEach(char => {
        if (char.fixed) {
          initial[char.key] = char.value;
        } else {
          const isHigh = highCharacteristics.some(rec => matchesCharacteristic(char.key, rec));
          const isLow = lowCharacteristics.some(rec => matchesCharacteristic(char.key, rec));
          
          if (isHigh) {
            initial[char.key] = 13;
          } else if (isLow) {
            initial[char.key] = 8;
          } else {
            initial[char.key] = 11;
          }
        }
      });
      setCharacteristics(initial);
    }
  }, [selectedRace, characteristicsLoading, characteristics]);
  
  const [specializations, setSpecializations] = useState({});
  const [professionalSkills, setProfessionalSkills] = useState([]);
  const [otherSkills, setOtherSkills] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [connections, setConnections] = useState([]);
  const [bio, setBio] = useState('');
  
  // Optional tool dialogs
  const [showRaceSelectionDialog, setShowRaceSelectionDialog] = useState(false);
  const [showAgeCalculationDialog, setShowAgeCalculationDialog] = useState(false);
  const [showBirthDialog, setShowBirthDialog] = useState(false);
  const [showFamilyDialog, setShowFamilyDialog] = useState(false);
  const [ageData, setAgeData] = useState(null);
  const [backgroundData, setBackgroundData] = useState(null);
  const [familyData, setFamilyData] = useState(null);
  const [raceCategory, setRaceCategory] = useState(null);
  const [gender, setGender] = useState('');

  // State storage for dialogs (to persist when reopening)
  const [ageCalculationDialogState, setAgeCalculationDialogState] = useState(null);
  const [birthDialogState, setBirthDialogState] = useState(null);
  const [familyDialogState, setFamilyDialogState] = useState(null);

  // Load saved state from localStorage when dialog opens
  useEffect(() => {
    if (open) {
      try {
        const savedState = localStorage.getItem(storageKey);
        if (savedState) {
          const parsed = JSON.parse(savedState);
          if (parsed.characterName) setCharacterName(parsed.characterName);
          if (parsed.basics) setBasics(parsed.basics);
          if (parsed.attributes) setAttributes(parsed.attributes);
          if (parsed.attributeRolls) setAttributeRolls(parsed.attributeRolls);
          if (parsed.anpassadSets) setAnpassadSets(parsed.anpassadSets);
          if (parsed.selectedAnpassadSet) setSelectedAnpassadSet(parsed.selectedAnpassadSet);
          if (parsed.characteristics) setCharacteristics(parsed.characteristics);
          if (parsed.characteristicRolls) setCharacteristicRolls(parsed.characteristicRolls);
          if (parsed.specializations) setSpecializations(parsed.specializations);
          if (parsed.professionalSkills) setProfessionalSkills(parsed.professionalSkills);
          if (parsed.otherSkills) setOtherSkills(parsed.otherSkills);
          if (parsed.languages) setLanguages(parsed.languages);
          if (parsed.connections) setConnections(parsed.connections);
          if (parsed.bio) setBio(parsed.bio);
          if (parsed.selectedRace) {
            setSelectedRace(parsed.selectedRace);
            // Fetch race category again when loading saved race
            fetchRaceCategory(parsed.selectedRace);
          }
          if (parsed.ageData) setAgeData(parsed.ageData);
          if (parsed.backgroundData) setBackgroundData(parsed.backgroundData);
          if (parsed.familyData) setFamilyData(parsed.familyData);
          if (parsed.gender) setGender(parsed.gender);
          if (parsed.activeTab !== undefined) setActiveTab(parsed.activeTab);
          if (parsed.ageCalculationDialogState) setAgeCalculationDialogState(parsed.ageCalculationDialogState);
          if (parsed.birthDialogState) setBirthDialogState(parsed.birthDialogState);
          if (parsed.familyDialogState) setFamilyDialogState(parsed.familyDialogState);
        }
      } catch (err) {
        console.error('Error loading saved state:', err);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, storageKey]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (open) {
      try {
        const stateToSave = {
          characterName,
          basics,
          attributes,
          attributeRolls,
          anpassadSets,
          selectedAnpassadSet,
          characteristics,
          characteristicRolls,
          specializations,
          professionalSkills,
          otherSkills,
          languages,
          connections,
          bio,
          selectedRace,
          ageData,
          backgroundData,
          familyData,
          raceCategory,
          gender,
          activeTab,
          ageCalculationDialogState,
          birthDialogState,
          familyDialogState
        };
        localStorage.setItem(storageKey, JSON.stringify(stateToSave));
      } catch (err) {
        console.error('Error saving state:', err);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    characterName,
    basics,
    attributes,
    attributeRolls,
    anpassadSets,
    selectedAnpassadSet,
    characteristics,
    characteristicRolls,
    specializations,
    professionalSkills,
    otherSkills,
    languages,
    connections,
    bio,
    selectedRace,
    ageData,
    backgroundData,
    familyData,
    raceCategory,
    gender,
    activeTab,
    ageCalculationDialogState,
    birthDialogState,
    familyDialogState,
    storageKey
  ]);

  // Fetch race category when race is selected
  const fetchRaceCategory = async (race) => {
    if (!race || !race.category || !world) {
      setRaceCategory(null);
      return;
    }
    
    try {
      const response = await fetch(`/api/race-categories/${world.ruleset || 'EON'}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const category = data.categories?.find(cat => cat.name === race.category);
        setRaceCategory(category || null);
      }
    } catch (err) {
      console.error('Error fetching race category:', err);
    }
  };

  const handleRaceSelected = async (race) => {
    setSelectedRace(race);
    setShowRaceSelectionDialog(false);
    await fetchRaceCategory(race);
  };

  const handleRollAttribute = (attr) => {
    const statRollMethod = world?.settings?.statRollMethod || 'standard';
    let rolls;
    let total;
    
    if (statRollMethod === 'höga attribut') {
      // Roll 4T6 and discard the lowest
      const allRolls = rollT6Multiple(4);
      const sortedRolls = [...allRolls].sort((a, b) => a - b);
      const dropped = sortedRolls[0];
      const kept = sortedRolls.slice(1);
      rolls = { all: allRolls, kept, dropped };
      total = kept.reduce((a, b) => a + b, 0);
    } else if (statRollMethod === 'hjälteattribut') {
      // Roll 2T6 + 9
      rolls = rollT6Multiple(2);
      total = rolls.reduce((a, b) => a + b, 0) + 9;
    } else {
      // Standard: 3T6
      rolls = rollT6Multiple(3);
      total = rolls.reduce((a, b) => a + b, 0);
    }
    
    // Store the base rolled value (without modifiers)
    setAttributes(prev => ({ ...prev, [attr]: total }));
    setAttributeRolls(prev => ({ ...prev, [attr]: rolls }));
  };
  
  const handleRollCharacteristic = (charKey) => {
    const rolls = rollT6Multiple(3);
    const total = rolls.reduce((a, b) => a + b, 0);
    setCharacteristics(prev => ({ ...prev, [charKey]: total }));
    setCharacteristicRolls(prev => ({ ...prev, [charKey]: rolls }));
  };
  
  const handleCharacteristicValueChange = (charKey, value) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      setCharacteristics(prev => ({ ...prev, [charKey]: '' }));
      return;
    }
    const clampedValue = Math.max(3, Math.min(18, numValue));
    setCharacteristics(prev => ({ ...prev, [charKey]: clampedValue }));
  };
  
  const getCharacteristicValue = (charKey) => {
    const char = CHARACTERISTICS.find(c => c.key === charKey);
    if (char?.fixed) {
      return char.value;
    }
    return characteristics[charKey] !== undefined && characteristics[charKey] !== '' 
      ? characteristics[charKey] 
      : 11;
  };
  
  const hasHighSpecialization = (charKey) => {
    const char = CHARACTERISTICS.find(c => c.key === charKey);
    if (char?.fixed) return false;
    const value = getCharacteristicValue(charKey);
    return typeof value === 'number' && value >= 14;
  };
  
  const hasLowSpecialization = (charKey) => {
    const char = CHARACTERISTICS.find(c => c.key === charKey);
    if (char?.fixed) return false;
    const value = getCharacteristicValue(charKey);
    return typeof value === 'number' && value <= 7;
  };

  const handleAgeCalculated = (ageDataResult) => {
    // Automatically transfer age data to form
    setAgeData(ageDataResult);
    if (ageDataResult?.age) {
      // Age is already in ageData, will be used in form
    }
    if (ageDataResult?.gender) {
      setGender(ageDataResult.gender);
    }
    if (ageDataResult?.length) {
      // Height will be shown in form
    }
    if (ageDataResult?.weight) {
      // Weight will be shown in form
    }
    if (ageDataResult?.kroppsbyggnad) {
      setBasics(prev => ({ 
        ...prev, 
        build: ageDataResult.kroppsbyggnad.type || ageDataResult.kroppsbyggnad,
        buildRollDetails: ageDataResult.kroppsbyggnadRollDetails?.t6Rolls ? 
          ageDataResult.kroppsbyggnadRollDetails.t6Rolls.reduce((a, b) => a + b, 0) : null
      }));
    }
      setShowAgeCalculationDialog(false);
  };


  const handleBackgroundConfirmed = async (backgroundResult) => {
    setBackgroundData(backgroundResult);
      setShowBirthDialog(false);
    await fetchRaceCategory(selectedRace);
  };

  const handleFamilyConfirmed = (familyResult) => {
    setFamilyData(familyResult);
      setShowFamilyDialog(false);
  };

  const addSkill = (type) => {
    if (type === 'professional') {
      setProfessionalSkills([...professionalSkills, { name: '', level: 10, specialization: '' }]);
    } else {
      setOtherSkills([...otherSkills, { name: '', level: 10, specialization: '' }]);
    }
  };

  const removeSkill = (type, index) => {
    if (type === 'professional') {
      setProfessionalSkills(professionalSkills.filter((_, i) => i !== index));
    } else {
      setOtherSkills(otherSkills.filter((_, i) => i !== index));
    }
  };

  const updateSkill = (type, index, field, value) => {
    if (type === 'professional') {
      const updated = [...professionalSkills];
      updated[index] = { ...updated[index], [field]: value };
      setProfessionalSkills(updated);
    } else {
      const updated = [...otherSkills];
      updated[index] = { ...updated[index], [field]: value };
      setOtherSkills(updated);
    }
  };

  const addLanguage = () => {
    setLanguages([...languages, { name: '', level: 10 }]);
  };

  const removeLanguage = (index) => {
    setLanguages(languages.filter((_, i) => i !== index));
  };

  const updateLanguage = (index, field, value) => {
    const updated = [...languages];
    updated[index] = { ...updated[index], [field]: value };
    setLanguages(updated);
  };

  const addConnection = () => {
    setConnections([...connections, { id: '', relationship: '', description: '' }]);
  };

  const removeConnection = (index) => {
    setConnections(connections.filter((_, i) => i !== index));
  };

  const updateConnection = (index, field, value) => {
    const updated = [...connections];
    updated[index] = { ...updated[index], [field]: value };
    setConnections(updated);
  };

  const handleCreateCharacter = async (e) => {
    e.preventDefault();
    if (!characterName.trim()) {
      alert('Karaktärsnamn krävs');
      return;
    }

    setCreating(true);
    try {
      // Apply race modifiers to attributes
      const finalAttributes = { ...attributes };
      if (selectedRace?.modifiers) {
        const modifiers = selectedRace.modifiers instanceof Map 
          ? Object.fromEntries(selectedRace.modifiers)
          : selectedRace.modifiers;
        
        Object.keys(finalAttributes).forEach(attr => {
          const baseValue = finalAttributes[attr];
          if (baseValue !== undefined && baseValue !== null && typeof baseValue === 'number') {
            const modifier = modifiers[attr] || 0;
            finalAttributes[attr] = baseValue + modifier;
          }
        });
      }
      
      const characterData = {
        name: characterName.trim(),
        worldId,
        basics: {
          race: selectedRace?.name || '',
          age: ageData?.age || null,
          gender: gender || ageData?.gender || '',
          height: ageData?.length || null,
          weight: ageData?.weight || null,
          build: basics.build || ageData?.kroppsbyggnad || '',
          buildRollDetails: ageData?.kroppsbyggnadRollDetails || null,
          hair: basics.hair || '',
          eyes: basics.eyes || '',
          skin: basics.skin || '',
          home: basics.home || '',
          religion: basics.religion || '',
          profession: basics.profession || ''
        },
        attributes: finalAttributes,
        characteristics: characteristics,
        specializations: specializations,
        professionalSkills: professionalSkills.filter(s => s.name),
        otherSkills: otherSkills.filter(s => s.name),
        languages: languages.filter(l => l.name),
        connections: connections.filter(c => c.id && c.relationship),
        bio: bio ? [bio] : [],
        inventory: [],
        ownedItems: [],
        advantages: [],
        disadvantages: [],
        meleeWeapons: [],
        rangedWeapons: [],
        armor: [],
        shields: []
      };

      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(characterData)
      });

      if (response.ok) {
        const data = await response.json();
        // Clear localStorage on successful creation
        try {
          localStorage.removeItem(storageKey);
        } catch (err) {
          console.error('Error clearing saved state:', err);
        }
        if (onConfirm) {
          onConfirm(data.character);
        }
        // Reset form
        handleCancel();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Misslyckades att skapa karaktär');
      }
    } catch (err) {
      console.error('Error creating character:', err);
      alert('Misslyckades att skapa karaktär');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    // Just close the dialog without resetting
    onClose();
  };

  const handleCancel = () => {
    // Reset form when cancel button is pressed
    setCharacterName('');
    setBasics({
      profession: '',
      hair: '',
      eyes: '',
      skin: '',
      home: '',
      religion: '',
      build: ''
    });
    setAttributes({});
    setAttributeRolls({});
    setAnpassadSets([]);
    setSelectedAnpassadSet(null);
    setDragOverAttribute(null);
    setCharacteristics({});
    setCharacteristicRolls({});
    setSpecializations({});
    setProfessionalSkills([]);
    setOtherSkills([]);
    setLanguages([]);
    setConnections([]);
    setBio('');
    setSelectedRace(null);
    setAgeData(null);
    setBackgroundData(null);
    setFamilyData(null);
    setRaceCategory(null);
    setGender('');
    setActiveTab(0);
    
    // Reset dialog states
    setShowRaceSelectionDialog(false);
    setShowAgeCalculationDialog(false);
    setShowBirthDialog(false);
    setShowFamilyDialog(false);
    
    // Reset dialog saved states
    setAgeCalculationDialogState(null);
    setBirthDialogState(null);
    setFamilyDialogState(null);
    
    // Clear localStorage
    try {
      localStorage.removeItem(storageKey);
    } catch (err) {
      console.error('Error clearing saved state:', err);
    }
    
    onClose();
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="xl" fullWidth>
        <form onSubmit={handleCreateCharacter}>
          <DialogTitle>Skapa ny karaktär</DialogTitle>
        <DialogContent>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 3,
                minHeight: '600px'
              }}
            >
              {/* Left side: Character form (75% width on desktop) */}
              <Box
                sx={{
                  width: { xs: '100%', md: '75%' },
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <TextField
                  autoFocus
                  margin="dense"
                  id="characterName"
                  label="Karaktärnamn *"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  disabled={creating}
                  required
                  sx={{ mb: 2 }}
                />

                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                  <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                    <Tab label="Grundläggande" />
                    <Tab label="Attribut" />
                    <Tab label="Karaktärsdrag" />
                    <Tab label="Färdigheter" />
                    <Tab label="Kopplingar" />
                    <Tab label="Biografi" />
                  </Tabs>
                </Box>

                <TabPanel value={activeTab} index={0}>
                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        margin="dense"
                        label="Ras"
                        fullWidth
                        value={selectedRace?.name || ''}
                        onClick={() => {
                          setShowRaceSelectionDialog(true);
                          setActiveTab(0);
                        }}
                        onChange={() => {}}
                        disabled={creating}
                        helperText="Klicka för att välja ras"
                        InputProps={{
                          readOnly: true,
                          sx: { cursor: 'pointer' }
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        margin="dense"
                        label="Kön"
                        fullWidth
                        value={gender || ageData?.gender || ''}
                        onChange={(e) => setGender(e.target.value)}
                        disabled={creating}
                        inputProps={{
                          list: 'gender-options'
                        }}
                      />
                      <datalist id="gender-options">
                        <option value="Man" />
                        <option value="Kvinna" />
                        <option value="Obestämt" />
                      </datalist>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        margin="dense"
                        label="Ålder"
                        type="number"
                        fullWidth
                        value={ageData?.age || ''}
                        onChange={(e) => {
                          const newAge = e.target.value ? parseInt(e.target.value) : null;
                          setAgeData(prev => prev ? ({ ...prev, age: newAge }) : { age: newAge });
                        }}
                        disabled={creating}
                        InputProps={{
                          readOnly: !!ageData?.age
                        }}
                        helperText={ageData?.age ? 'Använd verktyget för att ändra' : ''}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        margin="dense"
                        label="Yrke"
                        fullWidth
                        value={basics.profession}
                        onChange={(e) => setBasics(prev => ({ ...prev, profession: e.target.value }))}
                        disabled={creating}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        margin="dense"
                        label="Längd (cm)"
                        type="number"
                        fullWidth
                        value={ageData?.length || ''}
                        onChange={(e) => {
                          const newHeight = e.target.value ? parseInt(e.target.value) : null;
                          setAgeData(prev => prev ? ({ ...prev, length: newHeight }) : { length: newHeight });
                        }}
                        disabled={creating}
                        InputProps={{
                          readOnly: !!ageData?.length
                        }}
                        helperText={ageData?.length ? 'Använd verktyget för att ändra' : ''}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        margin="dense"
                        label="Vikt (kg)"
                        type="number"
                        fullWidth
                        value={ageData?.weight || ''}
                        onChange={(e) => {
                          const newWeight = e.target.value ? parseInt(e.target.value) : null;
                          setAgeData(prev => prev ? ({ ...prev, weight: newWeight }) : { weight: newWeight });
                        }}
                        disabled={creating}
                        InputProps={{
                          readOnly: !!ageData?.weight
                        }}
                        helperText={ageData?.weight ? 'Använd verktyget för att ändra' : ''}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        margin="dense"
                        label="Kroppsbyggnad"
                        fullWidth
                        value={basics.build || ageData?.kroppsbyggnad || ''}
                        onChange={(e) => setBasics(prev => ({ ...prev, build: e.target.value }))}
                        disabled={creating || !!ageData?.kroppsbyggnad}
                        helperText={ageData?.kroppsbyggnad ? 'Använd verktyget för att ändra' : ''}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        margin="dense"
                        label="Hår"
                        fullWidth
                        value={basics.hair}
                        onChange={(e) => setBasics(prev => ({ ...prev, hair: e.target.value }))}
                        disabled={creating}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        margin="dense"
                        label="Ögon"
                        fullWidth
                        value={basics.eyes}
                        onChange={(e) => setBasics(prev => ({ ...prev, eyes: e.target.value }))}
                        disabled={creating}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        margin="dense"
                        label="Hud"
                        fullWidth
                        value={basics.skin}
                        onChange={(e) => setBasics(prev => ({ ...prev, skin: e.target.value }))}
                        disabled={creating}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        margin="dense"
                        label="Hem"
                        fullWidth
                        value={basics.home}
                        onChange={(e) => setBasics(prev => ({ ...prev, home: e.target.value }))}
                        disabled={creating}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        margin="dense"
                        label="Religion"
                        fullWidth
                        value={basics.religion}
                        onChange={(e) => setBasics(prev => ({ ...prev, religion: e.target.value }))}
                        disabled={creating}
                      />
                    </Grid>
                  </Grid>
                </TabPanel>

                <TabPanel value={activeTab} index={1}>
          <Alert severity="info" sx={{ mb: 2 }}>
                    {world?.settings?.statRollMethod === 'anpassad' 
                      ? 'Dra och släpp värden från kortet nedan till attributen, eller klicka på "Välj" för ett attribut och sedan på ett värde. Använd "Rulla alla" för att rulla 9 värden på en gång.'
                      : 'Klicka på tärningsikonen för att rulla attribut, eller använd "Rulla alla" för att rulla alla attribut på en gång.'}
          </Alert>
                  {world?.settings?.statRollMethod !== 'anpassad' && (
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        startIcon={<CasinoIcon />}
                        onClick={() => {
                          const allAttributes = ['STY', 'TÅL', 'RÖR', 'PER', 'PSY', 'VIL', 'BIL', 'SYN', 'HÖR'];
                          allAttributes.forEach(attr => {
                            handleRollAttribute(attr);
                          });
                        }}
                        disabled={creating}
                      >
                        Slå alla
          </Button>
                    </Box>
                  )}
                  <Grid container spacing={2}>
                    {['STY', 'TÅL', 'RÖR', 'PER', 'PSY', 'VIL', 'BIL', 'SYN', 'HÖR'].map(attr => {
                      // Get race modifier
                      let raceModifier = 0;
                      if (selectedRace?.modifiers) {
                        if (selectedRace.modifiers instanceof Map) {
                          raceModifier = selectedRace.modifiers.get(attr) || 0;
                        } else {
                          raceModifier = selectedRace.modifiers[attr] || 0;
                        }
                      }
                      
                      // Get base value from state
                      const storedValue = attributes[attr];
                      const baseValue = storedValue !== undefined && storedValue !== null ? storedValue : '';
                      const displayValue = baseValue;

  return (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={attr}>
                          <Box
                            onDragOver={(e) => {
                              if (world?.settings?.statRollMethod === 'anpassad') {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                                setDragOverAttribute(attr);
                              }
                            }}
                            onDragLeave={(e) => {
                              if (world?.settings?.statRollMethod === 'anpassad') {
                                // Only clear if we're actually leaving the drop zone
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = e.clientX;
                                const y = e.clientY;
                                if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                                  setDragOverAttribute(null);
                                }
                              }
                            }}
                            onDrop={(e) => {
                              if (world?.settings?.statRollMethod === 'anpassad') {
                                e.preventDefault();
                                setDragOverAttribute(null);
                                try {
                                  const data = JSON.parse(e.dataTransfer.getData('application/json'));
                                  const draggedSet = anpassadSets.find(s => s.id === data.setId);
                                  if (draggedSet) {
                                    // Unassign from previous attribute if any
                                    if (draggedSet.assignedTo) {
                                      setAttributes(prev => {
                                        const newAttrs = { ...prev };
                                        delete newAttrs[draggedSet.assignedTo];
                                        return newAttrs;
                                      });
                                      setAttributeRolls(prev => {
                                        const newRolls = { ...prev };
                                        delete newRolls[draggedSet.assignedTo];
                                        return newRolls;
                                      });
                                    }
                                    // Unassign any existing set from this attribute
                                    const existingSet = anpassadSets.find(s => s.assignedTo === attr);
                                    if (existingSet) {
                                      setAnpassadSets(prev => prev.map(s => 
                                        s.id === existingSet.id ? { ...s, assignedTo: null } : s
                                      ));
                                    }
                                    // Assign the dragged set to this attribute
                                    setAnpassadSets(prev => prev.map(s => 
                                      s.id === draggedSet.id ? { ...s, assignedTo: attr } : s
                                    ));
                                    setAttributes(prev => ({ ...prev, [attr]: draggedSet.total }));
                                    setAttributeRolls(prev => ({ ...prev, [attr]: draggedSet.rolls }));
                                    setSelectedAnpassadSet(null);
                                  }
                                } catch (err) {
                                  console.error('Error handling drop:', err);
                                }
                              }
                            }}
                            sx={{
                              ...(world?.settings?.statRollMethod === 'anpassad' && {
                                border: dragOverAttribute === attr ? '2px dashed' : '2px dashed transparent',
                                borderColor: dragOverAttribute === attr ? 'primary.main' : 'transparent',
                                borderRadius: 1,
                                p: 0.5,
                                transition: 'all 0.2s',
                                bgcolor: dragOverAttribute === attr ? 'action.selected' : 'transparent',
                                '&:hover': {
                                  borderColor: dragOverAttribute !== attr ? 'primary.light' : 'primary.main',
                                  bgcolor: dragOverAttribute !== attr ? 'action.hover' : 'action.selected'
                                }
                              })
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <TextField
                                label={attr}
                                type="number"
                                fullWidth
                                value={displayValue}
                                onChange={(e) => {
                                  const newValue = e.target.value === '' ? undefined : parseInt(e.target.value);
                                  setAttributes(prev => ({ ...prev, [attr]: newValue }));
                                }}
                                disabled={creating}
                              />
                              {world?.settings?.statRollMethod === 'anpassad' ? (
                                <Button
                                  size="small"
                                  onClick={() => {
                                    // Select this attribute for assignment
                                    const currentSet = anpassadSets.find(set => set.assignedTo === attr);
                                    if (currentSet) {
                                      // Unassign
                                      setAnpassadSets(prev => prev.map(s => 
                                        s.id === currentSet.id ? { ...s, assignedTo: null } : s
                                      ));
                                      setAttributes(prev => {
                                        const newAttrs = { ...prev };
                                        delete newAttrs[attr];
                                        return newAttrs;
                                      });
                                      setAttributeRolls(prev => {
                                        const newRolls = { ...prev };
                                        delete newRolls[attr];
                                        return newRolls;
                                      });
                                      setSelectedAnpassadSet(null);
                                    } else {
                                      setSelectedAnpassadSet({ assignedTo: attr });
                                    }
                                  }}
                                  disabled={creating}
                                  color={anpassadSets.some(set => set.assignedTo === attr) ? 'success' : selectedAnpassadSet?.assignedTo === attr ? 'warning' : 'primary'}
                                  variant={anpassadSets.some(set => set.assignedTo === attr) || selectedAnpassadSet?.assignedTo === attr ? 'contained' : 'outlined'}
                                  sx={{ minWidth: 80 }}
                                  title={anpassadSets.some(set => set.assignedTo === attr) ? 'Klicka för att ta bort tilldelning' : 'Klicka för att välja värde från poolen'}
                                >
                                  {anpassadSets.some(set => set.assignedTo === attr) ? 'Tilldelad' : selectedAnpassadSet?.assignedTo === attr ? 'Väljer...' : 'Välj'}
                                </Button>
                              ) : (
                                <Button
                                  size="small"
                                  onClick={() => handleRollAttribute(attr)}
                                  disabled={creating}
                                  color="primary"
                                  variant="outlined"
                                  startIcon={<CasinoIcon />}
                                  sx={{ minWidth: 80 }}
                                >
                                  Slå
                                </Button>
                              )}
                            </Box>
                            {(attributeRolls[attr] || (world?.settings?.statRollMethod === 'anpassad' && anpassadSets.find(set => set.assignedTo === attr))) && (
                              <Box sx={{ mt: 1, ml: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {(() => {
                                  const statRollMethod = world?.settings?.statRollMethod || 'standard';
                                  let rolls = attributeRolls[attr];
                                  
                                  // For anpassad, get rolls from assigned set
                                  if (statRollMethod === 'anpassad' && !rolls) {
                                    const assignedSet = anpassadSets.find(set => set.assignedTo === attr);
                                    if (assignedSet) {
                                      rolls = assignedSet.rolls;
                                    }
                                  }
                                  
                                  if (!rolls) return null;
                                  
                                  if (statRollMethod === 'höga attribut' && rolls.kept) {
                                    // Show kept dice for höga attribut
  return (
    <>
                                        {rolls.kept.map((roll, index) => (
                                          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Box
                                              sx={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: 1,
                                                bgcolor: 'primary.main',
                                                color: 'primary.contrastText',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 'bold',
                                                fontSize: '0.75rem',
                                                boxShadow: 1
                                              }}
                                            >
                                              {roll}
                                            </Box>
                                            {index < rolls.kept.length - 1 && (
                                              <Typography 
                                                variant="caption" 
                                                sx={{ fontWeight: 'bold', color: 'text.secondary' }}
                                              >
                                                +
                                              </Typography>
                                            )}
                                          </Box>
                                        ))}
                                        <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                                          (slängd: {rolls.dropped})
                                        </Typography>
                                      </>
                                    );
                                  } else if (statRollMethod === 'hjälteattribut' && Array.isArray(rolls)) {
                                    // Show 2T6 + 9 for hjälteattribut
                                    return (
                                      <>
                                        {rolls.map((roll, index) => (
                                          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Box
                                              sx={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: 1,
                                                bgcolor: 'primary.main',
                                                color: 'primary.contrastText',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 'bold',
                                                fontSize: '0.75rem',
                                                boxShadow: 1
                                              }}
                                            >
                                              {roll}
                                            </Box>
                                            {index < rolls.length - 1 && (
                                              <Typography 
                                                variant="caption" 
                                                sx={{ fontWeight: 'bold', color: 'text.secondary' }}
                                              >
                                                +
                                              </Typography>
                                            )}
                                          </Box>
                                        ))}
                                        <Typography variant="caption" color="text.secondary">+ 9</Typography>
                                      </>
                                    );
                                  } else if (Array.isArray(rolls)) {
                                    // Standard: show all dice
                                    return rolls.map((roll, index) => (
                                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Box
                                          sx={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: 1,
                                            bgcolor: 'primary.main',
                                            color: 'primary.contrastText',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 'bold',
                                            fontSize: '0.75rem',
                                            boxShadow: 1
                                          }}
                                        >
                                          {roll}
                                        </Box>
                                        {index < rolls.length - 1 && (
                                          <Typography 
                                            variant="caption" 
                                            sx={{ fontWeight: 'bold', color: 'text.secondary' }}
                                          >
                                            +
                                          </Typography>
                                        )}
                                      </Box>
                                    ));
                                  }
                                  return null;
                                })()}
                                {baseValue !== '' && baseValue !== null && baseValue !== undefined && typeof baseValue === 'number' && (
                                  <>
                                    {raceModifier !== 0 && (
                                      <>
                                        <Typography variant="caption" color="text.secondary">
                                          {raceModifier > 0 ? '+' : ''}{raceModifier}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">=</Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                                          {baseValue + raceModifier}
                                        </Typography>
                                      </>
                                    )}
                                    {raceModifier === 0 && (
                                      <>
                                        <Typography variant="caption" color="text.secondary">=</Typography>
                                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                          {baseValue}
                                        </Typography>
                                      </>
                                    )}
                                  </>
                                )}
                              </Box>
                            )}
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                  
                  {/* Anpassad method: Rolled sets card */}
                  {world?.settings?.statRollMethod === 'anpassad' && (
                    <Box sx={{ mt: 3 }}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                              Rullade värden
                            </Typography>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<CasinoIcon />}
                              onClick={() => {
                                // Clear existing assignments (but keep attribute values in input boxes)
                                const assignedAttributes = anpassadSets
                                  .filter(set => set.assignedTo !== null)
                                  .map(set => set.assignedTo);
                                
                                // Remove roll tracking for assigned attributes
                                setAttributeRolls(prev => {
                                  const newRolls = { ...prev };
                                  assignedAttributes.forEach(attr => {
                                    delete newRolls[attr];
                                  });
                                  return newRolls;
                                });
                                
                                // Clear all existing sets and roll 9 new values
                                const newSets = Array.from({ length: 9 }, () => {
                                  const rolls = rollT6Multiple(3);
                                  const total = rolls.reduce((a, b) => a + b, 0);
                                  return {
                                    id: Date.now() + Math.random(),
                                    rolls,
                                    total,
                                    assignedTo: null
                                  };
                                });
                                setAnpassadSets(newSets.sort((a, b) => b.total - a.total));
                                setSelectedAnpassadSet(null);
                              }}
                            >
                              Rulla alla
                            </Button>
                          </Box>
                          {anpassadSets.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              Klicka på &quot;Rulla alla&quot; för att skapa värden som kan tilldelas attribut.
                            </Typography>
                          ) : (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {anpassadSets.map(set => {
                                const isAssigned = set.assignedTo !== null;
                                const isSelected = selectedAnpassadSet?.assignedTo === set.assignedTo;
                                return (
                                  <Chip
                                    key={set.id}
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData('application/json', JSON.stringify({ setId: set.id }));
                                      e.dataTransfer.effectAllowed = 'move';
                                    }}
                                    label={
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                          {set.rolls.map((roll, idx) => (
                                            <Box
                                              key={idx}
                                              sx={{
                                                width: 20,
                                                height: 20,
                                                borderRadius: 0.5,
                                                bgcolor: 'primary.main',
                                                color: 'primary.contrastText',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 'bold',
                                                fontSize: '0.7rem',
                                                boxShadow: 1
                                              }}
                                            >
                                              {roll}
                                            </Box>
                                          ))}
                                        </Box>
                                        <Typography variant="body2" sx={{ ml: 0.5, fontWeight: 'bold' }}>
                                          = {set.total}
                                        </Typography>
                                      </Box>
                                    }
                                    onClick={() => {
                                      if (isAssigned) {
                                        // Unassign
                                        setAnpassadSets(prev => prev.map(s => 
                                          s.id === set.id ? { ...s, assignedTo: null } : s
                                        ));
                                        setAttributes(prev => {
                                          const newAttrs = { ...prev };
                                          delete newAttrs[set.assignedTo];
                                          return newAttrs;
                                        });
                                        setAttributeRolls(prev => {
                                          const newRolls = { ...prev };
                                          delete newRolls[set.assignedTo];
                                          return newRolls;
                                        });
                                        if (selectedAnpassadSet?.assignedTo === set.assignedTo) {
                                          setSelectedAnpassadSet(null);
                                        }
                                      } else if (selectedAnpassadSet?.assignedTo) {
                                        // Assign to selected attribute
                                        const attr = selectedAnpassadSet.assignedTo;
                                        // Unassign from previous set if any
                                        setAnpassadSets(prev => prev.map(s => 
                                          s.assignedTo === attr ? { ...s, assignedTo: null } : s
                                        ));
                                        // Assign to this set
                                        setAnpassadSets(prev => prev.map(s => 
                                          s.id === set.id ? { ...s, assignedTo: attr } : s
                                        ));
                                        setAttributes(prev => ({ ...prev, [attr]: set.total }));
                                        setAttributeRolls(prev => ({ ...prev, [attr]: set.rolls }));
                                        setSelectedAnpassadSet(null);
                                      }
                                    }}
                                    color={isAssigned ? 'success' : isSelected ? 'primary' : 'default'}
                                    variant={isAssigned ? 'filled' : isSelected ? 'filled' : 'outlined'}
                                    sx={{ 
                                      cursor: isAssigned || selectedAnpassadSet?.assignedTo ? 'pointer' : 'grab',
                                      opacity: isAssigned && !isSelected ? 0.7 : 1,
                                      '&:active': {
                                        cursor: 'grabbing'
                                      }
                                    }}
                                    onDelete={isAssigned ? undefined : () => {
                                      setAnpassadSets(prev => prev.filter(s => s.id !== set.id));
                                    }}
                                    title={isAssigned ? `Tilldelad till ${set.assignedTo}` : selectedAnpassadSet?.assignedTo ? `Klicka för att tilldela till ${selectedAnpassadSet.assignedTo}` : 'Välj ett attribut först'}
                                  />
                                );
                              })}
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Box>
                  )}
                </TabPanel>

                <TabPanel value={activeTab} index={2}>
                  {characteristicsLoading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                      <Typography>Laddar...</Typography>
                    </Box>
                  ) : (
                    <>
                      <Alert severity="info" sx={{ mb: 3 }}>
                        Rykte är satt till 5 och Tur är satt till 11. Du kan slå de andra värdena med 3T6 (3-18) eller ange dem manuellt. 
                        Vid värde ≥14 kan du ange en hög specialisering och vid värde ≤7 kan du ange en låg specialisering. Klicka på ett exempel för att fylla i textfältet.
                      </Alert>

                      <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 12 }}>
                          <Grid container spacing={2}>
                            {/* First column of characteristics */}
                            <Grid size={{ xs: 12, md: 6 }}>
                              <TableContainer component={Paper} variant="outlined">
                                <Table>
                                  <TableHead>
                                    <TableRow>
                                      <TableCell><strong>Karaktärsdrag</strong></TableCell>
                                      <TableCell align="right"><strong>Värde</strong></TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {CHARACTERISTICS.slice(0, Math.ceil(CHARACTERISTICS.length / 2)).map(char => {
                                      const value = getCharacteristicValue(char.key);
                                      const isFixed = char.fixed;
                                      const description = characteristicsData?.descriptions?.[char.key] || '';
                                      const showHighSpec = hasHighSpecialization(char.key);
                                      const showLowSpec = hasLowSpecialization(char.key);
                                      const highExamples = characteristicsData?.highSpecializationExamples?.[char.key] || [];
                                      const lowExamples = characteristicsData?.lowSpecializationExamples?.[char.key] || [];
                                      
                                      const highCharacteristics = selectedRace?.metadata?.highCharacteristics || [];
                                      const lowCharacteristics = selectedRace?.metadata?.lowCharacteristics || [];
                                      const isHighRecommended = highCharacteristics.some(rec => matchesCharacteristic(char.key, rec));
                                      const isLowRecommended = lowCharacteristics.some(rec => matchesCharacteristic(char.key, rec));

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
                                          onValueChange={handleCharacteristicValueChange}
                                          onRoll={handleRollCharacteristic}
                                          onSpecializationChange={(key, val) => {
                                            setSpecializations(prev => {
                                              const newSpecs = { ...prev };
                                              if (val) {
                                                newSpecs[key] = val;
                                              } else {
                                                delete newSpecs[key];
                                              }
                                              return newSpecs;
                                            });
                                          }}
                                          rolls={characteristicRolls[char.key]}
                                        />
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Grid>
                            
                            {/* Second column of characteristics */}
                            <Grid size={{ xs: 12, md: 6 }}>
                              <TableContainer component={Paper} variant="outlined">
                                <Table>
                                  <TableHead>
                                    <TableRow>
                                      <TableCell><strong>Karaktärsdrag</strong></TableCell>
                                      <TableCell align="right"><strong>Värde</strong></TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {CHARACTERISTICS.slice(Math.ceil(CHARACTERISTICS.length / 2)).map(char => {
                                      const value = getCharacteristicValue(char.key);
                                      const isFixed = char.fixed;
                                      const description = characteristicsData?.descriptions?.[char.key] || '';
                                      const showHighSpec = hasHighSpecialization(char.key);
                                      const showLowSpec = hasLowSpecialization(char.key);
                                      const highExamples = characteristicsData?.highSpecializationExamples?.[char.key] || [];
                                      const lowExamples = characteristicsData?.lowSpecializationExamples?.[char.key] || [];
                                      
                                      const highCharacteristics = selectedRace?.metadata?.highCharacteristics || [];
                                      const lowCharacteristics = selectedRace?.metadata?.lowCharacteristics || [];
                                      const isHighRecommended = highCharacteristics.some(rec => matchesCharacteristic(char.key, rec));
                                      const isLowRecommended = lowCharacteristics.some(rec => matchesCharacteristic(char.key, rec));

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
                                          onValueChange={handleCharacteristicValueChange}
                                          onRoll={handleRollCharacteristic}
                                          onSpecializationChange={(key, val) => {
                                            setSpecializations(prev => {
                                              const newSpecs = { ...prev };
                                              if (val) {
                                                newSpecs[key] = val;
                                              } else {
                                                delete newSpecs[key];
                                              }
                                              return newSpecs;
                                            });
                                          }}
                                          rolls={characteristicRolls[char.key]}
                                        />
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Grid>
                          </Grid>
                        </Grid>
                      </Grid>
                    </>
                  )}
                </TabPanel>

                <TabPanel value={activeTab} index={3}>
                  <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="h6">Yrkesfärdigheter</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      {professionalSkills.map((skill, index) => (
                        <Box key={index} mb={2} p={2} border={1} borderColor="divider" borderRadius={1}>
                          <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, sm: 4 }}>
                              <TextField
                                label="Namn"
                                fullWidth
                                size="small"
                                value={skill.name}
                                onChange={(e) => updateSkill('professional', index, 'name', e.target.value)}
                                disabled={creating}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 3 }}>
                              <TextField
                                label="Nivå"
                                type="number"
                                fullWidth
                                size="small"
                                value={skill.level}
                                onChange={(e) => updateSkill('professional', index, 'level', parseInt(e.target.value) || 10)}
                                disabled={creating}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                              <TextField
                                label="Specialisering"
                                fullWidth
                                size="small"
                                value={skill.specialization}
                                onChange={(e) => updateSkill('professional', index, 'specialization', e.target.value)}
                                disabled={creating}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 1 }}>
                              <IconButton
                                color="error"
                                onClick={() => removeSkill('professional', index)}
                                disabled={creating}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Grid>
                          </Grid>
                        </Box>
                      ))}
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => addSkill('professional')}
                        disabled={creating}
                        sx={{ mt: 2 }}
                      >
                        Lägg till yrkesfärdighet
                      </Button>
                    </AccordionDetails>
                  </Accordion>

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="h6">Övriga färdigheter</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      {otherSkills.map((skill, index) => (
                        <Box key={index} mb={2} p={2} border={1} borderColor="divider" borderRadius={1}>
                          <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, sm: 4 }}>
                              <TextField
                                label="Namn"
                                fullWidth
                                size="small"
                                value={skill.name}
                                onChange={(e) => updateSkill('other', index, 'name', e.target.value)}
                                disabled={creating}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 3 }}>
                              <TextField
                                label="Nivå"
                                type="number"
                                fullWidth
                                size="small"
                                value={skill.level}
                                onChange={(e) => updateSkill('other', index, 'level', parseInt(e.target.value) || 10)}
                                disabled={creating}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                              <TextField
                                label="Specialisering"
                                fullWidth
                                size="small"
                                value={skill.specialization}
                                onChange={(e) => updateSkill('other', index, 'specialization', e.target.value)}
                                disabled={creating}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 1 }}>
                              <IconButton
                                color="error"
                                onClick={() => removeSkill('other', index)}
                                disabled={creating}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Grid>
                          </Grid>
              </Box>
                      ))}
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => addSkill('other')}
                        disabled={creating}
                        sx={{ mt: 2 }}
                      >
                        Lägg till färdighet
                      </Button>
                    </AccordionDetails>
                  </Accordion>

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="h6">Språk</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      {languages.map((lang, index) => (
                        <Box key={index} mb={2} p={2} border={1} borderColor="divider" borderRadius={1}>
                          <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
                                label="Språk"
              fullWidth
                                size="small"
                                value={lang.name}
                                onChange={(e) => updateLanguage(index, 'name', e.target.value)}
                                disabled={creating}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 5 }}>
                              <TextField
                                label="Nivå"
                                type="number"
                                fullWidth
                                size="small"
                                value={lang.level}
                                onChange={(e) => updateLanguage(index, 'level', parseInt(e.target.value) || 10)}
                                disabled={creating}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 1 }}>
                              <IconButton
                                color="error"
                                onClick={() => removeLanguage(index)}
                                disabled={creating}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Grid>
                          </Grid>
                        </Box>
                      ))}
                      <Button
              variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={addLanguage}
              disabled={creating}
                        sx={{ mt: 2 }}
                      >
                        Lägg till språk
                      </Button>
                    </AccordionDetails>
                  </Accordion>
                </TabPanel>

                <TabPanel value={activeTab} index={4}>
                  {connections.map((conn, index) => (
                    <Box key={index} mb={2} p={2} border={1} borderColor="divider" borderRadius={1}>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            label="ID"
                            fullWidth
                            size="small"
                            value={conn.id}
                            onChange={(e) => updateConnection(index, 'id', e.target.value)}
                            disabled={creating}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
                            label="Relation"
              fullWidth
                            size="small"
                            value={conn.relationship}
                            onChange={(e) => updateConnection(index, 'relationship', e.target.value)}
                            disabled={creating}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 3 }}>
                          <TextField
                            label="Beskrivning"
                            fullWidth
                            size="small"
                            value={conn.description}
                            onChange={(e) => updateConnection(index, 'description', e.target.value)}
                            disabled={creating}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 1 }}>
                          <IconButton
                            color="error"
                            onClick={() => removeConnection(index)}
                            disabled={creating}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                  <Button
              variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={addConnection}
                    disabled={creating}
                    sx={{ mt: 2 }}
                  >
                    Lägg till koppling
                  </Button>
                </TabPanel>

                <TabPanel value={activeTab} index={5}>
                  <TextField
                    label="Biografi"
                    fullWidth
              multiline
                    rows={10}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
              disabled={creating}
            />
                </TabPanel>
              </Box>

              {/* Divider (only on desktop) */}
              {!isMobile && (
                <Divider orientation="vertical" flexItem />
              )}

              {/* Right side: Guide (25% width on desktop) */}
              <Box
                sx={{
                  width: { xs: '100%', md: '25%' },
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Guide
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Stegvis guide för karaktärsskapande.
                </Typography>

                <Stack spacing={1}>
                  {/* Step 1: Race Selection */}
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      cursor: 'pointer',
                      opacity: selectedRace ? 1 : 0.7,
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => {
                      setShowRaceSelectionDialog(true);
                      setActiveTab(0);
                    }}
                  >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Steg 1
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'medium', mt: 0.5 }}>
                        Välj ras
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {selectedRace ? selectedRace.name : 'Ej vald'}
                      </Typography>
                    </CardContent>
                  </Card>

                  {/* Step 2: Attributes */}
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => setActiveTab(1)}
                  >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Steg 2
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'medium', mt: 0.5 }}>
                        Attribut
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {(() => {
                          const allAttributes = ['STY', 'TÅL', 'RÖR', 'PER', 'PSY', 'VIL', 'BIL', 'SYN', 'HÖR'];
                          const setCount = allAttributes.filter(attr => {
                            const value = attributes[attr];
                            return value !== undefined && value !== null;
                          }).length;
                          return setCount > 0 ? `${setCount}/9 angivna` : 'Ej angivna';
                        })()}
                      </Typography>
                    </CardContent>
                  </Card>

                  {/* Step 3: Age & Body - Enabled when attributes are set */}
                  {(() => {
                    const allAttributes = ['STY', 'TÅL', 'RÖR', 'PER', 'PSY', 'VIL', 'BIL', 'SYN', 'HÖR'];
                    const attributesSet = allAttributes.some(attr => {
                      const value = attributes[attr];
                      return value !== undefined && value !== null && value !== 10;
                    });
                    const isEnabled = attributesSet;
                    
                    return (
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          cursor: isEnabled ? 'pointer' : 'not-allowed',
                          opacity: isEnabled ? 1 : 0.5,
                          '&:hover': isEnabled ? { bgcolor: 'action.hover' } : {}
                        }}
                        onClick={() => {
                          if (isEnabled) {
                            setShowAgeCalculationDialog(true);
                            setActiveTab(0);
                          }
                        }}
                      >
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            Steg 3 {!isEnabled && '(Låst)'}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'medium', mt: 0.5 }}>
                            Ålder & fysik
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {ageData?.age ? `Ålder: ${ageData.age}` : 'Ej angivet'}
                          </Typography>
                        </CardContent>
                      </Card>
                    );
                  })()}

                  {/* Step 4: Characteristics */}
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      cursor: selectedRace ? 'pointer' : 'not-allowed',
                      opacity: selectedRace ? 1 : 0.5,
                      '&:hover': selectedRace ? { bgcolor: 'action.hover' } : {}
                    }}
                    onClick={() => {
                      if (selectedRace) {
                        setActiveTab(2);
                      }
                    }}
                  >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Steg 4 {!selectedRace && '(Låst)'}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'medium', mt: 0.5 }}>
                        Karaktärsdrag
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {characteristics.Lojalitet !== 10 ? 'Angivna' : 'Ej angivna'}
                      </Typography>
                    </CardContent>
                  </Card>

                  {/* Step 5: Background */}
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      cursor: ageData ? 'pointer' : 'not-allowed',
                      opacity: ageData ? 1 : 0.5,
                      '&:hover': ageData ? { bgcolor: 'action.hover' } : {}
                    }}
                    onClick={() => {
                      if (ageData) {
                        setShowBirthDialog(true);
                        setActiveTab(0);
                      }
                    }}
                  >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Steg 5 {!ageData && '(Låst)'}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'medium', mt: 0.5 }}>
                        Bakgrund
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {backgroundData ? 'Angiven' : 'Ej angiven'}
                      </Typography>
                    </CardContent>
                  </Card>

                  {/* Step 6: Family - Enabled when age & body are done */}
                  {(() => {
                    const ageAndBodyDone = ageData && ageData.age && ageData.length;
                    const isEnabled = ageAndBodyDone;
                    
                    return (
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          cursor: isEnabled ? 'pointer' : 'not-allowed',
                          opacity: isEnabled ? 1 : 0.5,
                          '&:hover': isEnabled ? { bgcolor: 'action.hover' } : {}
                        }}
                        onClick={() => {
                          if (isEnabled) {
                            setShowFamilyDialog(true);
                            setActiveTab(0);
                          }
                        }}
                      >
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            Steg 6 {!isEnabled && '(Låst)'}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'medium', mt: 0.5 }}>
                            Familj
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {familyData ? 'Angiven' : 'Ej angiven'}
                          </Typography>
                        </CardContent>
                      </Card>
                    );
                  })()}
                </Stack>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancel} disabled={creating}>
              Avbryt
            </Button>
            <Button type="submit" variant="contained" disabled={creating || !characterName.trim()}>
              {creating ? 'Skapar...' : 'Skapa karaktär'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Optional tool dialogs */}
      <Dialog open={showRaceSelectionDialog} onClose={() => setShowRaceSelectionDialog(false)} maxWidth="xl" fullWidth>
        <RaceSelectionDialog
          onClose={() => setShowRaceSelectionDialog(false)}
          worldId={worldId}
          onRaceSelected={handleRaceSelected}
          initialRaceId={selectedRace?.id || selectedRace?._id}
        />
      </Dialog>

      <Dialog open={showAgeCalculationDialog} onClose={() => setShowAgeCalculationDialog(false)} maxWidth="md" fullWidth>
        <AgeCalculationDialog
          onClose={() => setShowAgeCalculationDialog(false)}
          onConfirm={handleAgeCalculated}
          attributes={attributes}
          rerolls={0}
          selectedRace={selectedRace}
          raceCategory={raceCategory}
          gender={gender || 'man'}
          varierandeVikt={world?.settings?.varierandeVikt !== undefined ? world?.settings?.varierandeVikt : true}
          savedState={ageCalculationDialogState?.ageCalculationState || null}
          onStateChange={(state) => setAgeCalculationDialogState(state)}
        />
      </Dialog>


      <Dialog open={showBirthDialog} onClose={() => setShowBirthDialog(false)} maxWidth="lg" fullWidth>
        <BirthDialog
          onClose={() => setShowBirthDialog(false)}
          onConfirm={handleBackgroundConfirmed}
          worldSettings={world?.settings || {}}
          ageData={ageData}
          savedState={birthDialogState?.birthState || null}
          onStateChange={(state) => setBirthDialogState(state)}
        />
      </Dialog>

      <Dialog open={showFamilyDialog} onClose={() => setShowFamilyDialog(false)} maxWidth="lg" fullWidth>
        <FamilyDialog
          onClose={() => setShowFamilyDialog(false)}
          onConfirm={handleFamilyConfirmed}
          ageData={ageData}
          selectedRace={selectedRace}
          raceCategory={raceCategory}
          rerolls={0}
          freeSelections={world?.settings?.freeSelections || 0}
          savedState={familyDialogState?.familyState || null}
          onStateChange={(state) => setFamilyDialogState(state)}
        />
    </Dialog>
    </>
  );
}

CharacterCreationDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  worldId: PropTypes.string.isRequired,
  world: PropTypes.object,
  token: PropTypes.string.isRequired,
  onConfirm: PropTypes.func
};
