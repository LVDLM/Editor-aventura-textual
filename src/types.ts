/**
 * Types for the Point & Click Text Adventure Engine (Motor de Aventuras en Texto)
 */

export type StandardVerbType = 'mirar' | 'usar' | 'abrir' | 'coger' | 'hablar' | 'empujar' | 'ir_a';
export type VerbType = StandardVerbType | (string & {});

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
  useEffectAction?: ActionRule; // Direct effect when used on itself / directly from inventory
  combinations?: ActionRule[]; // Combinations / interactions with other inventory items
}

export type SoundSourceType = 'synth' | 'url';

export type SoundCategory =
  | 'ui'
  | 'action'
  | 'movement'
  | 'environment'
  | 'magic'
  | 'horror'
  | 'music'
  | 'custom';

export type InstrumentType =
  | 'custom'
  | 'piano'
  | 'organ'
  | 'flute'
  | 'strings'
  | 'bell'
  | 'synth_bass'
  | 'xylophone'
  | 'chiptune'
  | 'brass'
  | 'harp'
  | 'music_box'
  | 'drum';

/** Zona de resonancia del "tracto vocal". `freqs` es una trayectoria en el tiempo (1 valor = fija). */
export interface VoiceFormant {
  freqs: number[]; // Hz
  q?: number; // Selectividad (3 = ancha / 15 = muy marcada)
  gain?: number; // 0 to 4
}

/** Parámetros del motor de voz orgánica (ver utils/voiceEngine.js). Todos opcionales. */
export interface VoiceConfig {
  contour?: number[]; // Multiplicadores de tono respecto a startFreq, equiespaciados en el tiempo
  contourDepth?: number; // 0..2.5 intensidad del contorno (1 = tal cual, <1 más plano, >1 más exagerado)
  envelope?: number[]; // Curva de volumen 0..1, equiespaciada en el tiempo
  formants?: VoiceFormant[];
  formantScale?: number; // 0.4 (criatura enorme) a 2.5 (muy pequeña)
  breath?: number; // 0..1 aire / soplido
  voicing?: number; // 0..1 (0 = solo aire, susurro)
  roughness?: number; // 0..1 gruñido (modulación de amplitud)
  roughnessRate?: number; // Hz 8..120
  subharmonic?: number; // 0..1 voz crujiente (una octava más grave)
  drive?: number; // 0..1 saturación
  jitter?: number; // 0..1 inestabilidad de tono
  shimmer?: number; // 0..1 inestabilidad de volumen
  vibratoRate?: number; // Hz
  vibratoDepth?: number; // cents
  vibratoDelay?: number; // 0..0.95 fracción de la duración antes de que entre el vibrato
  unison?: number; // cents de desafinación del 2º oscilador (grosor)
  brightness?: number; // 0..1
  reverb?: number; // 0..1
  seed?: number; // semilla del azar (mismo valor = mismo sonido)
}

export interface SynthSoundConfig {
  // 'voice': motor de voz orgánica configurable (voice). 'animal_cry': modelo fijo de maullido.
  /** Mantiene el volumen constante hasta el final (sin decaimiento). */
  sustain?: boolean;
  synthesisProfile?: 'animal_cry' | 'voice';
  voice?: VoiceConfig;
  oscType: 'sine' | 'triangle' | 'square' | 'sawtooth' | 'noise' | 'fm_synth' | 'arpeggio' | 'laser';
  instrument?: InstrumentType;
  startFreq: number; // Hz (20 to 5000)
  endFreq?: number; // Hz ramp target
  rampType?: 'linear' | 'exponential' | 'instant';
  duration: number; // Seconds (0.04 to 5.0)
  volume: number; // 0.0 to 1.0
  filterType?: 'none' | 'lowpass' | 'highpass' | 'bandpass' | 'notch';
  filterFreq?: number; // Hz (50 to 12000)
  filterQ?: number; // Q factor (0.1 to 25)
  lfoFreq?: number; // Hz (0.1 to 40)
  lfoGain?: number; // Depth (0 to 300)
  noiseMix?: number; // 0.0 to 1.0
  arpeggioNotes?: number[]; // list of frequencies in Hz
  arpeggioSpeed?: number; // interval in seconds between notes
}

export interface SoundDefinition {
  id: string; // Unique ID (e.g. 'fanfare', 'custom_sword_clash')
  name: string; // User-friendly name
  description?: string;
  category: SoundCategory;
  sourceType: SoundSourceType;
  url?: string; // External or uploaded audio file (mp3, wav, ogg)
  synthConfig?: SynthSoundConfig;
  isGlobal?: boolean; // True if official platform sound
  isDefault?: boolean; // True if default built-in preset
  projectTitle?: string; // Optional title of the project this sound belongs to
  updatedAt?: string;
  updatedBy?: string;
}

export type SoundEffectType = string;

