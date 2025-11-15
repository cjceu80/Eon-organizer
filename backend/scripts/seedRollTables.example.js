/**
 * Seed script for roll / lookup tables.
 *
 * Usage:
 *  node backend/scripts/seedRollTables.js
 *
 * Notes:
 *  - Tables are idempotent (upserted by slug).
 *  - To keep copyrighted data out of git, you can point ROLL_TABLES_SEED_FILE
 *    to an external JSON file containing the data (see SAMPLE_SEED below).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import RollTable from '../models/RollTable.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eon-organizer';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_DATA_PATH = path.join(__dirname, 'seedRollTables.data.json');
const seedDataPath = process.env.ROLL_TABLES_SEED_FILE
  ? path.resolve(process.env.ROLL_TABLES_SEED_FILE)
  : DEFAULT_DATA_PATH;

/**
 * SAMPLE_SEED is used as a fallback to demonstrate structure.
 * Replace or extend with your data externally to avoid committing copyrighted text.
 */
const SAMPLE_SEED = [
  {
    name: 'Example: Family Origin',
    slug: 'example-family-origin',
    dice: '1d100',
    description: 'Demonstration table – replace with your actual copyrighted content.',
    source: 'Your Source Book',
    copyrightNotice: '© Your Publisher',
    tags: ['example', 'character-creation'],
    metadata: {
      ruleset: 'EON',
      notes: 'Remove SAMPLE_SEED once you provide real data through seedRollTables.data.json'
    },
    entries: [
      {
        minValue: 1,
        maxValue: 10,
        value: 'Orphaned',
        description: 'Character has lost both parents.',
        effect: {
          handlerId: 'flag:set',
          type: 'flag',
          label: 'isOrphan',
          details: { value: true }
        }
      },
      {
        minValue: 11,
        maxValue: 25,
        value: 'Raised by Guardians',
        description: 'Character was raised by relatives, mentors, or an institution.',
        effect: {
          handlerId: 'modifier:adjust',
          type: 'modifier',
          label: 'relationship',
          details: {
            target: 'mentorAffinity',
            operation: 'add',
            value: 1
          }
        },
        subTable: {
          type: 'inline',
          dice: '1d6',
          // Inline subtables can reuse the same structure recursively
          entries: [
            {
              minValue: 1,
              maxValue: 2,
              value: 'Distant Noble',
              description: 'A minor noble family took you in.',
              effect: {
                handlerId: 'tag:add',
                type: 'tag',
                label: 'patronHouse',
                details: { slug: 'noble-patron' }
              }
            },
            {
              minValue: 3,
              maxValue: 4,
              value: 'Temple Order',
              description: 'A religious order became your surrogate family.',
              effect: {
                handlerId: 'grant:skill',
                type: 'grant',
                label: 'faithTraining',
                details: { skill: 'Theology', bonus: 1 }
              }
            },
            {
              minValue: 5,
              maxValue: 6,
              value: 'Mercenary Company',
              description: 'Battle-scarred veterans raised and trained you.',
              effect: {
                handlerId: 'grant:skill',
                type: 'grant',
                label: 'martialTraining',
                details: { skill: 'Tactics', bonus: 1 }
              }
            }
          ]
        }
      },
      {
        minValue: 26,
        maxValue: 40,
        value: 'Noble Lineage',
        description: 'Character descends from a well-known noble household.',
        effect: {
          handlerId: 'table:roll',
          type: 'reference',
          label: 'rollOnTable',
          details: { tableSlug: 'example-noble-benefits' }
        }
      }
    ]
  },
  {
    name: 'Example: Noble Benefits',
    slug: 'example-noble-benefits',
    dice: '1d6',
    tags: ['example', 'benefit'],
    entries: [
      {
        minValue: 1,
        maxValue: 2,
        value: 'Favor Owed',
        description: 'You can call on a favor from a connected family.',
        effect: {
          handlerId: 'resource:add',
          type: 'resource',
          label: 'favor',
          details: {
            tier: 'minor',
            uses: 1
          }
        }
      },
      {
        minValue: 3,
        maxValue: 4,
        value: 'Land Grant',
        description: 'You control a small estate that generates income.',
        effect: {
          handlerId: 'resource:add',
          type: 'resource',
          label: 'landGrant',
          details: {
            incomePerSeason: 100,
            upkeep: 25
          }
        }
      },
      {
        minValue: 5,
        maxValue: 6,
        value: 'Retinue',
        description: 'You gain the service of a loyal attendant.',
        effect: {
          handlerId: 'asset:add',
          type: 'asset',
          label: 'retainer',
          details: {
            npcTemplate: 'attendant',
            quality: 'skilled'
          }
        }
      }
    ]
  }
];

