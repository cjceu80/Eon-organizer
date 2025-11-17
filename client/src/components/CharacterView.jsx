import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`character-tabpanel-${index}`}
      aria-labelledby={`character-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function CharacterView() {
  const { characterId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCharacter, setEditedCharacter] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCharacter();
  }, [characterId, token]);

  const fetchCharacter = async () => {
    if (!token || !characterId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/characters/${characterId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCharacter(data.character);
        setEditedCharacter(JSON.parse(JSON.stringify(data.character))); // Deep copy
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Misslyckades att ladda karaktär');
      }
    } catch (err) {
      console.error('Error fetching character:', err);
      setError('Misslyckades att ladda karaktär');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedCharacter) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/characters/${characterId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editedCharacter)
      });

      if (response.ok) {
        const data = await response.json();
        setCharacter(data.character);
        setEditedCharacter(JSON.parse(JSON.stringify(data.character)));
        setIsEditing(false);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Misslyckades att spara karaktär');
      }
    } catch (err) {
      console.error('Error saving character:', err);
      alert('Misslyckades att spara karaktär');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedCharacter(JSON.parse(JSON.stringify(character)));
    setIsEditing(false);
  };

  const updateField = (path, value) => {
    setEditedCharacter(prev => {
      const newChar = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let current = newChar;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newChar;
    });
  };

  const updateArrayField = (field, index, value) => {
    setEditedCharacter(prev => {
      const newChar = JSON.parse(JSON.stringify(prev));
      if (!newChar[field]) newChar[field] = [];
      newChar[field][index] = value;
      return newChar;
    });
  };

  const addArrayItem = (field, defaultItem = {}) => {
    setEditedCharacter(prev => {
      const newChar = JSON.parse(JSON.stringify(prev));
      if (!newChar[field]) newChar[field] = [];
      newChar[field].push(defaultItem);
      return newChar;
    });
  };

  const removeArrayItem = (field, index) => {
    setEditedCharacter(prev => {
      const newChar = JSON.parse(JSON.stringify(prev));
      if (newChar[field]) {
        newChar[field].splice(index, 1);
      }
      return newChar;
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !character) {
    return (
      <Box p={3}>
        <Alert severity="error">{error || 'Karaktär hittades inte'}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Tillbaka
        </Button>
      </Box>
    );
  }

  const displayChar = isEditing ? editedCharacter : character;

  return (
    <Box sx={{ py: 4, px: 2 }}>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          variant="outlined"
        >
          Tillbaka
        </Button>
        <Typography variant="h4">{displayChar.name}</Typography>
        {!isEditing ? (
          <IconButton
            onClick={() => setIsEditing(true)}
            color="primary"
            sx={{ ml: 'auto' }}
          >
            <EditIcon />
          </IconButton>
        ) : (
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
            <IconButton
              onClick={handleSave}
              color="primary"
              disabled={saving}
            >
              <SaveIcon />
            </IconButton>
            <IconButton
              onClick={handleCancel}
              disabled={saving}
            >
              <CancelIcon />
            </IconButton>
          </Box>
        )}
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Grundläggande" />
            <Tab label="Attribut" />
            <Tab label="Karaktärsdrag" />
            <Tab label="Färdigheter" />
            <Tab label="Utrustning" />
            <Tab label="Kopplingar" />
            <Tab label="Biografi" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Ålder"
                type="number"
                fullWidth
                value={displayChar.basics?.age || ''}
                onChange={(e) => updateField('basics.age', e.target.value ? parseInt(e.target.value) : null)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Kön"
                fullWidth
                value={displayChar.basics?.gender || ''}
                onChange={(e) => updateField('basics.gender', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Ras"
                fullWidth
                value={displayChar.basics?.race || ''}
                onChange={(e) => updateField('basics.race', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Yrke"
                fullWidth
                value={displayChar.basics?.profession || ''}
                onChange={(e) => updateField('basics.profession', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Längd (cm)"
                type="number"
                fullWidth
                value={displayChar.basics?.height || ''}
                onChange={(e) => updateField('basics.height', e.target.value ? parseInt(e.target.value) : null)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Vikt (kg)"
                type="number"
                fullWidth
                value={displayChar.basics?.weight || ''}
                onChange={(e) => updateField('basics.weight', e.target.value ? parseInt(e.target.value) : null)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Kroppsbyggnad"
                fullWidth
                value={displayChar.basics?.build || ''}
                onChange={(e) => updateField('basics.build', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Hår"
                fullWidth
                value={displayChar.basics?.hair || ''}
                onChange={(e) => updateField('basics.hair', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Ögon"
                fullWidth
                value={displayChar.basics?.eyes || ''}
                onChange={(e) => updateField('basics.eyes', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Hud"
                fullWidth
                value={displayChar.basics?.skin || ''}
                onChange={(e) => updateField('basics.skin', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Hem"
                fullWidth
                value={displayChar.basics?.home || ''}
                onChange={(e) => updateField('basics.home', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Religion"
                fullWidth
                value={displayChar.basics?.religion || ''}
                onChange={(e) => updateField('basics.religion', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={2}>
            {['STY', 'TÅL', 'RÖR', 'PER', 'PSY', 'VIL', 'BIL', 'SYN', 'HÖR'].map(attr => (
              <Grid item xs={6} sm={4} md={3} key={attr}>
                <TextField
                  label={attr}
                  type="number"
                  fullWidth
                  value={displayChar.attributes?.[attr] || 10}
                  onChange={(e) => updateField(`attributes.${attr}`, parseInt(e.target.value) || 10)}
                  disabled={!isEditing}
                />
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={2}>
            {['Lojalitet', 'Heder', 'Amor', 'Aggression', 'Tro', 'Generositet', 'Rykte', 'Tur', 'Qadosh'].map(char => (
              <Grid item xs={12} sm={6} key={char}>
                <Box>
                  <TextField
                    label={char}
                    type="number"
                    fullWidth
                    value={displayChar.characteristics?.[char] || 10}
                    onChange={(e) => updateField(`characteristics.${char}`, parseInt(e.target.value) || 10)}
                    disabled={!isEditing}
                    sx={{ mb: 1 }}
                  />
                  {displayChar.specializations?.[char] && (
                    <TextField
                      label="Specialisering"
                      fullWidth
                      size="small"
                      value={displayChar.specializations[char]}
                      onChange={(e) => {
                        const newSpecs = { ...displayChar.specializations };
                        if (e.target.value) {
                          newSpecs[char] = e.target.value;
                        } else {
                          delete newSpecs[char];
                        }
                        setEditedCharacter(prev => ({ ...prev, specializations: newSpecs }));
                      }}
                      disabled={!isEditing}
                    />
                  )}
                  {isEditing && !displayChar.specializations?.[char] && (
                    <Button
                      size="small"
                      onClick={() => {
                        const newSpecs = { ...displayChar.specializations, [char]: '' };
                        setEditedCharacter(prev => ({ ...prev, specializations: newSpecs }));
                      }}
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
              {(displayChar.professionalSkills || []).map((skill, index) => (
                <Box key={index} mb={2} p={2} border={1} borderColor="divider" borderRadius={1}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Namn"
                        fullWidth
                        value={skill.name || ''}
                        onChange={(e) => updateArrayField('professionalSkills', index, { ...skill, name: e.target.value })}
                        disabled={!isEditing}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        label="Nivå"
                        type="number"
                        fullWidth
                        value={skill.level || 10}
                        onChange={(e) => updateArrayField('professionalSkills', index, { ...skill, level: parseInt(e.target.value) || 10 })}
                        disabled={!isEditing}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Specialisering"
                        fullWidth
                        value={skill.specialization || ''}
                        onChange={(e) => updateArrayField('professionalSkills', index, { ...skill, specialization: e.target.value })}
                        disabled={!isEditing}
                      />
                    </Grid>
                    {isEditing && (
                      <Grid item xs={12} sm={1}>
                        <Button
                          color="error"
                          onClick={() => removeArrayItem('professionalSkills', index)}
                        >
                          Ta bort
                        </Button>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              ))}
              {isEditing && (
                <Button
                  variant="outlined"
                  onClick={() => addArrayItem('professionalSkills', { name: '', level: 10, specialization: '' })}
                  sx={{ mt: 2 }}
                >
                  Lägg till yrkesfärdighet
                </Button>
              )}
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Övriga färdigheter</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {(displayChar.otherSkills || []).map((skill, index) => (
                <Box key={index} mb={2} p={2} border={1} borderColor="divider" borderRadius={1}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Namn"
                        fullWidth
                        value={skill.name || ''}
                        onChange={(e) => updateArrayField('otherSkills', index, { ...skill, name: e.target.value })}
                        disabled={!isEditing}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        label="Nivå"
                        type="number"
                        fullWidth
                        value={skill.level || 10}
                        onChange={(e) => updateArrayField('otherSkills', index, { ...skill, level: parseInt(e.target.value) || 10 })}
                        disabled={!isEditing}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Specialisering"
                        fullWidth
                        value={skill.specialization || ''}
                        onChange={(e) => updateArrayField('otherSkills', index, { ...skill, specialization: e.target.value })}
                        disabled={!isEditing}
                      />
                    </Grid>
                    {isEditing && (
                      <Grid item xs={12} sm={1}>
                        <Button
                          color="error"
                          onClick={() => removeArrayItem('otherSkills', index)}
                        >
                          Ta bort
                        </Button>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              ))}
              {isEditing && (
                <Button
                  variant="outlined"
                  onClick={() => addArrayItem('otherSkills', { name: '', level: 10, specialization: '' })}
                  sx={{ mt: 2 }}
                >
                  Lägg till färdighet
                </Button>
              )}
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Språk</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {(displayChar.languages || []).map((lang, index) => (
                <Box key={index} mb={2} p={2} border={1} borderColor="divider" borderRadius={1}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Språk"
                        fullWidth
                        value={lang.name || ''}
                        onChange={(e) => updateArrayField('languages', index, { ...lang, name: e.target.value })}
                        disabled={!isEditing}
                      />
                    </Grid>
                    <Grid item xs={12} sm={5}>
                      <TextField
                        label="Nivå"
                        type="number"
                        fullWidth
                        value={lang.level || 10}
                        onChange={(e) => updateArrayField('languages', index, { ...lang, level: parseInt(e.target.value) || 10 })}
                        disabled={!isEditing}
                      />
                    </Grid>
                    {isEditing && (
                      <Grid item xs={12} sm={1}>
                        <Button
                          color="error"
                          onClick={() => removeArrayItem('languages', index)}
                        >
                          Ta bort
                        </Button>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              ))}
              {isEditing && (
                <Button
                  variant="outlined"
                  onClick={() => addArrayItem('languages', { name: '', level: 10 })}
                  sx={{ mt: 2 }}
                >
                  Lägg till språk
                </Button>
              )}
            </AccordionDetails>
          </Accordion>
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Utrustning kommer att implementeras här (vapen, rustning, sköldar, inventarie, etc.)
          </Typography>
        </TabPanel>

        <TabPanel value={activeTab} index={5}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Kopplingar kommer att implementeras här
          </Typography>
        </TabPanel>

        <TabPanel value={activeTab} index={6}>
          <TextField
            label="Biografi"
            fullWidth
            multiline
            rows={10}
            value={Array.isArray(displayChar.bio) ? displayChar.bio.join('\n') : (displayChar.bio || '')}
            onChange={(e) => {
              const bioArray = e.target.value.split('\n').filter(line => line.trim());
              updateField('bio', bioArray.length > 0 ? bioArray : []);
            }}
            disabled={!isEditing}
          />
        </TabPanel>
      </Paper>
    </Box>
  );
}

