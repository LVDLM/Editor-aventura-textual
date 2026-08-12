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
  combinations?: ActionRule[]; // Combinations / interactions with other inventory items
}

export type SoundEffectType =
  | 'none'
  | 'fanfare'
  | 'door_squeak'
  | 'damage'
  | 'gunshot'
  | 'pickup'
  | 'unlock'
  | 'secret'
  | 'thunder'
  | 'page_turn'
  | 'footsteps'
  | 'monster'
  | 'game_over'
  | 'click'
  | 'error';

export const SOUND_EFFECT_OPTIONS: { id: SoundEffectType; label: string }[] = [
  { id: 'none', label: 'Sin Sonido' },
  { id: 'fanfare', label: '🎺 Fanfarria breve (Coger objeto / Triunfo)' },
  { id: 'door_squeak', label: '🚪 Chirrido de puerta / Mueble' },
  { id: 'damage', label: '💥 Recibir daño / Impacto' },
  { id: 'gunshot', label: '🔫 Disparo de arma de fuego' },
  { id: 'pickup', label: '📦 Coger objeto (Tono rápido)' },
  { id: 'unlock', label: '🗝️ Abrir cerrojo / Llave' },
  { id: 'secret', label: '✨ Secreto / Magia / Arpegio' },
  { id: 'thunder', label: '🌩️ Trueno / Estruendo' },
  { id: 'page_turn', label: '📜 Pasar página / Hoja' },
  { id: 'footsteps', label: '👣 Pasos / Caminar' },
  { id: 'monster', label: '👾 Rugido de monstruo' },
  { id: 'game_over', label: '💀 Fin de partida / Muerte' },
  { id: 'click', label: '🔘 Clic de interfaz' },
  { id: 'error', label: '❌ Error / Impasable' },
];

export interface StateChange {
  setFlags?: Record<string, boolean>; // e.g., { habitacion_iluminada: true }
  addItemId?: string; // Add item to inventory
  removeItemId?: string; // Remove item from inventory
  removeItem2Id?: string; // Optional second item to remove from inventory (e.g. for item combinations)
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
  
  // What happens when triggered (Conditions MET)
  responseMessage: string; // Message printed in narrative response box
  characterId?: string; // Optional character triggered by action
  dialogue?: DialogueBlock; // Optional dialogue block triggered by action
  stateChange?: StateChange;
  isGameOver?: boolean; // Direct game over flag on action rule
  soundEffect?: SoundEffectType; // Sound effect triggered with this action response
  
