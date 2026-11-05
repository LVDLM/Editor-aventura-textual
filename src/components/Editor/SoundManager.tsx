import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Play,
  Square,
  Plus,
  Trash2,
  Copy,
  Save,
  RotateCcw,
  Sparkles,
  Shield,
  FolderPlus,
  Sliders,
  Search,
  CheckCircle,
  AlertCircle,
  Music,
  Globe,
  Lock,
} from 'lucide-react';
import {
  GameProject,
  SoundCategory,
  SoundDefinition,
  SynthSoundConfig,
  UserProfile,
  InstrumentType,
} from '../../types';
import {
  DEFAULT_SOUND_LIBRARY,
  getAudioContext,
  playSynthWithConfig,
  previewSoundDefinition,
  stopAllAudio,
  INSTRUMENT_OPTIONS,
} from '../../utils/audio';
import {
  fetchGlobalSoundLibraryFromFirestore,
  saveGlobalSoundLibraryToFirestore,
  resetGlobalSoundLibraryInFirestore,
} from '../../lib/firebase';

interface SoundManagerProps {
  project: GameProject;
  updateProject: (fn: (prev: GameProject) => GameProject) => void;
  currentUser?: UserProfile | null;
  webAspect?: 'clean' | 'classic';
}

const CATEGORY_LABELS: Record<SoundCategory | 'all', { label: string; color: string }> = {
  all: { label: 'Todos los Sonidos', color: 'text-amber-400' },
  ui: { label: 'Interfaz (UI)', color: 'text-sky-400' },
  action: { label: 'Acciones & Objetos', color: 'text-amber-400' },
  movement: { label: 'Movimiento & Pasos', color: 'text-emerald-400' },
  environment: { label: 'Ambiente & Entorno', color: 'text-teal-400' },
  magic: { label: 'Magia & Secretos', color: 'text-purple-400' },
  horror: { label: 'Terror & Monstruos', color: 'text-rose-400' },
  music: { label: 'Música & Fanfarrias', color: 'text-yellow-400' },
  custom: { label: 'Personalizados', color: 'text-indigo-400' },
};

// Quick Synth Templates
const SYNTH_TEMPLATES: { name: string; config: SynthSoundConfig }[] = [
  {
    name: 'Campanada Solemne',
    config: {
      oscType: 'sine',
      instrument: 'bell',
      startFreq: 261.63,
      endFreq: 255,
      rampType: 'exponential',
      duration: 1.8,
      volume: 0.35,
      lfoFreq: 3,
      lfoGain: 6,
      filterType: 'lowpass',
      filterFreq: 800,
    },
  },
  {
    name: 'Piano Acústico',
    config: {
      oscType: 'triangle',
      instrument: 'piano',
      startFreq: 440,
      duration: 0.7,
      volume: 0.35,
    },
  },
  {
    name: 'Órgano de Tubos',
    config: {
      oscType: 'sine',
      instrument: 'organ',
      startFreq: 261.63,
      duration: 0.9,
      volume: 0.3,
    },
  },
  {
    name: 'Cuerdas Orquestales',
    config: {
      oscType: 'sawtooth',
      instrument: 'strings',
      startFreq: 440,
      duration: 0.85,
      volume: 0.3,
    },
  },
  {
    name: 'Flauta Mística',
    config: {
      oscType: 'sine',
      instrument: 'flute',
      startFreq: 587.33,
      duration: 0.6,
      volume: 0.3,
    },
  },
  {
    name: 'Láser Retro Arcade',
    config: {
      oscType: 'sawtooth',
      instrument: 'chiptune',
      startFreq: 1800,
      endFreq: 120,
      rampType: 'exponential',
      duration: 0.22,
      volume: 0.28,
    },
  },
  {
    name: 'Moneda 8-Bit',
    config: {
      oscType: 'arpeggio',
      startFreq: 987.77,
      duration: 0.28,
      volume: 0.25,
      arpeggioNotes: [987.77, 1318.51],
      arpeggioSpeed: 0.08,
    },
  },
  {
    name: 'Fanfarria Triunfal',
    config: {
      oscType: 'arpeggio',
      startFreq: 523.25,
      duration: 0.45,
      volume: 0.3,
      arpeggioNotes: [523.25, 659.25, 783.99, 1046.5],
      arpeggioSpeed: 0.09,
    },
  },
  {
    name: 'Hechizo Mágico',
    config: {
      oscType: 'arpeggio',
      startFreq: 880,
      duration: 0.45,
      volume: 0.25,
      arpeggioNotes: [880, 1108.73, 1318.51, 1760, 2093.0],
      arpeggioSpeed: 0.06,
    },
  },
  {
    name: 'Chirrido de Puerta',
    config: {
      oscType: 'sawtooth',
      startFreq: 420,
      endFreq: 550,
      rampType: 'linear',
      duration: 0.54,
      volume: 0.22,
      filterType: 'bandpass',
      filterFreq: 650,
      filterQ: 2.5,
    },
  },
  {
    name: 'Disparo / Impacto',
    config: {
      oscType: 'noise',
      startFreq: 3000,
      endFreq: 150,
      rampType: 'exponential',
      duration: 0.38,
      volume: 0.4,
      filterType: 'lowpass',
      filterFreq: 2800,
    },
  },
  {
    name: 'Trueno Distante',
    config: {
      oscType: 'noise',
      startFreq: 450,
      endFreq: 80,
      rampType: 'linear',
      duration: 1.2,
      volume: 0.35,
      filterType: 'lowpass',
      filterFreq: 420,
    },
  },
  {
    name: 'Rugido de Monstruo',
    config: {
      oscType: 'sawtooth',
      startFreq: 140,
      endFreq: 45,
      rampType: 'exponential',
      duration: 0.6,
      volume: 0.3,
      lfoFreq: 16,
      lfoGain: 35,
    },
  },
  {
    name: 'Grito animal',
    config: {
      synthesisProfile: 'animal_cry',
      oscType: 'sine',
      startFreq: 620,
      endFreq: 390,
      rampType: 'linear',
      duration: 0.95,
      volume: 0.34,
    },
  },
  {
    name: 'Pasar Hoja',
    config: {
      oscType: 'noise',
      startFreq: 1200,
      endFreq: 800,
      rampType: 'linear',
      duration: 0.18,
      volume: 0.18,
      filterType: 'bandpass',
      filterFreq: 1200,
      filterQ: 1.8,
    },
  },
  {
    name: 'Choque de Espadas',
    config: {
      oscType: 'sawtooth',
      startFreq: 1400,
      endFreq: 350,
      rampType: 'exponential',
      duration: 0.28,
      volume: 0.3,
      noiseMix: 0.4,
      filterType: 'bandpass',
      filterFreq: 1500,
      filterQ: 4.0,
    },
  },
];

