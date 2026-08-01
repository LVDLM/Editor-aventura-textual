import { VerbDefinition } from '../types';

export const ALL_VERBS: VerbDefinition[] = [
  { id: 'mirar', label: 'Mirar / Examinar', iconName: 'Eye', defaultText: 'Miras con atención.' },
  { id: 'usar', label: 'Usar / Activar', iconName: 'Zap', defaultText: 'Intentas usarlo.' },
  { id: 'abrir', label: 'Abrir / Destapar', iconName: 'DoorOpen', defaultText: 'Intentas abrirlo.' },
  { id: 'coger', label: 'Coger / Llevar', iconName: 'Hand', defaultText: 'Intentas cogerlo.' },
  { id: 'hablar', label: 'Hablar con', iconName: 'MessageSquare', defaultText: 'Hablas en voz alta.' },
  { id: 'empujar', label: 'Empujar / Mover', iconName: 'Move', defaultText: 'Lo empujas.' },
  { id: 'ir_a', label: 'Ir a / Desplazarse', iconName: 'Footprints', defaultText: 'Te diriges hacia allí.' },
];
