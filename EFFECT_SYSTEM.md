# Effect System for Roll Table Bonuses

This document describes the effect system for handling different kinds of bonuses that can occur during character creation table rolls.

## Overview

The effect system allows roll table entries to apply various bonuses to characters during creation:
- Rolls on additional tables
- Extra units for abilities or languages
- Free units (fria enheter)
- Stat modifiers
- Permanent roll modifiers for skills and base stats

## Effect Types

### 1. `table:roll` - Roll on Additional Tables
Triggers additional table rolls when a result is rolled.

```javascript
{
  handlerId: 'table:roll',
  type: 'table',
  label: 'rollOnTable',
  details: {
    tables: ['propertyTable', 'estateTable'] // Array of table slugs
  }
}
```

### 2. `unit:add` - Add Units to Abilities or Languages
Adds units that can be used to increase ability or language skill chances.

```javascript
{
  handlerId: 'unit:add',
  type: 'units',
  label: 'language', // or 'ability'
  details: {
    target: 'language', // 'language' or 'ability'
    formula: '1T6+1', // Dice formula (supports T6, T10, T100, ObT6, arithmetic)
    specific: 'Elvish' // Optional: specific language/ability name, or null for player choice
  }
}
```

### 3. `freeUnits:add` - Add Free Units (Fria Enheter)
Adds free units that can be used anywhere.

```javascript
{
  handlerId: 'freeUnits:add',
  type: 'freeUnits',
  label: 'freeUnits',
  details: {
    formula: '1T6+2' // Dice formula
  }
}
```

### 4. `stat:modify` - Modify Base Stats
Permanently modifies a base stat (e.g., STY, BIL, etc.).

```javascript
{
  handlerId: 'stat:modify',
  type: 'statModifier',
  label: 'statModifier',
  details: {
    stat: 'STY', // Stat name
    modifier: 1 // Can be a number or formula string like 'Ob1T6-3'
  }
}
```

### 5. `rollModifier:add` - Add Permanent Roll Modifiers
Adds permanent modifiers to rolls for skills or base stats.

```javascript
{
  handlerId: 'rollModifier:add',
  type: 'rollModifier',
  label: 'rollModifier',
  details: {
    target: 'skill', // 'skill' or 'stat'
    modifier: 2, // Can be a number or formula string
    specific: 'Svärd' // Optional: specific skill/stat name, or null for general
  }
}
```

## Usage

### Processing Effects in Frontend

```javascript
import { processEffect, processMultipleEffects, applyEffectToBonuses } from '../utils/effectHandlers';

// Process a single effect
const effect = rollTableEntry.effect;
const context = {
  characterAge: 25,
  characterApparentAge: 25
};
const effectResult = processEffect(effect, context);

// Apply to character bonuses
let characterBonuses = {
  units: {},
  freeUnits: 0,
  statModifiers: {},
  rollModifiers: {},
  pendingTableRolls: []
};
characterBonuses = applyEffectToBonuses(characterBonuses, effectResult);

// Process multiple effects
const effects = [effect1, effect2, effect3];
const allBonuses = processMultipleEffects(effects, context);
```

### Saving Bonuses to Character

When creating a character, include the bonuses in the request:

```javascript
const response = await fetch('/api/characters', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: characterName,
    worldId,
    bio: characterBio,
    stats: { /* ... */ },
    bonuses: characterBonuses // Include bonuses here
  })
});
```

## Dice Formula Support

The system supports various dice notations in formulas:
- `1T6` - Roll 1 six-sided die
- `3T6` - Roll 3 six-sided dice
- `1T10` - Roll 1 ten-sided die
- `1T100` - Roll 1 hundred-sided die (d100)
- `Ob1T6` - Open-ended roll (6s trigger extra rolls)
- `1T6+1` - Roll and add 1
- `1T6-3` - Roll and subtract 3 (minimum 0)
- `1T6/2` - Roll and divide by 2 (rounded up)
- `Ob1T6-3` - Open-ended roll minus 3

Formulas can include context variables like `characterAge` or `characterApparentAge` if provided in the context object.

## Example: Complete Roll Table Entry

```javascript
{
  minValue: 54,
  maxValue: 55,
  value: 'Invandrare',
  description: 'Rollpersonens föräldrar är invandrare. Rollpersonen får 1T6+1 enheter för att höja färdighetschans i föräldrarnas språk.',
  effect: {
    handlerId: 'unit:add',
    type: 'units',
    label: 'language',
    details: {
      target: 'language',
      formula: '1T6+1',
      specific: null // Player chooses the language
    }
  }
}
```

## Data Structure

Bonuses are stored in the Character model as a Map with the following structure:

```javascript
{
  units: {
    language: {
      'Elvish': 5, // 5 units for Elvish
      'general': 3 // 3 units for any language
    },
    ability: {
      'Svärd': 4, // 4 units for Swords
      'general': 2 // 2 units for any ability
    }
  },
  freeUnits: 7, // 7 free units
  statModifiers: {
    'STY': 1, // +1 to STY
    'BIL': -2 // -2 to BIL
  },
  rollModifiers: {
    skill: {
      'Svärd': 2, // +2 to Swords rolls
      'general': 1 // +1 to all skill rolls
    },
    stat: {
      'STY': 1, // +1 to STY rolls
      'general': 0 // General stat roll modifier
    }
  },
  pendingTableRolls: ['propertyTable'] // Tables that still need to be rolled
}
```

## Integration Points

1. **Roll Table Display Component**: When displaying roll table results, check for `entry.effect` and process it using `processEffect()`.

2. **Character Creation Flow**: Collect all bonuses during character creation and include them in the character creation request.

3. **Character Display**: When displaying a character, show their bonuses from the `bonuses` field.

4. **Roll Modifiers**: When making skill or stat rolls, check the character's `bonuses.rollModifiers` and apply them to the roll.

