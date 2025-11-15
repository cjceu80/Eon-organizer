import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../hooks/useAuth';
import { Box, Typography, TextField, MenuItem, Switch, FormControlLabel, Button, Alert } from '@mui/material';



export default function RulesTab({ worldId, world, onWorldUpdate }) {
  const { token, user } = useAuth();
  const [statRollMethod, setStatRollMethod] = useState('standard');
  const [rerolls, setRerolls] = useState(0);
  const [freeSelections, setFreeSelections] = useState(0);
  const [feminineAttributes, setFeminineAttributes] = useState(false);
  const [minAttributes, setMinAttributes] = useState(null);
  const [maxAttributes, setMaxAttributes] = useState(null);
  const [varierandeVikt, setVarierandeVikt] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load settings from world when component mounts or world changes
  useEffect(() => {
    if (world && world.settings) {
      setStatRollMethod(world.settings.statRollMethod || 'standard');
      setRerolls(world.settings.rerolls || 0);
      setFreeSelections(world.settings.freeSelections || 0);
      setFeminineAttributes(world.settings.feminineAttributes || false);
      setMinAttributes(world.settings.minAttributes !== undefined ? world.settings.minAttributes : null);
      setMaxAttributes(world.settings.maxAttributes !== undefined ? world.settings.maxAttributes : null);
      setVarierandeVikt(world.settings.varierandeVikt !== undefined ? world.settings.varierandeVikt : true);
    } else if (world && !world.settings) {
      setStatRollMethod('standard');
      setRerolls(0);
      setFreeSelections(0);
      setFeminineAttributes(false);
      setMinAttributes(null);
      setMaxAttributes(null);
      setVarierandeVikt(true);
    }
  }, [world]);

  const handleSave = async () => {
    if (!world) return;
    
    // Check admin with string conversion to handle both string and ObjectId
    // Admin can be: string ID, ObjectId, or populated object { id, username, email }
    let worldAdminId = '';
    if (world.admin) {
      if (typeof world.admin === 'object' && world.admin !== null && world.admin.id) {
        // Populated admin object
        worldAdminId = String(world.admin.id);
      } else if (typeof world.admin === 'string' && world.admin !== '[object Object]') {
        // String ID (but not the string representation of an object)
        worldAdminId = world.admin;
      } else {
        // Try to get ID from object or use toString
        worldAdminId = String(world.admin);
      }
    }
    const userId = user?.id ? String(user.id) : '';
    
    if (worldAdminId !== userId) {
      return;
    }

    setSaving(true);
    setError('');
    try {
      const settingsPayload = {
        ...world.settings,
        statRollMethod,
        rerolls,
        freeSelections,
        feminineAttributes,
        minAttributes: minAttributes === '' ? null : minAttributes,
        maxAttributes: maxAttributes === '' ? null : maxAttributes,
        varierandeVikt
      };
      
      const response = await fetch(`/api/worlds/${worldId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          settings: settingsPayload
        })
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        setError(errorData.message || 'Misslyckades att spara inställningar');
        console.error('Save failed:', response.status, errorData);
        return;
      }

      const data = await response.json();
      
      // Update local state with saved values
      if (data.world && data.world.settings) {
        setStatRollMethod(data.world.settings.statRollMethod || 'standard');
        setRerolls(data.world.settings.rerolls || 0);
        setFreeSelections(data.world.settings.freeSelections || 0);
        setFeminineAttributes(data.world.settings.feminineAttributes || false);
        setMinAttributes(data.world.settings.minAttributes !== undefined ? data.world.settings.minAttributes : null);
        setMaxAttributes(data.world.settings.maxAttributes !== undefined ? data.world.settings.maxAttributes : null);
        setVarierandeVikt(data.world.settings.varierandeVikt !== undefined ? data.world.settings.varierandeVikt : true);
      }
      
      onWorldUpdate(data.world);
      alert('Inställningar sparade!');
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Misslyckades att spara inställningar');
    } finally {
      setSaving(false);
    }
  };

  // Check admin with string conversion to handle both string and ObjectId
  // Admin can be: string ID, ObjectId, or populated object { id, username, email }
  let worldAdminId = '';
  if (world?.admin) {
    if (typeof world.admin === 'object' && world.admin !== null && world.admin.id) {
      // Populated admin object
      worldAdminId = String(world.admin.id);
    } else if (typeof world.admin === 'string' && world.admin !== '[object Object]') {
      // String ID (but not the string representation of an object)
      worldAdminId = world.admin;
    } else {
      // Try to get ID from object or use toString
      worldAdminId = String(world.admin);
    }
  }
  const userId = user?.id ? String(user.id) : '';
  const isAdmin = worldAdminId && userId && worldAdminId !== '[object Object]' && worldAdminId === userId;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Karaktärskapande - Inställningar
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Konfigurera hur attribut ska rullas för nya karaktärer i denna värld.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      <Box sx={{ maxWidth: 600 }}>
        <TextField
          select
          fullWidth
          label="Attributrullning"
          value={statRollMethod}
          onChange={(e) => setStatRollMethod(e.target.value)}
          disabled={!isAdmin || saving}
          sx={{ mb: 3 }}
          helperText="Välj metod för att rulla huvudattribut"
        >
          <MenuItem value="standard">Standard</MenuItem>
          <MenuItem value="anpassad">Anpassad</MenuItem>
          <MenuItem value="höga attribut">Höga attribut</MenuItem>
          <MenuItem value="hjälteattribut">Hjälteattribut</MenuItem>
        </TextField>

        <TextField
          type="number"
          fullWidth
          label="Omrullningar"
          value={rerolls}
          onChange={(e) => setRerolls(Math.max(0, parseInt(e.target.value) || 0))}
          disabled={!isAdmin || saving}
          sx={{ mb: 3 }}
          inputProps={{ min: 0 }}
          helperText="Antal gånger spelare slå om tärningskast"
        />

        <TextField
          type="number"
          fullWidth
          label="Fria val"
          value={freeSelections}
          onChange={(e) => setFreeSelections(Math.max(0, parseInt(e.target.value) || 0))}
          disabled={!isAdmin || saving}
          sx={{ mb: 3 }}
          inputProps={{ min: 0 }}
          helperText="Antal fria val i tabeller"
        />

        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={feminineAttributes}
                onChange={(e) => setFeminineAttributes(e.target.checked)}
                disabled={!isAdmin || saving}
              />
            }
            label="Kvinnliga attribut"
          />
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
            Aktivera kvinnliga attribut för denna värld
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Minimum attribut
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={minAttributes !== null}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setMinAttributes(3);
                    } else {
                      setMinAttributes(null);
                    }
                  }}
                  disabled={!isAdmin || saving}
                />
              }
              label="Aktivera"
            />
            {minAttributes !== null && (
              <TextField
                type="number"
                size="small"
                label="Minimum värde"
                value={minAttributes}
                onChange={(e) => setMinAttributes(parseInt(e.target.value) || 3)}
                disabled={!isAdmin || saving}
                inputProps={{ min: 1, max: 20 }}
                sx={{ width: 150 }}
              />
            )}
          </Box>
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
            Minimum värde för rullade attribut. Ras- och könmodifikationer kan överskrida detta.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Maximum attribut
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={maxAttributes !== null}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setMaxAttributes(18);
                    } else {
                      setMaxAttributes(null);
                    }
                  }}
                  disabled={!isAdmin || saving}
                />
              }
              label="Aktivera"
            />
            {maxAttributes !== null && (
              <TextField
                type="number"
                size="small"
                label="Maximum värde"
                value={maxAttributes}
                onChange={(e) => setMaxAttributes(parseInt(e.target.value) || 18)}
                disabled={!isAdmin || saving}
                inputProps={{ min: 1, max: 30 }}
                sx={{ width: 150 }}
              />
            )}
          </Box>
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
            Maximum värde för rullade attribut. Ras- och könmodifikationer kan överskrida detta.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={varierandeVikt}
                onChange={(e) => setVarierandeVikt(e.target.checked)}
                disabled={!isAdmin || saving}
              />
            }
            label="Varierande vikt"
          />
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
            Aktivera varierande vikt för denna värld
          </Typography>
        </Box>

        {isAdmin && (
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{ mt: 2 }}
          >
            {saving ? 'Sparar...' : 'Spara inställningar'}
          </Button>
        )}

        {!isAdmin && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Endast världsadministratören kan ändra dessa inställningar.
          </Alert>
        )}
      </Box>
    </Box>
  );
}

RulesTab.propTypes = {
  worldId: PropTypes.string.isRequired,
  world: PropTypes.object,
  onWorldUpdate: PropTypes.func.isRequired,
};