# Database Seed Scripts

This directory contains scripts for seeding default/starter data into the database.

## Important Notice

⚠️ **Seed files are gitignored** - The actual seed files (`seedDefaultRaces.js`) are NOT committed to git as they may contain copyrighted content (proprietary race data, ruleset information, etc.).

Use `seedDefaultRaces.example.js` as a template to create your own seed files.

## seedDefaultRaces.js

Seeds default ruleset-wide races that will be available to all worlds using that ruleset.

### Usage

**Manually run:**
```bash
# From inside the backend container
docker exec eon-backend node scripts/seedDefaultRaces.js

# Or from backend directory locally
node scripts/seedDefaultRaces.js
```

**What it does:**
- Checks for existing ruleset-wide races to avoid duplicates
- Adds default races for each supported ruleset (currently EON)
- Safe to run multiple times (idempotent)

**Current default races:**
- **EON**: Adasier (with EON attribute modifiers)

**Creating your seed file:**

1. Copy the example template:
   ```bash
   cp backend/scripts/seedDefaultRaces.example.js backend/scripts/seedDefaultRaces.js
   ```

2. Edit `seedDefaultRaces.js` and add to the `defaultRaces` object:

```javascript
const defaultRaces = {
  EON: [
    {
      name: 'Adasier',
      modifiers: new Map([ /* ... */ ]),
      metadata: new Map([ /* ... */ ])
    },
    // Add more here
    {
      name: 'NewRace',
      modifiers: new Map([ /* ... */ ]),
      metadata: new Map([ /* ... */ ])
    }
  ],
  // Future: Add other rulesets
  DND5E: [ /* ... */ ]
};
```

### When to run

- **Initial setup**: When setting up a new database instance
- **After adding new default races**: To populate them
- **Development**: Anytime you want to ensure starter data exists

These races are **ruleset-wide**, meaning they appear in ALL worlds using that ruleset. World admins can create additional world-specific races via the API.