export const SOUND_EFFECT_OPTIONS: { id: SoundEffectType; label: string; category?: string }[] = [
  { id: 'none', label: 'Sin Sonido', category: 'ui' },
  { id: 'fanfare', label: 'Fanfarria breve (Triunfo / Descubrimiento)', category: 'music' },
  { id: 'door_squeak', label: 'Chirrido de puerta / Mueble', category: 'environment' },
  { id: 'damage', label: 'Recibir daño / Impacto', category: 'action' },
  { id: 'gunshot', label: 'Disparo de arma de fuego', category: 'action' },
  { id: 'pickup', label: 'Coger objeto (Tono rápido)', category: 'action' },
  { id: 'unlock', label: 'Abrir cerrojo / Llave', category: 'action' },
  { id: 'secret', label: 'Secreto / Magia / Arpegio', category: 'magic' },
  { id: 'thunder', label: 'Trueno / Estruendo', category: 'environment' },
  { id: 'page_turn', label: 'Pasar página / Hoja', category: 'environment' },
  { id: 'footsteps', label: 'Pasos / Caminar', category: 'movement' },
  { id: 'monster', label: 'Rugido de monstruo', category: 'horror' },
  { id: 'game_over', label: 'Fin de partida / Muerte', category: 'horror' },
  { id: 'click', label: 'Clic de interfaz', category: 'ui' },
  { id: 'error', label: 'Error / Impasable', category: 'ui' },
  { id: 'bell_toll', label: 'Campanada solemne', category: 'environment' },
  { id: 'magic_spell', label: 'Hechizo / Destello místico', category: 'magic' },
  { id: 'water_splash', label: 'Gota / Salpicadura de agua', category: 'environment' },
  { id: 'sword_clash', label: 'Choque de espadas metálico', category: 'action' },
  { id: 'coin_drop', label: 'Tintineo de monedas de oro', category: 'action' },
  { id: 'laser_retro', label: 'Rayo láser arcade sintetizado', category: 'action' },
  { id: 'creepy_ambient', label: 'Tensión y misterio ambiental', category: 'horror' },
];

export interface StateChange {
  setFlags?: Record<string, boolean>; // e.g., { habitacion_iluminada: true }
  addItemId?: string; // Add item to inventory
  addItems?: Record<string, number>; // Add multiple items or multiple quantities: { [itemId]: quantity }
  removeItemId?: string; // Remove item from inventory
  removeItem2Id?: string; // Optional second item to remove from inventory (e.g. for item combinations)
  removeItems?: Record<string, number>; // Optional multiple items / quantities to remove: { [itemId]: quantity }
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
  giveItems?: Record<string, number>; // Character gives multiple items or quantities to player (+items)
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
  soundEffect?: SoundEffectType; // Sound effect played when this paragraph block is revealed
  visibleIfFlags?: Record<string, boolean>;
  hiddenIfFlags?: Record<string, boolean>;
  requiredItemId?: string; // Single required inventory item for backwards compatibility
  requiredItemIds?: string[]; // Required inventory items (player must possess to see this block)
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
  timerMode?: 'sequence' | 'per_action'; // 'sequence' for total event duration, 'per_action' resets timer on each step
  sequence: QTEStep[]; // Ordered list of required actions
  onSuccessSceneId?: string; // Target scene on success
  onSuccessMessage?: string; // Custom narrative message on success
  onSuccessFlag?: string; // Global flag key to set to true on success
  onSuccessItemIds?: string[]; // Inventory item IDs granted to the player upon QTE success
  onFailSceneId?: string; // Target scene on fail/timeout
  onFailMessage?: string; // Custom message on fail/timeout
  onFailFlag?: string; // Global flag key to set to true on fail
  isFailGameOver?: boolean; // Triggers Game Over on fail
  incrementalParagraphs?: boolean; // Progressive paragraph reveals using [1], [2]...
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
  
  ratingAverage?: number; // Puntuación media en escala de 5 estrellas (e.g. 4.8)
  ratingCount?: number; // Número total de valoraciones acumuladas
  ratingTotal?: number; // Suma acumulada de estrellas
  publishedVersion?: number; // Versión pública activa (1, 2, 3...)

  gameCompleteTitle?: string; // Custom title for end message banner (e.g., "¡FIN DE LA AVENTURA!")
  gameCompleteSubtitle?: string; // Custom subtitle for end message banner (e.g., "Has completado felizmente la historia.")

  defaultResponses: Record<VerbType, string>;
  customVerbs?: VerbDefinition[]; // Custom action verbs defined for this specific game
  globalFlags: Record<string, boolean>; // Initial default flags
  inventoryItems: InventoryItem[];
  characters?: GameCharacter[];
  customSounds?: SoundDefinition[]; // Custom sounds added to this project (URL or Web Audio synth)
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
  deliveredRuleKeys?: string[]; // Fuentes de entrega de escena que ya entregaron sus objetos (no repetir al volver)
  difficulty?: 'facil' | 'normal' | 'dificil';
}

export type UserRole = 'admin' | 'author';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  photoURL?: string;
  isSuspended?: boolean;
  suspendedReason?: string;
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
  ratingAverage?: number; // Puntuación media en escala de 5 estrellas (e.g. 4.8)
  ratingCount?: number; // Número total de valoraciones acumuladas
  ratingTotal?: number; // Suma acumulada de estrellas
}

export interface StoryRating {
  id?: string;
  storyId: string;
  rating: number; // 1 to 5
  userId?: string;
  createdAt: string;
  updatedAt?: string;
}

