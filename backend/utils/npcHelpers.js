import NPC from '../models/NPC.js';
import Character from '../models/Character.js';

/**
 * Create an NPC connection from a character
 * @param {string} characterId - The ID of the character creating the connection
 * @param {string} connectionType - Type of connection: 'family', 'friend', 'enemy', 'other'
 * @param {string} description - Optional description of the connection
 * @returns {Promise<Object>} - The created NPC document
 */
export async function createNPCConnection(characterId, connectionType, description = '') {
  // Validate connection type
  const validTypes = ['family', 'friend', 'enemy', 'other'];
  if (!validTypes.includes(connectionType)) {
    throw new Error(`Invalid connection type. Must be one of: ${validTypes.join(', ')}`);
  }

  // Get character to verify it exists and get world
  const character = await Character.findById(characterId);
  if (!character) {
    throw new Error('Character not found');
  }

  // Create NPC connection
  const npc = new NPC({
    fromCharacter: characterId,
    world: character.world,
    connectionType,
    description: description || '',
    isFullyCreated: false
  });

  await npc.save();
  return npc;
}

/**
 * Create multiple NPC connections at once
 * @param {string} characterId - The ID of the character creating the connections
 * @param {Array<{type: string, description?: string}>} connections - Array of connection objects
 * @returns {Promise<Array<Object>>} - Array of created NPC documents
 */
export async function createNPCConnections(characterId, connections) {
  const character = await Character.findById(characterId);
  if (!character) {
    throw new Error('Character not found');
  }

  const npcs = connections.map(conn => ({
    fromCharacter: characterId,
    world: character.world,
    connectionType: conn.type || 'other',
    description: conn.description || '',
    isFullyCreated: false
  }));

  const createdNPCs = await NPC.insertMany(npcs);
  return createdNPCs;
}

/**
 * Get all NPC connections for a character
 * @param {string} characterId - The ID of the character
 * @returns {Promise<Array<Object>>} - Array of NPC documents
 */
export async function getCharacterNPCs(characterId) {
  return await NPC.find({ fromCharacter: characterId })
    .populate('fromCharacter', 'name')
    .populate('world', 'name')
    .sort({ createdAt: -1 });
}

/**
 * Get NPC connections by type for a character
 * @param {string} characterId - The ID of the character
 * @param {string} connectionType - Type of connection to filter by
 * @returns {Promise<Array<Object>>} - Array of NPC documents
 */
export async function getCharacterNPCsByType(characterId, connectionType) {
  return await NPC.find({ 
    fromCharacter: characterId,
    connectionType 
  })
    .populate('fromCharacter', 'name')
    .populate('world', 'name')
    .sort({ createdAt: -1 });
}

/**
 * Delete an NPC connection
 * @param {string} npcId - The ID of the NPC to delete
 * @returns {Promise<Object>} - Deleted NPC document
 */
export async function deleteNPCConnection(npcId) {
  const npc = await NPC.findByIdAndDelete(npcId);
  if (!npc) {
    throw new Error('NPC not found');
  }
  return npc;
}

/**
 * Mark an NPC as fully created (admin function)
 * @param {string} npcId - The ID of the NPC
 * @returns {Promise<Object>} - Updated NPC document
 */
export async function markNPCAsFullyCreated(npcId) {
  const npc = await NPC.findByIdAndUpdate(
    npcId,
    { isFullyCreated: true },
    { new: true }
  );
  if (!npc) {
    throw new Error('NPC not found');
  }
  return npc;
}

