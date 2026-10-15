import { VerbDefinition } from '../types';

export const ALL_VERBS: VerbDefinition[] = [
  { id: 'mirar', label: 'Mirar / Examinar', iconName: 'Eye', defaultText: 'Miras con atención.' },
  { id: 'usar', label: 'Usar / Activar', iconName: 'Zap', defaultText: 'Intentas usarlo o activarlo.' },
  { id: 'abrir', label: 'Abrir / Destapar', iconName: 'DoorOpen', defaultText: 'Intentas abrirlo.' },
  { id: 'coger', label: 'Coger / Tirar', iconName: 'Hand', defaultText: 'Intentas cogerlo o tirar de él.' },
  { id: 'hablar', label: 'Hablar con', iconName: 'MessageSquare', defaultText: 'Hablas en voz alta.' },
  { id: 'empujar', label: 'Empujar / Atacar', iconName: 'Move', defaultText: 'Intentas empujarlo o atacarlo.' },
  { id: 'ir_a', label: 'Ir a / Desplazarse', iconName: 'Footprints', defaultText: 'Te diriges hacia allí.' },
];
