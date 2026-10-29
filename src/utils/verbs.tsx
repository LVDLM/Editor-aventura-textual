import React from 'react';
import { VerbDefinition } from '../types';
import {
  Eye,
  Zap,
  DoorOpen,
  Hand,
  MessageSquare,
  Move,
  Footprints,
  Swords,
  Shield,
  Search,
  Crosshair,
  Flame,
  Skull,
  Heart,
  Key,
  BookOpen,
  Sparkles,
  Wand2,
  Compass,
  HelpCircle,
  Volume2,
} from 'lucide-react';

export const ALL_VERBS: VerbDefinition[] = [
  { id: 'mirar', label: 'Mirar / Examinar', iconName: 'Eye', defaultText: 'Miras con atención pero no observas nada especial.' },
  { id: 'usar', label: 'Usar / Activar', iconName: 'Zap', defaultText: 'Intentas usarlo o activarlo, pero no parece funcionar.' },
  { id: 'abrir', label: 'Abrir / Destapar', iconName: 'DoorOpen', defaultText: 'Intentas abrirlo, pero no cede o ya está abierto.' },
  { id: 'coger', label: 'Coger / Tirar', iconName: 'Hand', defaultText: 'Intentas cogerlo o moverlo, pero no puedes llevártelo.' },
  { id: 'hablar', label: 'Hablar con', iconName: 'MessageSquare', defaultText: 'Hablas en voz alta, pero nadie te responde.' },
  { id: 'empujar', label: 'Empujar / Atacar', iconName: 'Move', defaultText: 'Intentas empujarlo con fuerza, pero apenas se mueve.' },
  { id: 'ir_a', label: 'Ir a / Desplazarse', iconName: 'Footprints', defaultText: 'No puedes ir hacia allí en este momento.' },
];

export interface VerbIconOption {
  name: string;
  label: string;
}

export const AVAILABLE_VERB_ICONS: VerbIconOption[] = [
  { name: 'none', label: 'Sin icono (solo texto)' },
  { name: 'Eye', label: 'Ojo (Mirar / Observar)' },
  { name: 'Zap', label: 'Rayo (Usar / Activar)' },
  { name: 'DoorOpen', label: 'Puerta (Abrir / Entrar)' },
  { name: 'Hand', label: 'Mano (Coger / Agarrar)' },
  { name: 'MessageSquare', label: 'Bocadillo (Hablar / Comunicar)' },
  { name: 'Move', label: 'Flechas (Mover / Empujar)' },
  { name: 'Footprints', label: 'Huellas (Ir a / Desplazarse)' },
  { name: 'Swords', label: 'Espadas (Luchar / Atacar)' },
  { name: 'Shield', label: 'Escudo (Defender / Bloquear)' },
  { name: 'Search', label: 'Lupa (Investigar / Registrar)' },
  { name: 'Crosshair', label: 'Mira (Disparar / Apuntar)' },
  { name: 'Flame', label: 'Fuego (Quemar / Iluminar)' },
  { name: 'Skull', label: 'Calavera (Destruir / Rematar)' },
  { name: 'Heart', label: 'Corazón (Curar / Confortar)' },
  { name: 'Key', label: 'Llave (Desbloquear / Cerrar)' },
  { name: 'BookOpen', label: 'Libro (Leer / Descifrar)' },
  { name: 'Sparkles', label: 'Chispas (Hechizar / Magia)' },
  { name: 'Wand2', label: 'Varita (Conjurar / Transformar)' },
  { name: 'Compass', label: 'Brújula (Explorar / Orientarse)' },
  { name: 'HelpCircle', label: 'Interrogación (Preguntar / Dudar)' },
  { name: 'Volume2', label: 'Sonido (Escuchar / Prestar atención)' },
];

export function getProjectVerbs(project?: { customVerbs?: VerbDefinition[] } | null): VerbDefinition[] {
  if (project?.customVerbs && Array.isArray(project.customVerbs) && project.customVerbs.length > 0) {
    return project.customVerbs;
  }
  return ALL_VERBS;
}

export function renderVerbIcon(iconName: string, className = 'w-5 h-5'): React.ReactElement | null {
  if (!iconName || iconName === 'none' || iconName === 'sin_icono') {
    return null;
  }

  switch (iconName) {
    case 'Eye':
      return <Eye className={className} />;
    case 'Zap':
      return <Zap className={className} />;
    case 'DoorOpen':
      return <DoorOpen className={className} />;
    case 'Hand':
      return <Hand className={className} />;
    case 'MessageSquare':
      return <MessageSquare className={className} />;
    case 'Move':
      return <Move className={className} />;
    case 'Footprints':
      return <Footprints className={className} />;
    case 'Swords':
      return <Swords className={className} />;
    case 'Shield':
      return <Shield className={className} />;
    case 'Search':
      return <Search className={className} />;
    case 'Crosshair':
      return <Crosshair className={className} />;
    case 'Flame':
      return <Flame className={className} />;
    case 'Skull':
      return <Skull className={className} />;
    case 'Heart':
      return <Heart className={className} />;
    case 'Key':
      return <Key className={className} />;
    case 'BookOpen':
      return <BookOpen className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Wand2':
      return <Wand2 className={className} />;
    case 'Compass':
      return <Compass className={className} />;
    case 'HelpCircle':
      return <HelpCircle className={className} />;
    case 'Volume2':
      return <Volume2 className={className} />;
    default:
      return <Eye className={className} />;
  }
}
