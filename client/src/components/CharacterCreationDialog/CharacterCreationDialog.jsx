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
  CardActions,
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
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CasinoIcon from '@mui/icons-material/Casino';
import RaceSelectionDialog from './RaceSelectionDialog';
import AgeCalculationDialog from './AgeCalculationDialog';
import CharacteristicsDialog from './CharacteristicsDialog';
import BirthDialog from './BirthDialog';
import FamilyDialog from './FamilyDialog';
import DiceRollDisplay from '../DiceRollDisplay';
import { rollT6Multiple } from '../../utils/dice';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function CharacterCreationDialog({ 
  open,
  onClose,
  worldId,
  world,
  token,
  onConfirm
}) {
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
  
  const [attributes, setAttributes] = useState({
    STY: 10,
    TÅL: 10,
    RÖR: 10,
    PER: 10,
    PSY: 10,
    VIL: 10,
    BIL: 10,
    SYN: 10,
    HÖR: 10
  });
  
  // Store dice rolls for each attribute
  const [attributeRolls, setAttributeRolls] = useState({});
  
  // For anpassad method: store rolled sets and their assignments
  const [anpassadSets, setAnpassadSets] = useState([]);
  const [selectedAnpassadSet, setSelectedAnpassadSet] = useState(null);
  const [dragOverAttribute, setDragOverAttribute] = useState(null);
  
  const [characteristics, setCharacteristics] = useState({
    Lojalitet: 10,
    Heder: 10,
    Amor: 10,
    Aggression: 10,
    Tro: 10,
    Generositet: 10,
    Rykte: 10,
    Tur: 10,
    Qadosh: 10
  });
  
  // Store dice rolls for each characteristic
  const [characteristicRolls, setCharacteristicRolls] = useState({});
  
  const [specializations, setSpecializations] = useState({});
  const [professionalSkills, setProfessionalSkills] = useState([]);
  const [otherSkills, setOtherSkills] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [connections, setConnections] = useState([]);
  const [bio, setBio] = useState('');
  
  // Optional tool dialogs
  const [showRaceSelectionDialog, setShowRaceSelectionDialog] = useState(false);
  const [showAgeCalculationDialog, setShowAgeCalculationDialog] = useState(false);
  const [showCharacteristicsDialog, setShowCharacteristicsDialog] = useState(false);
  const [showBirthDialog, setShowBirthDialog] = useState(false);
  const [showFamilyDialog, setShowFamilyDialog] = useState(false);

  // Data collected from optional tools
  const [selectedRace, setSelectedRace] = useState(null);
  const [ageData, setAgeData] = useState(null);
  const [backgroundData, setBackgroundData] = useState(null);
  const [familyData, setFamilyData] = useState(null);
  const [raceCategory, setRaceCategory] = useState(null);
  const [gender, setGender] = useState('');

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
    
    // Update default attributes (10) to include race modifiers
    if (race?.modifiers) {
      const modifiers = race.modifiers instanceof Map 
        ? Object.fromEntries(race.modifiers)
        : race.modifiers;
      
      setAttributes(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(attr => {
          // Only update if still at default value of 10
          if (prev[attr] === 10) {
            const modifier = modifiers[attr] || 0;
            updated[attr] = 10 + modifier;
          }
        });
        return updated;
      });
    }
  };
  
  // Update attributes when race changes (if attributes are still at defaults)
  useEffect(() => {
    if (selectedRace?.modifiers) {
      const modifiers = selectedRace.modifiers instanceof Map 
        ? Object.fromEntries(selectedRace.modifiers)
        : selectedRace.modifiers;
      
      setAttributes(prev => {
        const updated = { ...prev };
        let hasChanges = false;
        Object.keys(updated).forEach(attr => {
          // Only update if still at default value of 10
          if (prev[attr] === 10) {
            const modifier = modifiers[attr] || 0;
            const newValue = 10 + modifier;
            if (newValue !== prev[attr]) {
              updated[attr] = newValue;
              hasChanges = true;
            }
          }
        });
        return hasChanges ? updated : prev;
      });
    }
  }, [selectedRace]);

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
  
  const handleRollCharacteristic = (char) => {
    const rolls = rollT6Multiple(3);
    const total = rolls.reduce((a, b) => a + b, 0);
    setCharacteristics(prev => ({ ...prev, [char]: total }));
    setCharacteristicRolls(prev => ({ ...prev, [char]: rolls }));
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

  const handleCharacteristicsConfirmed = (characteristicsResult) => {
    // Automatically transfer characteristics to form
    if (characteristicsResult?.characteristics) {
      setCharacteristics(characteristicsResult.characteristics);
    }
    if (characteristicsResult?.specializations) {
      setSpecializations(characteristicsResult.specializations);
    }
    setShowCharacteristicsDialog(false);
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
          const modifier = modifiers[attr] || 0;
          finalAttributes[attr] = (finalAttributes[attr] || 10) + modifier;
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
        if (onConfirm) {
          onConfirm(data.character);
        }
        // Reset form
        handleClose();
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
    // Reset form when closing
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
    setAttributes({
      STY: 10,
      TÅL: 10,
      RÖR: 10,
      PER: 10,
      PSY: 10,
      VIL: 10,
      BIL: 10,
      SYN: 10,
      HÖR: 10
    });
    setCharacteristics({
      Lojalitet: 10,
      Heder: 10,
      Amor: 10,
      Aggression: 10,
      Tro: 10,
      Generositet: 10,
      Rykte: 10,
      Tur: 10,
      Qadosh: 10
    });
    setSpecializations({});
    setProfessionalSkills([]);
    setOtherSkills([]);
    setLanguages([]);
    setConnections([]);
    setBio('');
    setAttributeRolls({});
    setCharacteristicRolls({});
    setSelectedRace(null);
    setAgeData(null);
    setBackgroundData(null);
    setFamilyData(null);
    setRaceCategory(null);
    setGender('');
    setActiveTab(0);
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
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        margin="dense"
                        label="Ras"
                        fullWidth
                        value={selectedRace?.name || ''}
                        InputProps={{ readOnly: true }}
                        helperText={selectedRace ? 'Använd verktyget för att ändra' : 'Använd verktyget för att välja'}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        margin="dense"
                        label="Kön"
                        fullWidth
                        value={gender || ageData?.gender || ''}
                        onChange={(e) => setGender(e.target.value)}
                        disabled={creating}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
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
                    <Grid item xs={12} sm={6}>
                      <TextField
                        margin="dense"
                        label="Yrke"
                        fullWidth
                        value={basics.profession}
                        onChange={(e) => setBasics(prev => ({ ...prev, profession: e.target.value }))}
                        disabled={creating}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
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
                    <Grid item xs={12} sm={6}>
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
                    <Grid item xs={12} sm={6}>
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
                    <Grid item xs={12} sm={6}>
                      <TextField
                        margin="dense"
                        label="Hår"
                        fullWidth
                        value={basics.hair}
                        onChange={(e) => setBasics(prev => ({ ...prev, hair: e.target.value }))}
                        disabled={creating}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        margin="dense"
                        label="Ögon"
                        fullWidth
                        value={basics.eyes}
                        onChange={(e) => setBasics(prev => ({ ...prev, eyes: e.target.value }))}
                        disabled={creating}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        margin="dense"
                        label="Hud"
                        fullWidth
                        value={basics.skin}
                        onChange={(e) => setBasics(prev => ({ ...prev, skin: e.target.value }))}
                        disabled={creating}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        margin="dense"
                        label="Hem"
                        fullWidth
                        value={basics.home}
                        onChange={(e) => setBasics(prev => ({ ...prev, home: e.target.value }))}
                        disabled={creating}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
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
                      : 'Klicka på tärningsikonen för att rulla attribut, eller ange manuellt.'}
                  </Alert>
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
                      
                      // Get base value from state (defaults to 10 if not set)
                      const storedValue = attributes[attr];
                      const baseValue = storedValue !== undefined && storedValue !== null ? storedValue : 10;
                      
                      // If base is 10 (default) and we have modifiers, show 10 + modifier in the field
                      // Otherwise show the base value
                      const displayValue = (baseValue === 10 && raceModifier !== 0) ? 10 + raceModifier : baseValue;
                      const finalValue = baseValue + raceModifier;

  return (
                        <Grid item xs={12} sm={6} md={4} key={attr}>
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
                                      setAttributes(prev => ({ ...prev, [draggedSet.assignedTo]: 10 }));
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
                                  const newValue = parseInt(e.target.value) || 10;
                                  // If we were showing 10 + modifier and user changes it, store base value
                                  // Subtract the modifier to get the actual base
                                  const baseToStore = (baseValue === 10 && raceModifier !== 0) 
                                    ? newValue - raceModifier 
                                    : newValue;
                                  setAttributes(prev => ({ ...prev, [attr]: baseToStore }));
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
                                      setAttributes(prev => ({ ...prev, [attr]: 10 }));
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
                              Klicka på "Rulla alla" för att skapa värden som kan tilldelas attribut.
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
                                        setAttributes(prev => ({ ...prev, [set.assignedTo]: 10 }));
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
          <Alert severity="info" sx={{ mb: 2 }}>
                    Klicka på tärningsikonen för att rulla karaktärsdrag, eller ange manuellt.
          </Alert>
                  <Grid container spacing={2}>
                    {['Lojalitet', 'Heder', 'Amor', 'Aggression', 'Tro', 'Generositet', 'Rykte', 'Tur', 'Qadosh'].map(char => (
                      <Grid item xs={12} sm={6} key={char}>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <TextField
                              label={char}
                              type="number"
                              fullWidth
                              value={characteristics[char] || 10}
                              onChange={(e) => setCharacteristics(prev => ({ ...prev, [char]: parseInt(e.target.value) || 10 }))}
                              disabled={creating}
                            />
                            <IconButton
                              onClick={() => handleRollCharacteristic(char)}
                              disabled={creating}
                              color="primary"
                              sx={{ minWidth: 40 }}
                            >
                              <CasinoIcon />
                            </IconButton>
                          </Box>
                          {characteristicRolls[char] && (
                            <Box sx={{ mb: 1, ml: 1 }}>
                              <DiceRollDisplay 
                                rolls={characteristicRolls[char]} 
                                diceType="T6" 
                                size="small"
                              />
                            </Box>
                          )}
                          {specializations[char] && (
                            <TextField
                              label="Specialisering"
                              fullWidth
                              size="small"
                              value={specializations[char]}
                              onChange={(e) => {
                                const newSpecs = { ...specializations };
                                if (e.target.value) {
                                  newSpecs[char] = e.target.value;
                                } else {
                                  delete newSpecs[char];
                                }
                                setSpecializations(newSpecs);
                              }}
                              disabled={creating}
                            />
                          )}
                          {!specializations[char] && (
                            <Button
                              size="small"
                              onClick={() => setSpecializations(prev => ({ ...prev, [char]: '' }))}
                              disabled={creating}
                            >
                              Lägg till specialisering
                            </Button>
                          )}
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
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
                            <Grid item xs={12} sm={4}>
                              <TextField
                                label="Namn"
                                fullWidth
                                size="small"
                                value={skill.name}
                                onChange={(e) => updateSkill('professional', index, 'name', e.target.value)}
                                disabled={creating}
                              />
                            </Grid>
                            <Grid item xs={12} sm={3}>
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
                            <Grid item xs={12} sm={4}>
                              <TextField
                                label="Specialisering"
                                fullWidth
                                size="small"
                                value={skill.specialization}
                                onChange={(e) => updateSkill('professional', index, 'specialization', e.target.value)}
                                disabled={creating}
                              />
                            </Grid>
                            <Grid item xs={12} sm={1}>
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
                            <Grid item xs={12} sm={4}>
                              <TextField
                                label="Namn"
                                fullWidth
                                size="small"
                                value={skill.name}
                                onChange={(e) => updateSkill('other', index, 'name', e.target.value)}
                                disabled={creating}
                              />
                            </Grid>
                            <Grid item xs={12} sm={3}>
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
                            <Grid item xs={12} sm={4}>
                              <TextField
                                label="Specialisering"
                                fullWidth
                                size="small"
                                value={skill.specialization}
                                onChange={(e) => updateSkill('other', index, 'specialization', e.target.value)}
                                disabled={creating}
                              />
                            </Grid>
                            <Grid item xs={12} sm={1}>
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
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Språk"
                                fullWidth
                                size="small"
                                value={lang.name}
                                onChange={(e) => updateLanguage(index, 'name', e.target.value)}
                                disabled={creating}
                              />
                            </Grid>
                            <Grid item xs={12} sm={5}>
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
                            <Grid item xs={12} sm={1}>
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
                        <Grid item xs={12} sm={4}>
                          <TextField
                            label="ID"
                            fullWidth
                            size="small"
                            value={conn.id}
                            onChange={(e) => updateConnection(index, 'id', e.target.value)}
                            disabled={creating}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            label="Relation"
                            fullWidth
                            size="small"
                            value={conn.relationship}
                            onChange={(e) => updateConnection(index, 'relationship', e.target.value)}
                            disabled={creating}
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            label="Beskrivning"
                            fullWidth
                            size="small"
                            value={conn.description}
                            onChange={(e) => updateConnection(index, 'description', e.target.value)}
                            disabled={creating}
                          />
                        </Grid>
                        <Grid item xs={12} sm={1}>
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

              {/* Right side: Tools (25% width on desktop) */}
              <Box
                sx={{
                  width: { xs: '100%', md: '25%' },
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Verktyg
          </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Använd dessa verktyg för att automatiskt fylla i formuläret.
                </Typography>

                <Stack spacing={2}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Välj ras
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {selectedRace ? selectedRace.name : 'Ej vald'}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        onClick={() => setShowRaceSelectionDialog(true)}
                        disabled={creating}
                        fullWidth
                      >
                        {selectedRace ? 'Ändra' : 'Välj'}
                      </Button>
                    </CardActions>
                  </Card>

                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Ålder & fysik
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {ageData?.age ? `Ålder: ${ageData.age}` : 'Ej angivet'}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        onClick={() => setShowAgeCalculationDialog(true)}
                        disabled={creating || !attributes || attributes.STY === 10}
                        fullWidth
                      >
                        Öppna
                      </Button>
                    </CardActions>
                  </Card>

                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Karaktärsdrag
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {characteristics.Lojalitet !== 10 ? 'Angivna' : 'Ej angivna'}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        onClick={() => setShowCharacteristicsDialog(true)}
                        disabled={creating || !selectedRace}
                        fullWidth
                      >
                        Öppna
                      </Button>
                    </CardActions>
                  </Card>

                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Bakgrund
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {backgroundData ? 'Angiven' : 'Ej angiven'}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        onClick={() => setShowBirthDialog(true)}
                        disabled={creating || !ageData}
                        fullWidth
                      >
                        Öppna
                      </Button>
                    </CardActions>
                  </Card>

                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Familj
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {familyData ? 'Angiven' : 'Ej angiven'}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        onClick={() => setShowFamilyDialog(true)}
                        disabled={creating || !backgroundData}
                        fullWidth
                      >
                        Öppna
                      </Button>
                    </CardActions>
                  </Card>
                </Stack>
              </Box>
            </Box>
        </DialogContent>
        <DialogActions>
            <Button onClick={handleClose} disabled={creating}>
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
        />
      </Dialog>

      <Dialog open={showCharacteristicsDialog} onClose={() => setShowCharacteristicsDialog(false)} maxWidth="md" fullWidth>
        <CharacteristicsDialog
          onClose={() => setShowCharacteristicsDialog(false)}
          onConfirm={handleCharacteristicsConfirmed}
          selectedRace={selectedRace}
        />
      </Dialog>

      <Dialog open={showBirthDialog} onClose={() => setShowBirthDialog(false)} maxWidth="md" fullWidth>
        <BirthDialog
          onClose={() => setShowBirthDialog(false)}
          onConfirm={handleBackgroundConfirmed}
          worldSettings={world?.settings || {}}
          ageData={ageData}
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
