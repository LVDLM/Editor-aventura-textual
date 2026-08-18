import { GameProject } from '../types';

export const sampleGameProject: GameProject = {
  id: 'el_misterio_de_la_habitacion',
  title: 'El Misterio de la Habitación Oscura',
  author: 'Editorial TextAdventure',
  version: '1.0.0',
  description: 'Una misteriosa aventura gráfica en texto donde la observación y la deducción te permitirán escapar de una vieja mansión.',
  synopsis: 'Te despiertas en una estancia fría y a oscuras. Las ventanas están selladas y el único sonido es el crujir de las viejas vigas de madera. Para sobrevivir y encontrar la salida de esta mansión olvidada, deberás inspeccionar cada rincón, descifrar acertijos ocultos en diarios antiguos y reaccionar a tiempo ante inesperadas trampas.',
  credits: '• Diseño y Guion Narrativo: Editorial TextAdventure\n• Ilustraciones y Arte Visual: Generadas con Gemini AI Studio & Archivo Clásico\n• Motor de Juego: Motor de Aventuras en Texto (React + Tailwind)\n• Colaboradores: Comunidad de Autores de Ficción Interactiva\n• Agradecimientos Especiales: A todos los apasionados del género Point & Click clásico.',
  theme: 'sepia-parchment',
  genreTags: ['aventura', 'misterio'],
  initialSceneId: 'scene_portada',
  
  defaultResponses: {
    mirar: 'Miras con atención, pero no observas nada fuera de lo normal.',
    usar: 'Intentas usarlo, pero no parece tener ningún efecto evidente.',
    abrir: 'Intentas abrirlo, pero no es posible o no responde.',
    coger: 'Intentas cogerlo, pero no puedes llevártelo contigo.',
    hablar: 'Hablas en voz alta, pero nadie te responde.',
    empujar: 'Lo empujas con fuerza, pero apenas se mueve un milímetro.',
    ir_a: 'No puedes ir hacia allí en este momento.',
  },

  globalFlags: {
    habitacion_iluminada: false,
    cajon_abierto: false,
    llave_encontrada: false,
    diario_leido: false,
    pasadizo_revelado: false,
  },

  inventoryItems: [
    {
      id: 'llave_pequena',
      name: 'Llave pequeña',
      description: 'Una antigua llave de bronce labrada con intrincados detalles.',
      icon: 'Key',
    },
    {
      id: 'diario_antiguo',
      name: 'Diario antiguo',
      description: 'Un viejo cuaderno de cuero con notas sobre pasadizos secretos.',
      icon: 'BookOpen',
    },
    {
      id: 'linterna',
      name: 'Linterna',
      description: 'Una linterna metálica que proyecta un haz de luz brillante.',
      icon: 'Flashlight',
    },
  ],

  scenes: [
    {
      id: 'scene_portada',
      name: 'Portada',
      type: 'portada',
      description: 'Pantalla de carátula del juego',
      textBlocks: [
        {
          id: 'block_sample_portada',
          type: 'portada',
          text: 'EL MISTERIO DE LA HABITACIÓN OSCURA\n\nUna misteriosa aventura de intriga y lógica en texto.\n\nHaz clic en [Comenzar] para iniciar la historia.',
          coverMode: 'with_text',
        },
      ],
      hotspots: [
        {
          id: 'hotspot_portada_comenzar',
          word: 'Comenzar',
          label: 'Comenzar la Aventura',
          initialVisible: true,
          actions: [
            {
              id: 'act_portada_comenzar',
              verb: 'ir_a',
              responseMessage: 'Pasando a la introducción de la historia...',
              stateChange: {
                goToSceneId: 'scene_introduccion',
              },
            },
          ],
        },
      ],
    },
    {
      id: 'scene_introduccion',
      name: 'Introducción',
      type: 'introduccion',
      description: 'Prólogo e introducción a la aventura',
      textBlocks: [
        {
          id: 'block_sample_intro',
          type: 'introduccion',
          text: 'PRÓLOGO\n\nLa noche caía sobre la vieja mansión Blackwood. Julián llevaba horas buscando refugio de la tormenta hasta que encontró una puerta entreabierta...\n\n¿Estás listo para [Entrar] en la habitación?',
        },
      ],
      hotspots: [
        {
          id: 'hotspot_intro_entrar',
          word: 'Entrar',
          label: 'Entrar a la habitación',
          initialVisible: true,
          actions: [
            {
              id: 'act_intro_entrar',
              verb: 'ir_a',
              responseMessage: 'Empujas la puerta y entras en la penumbra...',
              stateChange: {
                goToSceneId: 'scene_habitacion',
              },
            },
          ],
        },
      ],
    },
    {
      id: 'scene_habitacion',
      name: 'La Habitación Oscura',
      description: 'El dormitorio principal de la vieja residencia.',
      textBlocks: [
        {
          id: 'block_darkness',
          text: 'Julián entró en una habitación. Estaba oscura y solo se intuía una cama, una mesita de noche con una lámpara y una cómoda.',
          hiddenIfFlags: { habitacion_iluminada: true },
        },
        {
          id: 'block_light',
          text: 'La habitación se ilumina con una cálida luz. Julián puede ver claramente que sobre la mesita de noche hay varias fotos antiguas. La cómoda y un imponente armario están en la parte derecha de la estancia.',
          visibleIfFlags: { habitacion_iluminada: true },
        },
      ],
      hotspots: [
        {
          id: 'lampara',
          word: 'lámpara',
          label: 'Lámpara de noche',
          initialVisible: true,
          actions: [
            {
              id: 'act_lampara_mirar',
              verb: 'mirar',
              responseMessage: 'Es una pequeña lámpara de tulipa con un interruptor giratorio en la base.',
            },
            {
              id: 'act_lampara_usar',
              verb: 'usar',
              responseMessage: 'Julián acciona el interruptor con un leve clic. Un potente haz de luz ilumina toda la habitación.',
              stateChange: {
                setFlags: { habitacion_iluminada: true },
                appendStoryText: 'Ahora la estancia ya no parece tan intimidante, aunque el armario de madera oscura se alza siniestro.',
              },
            },
          ],
        },
        {
          id: 'mesita',
          word: 'mesita de noche',
          label: 'Mesita de noche',
          initialVisible: true,
          actions: [
            {
              id: 'act_mesita_mirar',
              verb: 'mirar',
              responseMessage: 'Una sólida mesita de roble barnizado. En la parte superior descansa la lámpara.',
            },
          ],
        },
        {
          id: 'cama',
          word: 'cama',
          label: 'Cama',
          initialVisible: true,
          actions: [
            {
              id: 'act_cama_mirar',
              verb: 'mirar',
              responseMessage: 'Una cama deshecha con sábanas de lino. Algo parece brillar flojamente debajo de la estructura.',
            },
            {
              id: 'act_cama_usar',
              verb: 'usar',
              responseMessage: 'Julián se agacha y mete la mano debajo del colchón. ¡Encuentra una pequeña llave metálica!',
              stateChange: {
                addItemId: 'llave_pequena',
                setFlags: { llave_encontrada: true },
                appendStoryText: 'Julián guarda la llave pequeña en su bolsillo.',
              },
            },
            {
              id: 'act_cama_coger',
              verb: 'coger',
              responseMessage: 'La cama pesa demasiado para llevártela.',
            },
          ],
        },
        {
          id: 'comoda',
          word: 'cómoda',
          label: 'Cómoda de madera',
          initialVisible: true,
          actions: [
            {
              id: 'act_comoda_mirar',
              verb: 'mirar',
              responseMessage: 'Una hermosa cómoda colonial con varios cajones adornados con tiradores de hierro.',
            },
            {
              id: 'act_comoda_abrir_sin_llave',
              verb: 'abrir',
              responseMessage: 'Julián tira de los cajones, pero parece que están cerrados con llave.',
              hiddenIfFlags: { cajon_abierto: true },
              requiredFlags: { llave_encontrada: false },
            },
            {
              id: 'act_comoda_usar_llave',
              verb: 'usar',
              requiredItemId: 'llave_pequena',
              responseMessage: 'Julián introduce la llave pequeña en la cerradura del primer cajón. Tras un chasquido metálico, el cajón se abre mostrando un diario antiguo en su interior.',
              stateChange: {
                setFlags: { cajon_abierto: true },
                addItemId: 'diario_antiguo',
                appendStoryText: 'Encuentras un diario antiguo escrito por el antiguo dueño de la casa.',
              },
            },
            {
              id: 'act_comoda_abrir_con_llave',
              verb: 'abrir',
              requiredItemId: 'llave_pequena',
              responseMessage: 'Usas la llave para abrir el cajón principal. Encuentras el diario antiguo.',
              stateChange: {
                setFlags: { cajon_abierto: true },
                addItemId: 'diario_antiguo',
              },
            },
          ],
          customDefaultResponses: {
            abrir: 'Parece que los cajones están cerrados con llave.',
          },
        },
        {
          id: 'fotos',
          word: 'fotos',
          label: 'Fotografías antiguas',
          initialVisible: true,
          visibleIfFlags: { habitacion_iluminada: true },
          actions: [
            {
              id: 'act_fotos_mirar',
              verb: 'mirar',
              responseMessage: 'Fotos sepia de una familia victoriana. En una de ellas se distingue un grabado en el reverso: "Detrás del vestidor aguarda la verdad".',
            },
            {
              id: 'act_fotos_coger',
              verb: 'coger',
              responseMessage: 'Prefieres dejar las fotografías en su lugar sobre la mesita.',
            },
          ],
        },
        {
          id: 'armario',
          word: 'armario',
          label: 'Armario alto',
          initialVisible: true,
          visibleIfFlags: { habitacion_iluminada: true },
          actions: [
            {
              id: 'act_armario_mirar',
              verb: 'mirar',
              responseMessage: 'Un armario alto de dos puertas. Parece crujir cada vez que sopla el viento.',
            },
            {
              id: 'act_armario_abrir',
              verb: 'abrir',
              responseMessage: 'Julián abre las puertas del armario. Al apartar las chaquetas colgadas, descubre que la pared posterior del armario está hueca y esconde una pasadizo secreto.',
              stateChange: {
                setFlags: { pasadizo_revelado: true },
                goToSceneId: 'scene_pasadizo',
              },
            },
            {
              id: 'act_armario_empujar',
              verb: 'empujar',
              responseMessage: 'El armario es demasiado pesado, pero notas un hueco hueco en el fondo.',
            },
          ],
        },
        {
          id: 'suelo',
          word: 'suelo',
          label: 'Suelo de madera',
          initialVisible: true,
          actions: [
            {
              id: 'act_suelo_mirar',
              verb: 'mirar',
              responseMessage: 'Un suelo de parquet barnizado un poco gastado por los años.',
            },
            {
              id: 'act_suelo_abrir',
              verb: 'abrir',
              responseMessage: 'Eso no funciona. ¡Hay que estar loco para intentar abrir el suelo!',
            },
          ],
        },
      ],
    },
    {
      id: 'scene_pasadizo',
      name: 'El Pasadizo Secreto',
      description: 'Un angosto pasillo de piedra tallada tras el armario.',
      textBlocks: [
        {
          id: 'block_pasadizo_main',
          text: 'Julián atraviesa el fondo del armario y se encuentra en un pasadizo de piedra fría. El aire huele a polvo y humedad. Al fondo se divisa una puerta pesada y a la izquierda una vieja palanca de hierro.',
        },
      ],
      hotspots: [
        {
          id: 'palanca',
          word: 'palanca',
          label: 'Palanca de hierro',
          initialVisible: true,
          actions: [
            {
              id: 'act_palanca_mirar',
              verb: 'mirar',
              responseMessage: 'Una gruesa palanca industrial cubierta de óxido.',
            },
            {
              id: 'act_palanca_empujar',
              verb: 'empujar',
              responseMessage: 'Julián tira con fuerza de la palanca. Se escucha el retumbar de un engranaje y la puerta del fondo se desbloquea.',
              stateChange: {
                appendStoryText: 'Un eco lejano resuena indicando que el pasaje al despecho queda despejado.',
              },
            },
            {
              id: 'act_palanca_usar',
              verb: 'usar',
              responseMessage: 'Accionas la palanca. Un mecanismo hace sonar un pestillo.',
            },
          ],
        },
        {
          id: 'puerta_pasadizo',
          word: 'puerta',
          label: 'Puerta pesada',
          initialVisible: true,
          actions: [
            {
              id: 'act_puerta_mirar',
              verb: 'mirar',
              responseMessage: 'Una robusta puerta de roble tallada con el emblema de un búho.',
            },
            {
              id: 'act_puerta_abrir',
              verb: 'abrir',
              responseMessage: 'Empujas la puerta pesada y entras al despacho secreto de la mansión.',
              stateChange: {
                goToSceneId: 'scene_despacho',
              },
            },
            {
              id: 'act_puerta_ir',
              verb: 'ir_a',
              responseMessage: 'Cruzas el umbral hacia el despacho.',
              stateChange: {
                goToSceneId: 'scene_despacho',
              },
            },
          ],
        },
        {
          id: 'armario_retorno',
          word: 'armario',
          label: 'Volver al armario',
          initialVisible: true,
          actions: [
            {
              id: 'act_armario_retorno_ir',
              verb: 'ir_a',
              responseMessage: 'Vuelves a atravesar el armario hacia la habitación.',
              stateChange: {
                goToSceneId: 'scene_habitacion',
              },
            },
          ],
        },
      ],
    },
    {
      id: 'scene_despacho',
      name: 'El Despacho del Abuelo',
      description: 'Una sala repleta de estanterías de libros, globos terráqueos y mapas anticuados.',
      textBlocks: [
        {
          id: 'block_despacho_intro',
          text: 'Has llegado al corazón del misterio: el Despacho Secreto. Frente a ti hay un gran escritorio con un manuscrito dorado y una ventana por donde entra la luz de la luna.',
        },
      ],
      hotspots: [
        {
          id: 'escritorio',
          word: 'escritorio',
          label: 'Escritorio de caoba',
          initialVisible: true,
          actions: [
            {
              id: 'act_escritorio_mirar',
              verb: 'mirar',
              responseMessage: 'Un elegante escritorio repleto de documentos históricos y plumas de tinta.',
            },
          ],
        },
        {
          id: 'manuscrito',
          word: 'manuscrito dorado',
          label: 'Manuscrito Dorado',
          initialVisible: true,
          actions: [
            {
              id: 'act_manuscrito_mirar',
              verb: 'mirar',
              responseMessage: 'El texto dice: "¡Felicidades, perspicaz aventurero! Has completado el misterio de la mansión utilizando el motor de aventuras de texto."',
            },
            {
              id: 'act_manuscrito_coger',
              verb: 'coger',
              responseMessage: 'Tomas el manuscrito dorado. Sientes la satisfacción de haber resuelto el enigma.',
            },
          ],
        },
        {
          id: 'ventana',
          word: 'ventana',
          label: 'Ventana',
          initialVisible: true,
          actions: [
            {
              id: 'act_ventana_mirar',
              verb: 'mirar',
              responseMessage: 'A través del cristal contemplas el impresionante jardín iluminado por las estrellas.',
            },
          ],
        },
      ],
    },
  ],
};
