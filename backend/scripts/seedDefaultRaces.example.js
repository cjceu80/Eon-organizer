/**
 * EXAMPLE SEED FILE - Create seedDefaultRaces.js based on this template
 * 
 * This file contains the structure for seeding default ruleset-wide races.
 * Copy this file to seedDefaultRaces.js and populate with your own default races.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Race from '../models/Race.js';
import RaceCategory from '../models/RaceCategory.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eon-organizer';

// Default race categories for each ruleset
const defaultRaceCategories = {
  EON: [
    {
      name: 'ExampleCategory',
      description: 'Description for example category.',
      exhaustionColumnDivisor: 1, // Divisor for exhaustion columns: (TÅL + VIL) / exhaustionColumnDivisor
      apparentAgeTable: [
        { minActualAge: 0, maxActualAge: 10, apparentAge: 10 },
        { minActualAge: 11, maxActualAge: 20, apparentAge: 15 }
      ]
    }
    // Add more EON categories here as needed
  ]
};

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
        ['maleLength', 145],
        ['maleWeight', 105],
        ['femaleLength', 135],
        ['femaleWeight', 105],
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

    // Seed race categories first
    for (const [ruleset, categories] of Object.entries(defaultRaceCategories)) {
      console.log(`\nSeeding default race categories for ${ruleset}...`);
      for (const categoryData of categories) {
        const existingCategory = await RaceCategory.findOne({ ruleset, name: categoryData.name });
        if (existingCategory) {
          console.log(`  ✓ Category '${categoryData.name}' already exists for ${ruleset}.`);
          // Optional: Update existing category if needed
          if (categoryData.apparentAgeTable && JSON.stringify(existingCategory.apparentAgeTable) !== JSON.stringify(categoryData.apparentAgeTable)) {
            existingCategory.apparentAgeTable = categoryData.apparentAgeTable;
            await existingCategory.save();
            console.log(`    Updated apparentAgeTable for category '${categoryData.name}'.`);
          }
          if (categoryData.exhaustionColumnDivisor !== undefined && existingCategory.exhaustionColumnDivisor !== categoryData.exhaustionColumnDivisor) {
            existingCategory.exhaustionColumnDivisor = categoryData.exhaustionColumnDivisor;
            await existingCategory.save();
            console.log(`    Updated exhaustionColumnDivisor for category '${categoryData.name}'.`);
          }
          continue;
        }
        const category = new RaceCategory({
          name: categoryData.name,
          ruleset,
          description: categoryData.description || '',
          apparentAgeTable: categoryData.apparentAgeTable || [],
          exhaustionColumnDivisor: categoryData.exhaustionColumnDivisor || 1
        });
        await category.save();
        console.log(`  ✓ Added category '${categoryData.name}' for ${ruleset}.`);
      }
    }

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