export const SoundManager: React.FC<SoundManagerProps> = ({
  project,
  updateProject,
  currentUser,
  webAspect = 'clean',
}) => {
  const isAdmin = currentUser?.role === 'admin' || currentUser?.email === 'lavozdelosmuertos@gmail.com';
  const isClean = webAspect === 'clean';

  // Global Library state from Firestore
  const [globalSounds, setGlobalSounds] = useState<SoundDefinition[]>([...DEFAULT_SOUND_LIBRARY]);
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(false);
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);
  const [globalFeedback, setGlobalFeedback] = useState<string | null>(null);

  // Filter & Search state
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'global' | 'project' | SoundCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSoundId, setSelectedSoundId] = useState<string>('click');

  // Currently playing sound ID for playback feedback
  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null);
  const [isPlayingTesting, setIsPlayingTesting] = useState(false);

  // Active sound being edited in the editor panel
  const [activeSoundForm, setActiveSoundForm] = useState<SoundDefinition | null>(null);
  const [urlTestingStatus, setUrlTestingStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [urlErrorMessage, setUrlErrorMessage] = useState('');

  // Load Global Sound Library from Firestore on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoadingGlobal(true);
    fetchGlobalSoundLibraryFromFirestore()
      .then((sounds) => {
        if (isMounted) {
          setGlobalSounds(sounds);
          setIsLoadingGlobal(false);
        }
      })
      .catch((e) => {
        console.warn('Error loading sound library:', e);
        if (isMounted) setIsLoadingGlobal(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Combined sound catalog: Global Library + Project Custom Sounds
  const projectCustomSounds = project.customSounds || [];

  const allMergedSounds: SoundDefinition[] = [
    ...globalSounds.map((s) => ({ ...s, isGlobal: true })),
    ...projectCustomSounds.filter((cs) => !globalSounds.some((gs) => gs.id === cs.id)),
  ];

  // Select sound on initial load or sound change
  useEffect(() => {
    const found = allMergedSounds.find((s) => s.id === selectedSoundId) || allMergedSounds[0];
    if (found) {
      // Check if project has custom override
      const projectOverride = projectCustomSounds.find((s) => s.id === found.id);
      setActiveSoundForm(projectOverride ? { ...projectOverride, isGlobal: false } : { ...found });
    }
  }, [selectedSoundId, globalSounds, project.customSounds]);

  // Filtered sounds list
  const filteredSounds = allMergedSounds.filter((sound) => {
    const matchesSearch =
      sound.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sound.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sound.description && sound.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'global') return sound.isGlobal;
    if (selectedFilter === 'project') return !sound.isGlobal;
    return sound.category === selectedFilter;
  });

  // Sound Playback Handler
  const handlePlaySound = async (sound: SoundDefinition) => {
    stopAllAudio();
    try {
      setPlayingSoundId(sound.id);
      setIsPlayingTesting(true);
      await previewSoundDefinition(sound);
    } catch (e) {
      console.warn('Playback error:', e);
    } finally {
      setPlayingSoundId(null);
      setIsPlayingTesting(false);
    }
  };

  const handleStopPreview = () => {
    stopAllAudio();
    setPlayingSoundId(null);
    setIsPlayingTesting(false);
  };

  // Sound Testing inside Form
  const handleTestActiveForm = async () => {
    if (!activeSoundForm) return;
    handleStopPreview();
    try {
      setIsPlayingTesting(true);
      if (activeSoundForm.sourceType === 'url' && activeSoundForm.url) {
        setUrlTestingStatus('testing');
        setUrlErrorMessage('');
        await previewSoundDefinition(activeSoundForm);
        setUrlTestingStatus('success');
      } else {
        await previewSoundDefinition(activeSoundForm);
      }
    } catch (err: any) {
      setUrlTestingStatus('error');
      setUrlErrorMessage(err?.message || 'No se pudo reproducir el sonido.');
    } finally {
      setIsPlayingTesting(false);
    }
  };

  // Add a brand new project sound
  const handleCreateNewProjectSound = () => {
    const randomId = `sonido_${Date.now().toString().slice(-4)}`;
    const newSound: SoundDefinition = {
      id: randomId,
      name: 'Nuevo Efecto de Sonido',
      description: 'Sonido personalizado creado en el proyecto',
      category: 'action',
      sourceType: 'synth',
      isGlobal: false,
      synthConfig: {
        oscType: 'sawtooth',
        instrument: 'custom',
        startFreq: 440,
        endFreq: 220,
        rampType: 'exponential',
        duration: 0.25,
        volume: 0.3,
      },
    };

    updateProject((prev) => ({
      ...prev,
      customSounds: [...(prev.customSounds || []), newSound],
    }));

    setSelectedSoundId(newSound.id);
    setActiveSoundForm({ ...newSound });
    setSelectedFilter('project');
  };

  // Duplicate an official library sound into current project for customization
  const handleDuplicateToProject = (sound: SoundDefinition) => {
    const copySound: SoundDefinition = {
      ...sound,
      id: sound.isGlobal ? `${sound.id}_custom` : `${sound.id}_copia`,
      name: `${sound.name} (Personalizado)`,
      isGlobal: false,
      isDefault: false,
    };

    updateProject((prev) => ({
      ...prev,
      customSounds: [...(prev.customSounds || []).filter((s) => s.id !== copySound.id), copySound],
    }));

    setSelectedSoundId(copySound.id);
    setActiveSoundForm({ ...copySound });
    setSelectedFilter('project');
  };

  // Save changes to active sound in Project
  const handleSaveToProject = () => {
    if (!activeSoundForm) return;

    const updated = { ...activeSoundForm, isGlobal: false };

    updateProject((prev) => {
      const existingList = prev.customSounds || [];
      const index = existingList.findIndex((s) => s.id === updated.id);
      let nextList = [...existingList];
      if (index >= 0) {
        nextList[index] = updated;
      } else {
        nextList.push(updated);
      }
      return {
        ...prev,
        customSounds: nextList,
      };
    });

    setGlobalFeedback('¡Sonido guardado correctamente en tu proyecto!');
    setTimeout(() => setGlobalFeedback(null), 3000);
  };

  // Delete sound from Project
  const handleDeleteFromProject = (soundId: string) => {
    updateProject((prev) => {
      const nextCustom = (prev.customSounds || []).filter((s) => s.id !== soundId);
      return {
        ...prev,
        customSounds: nextCustom,
      };
    });

    // Pick first available global sound to switch to smoothly
    const fallbackId = globalSounds[0]?.id || 'click';
    setSelectedSoundId(fallbackId);
    setGlobalFeedback('Sonido eliminado del proyecto.');
    setTimeout(() => setGlobalFeedback(null), 3000);
  };

  // ADMIN ACTION: Save sound changes to Global Library (Firestore)
  const handleAdminSaveToGlobalLibrary = async () => {
    if (!isAdmin || !activeSoundForm) return;

    setIsSavingGlobal(true);
    setGlobalFeedback(null);
    try {
      const targetSound: SoundDefinition = {
        ...activeSoundForm,
        isGlobal: true,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.email || 'Urdimbre',
      };

      // Update global sounds list
      const nextGlobalList = globalSounds.map((s) => (s.id === targetSound.id ? targetSound : s));
      if (!nextGlobalList.some((s) => s.id === targetSound.id)) {
        nextGlobalList.push(targetSound);
      }

      await saveGlobalSoundLibraryToFirestore(nextGlobalList, currentUser?.email || 'lavozdelosmuertos@gmail.com');
      setGlobalSounds(nextGlobalList);
      setGlobalFeedback('¡Sonido guardado en la Biblioteca Global de la Plataforma para todos los usuarios!');
    } catch (e: any) {
      alert('Error al guardar en Firestore: ' + (e?.message || e));
    } finally {
      setIsSavingGlobal(false);
      setTimeout(() => setGlobalFeedback(null), 4000);
    }
  };

  // ADMIN ACTION: Reset Global Library to defaults in Firestore
  const handleAdminResetGlobalLibrary = async () => {
    if (!isAdmin) return;
    if (
      confirm(
        '¿Restablecer toda la Biblioteca Global a los presets de sintetizador originales de fábrica? Se sincronizará en Firestore.'
      )
    ) {
      setIsSavingGlobal(true);
      try {
        await resetGlobalSoundLibraryInFirestore(currentUser?.email || 'lavozdelosmuertos@gmail.com');
        setGlobalSounds([...DEFAULT_SOUND_LIBRARY]);
        setGlobalFeedback('¡Biblioteca Global restablecida con éxito a los presets originales!');
      } catch (e: any) {
        alert('Error al restablecer: ' + (e?.message || e));
      } finally {
        setIsSavingGlobal(false);
        setTimeout(() => setGlobalFeedback(null), 4000);
      }
    }
  };

  // Apply a quick synth template to the active form
  const handleApplyTemplate = (template: typeof SYNTH_TEMPLATES[0]) => {
    if (!activeSoundForm) return;
    setActiveSoundForm({
      ...activeSoundForm,
      sourceType: 'synth',
      synthConfig: { ...template.config },
    });
    // Auto test template sound
    const ctx = getAudioContext();
    if (ctx) {
      playSynthWithConfig(ctx, template.config);
    }
  };

  // Handle instrument change
  const handleSelectInstrument = (instId: InstrumentType) => {
    if (!activeSoundForm) return;
    const option = INSTRUMENT_OPTIONS.find((o) => o.id === instId);
    const curr = activeSoundForm.synthConfig || {
      oscType: 'sine',
      startFreq: 440,
      duration: 0.4,
      volume: 0.3,
    };

    const nextConfig: SynthSoundConfig = {
      ...curr,
      instrument: instId,
      startFreq: option && instId !== 'custom' ? option.defaultFreq : curr.startFreq,
      duration: option && instId !== 'custom' ? option.defaultDur : curr.duration,
    };

    setActiveSoundForm({
      ...activeSoundForm,
      synthConfig: nextConfig,
    });

    const ctx = getAudioContext();
    if (ctx) {
      playSynthWithConfig(ctx, nextConfig);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div
        className={`p-5 rounded-2xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
          isClean ? 'bg-[#FFFDF6] border-[#E5DCB8]' : 'bg-[#2C241C] border-[#42362B]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-inner ${
              isClean ? 'bg-[#E5DCB8]/60 text-[#A4332A] border border-[#D9CFA9]' : 'bg-amber-500/10 border border-amber-500/30 text-amber-500'
            }`}
          >
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-serif font-bold text-lg ${isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}`}>
                Gestor de Sonidos y Sintetizador
              </h3>
              {isAdmin ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold flex items-center gap-1">
                  <Shield className="w-3 h-3 text-amber-400" />
                  <span>Modo Administrador (Urdimbre)</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 text-[11px] font-bold flex items-center gap-1">
                  <span>Modo Creador</span>
                </span>
              )}
            </div>
            <p className={`text-xs mt-0.5 ${isClean ? 'text-[#6B5C46]' : 'text-[#D1C7B7]'}`}>
              {isAdmin
                ? 'Edita y afina las ondas y frecuencias de la biblioteca global, inserta URLs de audio o añade nuevos efectos para toda la plataforma.'
                : 'Escucha y asigna sonidos de la biblioteca oficial a tus escenas y acciones, o crea sonidos y enlaces URL propios para tu historia.'}
            </p>
          </div>
        </div>

        {/* Global Admin Tools */}
        {isAdmin && (
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <button
              type="button"
              onClick={handleAdminResetGlobalLibrary}
              disabled={isSavingGlobal}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isClean
                  ? 'bg-[#F4EFE3] hover:bg-[#E5DCB8] text-[#6B5C46] border-[#E5DCB8]'
                  : 'bg-[#1F1913] hover:bg-[#382E25] text-[#D1C7B7] border-[#42362B]'
              }`}
              title="Restaurar toda la biblioteca oficial a los presets de síntesis de fábrica"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer Fábrica</span>
            </button>

            <button
              type="button"
              onClick={handleCreateNewProjectSound}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Sonido</span>
            </button>
          </div>
        )}
      </div>

      {/* Global Feedback Banner */}
      {globalFeedback && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{globalFeedback}</span>
        </div>
      )}

      {/* Main Grid: Catalog Sidebar & Audio Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sound Catalog & Categories (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Filter Bar & Search */}
          <div
            className={`p-4 rounded-2xl border shadow-sm space-y-3 ${
              isClean ? 'bg-[#FFFDF6] border-[#E5DCB8]' : 'bg-[#2C241C] border-[#42362B]'
            }`}
          >
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar sonidos por nombre..."
                className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border transition-all ${
                  isClean
                    ? 'bg-[#F4EFE3] border-[#E5DCB8] text-[#2A2118] focus:border-[#A4332A]'
                    : 'bg-[#1F1913] border-[#42362B] text-[#F4EFE3] focus:border-amber-500'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Scope Filter Tabs */}
            <div
              className={`flex items-center gap-1 p-1 rounded-xl border text-[11px] font-semibold ${
                isClean ? 'bg-[#F4EFE3] border-[#E5DCB8]' : 'bg-black/20 border-white/5'
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedFilter('all')}
                className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                  selectedFilter === 'all'
                    ? isClean
                      ? 'bg-[#A4332A] text-white font-bold shadow-sm'
                      : 'bg-amber-600 text-white font-bold shadow-sm'
                    : isClean
                    ? 'text-[#6B5C46] hover:text-[#2A2118]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos ({allMergedSounds.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('global')}
                className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
                  selectedFilter === 'global'
                    ? isClean
                      ? 'bg-[#A4332A] text-white font-bold shadow-sm'
                      : 'bg-amber-600 text-white font-bold shadow-sm'
                    : isClean
                    ? 'text-[#6B5C46] hover:text-[#2A2118]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Shield className="w-3 h-3 text-amber-300" />
                <span>Oficiales ({globalSounds.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('project')}
                className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
                  selectedFilter === 'project'
                    ? isClean
                      ? 'bg-[#A4332A] text-white font-bold shadow-sm'
                      : 'bg-amber-600 text-white font-bold shadow-sm'
                    : isClean
                    ? 'text-[#6B5C46] hover:text-[#2A2118]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Proyecto ({projectCustomSounds.length})</span>
              </button>
            </div>

            {/* Category Chips */}
            <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto pb-1">
              {(['ui', 'action', 'movement', 'environment', 'magic', 'horror', 'music'] as SoundCategory[]).map(
                (cat) => {
                  const info = CATEGORY_LABELS[cat];
                  const isActive = selectedFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedFilter(isActive ? 'all' : cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1 transition-all cursor-pointer ${
                        isActive
                          ? isClean
                            ? 'bg-[#A4332A] text-white border-[#872820] font-bold'
                            : 'bg-amber-500/30 border-amber-500/60 text-amber-200 font-bold'
                          : isClean
                          ? 'bg-[#F4EFE3] border-[#E5DCB8] text-[#6B5C46] hover:text-[#2A2118] hover:bg-[#EBE3CD]'
                          : 'bg-[#1F1913] border-[#42362B] text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>{info.label.split(' ')[0]}</span>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Sound List */}
          <div
            className={`p-3 rounded-2xl border shadow-sm space-y-2 max-h-[580px] overflow-y-auto ${
              isClean ? 'bg-[#FFFDF6] border-[#E5DCB8]' : 'bg-[#2C241C] border-[#42362B]'
            }`}
          >
            {filteredSounds.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Volume2 className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
                <p className={`text-xs ${isClean ? 'text-[#6B5C46]' : 'text-slate-400'}`}>
                  No se encontraron sonidos con los filtros seleccionados.
                </p>
                <button
                  type="button"
                  onClick={handleCreateNewProjectSound}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear Sonido Personalizado</span>
                </button>
              </div>
            ) : (
              filteredSounds.map((sound) => {
                const isSelected = selectedSoundId === sound.id;
                const isPlaying = playingSoundId === sound.id;

                return (
                  <div
                    key={sound.id}
                    onClick={() => {
                      setSelectedSoundId(sound.id);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? isClean
                          ? 'bg-[#EAE0C8] border-[#A4332A]/50 shadow-sm'
                          : 'bg-amber-500/15 border-amber-500/50 shadow-sm'
                        : isClean
                        ? 'bg-[#F4EFE3] hover:bg-[#E5DCB8]/70 border-[#E5DCB8]'
                        : 'bg-[#1F1913] hover:bg-[#2A2118] border-[#42362B]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Play / Stop Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlaySound(sound);
                        }}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all cursor-pointer shadow-sm flex-shrink-0 ${
                          isPlaying
                            ? 'bg-emerald-600 scale-105 ring-2 ring-emerald-400 animate-pulse'
                            : isClean
                            ? 'bg-[#A4332A] hover:bg-[#872820] hover:scale-105'
                            : 'bg-amber-600 hover:bg-amber-500 hover:scale-105'
                        }`}
                        title="Preescuchar sonido"
                      >
                        {isPlaying ? <Square className="w-3.5 h-3.5 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                      </button>

                      <div className="min-w-0">
                        <h4 className={`text-xs font-bold truncate ${isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}`}>
                          {sound.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                          <span className={`font-mono text-[10px] ${isClean ? 'text-[#872820] font-semibold' : 'text-amber-400/90'}`}>
                            {sound.id}
                          </span>
                          <span>•</span>
                          <span>{sound.sourceType === 'url' ? 'Audio URL' : 'Sintetizador'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {sound.isGlobal ? (
                        <span
                          className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1"
                          title="Sonido de la Biblioteca Oficial del Sistema"
                        >
                          <Shield className="w-3 h-3 text-amber-400" />
                          <span className="hidden sm:inline">Oficial</span>
                        </span>
                      ) : (
                        <span
                          className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold flex items-center gap-1"
                          title="Sonido exclusivo de este proyecto"
                        >
                          <span>Proyecto</span>
                        </span>
                      )}

                      {!sound.isGlobal && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFromProject(sound.id);
                          }}
                          className="p-1 text-rose-500 hover:text-rose-600 hover:bg-rose-500/20 rounded-lg transition-all cursor-pointer"
                          title="Eliminar sonido de este proyecto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Create Sound CTA */}
          <button
            type="button"
            onClick={handleCreateNewProjectSound}
            className={`w-full py-2.5 px-4 border border-dashed rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isClean
                ? 'bg-[#FFFDF6] hover:bg-[#E5DCB8] text-[#2A2118] border-[#D9CFA9]'
                : 'bg-[#2C241C] hover:bg-[#382E25] text-amber-200 border-amber-500/40'
            }`}
          >
            <FolderPlus className="w-4 h-4 text-amber-500" />
            <span>+ Añadir Nuevo Sonido al Proyecto</span>
          </button>
        </div>

        {/* Right Column: Interactive Sound Designer Studio (7 cols) */}
        <div className="lg:col-span-7">
          {activeSoundForm ? (
            <div
              className={`p-5 rounded-2xl border shadow-sm space-y-6 ${
                isClean ? 'bg-[#FFFDF6] border-[#E5DCB8]' : 'bg-[#2C241C] border-[#42362B]'
              }`}
            >
              {/* Studio Header & Live Preview Bar */}
              <div
                className={`p-4 rounded-xl border space-y-3 ${
                  isClean ? 'bg-[#F4EFE3] border-[#E5DCB8]' : 'bg-black/25 border-white/5'
                }`}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                        isClean ? 'bg-[#E5DCB8] text-[#A4332A]' : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold ${isClean ? 'text-[#2A2118]' : 'text-white'}`}>
                        {activeSoundForm.name}
                      </h4>
                      <p className={`text-[11px] font-mono ${isClean ? 'text-[#872820] font-semibold' : 'text-amber-400'}`}>
                        ID: {activeSoundForm.id}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestActiveForm}
                      disabled={isPlayingTesting}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 text-white shadow-md transition-all cursor-pointer ${
                        isPlayingTesting
                          ? 'bg-emerald-600 animate-pulse'
                          : isClean
                          ? 'bg-[#A4332A] hover:bg-[#872820]'
                          : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:brightness-110'
                      }`}
                    >
                      {isPlayingTesting ? <Square className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                      <span>{isPlayingTesting ? 'Reproduciendo...' : 'Probar Sonido'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Source Type Selector: Synth vs URL */}
              <div className="space-y-1.5">
                <label className={`text-xs font-bold block ${isClean ? 'text-[#2A2118]' : 'text-slate-300'}`}>
                  Tipo de Fuente de Sonido:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveSoundForm({ ...activeSoundForm, sourceType: 'synth' })}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      activeSoundForm.sourceType === 'synth'
                        ? isClean
                          ? 'bg-[#A4332A] text-white border-[#872820] shadow-sm'
                          : 'bg-amber-600 text-white border-amber-500 shadow-sm'
                        : isClean
                        ? 'bg-[#F4EFE3] border-[#E5DCB8] text-[#2A2118] hover:bg-[#EBE3CD]'
                        : 'bg-[#1F1913] border-[#42362B] text-slate-400 hover:bg-[#2A2118]'
                    }`}
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Sintetizador Web Audio</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSoundForm({ ...activeSoundForm, sourceType: 'url' })}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      activeSoundForm.sourceType === 'url'
                        ? isClean
                          ? 'bg-[#A4332A] text-white border-[#872820] shadow-sm'
                          : 'bg-amber-600 text-white border-amber-500 shadow-sm'
                        : isClean
                        ? 'bg-[#F4EFE3] border-[#E5DCB8] text-[#2A2118] hover:bg-[#EBE3CD]'
                        : 'bg-[#1F1913] border-[#42362B] text-slate-400 hover:bg-[#2A2118]'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    <span>Archivo URL (MP3 / WAV / OGG)</span>
                  </button>
                </div>
              </div>

              {/* Basic Fields: Name, Category, Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={`text-xs font-bold block ${isClean ? 'text-[#2A2118]' : 'text-slate-300'}`}>
                    Nombre del Sonido:
                  </label>
                  <input
                    type="text"
                    value={activeSoundForm.name}
                    onChange={(e) => setActiveSoundForm({ ...activeSoundForm, name: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border ${
                      isClean
                        ? 'bg-[#F4EFE3] border-[#E5DCB8] text-[#2A2118] focus:border-[#A4332A]'
                        : 'bg-[#1F1913] border-[#42362B] text-[#F4EFE3] focus:border-amber-500'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className={`text-xs font-bold block ${isClean ? 'text-[#2A2118]' : 'text-slate-300'}`}>
                    Categoría Temática:
                  </label>
                  <select
                    value={activeSoundForm.category}
                    onChange={(e) =>
                      setActiveSoundForm({ ...activeSoundForm, category: e.target.value as SoundCategory })
                    }
                    className={`w-full px-3 py-2 rounded-xl text-xs border ${
                      isClean
                        ? 'bg-[#F4EFE3] border-[#E5DCB8] text-[#2A2118] focus:border-[#A4332A]'
                        : 'bg-[#1F1913] border-[#42362B] text-[#F4EFE3] focus:border-amber-500'
                    }`}
                  >
                    {(['ui', 'action', 'movement', 'environment', 'magic', 'horror', 'music', 'custom'] as SoundCategory[]).map(
                      (cat) => (
                        <option key={cat} value={cat}>
                          {CATEGORY_LABELS[cat]?.label}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className={`text-xs font-bold block ${isClean ? 'text-[#2A2118]' : 'text-slate-300'}`}>
                  Descripción y Uso:
                </label>
                <input
                  type="text"
                  value={activeSoundForm.description || ''}
                  onChange={(e) => setActiveSoundForm({ ...activeSoundForm, description: e.target.value })}
                  placeholder="Ej: Sonido de cerradura al usar la llave dorada..."
                  className={`w-full px-3 py-2 rounded-xl text-xs border ${
                    isClean
                      ? 'bg-[#F4EFE3] border-[#E5DCB8] text-[#2A2118] focus:border-[#A4332A]'
                      : 'bg-[#1F1913] border-[#42362B] text-[#F4EFE3] focus:border-amber-500'
                  }`}
                />
              </div>

              {/* ==================== URL MODE ==================== */}
              {activeSoundForm.sourceType === 'url' && (
                <div
                  className={`p-4 rounded-xl border space-y-4 ${
                    isClean ? 'bg-[#F4EFE3] border-[#E5DCB8]' : 'bg-[#1F1913] border-[#42362B]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-sky-500" />
                    <h5 className={`text-xs font-bold uppercase tracking-wide ${isClean ? 'text-[#2A2118]' : 'text-sky-300'}`}>
                      Configuración de Audio Externo (URL)
                    </h5>
                  </div>

                  <div className="space-y-1.5">
                    <label className={`text-xs font-semibold block ${isClean ? 'text-[#2A2118]' : 'text-slate-300'}`}>
                      Enlace Directo de Archivo de Audio (MP3, WAV, OGG, M4A):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={activeSoundForm.url || ''}
                        onChange={(e) => {
                          setActiveSoundForm({ ...activeSoundForm, url: e.target.value });
                          setUrlTestingStatus('idle');
                        }}
                        placeholder="https://ejemplo.com/audios/efecto_puerta.mp3"
                        className={`flex-1 px-3 py-2 rounded-xl text-xs border font-mono ${
                          isClean
                            ? 'bg-[#FFFDF6] border-[#E5DCB8] text-[#2A2118]'
                            : 'bg-[#2C241C] border-[#42362B] text-[#F4EFE3]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={handleTestActiveForm}
                        disabled={!activeSoundForm.url || isPlayingTesting}
                        className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Probar Enlace</span>
                      </button>
                    </div>

                    {urlTestingStatus === 'success' && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold mt-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>¡Enlace de audio verificado y reproducible con éxito!</span>
                      </div>
                    )}
                    {urlTestingStatus === 'error' && (
                      <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold mt-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Error al cargar audio: {urlErrorMessage}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-amber-500/20 space-y-3">
                    <div>
                      <h6 className={`text-xs font-bold ${isClean ? 'text-[#2A2118]' : 'text-amber-200'}`}>
                        Procesamiento no destructivo de la muestra
                      </h6>
                      <p className={`text-[10px] mt-1 ${isClean ? 'text-[#6B5C46]' : 'text-slate-400'}`}>
                        El archivo original no se modifica. En esta fase, cambiar la velocidad también cambia la duración y el tono.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="space-y-1 text-[11px]">
                        <span className={isClean ? 'text-[#6B5C46]' : 'text-slate-300'}>
                          Velocidad: {(activeSoundForm.audioProcessing?.playbackRate ?? 1).toFixed(2)}×
                        </span>
                        <input
                          type="range" min="0.5" max="2" step="0.05"
                          value={activeSoundForm.audioProcessing?.playbackRate ?? 1}
                          onChange={(e) => setActiveSoundForm({ ...activeSoundForm, audioProcessing: { ...activeSoundForm.audioProcessing, playbackRate: Number(e.target.value) } })}
                          className="w-full accent-amber-600"
                        />
                      </label>

                      <label className="space-y-1 text-[11px]">
                        <span className={isClean ? 'text-[#6B5C46]' : 'text-slate-300'}>
                          Tono adicional: {activeSoundForm.audioProcessing?.pitchSemitones ?? 0} semitonos
                        </span>
                        <input
                          type="range" min="-12" max="12" step="1"
                          value={activeSoundForm.audioProcessing?.pitchSemitones ?? 0}
                          onChange={(e) => setActiveSoundForm({ ...activeSoundForm, audioProcessing: { ...activeSoundForm.audioProcessing, pitchSemitones: Number(e.target.value) } })}
                          className="w-full accent-amber-600"
                        />
                      </label>

                      <label className="space-y-1 text-[11px]">
                        <span className={isClean ? 'text-[#6B5C46]' : 'text-slate-300'}>
                          Filtro paso bajo: {activeSoundForm.audioProcessing?.lowpassHz ?? 19000} Hz
                        </span>
                        <input
                          type="range" min="500" max="19000" step="100"
                          value={activeSoundForm.audioProcessing?.lowpassHz ?? 19000}
                          onChange={(e) => setActiveSoundForm({ ...activeSoundForm, audioProcessing: { ...activeSoundForm.audioProcessing, lowpassHz: Number(e.target.value) } })}
                          className="w-full accent-amber-600"
                        />
                      </label>

                      <label className="space-y-1 text-[11px]">
                        <span className={isClean ? 'text-[#6B5C46]' : 'text-slate-300'}>
                          Eco: {Math.round((activeSoundForm.audioProcessing?.echoMix ?? 0) * 100)}%
                        </span>
                        <input
                          type="range" min="0" max="0.7" step="0.05"
                          value={activeSoundForm.audioProcessing?.echoMix ?? 0}
                          onChange={(e) => setActiveSoundForm({ ...activeSoundForm, audioProcessing: { ...activeSoundForm.audioProcessing, echoMix: Number(e.target.value) } })}
                          className="w-full accent-amber-600"
                        />
                      </label>

                      <label className="space-y-1 text-[11px]">
                        <span className={isClean ? 'text-[#6B5C46]' : 'text-slate-300'}>Recorte inicial (segundos)</span>
                        <input
                          type="number" min="0" max="60" step="0.05"
                          value={activeSoundForm.audioProcessing?.trimStartSeconds ?? 0}
                          onChange={(e) => setActiveSoundForm({ ...activeSoundForm, audioProcessing: { ...activeSoundForm.audioProcessing, trimStartSeconds: Math.max(0, Number(e.target.value) || 0) } })}
                          className={`w-full px-2 py-1.5 rounded-lg border text-xs ${isClean ? 'bg-[#FFFDF6] border-[#E5DCB8] text-[#2A2118]' : 'bg-[#2C241C] border-[#42362B] text-white'}`}
                        />
                      </label>

                      <label className="space-y-1 text-[11px]">
                        <span className={isClean ? 'text-[#6B5C46]' : 'text-slate-300'}>Recorte final (segundos)</span>
                        <input
                          type="number" min="0" max="60" step="0.05"
                          value={activeSoundForm.audioProcessing?.trimEndSeconds ?? 0}
                          onChange={(e) => setActiveSoundForm({ ...activeSoundForm, audioProcessing: { ...activeSoundForm.audioProcessing, trimEndSeconds: Math.max(0, Number(e.target.value) || 0) } })}
                          className={`w-full px-2 py-1.5 rounded-lg border text-xs ${isClean ? 'bg-[#FFFDF6] border-[#E5DCB8] text-[#2A2118]' : 'bg-[#2C241C] border-[#42362B] text-white'}`}
                        />
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveSoundForm({ ...activeSoundForm, audioProcessing: {} })}
                      className={`text-[10px] font-semibold underline underline-offset-2 ${isClean ? 'text-[#872820]' : 'text-amber-300'}`}
                    >
                      Restablecer procesamiento
                    </button>
                  </div>
                </div>
              )}

              {/* ==================== SYNTHESIZER MODE ==================== */}
              {activeSoundForm.sourceType === 'synth' && (
                <div className="space-y-5">
                  {/* Instrument Selector */}
                  <div
                    className={`p-4 rounded-2xl border space-y-3 ${
                      isClean ? 'bg-[#F4EFE3] border-[#E5DCB8]' : 'bg-[#1F1913] border-[#42362B]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <label className={`text-xs font-bold flex items-center gap-1.5 ${isClean ? 'text-[#2A2118]' : 'text-amber-300'}`}>
                        <Music className="w-3.5 h-3.5 text-amber-500" />
                        <span>Selector de Instrumento y Timbre Acústico:</span>
                      </label>
                      <span className={`text-[10px] ${isClean ? 'text-[#6B5C46]' : 'text-slate-400'}`}>
                        (Modelado físico y síntesis armónica)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {INSTRUMENT_OPTIONS.map((inst) => {
                        const isCurrent =
                          (activeSoundForm.synthConfig?.instrument || 'custom') === inst.id;
                        return (
                          <button
                            key={inst.id}
                            type="button"
                            onClick={() => handleSelectInstrument(inst.id)}
                            className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                              isCurrent
                                ? isClean
                                  ? 'bg-[#A4332A] text-white border-[#872820] shadow-sm'
                                  : 'bg-amber-600 text-white border-amber-500 shadow-sm'
                                : isClean
                                ? 'bg-[#FFFDF6] border-[#E5DCB8] text-[#2A2118] hover:bg-[#EBE3CD]'
                                : 'bg-[#2C241C] border-[#42362B] text-slate-300 hover:text-white'
                            }`}
                          >
                            <span className="block text-xs font-bold truncate">{inst.name}</span>
                            <span
                              className={`block text-[10px] mt-0.5 line-clamp-1 ${
                                isCurrent ? 'text-white/80' : isClean ? 'text-[#6B5C46]' : 'text-slate-400'
                              }`}
                            >
                              {inst.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Synth Quick Templates */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className={`text-xs font-bold flex items-center gap-1.5 ${isClean ? 'text-[#2A2118]' : 'text-amber-300'}`}>
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Plantillas de Efectos Rápidos:</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {SYNTH_TEMPLATES.map((tmpl) => (
                        <button
                          key={tmpl.name}
                          type="button"
                          onClick={() => handleApplyTemplate(tmpl)}
                          className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isClean
                              ? 'bg-[#F4EFE3] hover:bg-[#E5DCB8] text-[#2A2118] border-[#E5DCB8]'
                              : 'bg-[#1F1913] hover:bg-[#2A2118] text-slate-300 border-[#42362B]'
                          }`}
                        >
                          <span>{tmpl.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Synth Parameters Panel */}
                  <div
                    className={`p-4 rounded-2xl border space-y-4 ${
                      isClean ? 'bg-[#F4EFE3] border-[#E5DCB8]' : 'bg-[#1F1913] border-[#42362B]'
                    }`}
                  >
                    {/* Oscillator Waveform */}
                    <div className="space-y-1.5">
                      <label className={`text-xs font-bold block ${isClean ? 'text-[#2A2118]' : 'text-slate-300'}`}>
                        Forma de Onda del Oscilador:
                      </label>
                      <div className="flex items-center justify-end gap-1.5 mb-2">
                        <button type="button" onClick={handleTestActiveForm} disabled={isPlayingTesting} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 ${isClean ? 'bg-[#A4332A] text-white' : 'bg-amber-600 text-black'} disabled:opacity-50`}><Play className="w-3 h-3 fill-current" /> Escuchar cambios</button>
                        <button type="button" onClick={handleStopPreview} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 ${isClean ? 'bg-[#E5DCB8] text-[#2A2118]' : 'bg-white/10 text-slate-200'}`}><Square className="w-3 h-3 fill-current" /> Parar</button>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {[
                          { id: 'sine', label: 'Senoidal' },
                          { id: 'triangle', label: 'Triangular' },
                          { id: 'square', label: 'Cuadrada' },
                          { id: 'sawtooth', label: 'Diente Sierra' },
                          { id: 'noise', label: 'Ruido Blanco' },
                          { id: 'arpeggio', label: 'Arpegio' },
                        ].map((w) => (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => {
                              const curr = activeSoundForm.synthConfig || {
                                oscType: 'sine',
                                startFreq: 440,
                                duration: 0.3,
                                volume: 0.3,
                              };
                              setActiveSoundForm({
                                ...activeSoundForm,
                                synthConfig: { ...curr, oscType: w.id as any },
                              });
                            }}
                            className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                              activeSoundForm.synthConfig?.oscType === w.id
                                ? isClean
                                  ? 'bg-[#A4332A] text-white border-[#872820] shadow-sm font-black'
                                  : 'bg-amber-500 text-black border-amber-400 shadow-sm font-black'
                                : isClean
                                ? 'bg-[#FFFDF6] border-[#E5DCB8] text-[#2A2118] hover:bg-[#EBE3CD]'
                                : 'bg-[#2C241C] border-[#42362B] text-slate-400 hover:text-white'
                            }`}
                          >
                            <span className="truncate block">{w.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Frequency & Pitch Sliders */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Start Frequency */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className={isClean ? 'text-[#2A2118]' : 'text-slate-300'}>Frecuencia Inicial:</span>
                          <span className={`font-mono ${isClean ? 'text-[#872820]' : 'text-amber-400'}`}>
                            {activeSoundForm.synthConfig?.startFreq || 440} Hz
                          </span>
                        </div>
                        <input
                          type="range"
                          min="40"
                          max="3000"
                          step="10"
                          value={activeSoundForm.synthConfig?.startFreq || 440}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setActiveSoundForm({
                              ...activeSoundForm,
                              synthConfig: { ...(activeSoundForm.synthConfig as any), startFreq: val },
                            });
                          }}
                          className="w-full accent-amber-600"
                        />
                      </div>

                      {/* End Frequency (Pitch Ramp) */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className={isClean ? 'text-[#2A2118]' : 'text-slate-300'}>Frecuencia Final (Pitch ramp):</span>
                          <span className={`font-mono ${isClean ? 'text-[#872820]' : 'text-amber-400'}`}>
                            {activeSoundForm.synthConfig?.endFreq || activeSoundForm.synthConfig?.startFreq || 440} Hz
                          </span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="3000"
                          step="10"
                          value={activeSoundForm.synthConfig?.endFreq || activeSoundForm.synthConfig?.startFreq || 440}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setActiveSoundForm({
                              ...activeSoundForm,
                              synthConfig: { ...(activeSoundForm.synthConfig as any), endFreq: val },
                            });
                          }}
                          className="w-full accent-amber-600"
                        />
                      </div>
                    </div>

                    {/* Duration and Volume */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Duration */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className={isClean ? 'text-[#2A2118]' : 'text-slate-300'}>Duración:</span>
                          <span className={`font-mono ${isClean ? 'text-[#872820]' : 'text-amber-400'}`}>
                            {(activeSoundForm.synthConfig?.duration || 0.3).toFixed(2)} seg
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.05"
                          max="3.0"
                          step="0.02"
                          value={activeSoundForm.synthConfig?.duration || 0.3}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setActiveSoundForm({
                              ...activeSoundForm,
                              synthConfig: { ...(activeSoundForm.synthConfig as any), duration: val },
                            });
                          }}
                          className="w-full accent-amber-600"
                        />
                      </div>

                      {/* Volume */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className={isClean ? 'text-[#2A2118]' : 'text-slate-300'}>Volumen:</span>
                          <span className={`font-mono ${isClean ? 'text-[#872820]' : 'text-amber-400'}`}>
                            {Math.round((activeSoundForm.synthConfig?.volume || 0.3) * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.05"
                          max="1.0"
                          step="0.05"
                          value={activeSoundForm.synthConfig?.volume || 0.3}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setActiveSoundForm({
                              ...activeSoundForm,
                              synthConfig: { ...(activeSoundForm.synthConfig as any), volume: val },
                            });
                          }}
                          className="w-full accent-amber-600"
                        />
                      </div>
                    </div>

                    {/* Filter & LFO Modulation */}
                    <div
                      className={`grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t ${
                        isClean ? 'border-[#E5DCB8]' : 'border-white/10'
                      }`}
                    >
                      {/* Filter Type */}
                      <div className="space-y-1">
                        <label className={`text-xs font-bold block ${isClean ? 'text-[#2A2118]' : 'text-slate-300'}`}>
                          Filtro Acústico:
                        </label>
                        <select
                          value={activeSoundForm.synthConfig?.filterType || 'none'}
                          onChange={(e) => {
                            setActiveSoundForm({
                              ...activeSoundForm,
                              synthConfig: {
                                ...(activeSoundForm.synthConfig as any),
                                filterType: e.target.value as any,
                              },
                            });
                          }}
                          className={`w-full px-3 py-1.5 rounded-xl text-xs border ${
                            isClean
                              ? 'bg-[#FFFDF6] border-[#E5DCB8] text-[#2A2118]'
                              : 'bg-[#2C241C] border-[#42362B] text-[#F4EFE3]'
                          }`}
                        >
                          <option value="none">Sin Filtro</option>
                          <option value="lowpass">Paso Bajo (Lowpass - Apagar agudos)</option>
                          <option value="highpass">Paso Alto (Highpass - Quitar graves)</option>
                          <option value="bandpass">Paso Banda (Bandpass - Resonante)</option>
                        </select>
                      </div>

                      {/* LFO Modulation Rate */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className={isClean ? 'text-[#2A2118]' : 'text-slate-300'}>Modulación LFO (Vibrato):</span>
                          <span className={`font-mono ${isClean ? 'text-[#872820]' : 'text-amber-400'}`}>
                            {activeSoundForm.synthConfig?.lfoFreq || 0} Hz
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="30"
                          step="1"
                          value={activeSoundForm.synthConfig?.lfoFreq || 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setActiveSoundForm({
                              ...activeSoundForm,
                              synthConfig: {
                                ...(activeSoundForm.synthConfig as any),
                                lfoFreq: val,
                                lfoGain: val > 0 ? (activeSoundForm.synthConfig?.lfoGain || 25) : 0,
                              },
                            });
                          }}
                          className="w-full accent-amber-600"
                        />
                      </div>
                    </div>

                    {/* Arpeggio Notes Editor (if arpeggio selected) */}
                    {activeSoundForm.synthConfig?.oscType === 'arpeggio' && (
                      <div
                        className={`space-y-2 p-3 rounded-xl border ${
                          isClean ? 'bg-[#FFFDF6] border-[#E5DCB8]' : 'bg-black/20 border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <label className={`text-xs font-bold ${isClean ? 'text-[#2A2118]' : 'text-amber-300'}`}>
                            Notas del Arpegio (Frecuencias Hz):
                          </label>
                          <span className={`text-[10px] ${isClean ? 'text-[#6B5C46]' : 'text-slate-400'}`}>
                            Velocidad: {(activeSoundForm.synthConfig.arpeggioSpeed || 0.08).toFixed(2)}s/nota
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {(activeSoundForm.synthConfig.arpeggioNotes || [523.25, 659.25, 783.99, 1046.5]).map(
                            (noteFreq, idx) => (
                              <div
                                key={idx}
                                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border ${
                                  isClean
                                    ? 'bg-[#E5DCB8] border-[#D9CFA9] text-[#2A2118]'
                                    : 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                                }`}
                              >
                                <span>{Math.round(noteFreq)} Hz</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextNotes = (activeSoundForm.synthConfig?.arpeggioNotes || []).filter(
                                      (_, i) => i !== idx
                                    );
                                    setActiveSoundForm({
                                      ...activeSoundForm,
                                      synthConfig: {
                                        ...(activeSoundForm.synthConfig as any),
                                        arpeggioNotes: nextNotes,
                                      },
                                    });
                                  }}
                                  className="text-rose-600 hover:text-rose-700 font-black ml-1 cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                            )
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className={`text-[11px] ${isClean ? 'text-[#6B5C46]' : 'text-slate-400'}`}>
                            Añadir nota musical:
                          </span>
                          {[
                            { name: 'Do (C4)', hz: 261.63 },
                            { name: 'Mi (E4)', hz: 329.63 },
                            { name: 'Sol (G4)', hz: 392.0 },
                            { name: 'Do (C5)', hz: 523.25 },
                            { name: 'Mi (E5)', hz: 659.25 },
                            { name: 'Sol (G5)', hz: 783.99 },
                            { name: 'Do (C6)', hz: 1046.5 },
                          ].map((n) => (
                            <button
                              key={n.name}
                              type="button"
                              onClick={() => {
                                const currentNotes = activeSoundForm.synthConfig?.arpeggioNotes || [];
                                setActiveSoundForm({
                                  ...activeSoundForm,
                                  synthConfig: {
                                    ...(activeSoundForm.synthConfig as any),
                                    arpeggioNotes: [...currentNotes, n.hz],
                                  },
                                });
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                isClean
                                  ? 'bg-[#E5DCB8] hover:bg-[#A4332A] hover:text-white text-[#2A2118]'
                                  : 'bg-white/10 hover:bg-amber-500 hover:text-black text-slate-300'
                              }`}
                            >
                              + {n.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons & Permissions */}
              <div className={`pt-4 border-t space-y-3 ${isClean ? 'border-[#E5DCB8]' : 'border-white/10'}`}>
                {/* Author notice if sound is official */}
                {activeSoundForm.isGlobal && !isAdmin && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className={`font-bold ${isClean ? 'text-[#2A2118]' : 'text-amber-200'}`}>
                        Sonido de la Biblioteca Oficial (Solo Lectura para Creadores)
                      </p>
                      <p className={`text-[11px] mt-0.5 ${isClean ? 'text-[#6B5C46]' : 'text-slate-300'}`}>
                        Puedes escuchar y asignar este sonido a tus escenas. Si deseas personalizar sus frecuencias o usar una URL diferente, pulsa en "Duplicar en mi proyecto".
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    {/* Duplicate button */}
                    <button
                      type="button"
                      onClick={() => handleDuplicateToProject(activeSoundForm)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                        isClean
                          ? 'bg-[#F4EFE3] hover:bg-[#E5DCB8] text-[#2A2118] border-[#E5DCB8]'
                          : 'bg-[#1F1913] hover:bg-[#2A2118] text-amber-200 border-amber-500/30'
                      }`}
                      title="Crear una copia editable de este sonido en tu proyecto"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Duplicar en mi Proyecto</span>
                    </button>

                    {/* Delete button from Project */}
                    {!activeSoundForm.isGlobal && (
                      <button
                        type="button"
                        onClick={() => handleDeleteFromProject(activeSoundForm.id)}
                        className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        title="Eliminar este sonido del proyecto"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Eliminar del Proyecto</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* If sound is project custom: Save to project */}
                    {!activeSoundForm.isGlobal && (
                      <button
                        type="button"
                        onClick={handleSaveToProject}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>Guardar en el Proyecto</span>
                      </button>
                    )}

                    {/* If Admin: Option to save to global Firestore library */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={handleAdminSaveToGlobalLibrary}
                        disabled={isSavingGlobal}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                        title="Guardar y propagar cambios a toda la plataforma en Firestore"
                      >
                        <Shield className="w-4 h-4" />
                        <span>{isSavingGlobal ? 'Guardando en Firestore...' : 'Guardar en Biblioteca Global'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center border rounded-2xl space-y-3 bg-black/10">
              <Volume2 className="w-12 h-12 mx-auto text-slate-400 opacity-50" />
              <h4 className={`text-sm font-bold ${isClean ? 'text-[#2A2118]' : 'text-slate-300'}`}>
                Selecciona un sonido del catálogo
              </h4>
              <p className={`text-xs ${isClean ? 'text-[#6B5C46]' : 'text-slate-400'}`}>
                Selecciona cualquier sonido a la izquierda para escuchar su onda sintetizada o ajustar sus parámetros.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
