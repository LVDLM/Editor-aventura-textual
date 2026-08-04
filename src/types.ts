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
  imageUrl?: string; // URL or Base64 data URL
  imageFileData?: string; // Uploaded Base64 file data
  imageFileName?: string; // Filename for ZIP export (e.g. img/item_llave.png)
  isGameOver?: boolean; // Triggers end of game when inspected/used
}

export interface StateChange {
  setFlags?: Record<string, boolean>; // e.g., { habitacion_iluminada: true }
  addItemId?: string; // Add item to inventory
  removeItemId?: string; // Remove item from inventory
  goToSceneId?: string; // Jump to another scene
  appendStoryText?: string; // Append extra text paragraph to current scene
  revealHotspotIds?: string[]; // Enable hidden hotspots
  hideHotspotIds?: string[]; // Disable hotspots
  isGameOver?: boolean; // Triggers game over / end of game
  gameOverMessage?: string; // Optional custom message/title for game over
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
  isGameOver?: boolean; // Direct game over flag on action rule
  
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
  type?: 'portada' | 'introduccion' | 'normal';
  text: string; // Narrative text content
  imageUrl?: string; // URL or Base64 data URL
  imageFileData?: string; // Uploaded Base64 file data
  imageFileName?: string; // Filename for ZIP export (e.g. img/escena_bosque.png)
  coverMode?: 'full' | 'with_text'; // 'full' = Portada completa, 'with_text' = Acompañada de texto
  visibleIfFlags?: Record<string, boolean>;
  hiddenIfFlags?: Record<string, boolean>;
  isGameOver?: boolean; // Marks paragraph as triggering end of game
}

export type SceneType = 'portada' | 'introduccion' | 'normal' | 'qte';

export interface QTEStep {
  id: string;
  hotspotId?: string; // Target hotspot ID in the scene
  word?: string; // Word or target label
  label: string; // Step instruction e.g., "¡Agacharse a la derecha!", "¡Usar palanca!"
  expectedVerb?: VerbType; // Required verb (e.g., 'usar', 'empujar', 'mirar' or undefined for any click)
}

export interface QTEConfig {
  timeLimitSeconds: number; // Duration of the event in seconds (e.g. 10)
  sequence: QTEStep[]; // Ordered list of required actions
  onSuccessSceneId?: string; // Target scene on success
  onSuccessMessage?: string; // Custom narrative message on success
  onFailSceneId?: string; // Target scene on fail/timeout
  onFailMessage?: string; // Custom message on fail/timeout
  isFailGameOver?: boolean; // Triggers Game Over on fail
}

export interface Scene {
  id: string;
  name: string;
  type?: SceneType;
  description?: string;
  textBlocks: SceneTextBlock[];
  hotspots: Hotspot[];
  qteConfig?: QTEConfig;
}

export type EngineTheme = 'classic-retro' | 'modern-dark' | 'sepia-parchment' | 'cyber-terminal' | 'emerald-vintage';

export interface GameProject {
  id: string;
  title: string;
  author: string;
  version: string;
  description: string;
  synopsis?: string; // Detailed story synopsis shown in library and cover details
  credits?: string; // Credits, image sources, collaborators, and acknowledgments
  theme: EngineTheme;
  initialSceneId: string;
  allowDownload?: boolean; // Whether users other than author/admin can download story
  
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

export type UserRole = 'admin' | 'author';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export type PublicationStatus = 'draft' | 'pending_review' | 'published' | 'rejected';

export interface CloudProjectDoc {
  id: string;
  title: string;
  description: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  status: PublicationStatus;
  projectData: GameProject;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  reviewFeedback?: string;
  coverImage?: string;
  genre?: string;
  allowDownload?: boolean; // Whether non-author users can download HTML/ZIP
}

