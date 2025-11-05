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
      // Option 1: Use apparentAgeTable (lookup table)
      apparentAgeTable: [
        { minActualAge: 0, maxActualAge: 10, apparentAge: 10 },
        { minActualAge: 11, maxActualAge: 20, apparentAge: 15 }
      ],
      // Option 2: Use formulas instead of table (formulas take precedence if both are set)
      // apparentAgeFormula: '2.5 * Math.pow(actualAge, 0.26) - 4.7',
      // actualAgeFromApparentFormula: 'Math.pow((apparentAge + 4.7) / 2.5, 1 / 0.26)',
      // Optional: Sibling formula for this category (used as fallback for races without their own formula)
      siblingFormula: {
        numberOfLitters: 'Ob1T6-2',
        litterSize: '1',
        olderSiblingAgeFormula: 'characterAge + Ob1T6',
        youngerSiblingAgeFormula: 'characterAge - Ob1T6',
        genderFormula: '0.5' // 50% male, 50% female
      },
      // Optional: Parent formula for this category
      // Partial overrides are supported - you can provide only formula, only table, or both:
      // 
      // Example 1: Only override formula (uses default table):
      // parentFormula: { formula: '1T100' } // Alver (Elves) roll 1T100 without adding apparent age
      //
      // Example 2: Only override table (uses default formula: '1T100 + characterApparentAge'):
      // parentFormula: {
      //   table: [
      //     { min: 1, max: 50, result: 'both parents alive' },
      //     { min: 51, max: 100, result: 'both dead' }
      //   ]
      // }
      //
      // Example 3: Override both (full custom configuration):
      parentFormula: {
        formula: '1T100', // Default is '1T100 + characterApparentAge'
        table: [
          { min: 1, max: 60, result: 'both parents alive' },
          { min: 61, max: 80, result: 'father unknown' },
          { min: 81, max: 88, result: 'mother alive' },
          { min: 89, max: 95, result: 'father alive' },
          { min: 96, max: 999, result: 'both dead' }
        ]
      },
      // Optional: Parent age formula for this category
      // Default is 'oldestSiblingOrCharacterApparentAge + 14 + Ob2T6'
      // Example override: Alver (Elves) might have different parent age calculation
      // parentAgeFormula: 'oldestSiblingOrCharacterApparentAge + 20 + Ob3T6'
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
        ['description', 'Example race for EON ruleset'],
        // Optional: Sibling formula specific to this race
        // If not provided, will fall back to race category's siblingFormula, then defaults
        ['siblingFormula', {
          numberOfLitters: 'Ob1T6-2',
          litterSize: '1T6/2+1', // Example: for triarker with formula-based litter size
          olderSiblingAgeFormula: 'characterAge + Ob1T6',
          youngerSiblingAgeFormula: 'characterAge - Ob1T6',
          genderFormula: '0.6' // Example: 60% male, 40% female
        }],
        // Optional: Parent formula specific to this race
        // If not provided, will fall back to race category's parentFormula, then defaults
        // Partial overrides are supported - you can provide only formula, only table, or both
        ['parentFormula', {
          formula: '1T100', // Example: override formula for this specific race
          // table: [...] // Omit to use default table, or provide custom table
        }],
        // Optional: Parent age formula specific to this race
        // Default is 'oldestSiblingOrCharacterApparentAge + 14 + Ob2T6'
        // Example: Some races might have different parent age calculation
        // ['parentAgeFormula', 'oldestSiblingOrCharacterApparentAge + 20 + Ob3T6'],
        // Optional: Characteristics recommendations for this race
        // High characteristics default to 13, low characteristics default to 8
        // Can use full characteristic names or just first 3 characters
        ['highCharacteristics', ['Lojalitet', 'Heder', 'Tro']], // Example: These tend to be high
        ['lowCharacteristics', ['Agg', 'Gen']] // Example: Aggression and Generositet tend to be low (using first 3 chars)
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
          console.log(`  Checking category '${categoryData.name}' for updates...`);
          // Update existing category if needed
          let updated = false;
          
          // Update description
          if (categoryData.description !== undefined && existingCategory.description !== categoryData.description) {
            existingCategory.description = categoryData.description || '';
            updated = true;
            console.log(`    Updated description for category '${categoryData.name}'.`);
          }
          
          // Update apparentAgeTable
          if (categoryData.apparentAgeTable && JSON.stringify(existingCategory.apparentAgeTable) !== JSON.stringify(categoryData.apparentAgeTable)) {
            existingCategory.apparentAgeTable = categoryData.apparentAgeTable;
            updated = true;
            console.log(`    Updated apparentAgeTable for category '${categoryData.name}'.`);
          }
          
          // Update exhaustionColumnDivisor
          if (categoryData.exhaustionColumnDivisor !== undefined && existingCategory.exhaustionColumnDivisor !== categoryData.exhaustionColumnDivisor) {
            existingCategory.exhaustionColumnDivisor = categoryData.exhaustionColumnDivisor;
            updated = true;
            console.log(`    Updated exhaustionColumnDivisor for category '${categoryData.name}'.`);
          }
          
          // Update siblingFormula - always check if provided in seed data
          if (categoryData.siblingFormula !== undefined) {
            // Normalize both to plain objects for comparison
            const existingFormula = existingCategory.siblingFormula 
              ? JSON.parse(JSON.stringify(existingCategory.siblingFormula))
              : null;
            const newFormula = JSON.parse(JSON.stringify(categoryData.siblingFormula));
            
            // Compare normalized objects
            if (JSON.stringify(existingFormula) !== JSON.stringify(newFormula)) {
              existingCategory.siblingFormula = categoryData.siblingFormula;
              updated = true;
              console.log(`    Updated siblingFormula for category '${categoryData.name}'.`);
              console.log(`      Old: ${JSON.stringify(existingFormula)}`);
              console.log(`      New: ${JSON.stringify(newFormula)}`);
            }
          }
          
          // Update parentFormula - always check if provided in seed data
          // Handle partial overrides: if only formula or only table is provided, merge with existing/defaults
          if (categoryData.parentFormula !== undefined) {
            const newFormula = categoryData.parentFormula;
            const existingFormula = existingCategory.parentFormula || {};
            
            // Determine what the final formula should be (support partial overrides)
            const finalFormula = {
              formula: newFormula.formula !== undefined 
                ? newFormula.formula 
                : (existingFormula.formula || '1T100 + characterApparentAge'),
              table: newFormula.table !== undefined 
                ? newFormula.table 
                : (existingFormula.table || [
                    { min: 1, max: 60, result: 'both parents alive' },
                    { min: 61, max: 80, result: 'father unknown' },
                    { min: 81, max: 88, result: 'mother alive' },
                    { min: 89, max: 95, result: 'father alive' },
                    { min: 96, max: 999, result: 'both dead' }
                  ])
            };
            
            // Compare normalized objects
            const existingNormalized = existingFormula 
              ? JSON.parse(JSON.stringify(existingFormula))
              : null;
            const finalNormalized = JSON.parse(JSON.stringify(finalFormula));
            
            if (JSON.stringify(existingNormalized) !== JSON.stringify(finalNormalized)) {
              existingCategory.parentFormula = finalFormula;
              updated = true;
              console.log(`    Updated parentFormula for category '${categoryData.name}'.`);
              console.log(`      Old: ${JSON.stringify(existingNormalized)}`);
              console.log(`      New: ${JSON.stringify(finalNormalized)}`);
            }
          }
          
          if (updated) {
            await existingCategory.save();
            console.log(`  ✓ Updated category '${categoryData.name}' for ${ruleset}.`);
          } else {
            console.log(`  ✓ Category '${categoryData.name}' already up to date for ${ruleset}.`);
          }
          continue;
        }
        
        // Create new category - only include siblingFormula and parentFormula if explicitly provided
        const categoryDataObj = {
          name: categoryData.name,
          ruleset,
          description: categoryData.description || '',
          apparentAgeTable: categoryData.apparentAgeTable || [],
          exhaustionColumnDivisor: categoryData.exhaustionColumnDivisor || 1
        };
        
        // Only add siblingFormula if explicitly provided (don't store defaults)
        if (categoryData.siblingFormula !== undefined) {
          categoryDataObj.siblingFormula = categoryData.siblingFormula;
        }
        
        // Only add parentFormula if explicitly provided (don't store defaults)
        // For parentFormula, build the complete object with defaults for missing parts
        if (categoryData.parentFormula !== undefined) {
          categoryDataObj.parentFormula = {
            formula: categoryData.parentFormula.formula !== undefined
              ? categoryData.parentFormula.formula
              : '1T100 + characterApparentAge',
            table: categoryData.parentFormula.table !== undefined
              ? categoryData.parentFormula.table
              : [
                  { min: 1, max: 60, result: 'both parents alive' },
                  { min: 61, max: 80, result: 'father unknown' },
                  { min: 81, max: 88, result: 'mother alive' },
                  { min: 89, max: 95, result: 'father alive' },
                  { min: 96, max: 999, result: 'both dead' }
                ]
          };
        }
        
        const category = new RaceCategory(categoryDataObj);
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
          console.log(`  Checking race '${raceData.name}' for updates...`);
          let updated = false;
          
          // Update category
          if (raceData.category !== undefined && existingRace.category !== raceData.category) {
            existingRace.category = raceData.category || '';
            updated = true;
            console.log(`    Updated category for race '${raceData.name}'.`);
          }
          
          // Update modifiers (convert Maps to objects for comparison)
          if (raceData.modifiers) {
            const existingModifiers = existingRace.modifiers instanceof Map 
              ? Object.fromEntries(existingRace.modifiers) 
              : existingRace.modifiers || {};
            const newModifiers = raceData.modifiers instanceof Map 
              ? Object.fromEntries(raceData.modifiers) 
              : raceData.modifiers;
            
            if (JSON.stringify(existingModifiers) !== JSON.stringify(newModifiers)) {
              existingRace.modifiers = raceData.modifiers;
              updated = true;
              console.log(`    Updated modifiers for race '${raceData.name}'.`);
            }
          }
          
          // Update metadata (convert Maps to objects for comparison)
          // Handle partial overrides for parentFormula within metadata
          if (raceData.metadata) {
            const existingMetadata = existingRace.metadata instanceof Map 
              ? Object.fromEntries(existingRace.metadata) 
              : existingRace.metadata || {};
            const newMetadata = raceData.metadata instanceof Map 
              ? Object.fromEntries(raceData.metadata) 
              : raceData.metadata;
            
            // Special handling for parentFormula partial overrides in metadata
            if (newMetadata.parentFormula && typeof newMetadata.parentFormula === 'object') {
              const existingParentFormula = existingMetadata.parentFormula || {};
              const newParentFormula = newMetadata.parentFormula;
              
              // Merge partial override with existing or defaults
              newMetadata.parentFormula = {
                formula: newParentFormula.formula !== undefined
                  ? newParentFormula.formula
                  : (existingParentFormula.formula || '1T100 + characterApparentAge'),
                table: newParentFormula.table !== undefined
                  ? newParentFormula.table
                  : (existingParentFormula.table || [
                      { min: 1, max: 60, result: 'both parents alive' },
                      { min: 61, max: 80, result: 'father unknown' },
                      { min: 81, max: 88, result: 'mother alive' },
                      { min: 89, max: 95, result: 'father alive' },
                      { min: 96, max: 999, result: 'both dead' }
                    ])
              };
            }
            
            if (JSON.stringify(existingMetadata) !== JSON.stringify(newMetadata)) {
              existingRace.metadata = raceData.metadata instanceof Map ? raceData.metadata : new Map(Object.entries(newMetadata));
              updated = true;
              console.log(`    Updated metadata for race '${raceData.name}'.`);
            }
          }
          
          if (updated) {
            await existingRace.save();
            console.log(`  ✓ Updated race '${raceData.name}' for ${ruleset}.`);
          } else {
            console.log(`  ✓ Race '${raceData.name}' already up to date for ${ruleset}.`);
          }
          continue;
        }

        // Create new ruleset-wide race
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

