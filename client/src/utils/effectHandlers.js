/**
 * Effect handler system for processing roll table bonuses during character creation.
 * 
 * Supported effect types:
 * - table:roll - Roll on additional tables
 * - unit:add - Add units to abilities/languages
 * - freeUnits:add - Add free units (fria enheter)
 * - stat:modify - Modify base stats
 * - rollModifier:add - Add permanent roll modifiers to skills or base stats
 */

import { rollT6Multiple, rollT100, rollT10, rollObT6WithDetails } from './dice';

/**
 * Evaluate a dice formula string (e.g., "1T6+1", "1T6/2", "Ob1T6")
 * Supports: T6, T10, T100, ObT6, basic arithmetic
 */
function evaluateDiceFormula(formula, context = {}) {
  if (!formula || typeof formula !== 'string') {
    return 0;
  }

  let expr = formula.trim();

  // Replace context variables (e.g., characterAge, characterApparentAge)
  Object.keys(context).forEach(key => {
    const regex = new RegExp(key, 'g');
    expr = expr.replace(regex, context[key].toString());
  });

  // Handle ObT6 notation (e.g., Ob1T6)
  const obT6Regex = /Ob(\d+)T6/g;
  expr = expr.replace(obT6Regex, (match, count) => {
    const diceCount = parseInt(count, 10);
    const result = rollObT6WithDetails(diceCount);
    return result.total.toString();
  });

  // Handle T100 notation (e.g., 1T100)
  const t100Regex = /(\d+)T100/g;
  expr = expr.replace(t100Regex, (match, count) => {
    let total = 0;
    for (let i = 0; i < parseInt(count, 10); i++) {
      total += rollT100();
    }
    return total.toString();
  });

  // Handle T10 notation (e.g., 1T10)
  const t10Regex = /(\d+)T10/g;
  expr = expr.replace(t10Regex, (match, count) => {
    let total = 0;
    for (let i = 0; i < parseInt(count, 10); i++) {
      total += rollT10();
    }
    return total.toString();
  });

  // Handle T6 notation (e.g., 1T6)
  const t6Regex = /(\d+)T6/g;
  expr = expr.replace(t6Regex, (match, count) => {
    const rolls = rollT6Multiple(parseInt(count, 10));
    return rolls.reduce((a, b) => a + b, 0).toString();
  });

  // Evaluate the expression
  try {
    // Handle division with rounding up (e.g., 1T6/2)
    if (expr.includes('/')) {
      const result = Function(`"use strict"; return (${expr})`)();
      return Math.ceil(result);
    }
    const result = Function(`"use strict"; return (${expr})`)();
    return typeof result === 'number' ? Math.max(0, Math.floor(result)) : 0;
  } catch (err) {
    console.error('Error evaluating dice formula:', formula, err);
    return 0;
  }
}

/**
 * Process an effect from a roll table entry
 * @param {Object} effect - The effect object from a roll table entry
 * @param {Object} context - Context variables (character data, etc.)
 * @returns {Object} Processed effect result
 */
export function processEffect(effect, context = {}) {
  if (!effect || !effect.handlerId) {
    return { type: 'none', result: null };
  }

  const { handlerId, label, details } = effect;

  switch (handlerId) {
    case 'table:roll':
      return {
        type: 'table:roll',
        handlerId,
        label: label || 'rollOnTable',
        tables: details?.tables || [],
        result: {
          tables: details?.tables || [],
          message: `Roll on table(s): ${(details?.tables || []).join(', ')}`
        }
      };

    case 'unit:add':
      return {
        type: 'unit:add',
        handlerId,
        label: label || 'units',
        target: details?.target || 'ability', // 'ability' or 'language'
        formula: details?.formula || details?.language || details?.ability || '1',
        specific: details?.specific || null, // Specific ability/language name
        result: {
          target: details?.target || 'ability',
          formula: details?.formula || details?.language || details?.ability || '1',
          specific: details?.specific || null,
          units: evaluateDiceFormula(
            details?.formula || details?.language || details?.ability || '1',
            context
          )
        }
      };

    case 'freeUnits:add':
      return {
        type: 'freeUnits:add',
        handlerId,
        label: label || 'freeUnits',
        formula: details?.formula || '1',
        result: {
          formula: details?.formula || '1',
          units: evaluateDiceFormula(details?.formula || '1', context)
        }
      };

    case 'stat:modify':
      return {
        type: 'stat:modify',
        handlerId,
        label: label || 'statModifier',
        stat: details?.stat || null, // Stat name (e.g., 'STY', 'BIL')
        modifier: details?.modifier || 0, // Can be a number or formula
        result: {
          stat: details?.stat || null,
          modifier: typeof details?.modifier === 'string'
            ? evaluateDiceFormula(details?.modifier, context)
            : (details?.modifier || 0)
        }
      };

    case 'rollModifier:add':
      return {
        type: 'rollModifier:add',
        handlerId,
        label: label || 'rollModifier',
        target: details?.target || 'skill', // 'skill' or 'stat'
        modifier: details?.modifier || 0, // Can be a number or formula
        specific: details?.specific || null, // Specific skill/stat name
        result: {
          target: details?.target || 'skill',
          modifier: typeof details?.modifier === 'string'
            ? evaluateDiceFormula(details?.modifier, context)
            : (details?.modifier || 0),
          specific: details?.specific || null
        }
      };

    default:
      console.warn(`Unknown effect handler: ${handlerId}`);
      return {
        type: 'unknown',
        handlerId,
        result: null
      };
  }
}