  // Custom priority or condition fail message & consequences (Conditions NOT MET)
  failMessage?: string; // Message if required item or flag is missing
  failStateChange?: StateChange; // Consecuencias / Cambios de estado si no se cumplen las condiciones
  failIsGameOver?: boolean; // Fin de partida si no se cumplen las condiciones
  failSoundEffect?: SoundEffectType; // Efecto de sonido si no se cumplen las condiciones
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

export interface GameCharacter {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  imageFileData?: string;
  imageFileName?: string;
  healthPoints?: number;
  initialItemId?: string; // Default item held by character
}

export interface DialogueOption {
  id: string;
  playerText: string; // What the player says / selects
  npcResponse: string; // What the NPC replies
  nextNodeId?: string; // ID of next DialogueNode in tree, or undefined/empty to keep current node
  requiredItemId?: string; // Requires item in player's inventory (-item / requirement)
  consumeRequiredItem?: boolean; // If true, removes requiredItemId from player inventory (-item)
  giveItemId?: string; // Character gives item to player (+item)
  requiredFlags?: Record<string, boolean>;
  visibleIfFlags?: Record<string, boolean>;
  hiddenIfFlags?: Record<string, boolean>;
  setFlags?: Record<string, boolean>;
  appendStoryText?: string; // Extra narrative text paragraph inserted into story log
  goToSceneId?: string; // Leads to a new scene / advances story
  isOneTime?: boolean; // Disappears after selection
  endConversation?: boolean; // Closes dialogue window
  isGameOver?: boolean;
  soundEffect?: SoundEffectType;
}

export interface DialogueNode {
  id: string;
  title: string; // E.g. "Nodo 1: Saludo inicial", "Nodo 2: Insultos", "Nodo 3: Entrega de objeto"
  npcPrompt?: string; // What the NPC says at this node (e.g. "¡Luchas como un granjero!")
  options: DialogueOption[];
}

export interface DialogueBlock {
  characterId: string;
  greeting?: string; // Default initial NPC prompt
  initialNodeId?: string; // Starting node ID
  nodes?: DialogueNode[]; // Tree of conversation nodes
  options?: DialogueOption[]; // Legacy flat options
}

export interface SceneTextBlock {
  id: string;
  type?: 'portada' | 'introduccion' | 'normal' | 'final';
  text: string; // Narrative text content
  imageUrl?: string; // URL or Base64 data URL
  imageFileData?: string; // Uploaded Base64 file data
  imageFileName?: string; // Filename for ZIP export (e.g. img/escena_bosque.png)
  coverMode?: 'full' | 'with_text'; // 'full' = Portada completa, 'with_text' = Acompañada de texto
  visibleIfFlags?: Record<string, boolean>;
  hiddenIfFlags?: Record<string, boolean>;
  isGameOver?: boolean; // Marks paragraph as triggering end of game
  characterId?: string; // Character associated with this paragraph
  dialogue?: DialogueBlock; // Dialogue attached to this paragraph
}

export type SceneType = 'portada' | 'introduccion' | 'normal' | 'qte' | 'final';

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
  sfx?: SoundEffectType; // Sound played when entering/loading this scene
  textBlocks: SceneTextBlock[];
  hotspots: Hotspot[];
  qteConfig?: QTEConfig;
}

export type EngineTheme = 'classic-retro' | 'modern-dark' | 'sepia-parchment' | 'cyber-terminal' | 'emerald-vintage';

export const GENRE_TAGS = [
  'aventura',
  'ciencia-ficción',
  'drama',
  'erótica',
  'fantasía',
  'humor',
  'misterio',
  'otros',
  'policiaca',
  'romántica',
  'terror',
] as const;

export type GenreTag = typeof GENRE_TAGS[number];

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
  genreTags?: string[]; // Genre tags chosen by author/admin
  
  gameCompleteTitle?: string; // Custom title for end message banner (e.g., "¡FIN DE LA AVENTURA!")
  gameCompleteSubtitle?: string; // Custom subtitle for end message banner (e.g., "Has completado felizmente la historia.")

  defaultResponses: Record<VerbType, string>;
  globalFlags: Record<string, boolean>; // Initial default flags
  inventoryItems: InventoryItem[];
  characters?: GameCharacter[];
  scenes: Scene[];
}

export type AppendedTextEntry = string | { text: string; blockId?: string };

export interface SaveSlotData {
  id: string;
  timestamp: string;
  gameId: string;
  gameTitle: string;
  currentSceneId: string;
  currentSceneName: string;
  inventoryItemIds: string[];
  flags: Record<string, boolean>;
  usedDialogueOptionIds?: string[];
  narrativeHistory: { id: string; type: 'story' | 'response' | 'system'; text: string; timestamp?: string }[];
  appendedTextsPerScene: Record<string, AppendedTextEntry[]>;
  usedHotspotIds?: string[];
  difficulty?: 'facil' | 'normal' | 'dificil';
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
  projectData: GameProject; // Working draft
  publishedData?: GameProject; // Live published snapshot
  publishedVersion?: number; // Live published version number (1, 2, 3...)
  draftVersion?: number; // Current draft version number
  hasUnpublishedChanges?: boolean; // True if draft has been modified since last publish
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  reviewFeedback?: string;
  coverImage?: string;
  genre?: string;
  genreTags?: string[];
  allowDownload?: boolean; // Whether non-author users can download HTML/ZIP
}

