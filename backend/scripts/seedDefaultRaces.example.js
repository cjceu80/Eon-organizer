/**
 * EXAMPLE SEED FILE - Create seedDefaultRaces.js based on this template
 * 
 * This file contains the structure for seeding default ruleset-wide races.
 * Copy this file to seedDefaultRaces.js and populate with your own default races.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Race from '../models/Race.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eon-organizer';

// Default races for each ruleset
const defaultRaces = {
  EON: [
    {
      name: 'ExampleRace',
      category: 'ExampleCategory', // Optional: Category for organizing races
      modifiers: new Map([
        ['STY', 0],
        ['TÅL', 0],
        ['RÖR', 0],
        ['PER', 0],
        ['PSY', 0],
        ['VIL', 0],
        ['BIL', 0],
        ['SYN', 0],
        ['HÖR', 0]
      ]),
      metadata: new Map([
        ['description', 'Example race for EON ruleset']
      ])
    }
    // Add more EON races here as needed
  ]
};

async function seedDefaultRaces() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Seed races for each ruleset
    for (const [ruleset, races] of Object.entries(defaultRaces)) {
      console.log(`\nSeeding default races for ${ruleset}...`);
      
      for (const raceData of races) {
        // Check if race already exists
        const existingRace = await Race.findOne({ 
          ruleset,
          world: null,
          name: raceData.name
        });

        if (existingRace) {
          console.log(`  ✓ ${raceData.name} already exists (ruleset-wide).`);
          continue;
        }

        // Create ruleset-wide race
        const race = new Race({
          name: raceData.name,
          world: null, // null = ruleset-wide race
          ruleset,
          category: raceData.category || '',
          modifiers: raceData.modifiers,
          metadata: raceData.metadata || new Map()
        });

        await race.save();
        console.log(`  ✓ Added ${raceData.name} race as ruleset-wide race for ${ruleset}.`);
      }
    }

    console.log('\n✓ Done! All default races seeded.');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedDefaultRaces();