/**
 * Apply an effect result to character bonuses
 * @param {Object} currentBonuses - Current bonuses object
 * @param {Object} effectResult - Result from processEffect
 * @returns {Object} Updated bonuses object
 */
export function applyEffectToBonuses(currentBonuses, effectResult) {
  const bonuses = { ...currentBonuses };

  if (!effectResult || !effectResult.result) {
    return bonuses;
  }

  switch (effectResult.type) {
    case 'unit:add': {
      if (!bonuses.units) bonuses.units = {};
      if (!bonuses.units[effectResult.result.target]) {
        bonuses.units[effectResult.result.target] = {};
      }
      
      const targetKey = effectResult.result.specific || 'general';
      if (!bonuses.units[effectResult.result.target][targetKey]) {
        bonuses.units[effectResult.result.target][targetKey] = 0;
      }
      
      bonuses.units[effectResult.result.target][targetKey] += effectResult.result.units;
      break;
    }

    case 'freeUnits:add':
      if (!bonuses.freeUnits) bonuses.freeUnits = 0;
      bonuses.freeUnits += effectResult.result.units;
      break;

    case 'stat:modify':
      if (!bonuses.statModifiers) bonuses.statModifiers = {};
      if (!bonuses.statModifiers[effectResult.result.stat]) {
        bonuses.statModifiers[effectResult.result.stat] = 0;
      }
      bonuses.statModifiers[effectResult.result.stat] += effectResult.result.modifier;
      break;

    case 'rollModifier:add': {
      if (!bonuses.rollModifiers) bonuses.rollModifiers = {};
      if (!bonuses.rollModifiers[effectResult.result.target]) {
        bonuses.rollModifiers[effectResult.result.target] = {};
      }
      
      const modifierKey = effectResult.result.specific || 'general';
      if (!bonuses.rollModifiers[effectResult.result.target][modifierKey]) {
        bonuses.rollModifiers[effectResult.result.target][modifierKey] = 0;
      }
      
      bonuses.rollModifiers[effectResult.result.target][modifierKey] += effectResult.result.modifier;
      break;
    }

    case 'table:roll':
      // Table rolls are handled separately - they trigger additional rolls
      if (!bonuses.pendingTableRolls) bonuses.pendingTableRolls = [];
      bonuses.pendingTableRolls.push(...effectResult.result.tables);
      break;
  }

  return bonuses;
}

/**
 * Process multiple effects and combine results
 * @param {Array<Object>} effects - Array of effect objects
 * @param {Object} context - Context variables
 * @returns {Object} Combined bonuses object
 */
export function processMultipleEffects(effects, context = {}) {
  let bonuses = {
    units: {},
    freeUnits: 0,
    statModifiers: {},
    rollModifiers: {},
    pendingTableRolls: []
  };

  if (!Array.isArray(effects)) {
    return bonuses;
  }

  effects.forEach(effect => {
    const effectResult = processEffect(effect, context);
    bonuses = applyEffectToBonuses(bonuses, effectResult);
  });

  return bonuses;
}

/**
 * Get a human-readable description of an effect
 * @param {Object} effect - Effect object
 * @returns {string} Description
 */
export function getEffectDescription(effect) {
  if (!effect || !effect.handlerId) {
    return 'No effect';
  }

  const { handlerId, details } = effect;

  switch (handlerId) {
    case 'table:roll': {
      const tables = details?.tables || [];
      return `Roll on table(s): ${tables.join(', ')}`;
    }

    case 'unit:add': {
      const target = details?.target || 'ability';
      const specific = details?.specific;
      const formula = details?.formula || details?.language || details?.ability || '1';
      if (specific) {
        return `Add ${formula} units to ${target}: ${specific}`;
      }
      return `Add ${formula} units to ${target}`;
    }

    case 'freeUnits:add': {
      const freeFormula = details?.formula || '1';
      return `Add ${freeFormula} free units (fria enheter)`;
    }

    case 'stat:modify': {
      const stat = details?.stat || 'stat';
      const modifier = details?.modifier || 0;
      return `Modify ${stat} by ${modifier}`;
    }

    case 'rollModifier:add': {
      const rollTarget = details?.target || 'skill';
      const rollModifier = details?.modifier || 0;
      const rollSpecific = details?.specific;
      if (rollSpecific) {
        return `Add ${rollModifier} roll modifier to ${rollTarget}: ${rollSpecific}`;
      }
      return `Add ${rollModifier} roll modifier to ${rollTarget}`;
    }

    default:
      return `Unknown effect: ${handlerId}`;
  }
}

