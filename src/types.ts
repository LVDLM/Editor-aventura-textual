/**
 * Types for the Point & Click Text Adventure Engine (Motor de Aventuras en Texto)
 */

export type VerbType = 'mirar' | 'usar' | 'abrir' | 'coger' | 'hablar' | 'empujar' | 'ir_a';

export interface VerbDefinition {
  id: VerbType;
  label: string;
  iconName: string;
  defaultText: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
}

export interface StateChange {
  setFlags?: Record<string, boolean>; // e.g., { habitacion_iluminada: true }
  addItemId?: string; // Add item to inventory
  removeItemId?: string; // Remove item from inventory
  goToSceneId?: string; // Jump to another scene
  appendStoryText?: string; // Append extra text paragraph to current scene
  revealHotspotIds?: string[]; // Enable hidden hotspots
  hideHotspotIds?: string[]; // Disable hotspots
}

export interface ActionRule {
  id: string;
  verb: VerbType;
  requiredItemId?: string; // e.g. 'llave_comoda' needed to open
  requiredFlags?: Record<string, boolean>; // Flags that must match for this action to trigger
  visibleIfFlags?: Record<string, boolean>;
  hiddenIfFlags?: Record<string, boolean>;
  
  // What happens when triggered
  responseMessage: string; // Message printed in narrative response box
  stateChange?: StateChange;
  
  // Custom priority or condition fail message
  failMessage?: string; // Message if required item or flag is missing
}

export interface Hotspot {
  id: string;
  word: string; // The exact text substring in the scene text to make clickable
  label?: string; // Optional display label or full item name
  initialVisible: boolean; // Is it interactive right away?
  visibleIfFlags?: Record<string, boolean>; // Hidden unless flags match
  hiddenIfFlags?: Record<string, boolean>; // Hidden if flags match
  actions: ActionRule[];
  customDefaultResponses?: Partial<Record<VerbType, string>>;
}

export interface SceneTextBlock {
  id: string;
  text: string; // Narrative text content
  visibleIfFlags?: Record<string, boolean>;
  hiddenIfFlags?: Record<string, boolean>;
}

export interface Scene {
  id: string;
  name: string;
  description?: string;
  textBlocks: SceneTextBlock[];
  hotspots: Hotspot[];
}

export type EngineTheme = 'classic-retro' | 'modern-dark' | 'sepia-parchment' | 'cyber-terminal' | 'emerald-vintage';

export interface GameProject {
  id: string;
  title: string;
  author: string;
  version: string;
  description: string;
  theme: EngineTheme;
  initialSceneId: string;
  
  defaultResponses: Record<VerbType, string>;
  globalFlags: Record<string, boolean>; // Initial default flags
  inventoryItems: InventoryItem[];
  scenes: Scene[];
}

export interface SaveSlotData {
  id: string;
  timestamp: string;
  gameId: string;
  gameTitle: string;
  currentSceneId: string;
  currentSceneName: string;
  inventoryItemIds: string[];
  flags: Record<string, boolean>;
  narrativeHistory: { id: string; type: 'story' | 'response' | 'system'; text: string; timestamp?: string }[];
  appendedTextsPerScene: Record<string, string[]>;
  usedHotspotIds?: string[];
  difficulty?: 'facil' | 'normal';
}