function loadSeedData() {
  if (!fs.existsSync(seedDataPath)) {
    console.warn(`⚠️  Seed data file not found at ${seedDataPath}. Using SAMPLE_SEED placeholder data.`);
    return SAMPLE_SEED;
  }

  try {
    const raw = fs.readFileSync(seedDataPath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (Array.isArray(parsed.tables)) {
      return parsed.tables;
    }
    throw new Error('Seed file must export an array or an object with a "tables" array.');
  } catch (err) {
    console.error('Failed to read roll table seed file:', err);
    console.warn('Using SAMPLE_SEED placeholder data instead.');
    return SAMPLE_SEED;
  }
}

const asPlainObject = (value) => {
  if (!value || typeof value !== 'object') {
    return value;
  }

  if (value instanceof Map) {
    return Object.fromEntries(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => asPlainObject(item));
  }

  return { ...value };
};

const normalizeEntry = (entry) => {
  const normalized = { ...entry };
  if (normalized.metadata) {
    normalized.metadata = asPlainObject(normalized.metadata);
  }

  if (normalized.subTable && typeof normalized.subTable === 'object' && !Array.isArray(normalized.subTable)) {
    const sub = { ...normalized.subTable };
    if (Array.isArray(sub.entries)) {
      sub.entries = sub.entries.map(normalizeEntry);
    }
    normalized.subTable = sub;
  }
  return normalized;
};

const normalizeTable = (table) => {
  const normalized = { ...table };
  normalized.slug = (normalized.slug || normalized.name || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '-');

  if (!normalized.slug) {
    throw new Error(`Table "${normalized.name}" must have a slug or name to derive one.`);
  }

  if (normalized.metadata) {
    normalized.metadata = asPlainObject(normalized.metadata);
  }

  if (Array.isArray(normalized.tags)) {
    normalized.tags = Array.from(new Set(normalized.tags.map((tag) => tag.trim()).filter(Boolean)));
  }

  if (Array.isArray(normalized.entries)) {
    normalized.entries = normalized.entries.map(normalizeEntry);
  }

  return normalized;
};

async function seedRollTables() {
  console.log('Seeding roll tables...');

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true
    });
    console.log('✓ Connected to MongoDB');

    const tables = loadSeedData();
    if (!Array.isArray(tables) || tables.length === 0) {
      console.warn('No roll tables found in seed data. Nothing to seed.');
      await mongoose.disconnect();
      return;
    }

    for (const table of tables) {
      const normalized = normalizeTable(table);
      await RollTable.updateOne(
        { slug: normalized.slug },
        {
          $set: {
            name: normalized.name,
            slug: normalized.slug,
            description: normalized.description || '',
            dice: normalized.dice || '1d100',
            tags: normalized.tags || [],
            source: normalized.source || '',
            copyrightNotice: normalized.copyrightNotice || '',
            metadata: normalized.metadata || new Map(),
            entries: normalized.entries || []
          }
        },
        { upsert: true }
      );
      console.log(`  ✓ Seeded "${normalized.name}" (${normalized.slug})`);
    }

    console.log('✓ Roll tables seeding complete.');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding roll tables:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedRollTables();


