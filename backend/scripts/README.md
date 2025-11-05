# Database Seed Scripts

This directory contains scripts for seeding default/starter data into the database.

## Important Notice

⚠️ **Seed files are gitignored** - The actual seed files (`seedDefaultRaces.js`) are NOT committed to git as they may contain copyrighted content (proprietary race data, ruleset information, etc.).

Use `seedDefaultRaces.example.js` as a template to create your own seed files.

## seedDefaultRaces.js

Seeds default ruleset-wide races that will be available to all worlds using that ruleset.

### Usage

**Recommended: Run locally from host machine** (fastest, always uses latest code):
```powershell
# From backend directory - uses helper script
cd backend
.\seed.ps1

# Or directly with npm
npm run seed
# (Note: requires MONGODB_URI environment variable set to mongodb://localhost:27017/eon-organizer)
```

**Alternative: Run from inside container** (slower, may use cached modules):
```bash
docker exec eon-backend node scripts/seedDefaultRaces.js
```

**Why run locally?**
- ✅ Always uses the latest code from your filesystem
- ✅ No Docker exec overhead or module caching issues
- ✅ Faster iteration when testing schema changes
- ✅ Same connection to MongoDB (Docker exposes port 27017)

**Prerequisites for local execution:**
- Node.js installed on your host machine
- Backend dependencies installed (`npm install` in `backend/` directory)
- MongoDB container running and accessible on `localhost:27017`

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

