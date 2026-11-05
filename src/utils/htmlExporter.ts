import { GameProject } from '../types';
// El motor de voz se incrusta tal cual en el juego exportado: así el sonido del editor
// y el del HTML/ZIP salen del mismo código (sin copia que pueda desincronizarse).
import voiceEngineSource from './voiceEngine.js?raw';

const VOICE_ENGINE_EMBED = voiceEngineSource.replace(/^export\s+/gm, '');

/**
 * Generates a self-contained single-file HTML game that requires no external dependencies or servers.
 * It contains the full play runtime, styles, save/load engine, and embedded project data.
 */
export function generateStandaloneHTML(project: GameProject, isForZip: boolean = false): string {
  // If exporting for ZIP, resolve image path references to img/ folder
  const processedProject = JSON.parse(JSON.stringify(project)) as GameProject;
  if (isForZip) {
    for (const item of processedProject.inventoryItems) {
      if (item.imageFileName) {
        item.imageUrl = `img/${item.imageFileName}`;
        item.imageFileData = undefined;
      }
    }
    for (const scene of processedProject.scenes) {
      for (const block of scene.textBlocks) {
        if (block.imageFileName) {
          block.imageUrl = `img/${block.imageFileName}`;
          block.imageFileData = undefined;
        }
      }
    }
  }

  // Guarantee valid initialSceneId
  const initialSceneExists = (processedProject.scenes || []).some((s) => s.id === processedProject.initialSceneId);
  if (!initialSceneExists && processedProject.scenes && processedProject.scenes.length > 0) {
    const portadaScene = processedProject.scenes.find((s) => s.type === 'portada');
    processedProject.initialSceneId = portadaScene ? portadaScene.id : processedProject.scenes[0].id;
  }

  const jsonProject = JSON.stringify(processedProject, null, 2).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(project.title)} - Aventura Gráfica en Texto</title>
  <style>
    :root {
      --bg-color: #121826;
      --card-bg: #1e293b;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #eab308;
      --accent-hover: #fde047;
      --border-color: #334155;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: var(--bg-color);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      background-color: var(--card-bg);
      border-bottom: 1px solid var(--border-color);
      padding: 0.75rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    h1 { font-size: 1.25rem; font-weight: 700; color: var(--accent); }
    .author { font-size: 0.85rem; color: var(--text-muted); }
    
    .container {
      max-width: 900px;
      margin: 1.5rem auto;
      width: 100%;
      padding: 0 1rem;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .sentence-bar {
      background-color: #0f172a;
      border: 1px solid var(--accent);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      font-weight: 600;
      color: var(--accent);
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 46px;
    }

    .story-card {
      background-color: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.75rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
      line-height: 1.8;
      font-size: 1.15rem;
      white-space: pre-line;
    }

    .hotspot {
      color: var(--accent);
      font-weight: 700;
      text-decoration: underline;
      text-decoration-color: rgba(234, 179, 8, 0.4);
      text-underline-offset: 4px;
      cursor: pointer;
      padding: 2px 4px;
      border-radius: 4px;
      transition: all 0.2s ease;
    }
    .hotspot:hover {
      background-color: rgba(234, 179, 8, 0.2);
      color: #ffffff;
      text-decoration-color: var(--accent);
    }
    .hotspot-plain {
      color: inherit;
      cursor: pointer;
      padding: 0 1px;
      border-radius: 4px;
    }

    .response-box {
      background-color: #020617;
      border-left: 4px solid var(--accent);
      padding: 1rem 1.25rem;
      border-radius: 0 8px 8px 0;
      color: #e2e8f0;
      font-style: italic;
    }

    .controls-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.25rem;
    }
    @media (max-width: 640px) {
      .controls-grid { grid-template-columns: 1fr; }
    }

    .verbs-panel {
      background-color: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1rem;
    }
    .verbs-title {
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 0.75rem;
    }
    .verb-buttons {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
    }
    .verb-btn {
      background-color: #0f172a;
      border: 1px solid var(--border-color);
      color: var(--text-main);
      padding: 0.6rem;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .verb-btn:hover {
      border-color: var(--accent);
      color: var(--accent);
    }
    .verb-btn.active {
      background-color: var(--accent);
      color: #000000;
      border-color: var(--accent);
    }

    .inventory-panel {
      background-color: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1rem;
    }
    .inventory-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 160px;
      overflow-y: auto;
    }
    .inv-item {
      background-color: #0f172a;
      border: 1px solid var(--border-color);
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .inv-item:hover, .inv-item.selected {
      border-color: var(--accent);
      color: var(--accent);
    }
    .inv-qty-badge {
      background: rgba(245, 158, 11, 0.2);
      border: 1px solid var(--accent);
      color: var(--accent);
      font-weight: 800;
      font-family: monospace;
      font-size: 0.75rem;
      padding: 1px 6px;
      border-radius: 4px;
      margin-left: 6px;
    }

    .btn {
      background-color: #334155;
      color: #ffffff;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn:hover { background-color: #475569; }
    
    .empty-inv { font-size: 0.85rem; color: var(--text-muted); font-style: italic; }

    /* Modal Popup Styles */
    .popup-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: rgba(15, 23, 42, 0.82);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 1rem;
      animation: popupFadeIn 0.2s ease-out;
    }
    .popup-card {
      background-color: #0f172a;
      border: 2px solid var(--accent);
      border-radius: 16px;
      max-width: 480px;
      width: 100%;
      padding: 1.5rem;
      box-shadow: 0 20px 45px rgba(0,0,0,0.7);
      color: var(--text-main);
      position: relative;
      animation: popupSlideUp 0.2s ease-out;
    }
    .popup-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border-color);
    }
    .popup-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--accent);
    }
    .popup-close-x {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 1.25rem;
      cursor: pointer;
      line-height: 1;
      padding: 0.2rem 0.5rem;
    }
    .popup-close-x:hover { color: #ffffff; }
    .popup-body {
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: 1.25rem;
      color: #e2e8f0;
    }
    .popup-img-wrap {
      margin-top: 0.75rem;
      text-align: center;
    }
    .popup-img-wrap img {
      max-height: 180px;
      max-width: 100%;
      border-radius: 10px;
      border: 1px solid var(--accent);
      margin: 0 auto;
      display: block;
    }
    .popup-actions {
      display: flex;
      justify-content: flex-end;
    }
    .popup-btn {
      background-color: var(--accent);
      color: #0f172a;
      border: none;
      font-weight: 700;
      padding: 0.5rem 1.25rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: transform 0.1s ease;
    }
    .popup-btn:hover {
      transform: scale(1.02);
      filter: brightness(1.1);
    }
    @keyframes popupFadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes popupSlideUp { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  </style>
</head>
<body>
  <header>
    <div>
      <h1 id="game-title">Aventura</h1>
      <div class="author" id="game-author"></div>
    </div>
    <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
      <div class="difficulty-picker" style="display: inline-flex; align-items: center; gap: 0.4rem;">
        <label for="difficulty-select" style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">Dificultad:</label>
        <select id="difficulty-select" onchange="changeDifficulty(this.value)" style="background: #0f172a; color: var(--accent); border: 1px solid var(--border-color); border-radius: 6px; padding: 0.35rem 0.6rem; font-size: 0.8rem; font-weight: 600; cursor: pointer; outline: none;">
          <option value="facil">🌟 Fácil</option>
          <option value="normal">🔍 Normal</option>
          <option value="dificil">💀 Difícil</option>
        </select>
      </div>
      <button class="btn" onclick="saveGame()">💾 Guardar</button>
      <button class="btn" onclick="loadGame()">📂 Cargar</button>
      <button class="btn" onclick="toggleDetailsModal()" style="border-color: rgba(245, 158, 11, 0.4); color: #fde047; background: rgba(245, 158, 11, 0.1);">ℹ️ Detalles y Créditos</button>
      <button class="btn" onclick="resetGame()">🔄 Reiniciar</button>
    </div>
  </header>

  <div class="container">
    <div class="sentence-bar" id="sentence-bar">
      <span>Selecciona una acción (Mirar, Usar, Abrir...) o pulsa en una palabra.</span>
      <button class="btn" style="padding:2px 8px; font-size:0.75rem;" onclick="clearSentence()">Limpiar</button>
    </div>

    <div class="story-card" id="story-content">
      <!-- Story content rendered dynamically -->
    </div>

    <div class="response-box" id="response-box" style="display: none;"></div>

    <div class="controls-grid" id="controls-grid">
      <div class="verbs-panel">
        <div class="verbs-title">Acciones (Verbos)</div>
        <div class="verb-buttons">
          <button class="verb-btn" id="verb-mirar" onclick="selectVerb('mirar')">👁️ Mirar</button>
          <button class="verb-btn" id="verb-usar" onclick="selectVerb('usar')">⚡ Usar / Activar</button>
          <button class="verb-btn" id="verb-abrir" onclick="selectVerb('abrir')">🚪 Abrir</button>
          <button class="verb-btn" id="verb-coger" onclick="selectVerb('coger')">✋ Coger / Tirar</button>
          <button class="verb-btn" id="verb-hablar" onclick="selectVerb('hablar')">💬 Hablar</button>
          <button class="verb-btn" id="verb-empujar" onclick="selectVerb('empujar')">💪 Empujar / Atacar</button>
          <button class="verb-btn" id="verb-ir_a" onclick="selectVerb('ir_a')">🐾 Ir a</button>
        </div>
      </div>

      <div class="inventory-panel">
        <div class="verbs-title">Inventario</div>
        <div class="inventory-list" id="inventory-list">
          <span class="empty-inv">Tu inventario está vacío.</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal Popup for Interactive Feedback -->
  <div id="popup-modal" class="popup-overlay" style="display: none;" onclick="closePopupOnBackdrop(event)">
    <div class="popup-card" onclick="event.stopPropagation()">
      <div class="popup-header">
        <div class="popup-title" id="popup-title">Mensaje</div>
        <button class="popup-close-x" onclick="closePopupModal()">✕</button>
      </div>
      <div class="popup-body" id="popup-body"></div>
      <div class="popup-actions">
        <button class="popup-btn" onclick="closePopupModal()">Entendido</button>
      </div>
    </div>
  </div>

  <script type="application/json" id="game-data">
${jsonProject}
  </script>

  <script>
    let PROJECT = {};
    try {
      PROJECT = JSON.parse(document.getElementById('game-data').textContent || '{}');
    } catch (e) {
      console.error('Error al cargar datos del proyecto:', e);
    }

    let gameState = {
      currentSceneId: PROJECT.initialSceneId,
      inventory: [],
      flags: Object.assign({}, PROJECT.globalFlags || {}),
      appendedTexts: {},
      usedHotspotIds: [],
      verbUseCounts: {},
      difficulty: PROJECT.difficultyMode || 'easy',
      isGameOver: false
    };

    let activeVerb = null;
    let selectedInventoryItem = null;

    let audioCtx = null;

    // ---- Motor de voz orgánica (mismo código que usa el editor) ----
${VOICE_ENGINE_EMBED}

    function playSound(type) {
      if (!type || type === 'none') return;
      try {
        // Check if there is a custom sound in project with URL
        const custom = (PROJECT.customSounds || []).find(s => s.id === type);
        const urlToPlay = custom ? (custom.url || custom.audioUrl) : null;
        if (custom && custom.sourceType === 'url' && urlToPlay) {
          const audio = new Audio(urlToPlay);
          audio.volume = (custom.synthConfig && custom.synthConfig.volume !== undefined ? custom.synthConfig.volume : (custom.volume !== undefined ? custom.volume / 100 : 0.8));
          audio.play().catch(function() {});
          return;
        }

        if (!audioCtx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (AC) audioCtx = new AC();
        }
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        if (!audioCtx) return;
        const now = audioCtx.currentTime;

        // Check if custom sound has synthesizer configuration
        if (custom && custom.synthConfig) {
          const sc = custom.synthConfig;
          const dur = Math.max(0.04, sc.duration || 0.2);
          const vol = Math.max(0, Math.min(1, sc.volume !== undefined ? sc.volume : 0.25));
          const startF = Math.max(20, sc.startFreq || 440);

          if (sc.synthesisProfile === 'voice') {
            playVoiceSynth(audioCtx, sc, now);
            return;
          }

          if (sc.instrument === 'piano') {
            [1, 2, 3, 4].forEach((m, idx) => {
              const o = audioCtx.createOscillator(), g = audioCtx.createGain();
              o.type = 'triangle'; o.frequency.setValueAtTime(startF * m, now);
              g.gain.setValueAtTime(0, now);
              g.gain.linearRampToValueAtTime(vol * (0.6 / (idx + 1)), now + 0.005);
              g.gain.exponentialRampToValueAtTime(0.001, now + dur * (1 / (idx * 0.5 + 1)));
              o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + dur + 0.02);
            });
            return;
          } else if (sc.instrument === 'bell') {
            [1.0, 2.76, 5.4, 8.93].forEach((r, idx) => {
              const o = audioCtx.createOscillator(), g = audioCtx.createGain();
              o.type = 'sine'; o.frequency.setValueAtTime(startF * r, now);
              g.gain.setValueAtTime(0, now);
              g.gain.linearRampToValueAtTime(vol * (0.5 / (idx + 1)), now + 0.003);
              g.gain.exponentialRampToValueAtTime(0.001, now + dur * (1 / (idx * 0.6 + 1)));
              o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + dur + 0.02);
            });
            return;
          } else if (sc.instrument === 'organ') {
            [0.5, 1.0, 2.0, 3.0].forEach((m) => {
              const o = audioCtx.createOscillator(), g = audioCtx.createGain();
              o.type = 'sine'; o.frequency.setValueAtTime(startF * m, now);
              g.gain.setValueAtTime(0, now);
              g.gain.linearRampToValueAtTime(vol * 0.3, now + 0.03);
              g.gain.setValueAtTime(vol * 0.3, now + dur - 0.05);
              g.gain.linearRampToValueAtTime(0.001, now + dur);
              o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + dur + 0.02);
            });
            return;
          } else if (sc.oscType === 'arpeggio' && sc.arpeggioNotes && sc.arpeggioNotes.length) {
            const step = sc.arpeggioSpeed || 0.08;
            sc.arpeggioNotes.forEach((f, i) => {
              const o = audioCtx.createOscillator(), g = audioCtx.createGain();
              o.type = 'triangle'; o.frequency.setValueAtTime(f, now + i * step);
              g.gain.setValueAtTime(0, now + i * step);
              g.gain.linearRampToValueAtTime(vol, now + i * step + 0.015);
              g.gain.exponentialRampToValueAtTime(0.001, now + i * step + Math.min(dur, step * 1.5));
              o.connect(g); g.connect(audioCtx.destination); o.start(now + i * step); o.stop(now + i * step + dur + 0.02);
            });
            return;
          }

          const o = audioCtx.createOscillator(), g = audioCtx.createGain();
          o.type = (sc.oscType === 'sine' || sc.oscType === 'triangle' || sc.oscType === 'square' || sc.oscType === 'sawtooth') ? sc.oscType : 'sine';
          o.frequency.setValueAtTime(startF, now);
          if (sc.endFreq) {
            if (sc.rampType === 'linear') o.frequency.linearRampToValueAtTime(sc.endFreq, now + dur);
            else o.frequency.exponentialRampToValueAtTime(Math.max(20, sc.endFreq), now + dur);
          }
          g.gain.setValueAtTime(0, now);
          g.gain.linearRampToValueAtTime(vol, now + Math.min(0.03, dur * 0.15));
          g.gain.exponentialRampToValueAtTime(0.001, now + dur);
          o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + dur + 0.05);
          return;
        }

        if (type === 'click' || type === 'paper_turn' || type === 'writing') {
          const o = audioCtx.createOscillator(), g = audioCtx.createGain();
          o.type = 'sine'; o.frequency.setValueAtTime(400, now); o.frequency.exponentialRampToValueAtTime(200, now + 0.05);
          g.gain.setValueAtTime(0.15, now); g.gain.linearRampToValueAtTime(0.01, now + 0.05);
          o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + 0.05);
        } else if (type === 'fanfare' || type === 'success_chime' || type === 'victory_trumpet') {
          [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
            const o = audioCtx.createOscillator(), g = audioCtx.createGain();
            o.type = 'triangle'; o.frequency.setValueAtTime(f, now + i * 0.09);
            g.gain.setValueAtTime(0, now + i * 0.09); g.gain.linearRampToValueAtTime(0.25, now + i * 0.09 + 0.02);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.3);
            o.connect(g); g.connect(audioCtx.destination); o.start(now + i * 0.09); o.stop(now + i * 0.09 + 0.32);
          });
        } else if (type === 'door' || type === 'door_squeak' || type === 'chest_creak' || type === 'heavy_stone') {
          const o = audioCtx.createOscillator(), g = audioCtx.createGain(), flt = audioCtx.createBiquadFilter();
          o.type = 'sawtooth'; o.frequency.setValueAtTime(420, now); o.frequency.linearRampToValueAtTime(750, now + 0.18); o.frequency.linearRampToValueAtTime(310, now + 0.38); o.frequency.linearRampToValueAtTime(550, now + 0.5);
          flt.type = 'bandpass'; flt.frequency.setValueAtTime(650, now); flt.Q.setValueAtTime(2.5, now);
          g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.18, now + 0.04); g.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
          o.connect(flt); flt.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + 0.54);
        } else if (type === 'damage' || type === 'monster_roar' || type === 'death_toll') {
          const o = audioCtx.createOscillator(), g = audioCtx.createGain();
          o.type = 'sawtooth'; o.frequency.setValueAtTime(160, now); o.frequency.exponentialRampToValueAtTime(30, now + 0.45);
          g.gain.setValueAtTime(0.35, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
          o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + 0.5);
        } else if (type === 'gunshot' || type === 'explosion' || type === 'thunder') {
          const dur = 0.45, bufferSize = Math.floor(audioCtx.sampleRate * dur), buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate), data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
          const noise = audioCtx.createBufferSource(); noise.buffer = buffer;
          const filter = audioCtx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.setValueAtTime(3200, now); filter.frequency.exponentialRampToValueAtTime(120, now + dur);
          const gain = audioCtx.createGain(); gain.gain.setValueAtTime(0.45, now); gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
          noise.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination); noise.start(now);
        } else if (type === 'pickup' || type === 'key_jingle' || type === 'coin_clink') {
          const o = audioCtx.createOscillator(), g = audioCtx.createGain();
          o.type = 'sine'; o.frequency.setValueAtTime(587.33, now); o.frequency.exponentialRampToValueAtTime(1174.66, now + 0.12);
          g.gain.setValueAtTime(0.2, now); g.gain.linearRampToValueAtTime(0.01, now + 0.12);
          o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + 0.12);
        } else if (type === 'magic_sparkle' || type === 'spell_cast') {
          [880, 1108.73, 1318.51, 1760].forEach((f, i) => {
            const o = audioCtx.createOscillator(), g = audioCtx.createGain();
            o.type = 'sine'; o.frequency.setValueAtTime(f, now + i * 0.06);
            g.gain.setValueAtTime(0, now + i * 0.06); g.gain.linearRampToValueAtTime(0.18, now + i * 0.06 + 0.01);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.25);
            o.connect(g); g.connect(audioCtx.destination); o.start(now + i * 0.06); o.stop(now + i * 0.06 + 0.28);
          });
        } else {
          // Default subtle feedback
          const o = audioCtx.createOscillator(), g = audioCtx.createGain();
          o.type = 'sine'; o.frequency.setValueAtTime(440, now);
          g.gain.setValueAtTime(0.1, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + 0.16);
        }
      } catch (e) {}
    }

    document.getElementById('game-title').innerText = PROJECT.title;
    document.getElementById('game-author').innerText = 'Por ' + PROJECT.author;

    const diffSelect = document.getElementById('difficulty-select');
    if (diffSelect) {
      diffSelect.value = gameState.difficulty;
    }

    function changeDifficulty(mode) {
      gameState.difficulty = mode;
      render();
    }

    function getActiveScene() {
      let scene = (PROJECT.scenes || []).find(s => s.id === gameState.currentSceneId);
      if (!scene && PROJECT.scenes && PROJECT.scenes.length > 0) {
        const portadaScene = PROJECT.scenes.find(s => s.type === 'portada');
        scene = portadaScene || PROJECT.scenes[0];
        gameState.currentSceneId = scene.id;
      }
      return scene;
    }

    const GAME_OVER_TAG = /\\[(?:Terminar \\/ Cargar partida|Terminar|Cargar partida|Fin de partida)\\]/i;
    const GAME_OVER_TAG_GLOBAL = /(\\[(?:Terminar \\/ Cargar partida|Terminar|Cargar partida|Fin de partida)\\])/gi;

    function checkGameOverTag(str) {
      if (!str) return false;
      return GAME_OVER_TAG.test(str);
    }

    function stripGameOverTag(str) {
      if (!str) return '';
      return str.replace(GAME_OVER_TAG_GLOBAL, '').trim();
    }

    function isGameOverState() {
      if (gameState.isGameOver) return true;
      const scene = getActiveScene();
      if (!scene) return false;
      if (scene.type === 'final') return true;
      const hasBlockGameOver = (scene.textBlocks || []).some(b => {
        if (!checkConditions(b.visibleIfFlags, b.hiddenIfFlags)) return false;
        const reqItems = b.requiredItemIds || (b.requiredItemId ? [b.requiredItemId] : []);
        if (reqItems.length > 0 && !reqItems.every(id => (gameState.inventory || []).includes(id))) return false;
        return b.isGameOver || b.type === 'final' || checkGameOverTag(b.text);
      });
      if (hasBlockGameOver) return true;
      const appended = gameState.appendedTexts[scene.id] || [];
      const hasAppendedGameOver = appended.some(t => checkGameOverTag(t));
      return hasAppendedGameOver;
    }

    function escapeRegExp(str) {
      return (str || '').replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');
    }

    function escapeHTML(str) {
      return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function isWordMatchInText(word, text) {
      if (!word || !text) return false;
      const isWordChar = function(char) { return /[\p{L}\p{N}_]/u.test(char); };
      const startChar = word.charAt(0);
      const endChar = word.charAt(word.length - 1);
      const prefix = isWordChar(startChar) ? '(?<![\\p{L}\\p{N}_])' : '';
      const suffix = isWordChar(endChar) ? '(?![\\p{L}\\p{N}_])' : '';
      const pattern = new RegExp(prefix + escapeRegExp(word) + suffix, 'iu');
      return pattern.test(text);
    }

    function parseInteractiveText(text, scene) {
      if (!text) return '';
      if (isGameOverState()) return escapeHTML(text);
      if (!scene || !scene.hotspots || scene.hotspots.length === 0) return escapeHTML(text);

      const activeHotspots = scene.hotspots.filter(h => {
        if (!h.initialVisible) return false;
        return checkConditions(h.visibleIfFlags, h.hiddenIfFlags);
      });

      if (activeHotspots.length === 0) return escapeHTML(text);

      const isWordChar = function(char) { return /[\p{L}\p{N}_]/u.test(char); };
      const sortedHotspots = [...activeHotspots].sort((a, b) => b.word.length - a.word.length);
      const hotspotPatterns = sortedHotspots.map(function(h) {
        const escaped = escapeRegExp(h.word);
        const startChar = h.word.charAt(0);
        const endChar = h.word.charAt(h.word.length - 1);
        const prefix = isWordChar(startChar) ? '(?<![\\p{L}\\p{N}_])' : '';
        const suffix = isWordChar(endChar) ? '(?![\\p{L}\\p{N}_])' : '';
        return prefix + escaped + suffix;
      });

      const pattern = new RegExp('(' + hotspotPatterns.join('|') + ')', 'giu');

      const parts = text.split(pattern);
      const isNormalMode = gameState.difficulty === 'normal';
      const isHardMode = gameState.difficulty === 'hard' || gameState.difficulty === 'dificil';
      const usedHotspots = gameState.usedHotspotIds || [];

      let html = '';
      parts.forEach(part => {
        const matchedHotspot = sortedHotspots.find(h => h.word.toLowerCase() === part.toLowerCase());
        if (matchedHotspot) {
          const isUsed = usedHotspots.includes(matchedHotspot.id);
          const safeTitle = escapeHTML(matchedHotspot.label || matchedHotspot.word);
          const safeWord = escapeHTML(part);

          if (isHardMode) {
            html += '<span class="hotspot-plain" onclick="clickHotspot(\\\'' + matchedHotspot.id + '\\\', event)">' + safeWord + '</span>';
          } else if (isNormalMode && !isUsed) {
            html += '<span class="hotspot-plain" onclick="clickHotspot(\\\'' + matchedHotspot.id + '\\\', event)">' + safeWord + '</span>';
          } else {
            html += '<span class="hotspot" onclick="clickHotspot(\\\'' + matchedHotspot.id + '\\\', event)" title="Interactuar con ' + safeTitle + '">' + safeWord + '</span>';
          }
        } else {
          html += escapeHTML(part);
        }
      });

      return html;
    }

    function renderTextBlock(text, scene, block) {
      text = (text || '').replace(/\[\d+\]\s*/g, '');
      if (checkGameOverTag(text)) {
        const parts = text.split(GAME_OVER_TAG_GLOBAL);
        let html = '';
        parts.forEach(part => {
          if (checkGameOverTag(part)) {
            html += '<div style="margin: 1.25rem 0; padding: 1.25rem; background: #450a0a; border: 1px solid #f43f5e; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; box-shadow: 0 4px 15px rgba(244, 63, 94, 0.2);">' +
                      '<span style="color: #fda4af; font-weight: 700; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em;">💀 Fin de la partida</span>' +
                      '<div style="display: flex; gap: 0.5rem;">' +
                        '<button class="btn" style="background: #e11d48; color: #fff;" onclick="resetGame()">🔄 Reiniciar</button>' +
                        '<button class="btn" onclick="loadGame()">📂 Cargar partida</button>' +
                      '</div>' +
                    '</div>';
          } else if (part) {
            html += parseInteractiveText(part, scene);
          }
        });
        return html;
      }

      let html = parseInteractiveText(text, scene);
      if (block && (block.type === 'final' || block.isGameOver)) {
        if (block.type === 'final') {
          const title = (PROJECT.gameCompleteTitle || '¡FIN DE LA AVENTURA!').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          const subtitle = (PROJECT.gameCompleteSubtitle || 'Has completado felizmente la historia.').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          html += '<div style="margin: 1.5rem 0; padding: 1.25rem; background: #0f172a; border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 16px; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);">' +
                    '<div>' +
                      '<div style="color: #fde68a; font-weight: 900; font-size: 1.05rem; text-transform: uppercase; letter-spacing: 0.05em;">' + title + '</div>' +
                      '<div style="color: #cbd5e1; font-size: 0.8rem; margin-top: 0.25rem;">' + subtitle + '</div>' +
                    '</div>' +
                    '<div style="display: flex; gap: 0.5rem;">' +
                      '<button class="btn" style="background: #f59e0b; color: #0f172a; font-weight: 800;" onclick="resetGame()">🔄 Volver a jugar</button>' +
                      '<button class="btn" onclick="loadGame()">📂 Cargar partida</button>' +
                    '</div>' +
                  '</div>';
        } else if (block.isGameOver) {
          html += '<div style="margin: 1.25rem 0; padding: 1.25rem; background: #450a0a; border: 1px solid #f43f5e; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; box-shadow: 0 4px 15px rgba(244, 63, 94, 0.2);">' +
                    '<span style="color: #fda4af; font-weight: 700; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em;">💀 Fin de la partida</span>' +
                    '<div style="display: flex; gap: 0.5rem;">' +
                      '<button class="btn" style="background: #e11d48; color: #fff;" onclick="resetGame()">🔄 Reiniciar</button>' +
                      '<button class="btn" onclick="loadGame()">📂 Cargar partida</button>' +
                    '</div>' +
                  '</div>';
        }
      }
      return html;
    }

    function getImageSrc(itemOrBlock) {
      if (!itemOrBlock) return '';
      if (itemOrBlock.imageFileName) return 'img/' + itemOrBlock.imageFileName;
      return itemOrBlock.imageFileData || itemOrBlock.imageUrl || '';
    }

    let lastRenderedSceneId = null;
    function render() {
      const scene = getActiveScene();
      const storyCard = document.getElementById('story-content');
      if (!scene) {
        if (storyCard) storyCard.innerHTML = '<p style="color: #94a3b8; font-style: italic;">No hay escenas disponibles en este juego.</p>';
        return;
      }

      if (lastRenderedSceneId !== scene.id) {
        lastRenderedSceneId = scene.id;
        if (scene.sfx) playSound(scene.sfx);
      }

      let combinedHTML = '';

      if (scene.type === 'portada') {
        combinedHTML += '<div style="font-size: 0.75rem; font-weight: bold; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem; border-bottom: 1px solid rgba(245, 158, 11, 0.2); padding-bottom: 0.5rem;">✨ Escena de Portada</div>';
      } else if (scene.type === 'introduccion') {
        combinedHTML += '<div style="font-size: 0.75rem; font-weight: bold; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem; border-bottom: 1px solid rgba(14, 165, 233, 0.2); padding-bottom: 0.5rem;">📖 Escena de Introducción</div>';
      } else if (scene.type === 'final') {
        combinedHTML += '<div style="font-size: 0.75rem; font-weight: bold; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem; border-bottom: 1px solid rgba(245, 158, 11, 0.3); padding-bottom: 0.5rem;">Escena de Final (Conclusión)</div>';
      }

      // Group appended texts by blockId or unattached
      const appendedList = gameState.appendedTexts[scene.id] || [];
      const blockAppended = {};
      const unattachedAppended = [];

      appendedList.forEach(function(item) {
        const txt = typeof item === 'string' ? item : item.text;
        const bId = typeof item === 'string' ? null : item.blockId;
        if (bId) {
          if (!blockAppended[bId]) blockAppended[bId] = [];
          blockAppended[bId].push(txt);
        } else {
          unattachedAppended.push(txt);
        }
      });

      // Text blocks
      (scene.textBlocks || []).forEach((block, bIdx) => {
        const reqItems = block.requiredItemIds || (block.requiredItemId ? [block.requiredItemId] : []);
        const hasRequiredItems = reqItems.length === 0 || reqItems.every(id => (gameState.inventory || []).includes(id));
        if (checkConditions(block.visibleIfFlags, block.hiddenIfFlags) && hasRequiredItems) {
          const imgSrc = getImageSrc(block);
          const isPortada = block.type === 'portada' || scene.type === 'portada';
          const hasText = !!(block.text && block.text.trim().length > 0);

          combinedHTML += '<div id="block-' + block.id + '" style="margin-bottom: 1.25rem;">';

          if (imgSrc) {
            if (isPortada) {
              combinedHTML += '<div style="margin-bottom: 1rem; text-align: center;"><img src="' + escapeHTML(imgSrc) + '" alt="Portada" style="display: block; max-width: 100%; height: auto; max-height: 85vh; object-fit: contain; border-radius: 16px; border: 2px solid var(--accent); box-shadow: 0 8px 25px rgba(0,0,0,0.5); margin: 0 auto;" /></div>';
            } else {
              combinedHTML += '<div style="margin-bottom: 1rem; text-align: center;"><img src="' + escapeHTML(imgSrc) + '" alt="Ilustración" style="display: block; max-width: 100%; height: auto; max-height: 80vh; object-fit: contain; border-radius: 12px; margin: 0 auto; border: 1px solid var(--border-color);" /></div>';
            }
          }

          if (hasText) {
            combinedHTML += '<p style="margin-bottom: 0.75rem;">' + renderTextBlock(block.text, scene, block) + '</p>';
          }

          combinedHTML += '</div>';

          // Render appended texts belonging to this block
          const attached = blockAppended[block.id] || [];
          attached.forEach(function(t) {
            combinedHTML += '<p style="margin-bottom: 1rem; color: #fef08a;">' + renderTextBlock(t, scene) + '</p>';
          });
        }
      });

      // Unattached appended texts for scene
      unattachedAppended.forEach(function(t) {
        combinedHTML += '<p style="margin-bottom: 1rem; color: #fef08a;">' + renderTextBlock(t, scene) + '</p>';
      });

      if (!combinedHTML) {
        combinedHTML = '<p style="color: #94a3b8; font-style: italic;">No hay texto disponible para mostrar en esta escena.</p>';
      }

      if (storyCard) storyCard.innerHTML = combinedHTML;
      renderInventory();
      updateSentenceBar();

      const controlsGrid = document.getElementById('controls-grid');
      const sentenceBar = document.getElementById('sentence-bar');
      if (isGameOverState()) {
        if (controlsGrid) controlsGrid.style.display = 'none';
        if (sentenceBar) sentenceBar.style.display = 'none';
      } else {
        if (controlsGrid) controlsGrid.style.display = '';
        if (sentenceBar) sentenceBar.style.display = '';
      }

      const diffSelectEl = document.getElementById('difficulty-select');
      if (diffSelectEl) diffSelectEl.value = gameState.difficulty;
    }

    function checkConditions(visibleFlags, hiddenFlags) {
      if (visibleFlags) {
        for (let k in visibleFlags) {
          if (!!gameState.flags[k] !== !!visibleFlags[k]) return false;
        }
      }
      if (hiddenFlags) {
        for (let k in hiddenFlags) {
          if (!!gameState.flags[k] === !!hiddenFlags[k]) return false;
        }
      }
      return true;
    }

    function showPopupModal(title, message, imageSrc, iconSymbol) {
      const modal = document.getElementById('popup-modal');
      const titleEl = document.getElementById('popup-title');
      const bodyEl = document.getElementById('popup-body');
      if (!modal || !bodyEl) return;

      let headerHtml = '';
      if (iconSymbol) {
        headerHtml += '<span style="font-size: 1.25rem; margin-right: 0.4rem; display: inline-flex; align-items: center;">' + iconSymbol + '</span>';
      }
      if (title) {
        headerHtml += '<span>' + escapeHTML(title) + '</span>';
      }
      if (titleEl) titleEl.innerHTML = headerHtml;

      let content = '<div>' + message + '</div>';
      if (imageSrc) {
        content += '<div class="popup-img-wrap"><img src="' + escapeHTML(imageSrc) + '" alt="Imagen" /></div>';
      }
      bodyEl.innerHTML = content;
      modal.style.display = 'flex';
    }

    function closePopupModal() {
      const modal = document.getElementById('popup-modal');
      if (modal) modal.style.display = 'none';
    }

    function formatTextWithLinks(str) {
      if (!str) return '';
      if (/<[a-z][\s\S]*>/i.test(str)) {
        return str.replace(/<a\s+(?:[^>]*?\s+)?href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #fbbf24; text-decoration: underline;">$2</a>');
      }
      const escaped = escapeHTML(str);
      return escaped.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #fbbf24; text-decoration: underline;">$1</a>');
    }

    function toggleDetailsModal() {
      const syn = PROJECT.synopsis || PROJECT.description || 'Sin sinopsis registrada.';
      const creds = PROJECT.credits ? ('<div style="margin-top: 1rem; background: rgba(0,0,0,0.4); padding: 0.75rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); font-family: monospace; font-size: 0.8rem;"><strong style="color: #fbbf24; display: block; margin-bottom: 0.25rem;">Créditos y Fuentes:</strong>' + formatTextWithLinks(PROJECT.credits).replace(/\n/g, '<br/>') + '</div>') : '';
      showPopupModal('📖 Detalles de la Historia', '<div style="font-size: 0.95rem; line-height: 1.6;"><strong>' + escapeHTML(PROJECT.title) + '</strong> por <em>' + escapeHTML(PROJECT.author) + '</em></div><div style="margin-top: 0.75rem; font-size: 0.9rem; color: #cbd5e1;">' + escapeHTML(syn).replace(/\n/g, '<br/>') + '</div>' + creds, null, '✨');
    }

    function closePopupOnBackdrop(e) {
      if (e && e.target && e.target.id === 'popup-modal') closePopupModal();
    }

    function selectVerb(verb) {
      activeVerb = verb;
      document.querySelectorAll('.verb-btn').forEach(b => b.classList.remove('active'));
      const btn = document.getElementById('verb-' + verb);
      if (btn) btn.classList.add('active');
      updateSentenceBar();
    }

    function selectInventoryItem(id) {
      if (selectedInventoryItem === id) {
        var itemToUse = PROJECT.inventoryItems.find(function(i) { return i.id === id; });
        if (itemToUse && (activeVerb === 'usar' || itemToUse.useEffectAction)) {
          useInventoryItemDirectly(id);
          return;
        }
        selectedInventoryItem = null;
        renderInventory();
        updateSentenceBar();
        return;
      }

      if (selectedInventoryItem && selectedInventoryItem !== id) {
        var sourceId = selectedInventoryItem;
        var targetId = id;
        var sourceItem = PROJECT.inventoryItems.find(function(i) { return i.id === sourceId; });
        var targetItem = PROJECT.inventoryItems.find(function(i) { return i.id === targetId; });

        var rule = null;
        if (targetItem && targetItem.combinations) {
          rule = targetItem.combinations.find(function(c) { return c.requiredItemId === sourceId; });
        }
        if (!rule && sourceItem && sourceItem.combinations) {
          rule = sourceItem.combinations.find(function(c) { return c.requiredItemId === targetId; });
        }

        var flagsMatch = true;
        if (rule && rule.requiredFlags) {
          for (var flagKey in rule.requiredFlags) {
            if (!!gameState.flags[flagKey] !== !!rule.requiredFlags[flagKey]) {
              flagsMatch = false;
              break;
            }
          }
        }

        if (rule && flagsMatch) {
          var sc = rule.stateChange || {};
          if (sc.setFlags) {
            for (var k in sc.setFlags) {
              gameState.flags[k] = sc.setFlags[k];
            }
          }
          if (sc.addItemId && gameState.inventory.indexOf(sc.addItemId) === -1) {
            gameState.inventory.push(sc.addItemId);
          }
          if (sc.removeItemId) {
            gameState.inventory = gameState.inventory.filter(function(i) { return i !== sc.removeItemId; });
          }
          if (sc.removeItem2Id) {
            gameState.inventory = gameState.inventory.filter(function(i) { return i !== sc.removeItem2Id; });
          }
          if (sc.goToSceneId) {
            gameState.currentSceneId = sc.goToSceneId;
            renderScene(sc.goToSceneId);
          }

          if (rule.soundEffect && typeof playSound === 'function') {
            playSound(rule.soundEffect);
          }

          selectedInventoryItem = null;
          activeVerb = null;
          renderInventory();
          updateSentenceBar();

          var comboTitle = '🧩 ' + (targetItem ? targetItem.name : '') + ' + ' + (sourceItem ? sourceItem.name : '');
          var comboMsg = rule.responseMessage || 'Has combinado los objetos con éxito.';
          showPopupModal(comboTitle, escapeHTML(comboMsg), getImageSrc(targetItem) || getImageSrc(sourceItem), '✨');
          return;
        }

        selectedInventoryItem = null;
        activeVerb = null;
        renderInventory();
        updateSentenceBar();

        if (rule && !flagsMatch && rule.failMessage) {
          showPopupModal('Combinación no disponible', escapeHTML(rule.failMessage), null, 'ℹ️');
        } else {
          showPopupModal('Sin efecto', 'No parece ocurrir nada al usar ' + (sourceItem ? sourceItem.name : 'este objeto') + ' con ' + (targetItem ? targetItem.name : 'este objeto') + '.', null, 'ℹ️');
        }
        return;
      }

      if (activeVerb === 'usar') {
        var itemToUse = PROJECT.inventoryItems.find(function(i) { return i.id === id; });
        if (itemToUse && itemToUse.useEffectAction) {
          useInventoryItemDirectly(id);
          return;
        }
      }

      selectedInventoryItem = id;
      renderInventory();

      if (activeVerb === 'mirar') {
        const item = PROJECT.inventoryItems.find(function(i) { return i.id === selectedInventoryItem; });
        if (item) {
          const cleanDesc = stripGameOverTag(item.description || '');
          const itemImg = getImageSrc(item);
          let modalContent = '<div>' + escapeHTML(cleanDesc || 'Sin descripción.') + '</div>';
          showPopupModal(escapeHTML(item.name), modalContent, itemImg, '👁️');
        }
      } else {
        activeVerb = 'usar';
        document.querySelectorAll('.verb-btn').forEach(function(b) { b.classList.remove('active'); });
        const btn = document.getElementById('verb-usar');
        if (btn) btn.classList.add('active');
      }
      updateSentenceBar();
    }

    function useInventoryItemDirectly(id) {
      closePopupModal();
      var item = PROJECT.inventoryItems.find(function(i) { return i.id === id; });
      if (!item) return;

      var rule = item.useEffectAction;
      if (!rule) {
        showPopupModal(escapeHTML(item.name), 'No parece que puedas usar ' + escapeHTML(item.name) + ' por sí solo. Prueba a usarlo con alguna palabra clave del escenario o a combinarlo con otro objeto.', getImageSrc(item), 'ℹ️');
        return;
      }

      var flagsMatch = true;
      if (rule.requiredFlags) {
        for (var flagKey in rule.requiredFlags) {
          if (!!gameState.flags[flagKey] !== !!rule.requiredFlags[flagKey]) {
            flagsMatch = false;
            break;
          }
        }
      }

      if (!flagsMatch) {
        if (typeof playSound === 'function') playSound('error');
        showPopupModal(escapeHTML(item.name), escapeHTML(rule.failMessage || 'No se cumplen las condiciones para usar este objeto en este momento.'), getImageSrc(item), 'ℹ️');
        return;
      }

      var sc = rule.stateChange || {};
      if (sc.setFlags) {
        for (var k in sc.setFlags) {
          gameState.flags[k] = sc.setFlags[k];
        }
      }
      if (sc.addItems && Object.keys(sc.addItems).length > 0) {
        for (var k in sc.addItems) {
          var n = Math.floor(Number(sc.addItems[k]) || 0);
          if (gameState.inventory.indexOf(k) === -1) {
            for (var c = 0; c < n; c++) gameState.inventory.push(k);
          }
        }
      } else if (sc.addItemId) {
        if (gameState.inventory.indexOf(sc.addItemId) === -1) {
          gameState.inventory.push(sc.addItemId);
        }
      }

      if (sc.removeItems && Object.keys(sc.removeItems).length > 0) {
        for (var rk in sc.removeItems) {
          var rn = Math.floor(Number(sc.removeItems[rk]) || 0);
          for (var rc = 0; rc < rn; rc++) {
            var ridx = gameState.inventory.indexOf(rk);
            if (ridx !== -1) gameState.inventory.splice(ridx, 1);
          }
        }
      } else if (sc.removeItemId) {
        var idx = gameState.inventory.indexOf(sc.removeItemId);
        if (idx !== -1) gameState.inventory.splice(idx, 1);
      }

      if (sc.goToSceneId) {
        gameState.currentSceneId = sc.goToSceneId;
        renderScene(sc.goToSceneId);
      }

      if (rule.soundEffect && typeof playSound === 'function') {
        playSound(rule.soundEffect);
      }

      selectedInventoryItem = null;
      activeVerb = null;
      renderInventory();
      updateSentenceBar();

      var isGameOverUse = !!rule.isGameOver || !!sc.isGameOver;
      var respMsg = rule.responseMessage || ('Has usado ' + item.name + '.');
      showPopupModal('✨ ' + escapeHTML(item.name), escapeHTML(respMsg), getImageSrc(item), isGameOverUse ? '💀' : '✨');

      if (isGameOverUse) {
        gameState.isGameOver = true;
        if (typeof showGameOverScreen === 'function') {
          showGameOverScreen(escapeHTML(respMsg));
        }
      }
      if (typeof saveGameState === 'function') {
        saveGameState();
      }
    }

    function renderInventory() {
      const list = document.getElementById('inventory-list');
      if (gameState.inventory.length === 0) {
        list.innerHTML = '<span class="empty-inv">Tu inventario está vacío.</span>';
        return;
      }

      var uniqueItemIds = [];
      for (var i = 0; i < gameState.inventory.length; i++) {
        var id = gameState.inventory[i];
        if (uniqueItemIds.indexOf(id) === -1) {
          uniqueItemIds.push(id);
        }
      }

      list.innerHTML = uniqueItemIds.map(itemId => {
        const item = PROJECT.inventoryItems.find(i => i.id === itemId);
        if (!item) return '';
        const count = gameState.inventory.filter(id => id === itemId).length;
        const isSel = selectedInventoryItem === itemId ? 'selected' : '';
        const qtyBadge = count > 1 ? '<span class="inv-qty-badge">x' + count + '</span>' : '';
        const isComboTarget = selectedInventoryItem && selectedInventoryItem !== itemId ? '<span style="font-size: 0.65rem; color: #fbbf24; background: rgba(245, 158, 11, 0.15); padding: 2px 5px; border-radius: 4px; margin-left: auto;">🧩 Combinar</span>' : '';
        const useBadge = item.useEffectAction ? '<span style="font-size: 0.65rem; color: #34d399; background: rgba(16, 185, 129, 0.15); padding: 2px 5px; border-radius: 4px; margin-left: 4px;">✨ Usar</span>' : '';
        return '<div class="inv-item ' + isSel + '" onclick="selectInventoryItem(\\\'' + itemId + '\\\')"><span>📦 ' + escapeHTML(item.name) + ' ' + qtyBadge + '</span><span style="display: flex; align-items: center; gap: 4px;">' + isComboTarget + useBadge + '</span></div>';
      }).join('');
    }

    function updateSentenceBar() {
      const bar = document.getElementById('sentence-bar').querySelector('span');
      let text = '';
      if (activeVerb) {
        var verbLabels = {
          'mirar': 'MIRAR',
          'usar': 'USAR / ACTIVAR',
          'abrir': 'ABRIR',
          'coger': 'COGER / TIRAR',
          'hablar': 'HABLAR',
          'empujar': 'EMPUJAR / ATACAR',
          'ir_a': 'IR A'
        };
        text += (verbLabels[activeVerb] || activeVerb.toUpperCase()) + ' ';
      }
      if (selectedInventoryItem) {
        const item = PROJECT.inventoryItems.find(i => i.id === selectedInventoryItem);
        if (item) text += '[' + item.name + '] ';
      }
      if (!text) {
        text = 'Selecciona un verbo o pulsa sobre una palabra clave.';
      } else {
        text += '... (haz clic en un objeto del texto)';
      }
      bar.innerText = text;
    }

    function clearSentence() {
      activeVerb = null;
      selectedInventoryItem = null;
      document.querySelectorAll('.verb-btn').forEach(b => b.classList.remove('active'));
      renderInventory();
      updateSentenceBar();
    }

    function clickHotspot(hotspotId, event) {
      if (event) event.stopPropagation();
      if (isGameOverState()) return;

      const scene = getActiveScene();
      if (!scene) return;
      const hs = (scene.hotspots || []).find(h => h.id === hotspotId);
      if (!hs) return;

      if (!gameState.usedHotspotIds) gameState.usedHotspotIds = [];
      if (!gameState.usedHotspotIds.includes(hs.id)) {
        gameState.usedHotspotIds.push(hs.id);
      }

      const verbToUse = activeVerb || 'mirar';

      // Find all matching action rules for this verb
      const rulesForVerb = (hs.actions || []).filter(function(a) {
        return a.verb === verbToUse;
      });

      const matchingRules = rulesForVerb.filter(function(a) {
        if (a.requiredItemId && selectedInventoryItem !== a.requiredItemId && !gameState.inventory.includes(a.requiredItemId)) {
          return false;
        }
        if (a.requiredFlags && !checkConditions(a.requiredFlags)) {
          return false;
        }
        if (!checkConditions(a.visibleIfFlags, a.hiddenIfFlags)) {
          return false;
        }
        return true;
      });

      function getRuleScore(r: any) {
        return (r.requiredFlags ? Object.keys(r.requiredFlags).length : 0) + (r.requiredItemId ? 1 : 0);
      }

      matchingRules.sort(function(r1: any, r2: any) {
        return getRuleScore(r2) - getRuleScore(r1);
      });

      const maxScore = matchingRules.length > 0 ? getRuleScore(matchingRules[0]) : 0;
      const topRules = matchingRules.filter(function(r: any) {
        return getRuleScore(r) === maxScore;
      });

      const useKey = hs.id + '_' + verbToUse + '_' + maxScore;
      const currentUseCount = gameState.verbUseCounts[useKey] || 0;
      const ruleIndex = topRules.length > 0 ? Math.min(currentUseCount, topRules.length - 1) : -1;
      const rule = ruleIndex >= 0 ? topRules[ruleIndex] : null;

      gameState.verbUseCounts[useKey] = (gameState.verbUseCounts[useKey] || 0) + 1;

      const responseBox = document.getElementById('response-box');
      responseBox.style.display = 'block';

      if (rule) {
        var sc = rule.stateChange;
        var ruleItemIds = [];
        if (sc && sc.addItems && Object.keys(sc.addItems).length > 0) {
          for (var rk in sc.addItems) {
            if (Number(sc.addItems[rk]) > 0) ruleItemIds.push(rk);
          }
        } else if (sc && sc.addItemId) {
          ruleItemIds.push(sc.addItemId);
        }
        var alreadyHasItems = ruleItemIds.length > 0 && ruleItemIds.every(function(id) {
          return gameState.inventory.indexOf(id) !== -1;
        });

        if (rule.soundEffect && rule.soundEffect !== 'none') {
          playSound(rule.soundEffect);
        } else if (sc && sc.addItemId && !alreadyHasItems) {
          playSound('pickup');
        } else if (sc && sc.goToSceneId) {
          playSound('door');
        } else {
          playSound('click');
        }

        var firstItem = ruleItemIds.length > 0 ? PROJECT.inventoryItems.find(function(i) { return i.id === ruleItemIds[0]; }) : null;

        let msg = '';
        if (alreadyHasItems) {
          if (firstItem && firstItem.description && firstItem.description.trim()) {
            msg = firstItem.description.trim();
          } else if (rule.responseMessage) {
            msg = stripGameOverTag(rule.responseMessage);
          } else {
            msg = 'Ya tienes ' + (firstItem ? firstItem.name : 'este objeto') + ' en tu inventario.';
          }
        } else {
          msg = stripGameOverTag(rule.responseMessage || '');
        }

        let addedImgHtml = '';
        let itemImgSrc = '';

        if (alreadyHasItems && firstItem) {
          itemImgSrc = getImageSrc(firstItem);
          if (itemImgSrc) {
            addedImgHtml = '<div style="margin-top: 0.75rem; text-align: center;"><img src="' + escapeHTML(itemImgSrc) + '" alt="' + escapeHTML(firstItem.name) + '" style="max-height: 160px; max-width: 100%; border-radius: 8px; border: 1px solid var(--accent); margin: 0 auto; display: block;" /></div>';
          }
        }

        const isRuleGameOver = !!rule.isGameOver || !!(rule.stateChange && rule.stateChange.isGameOver) || checkGameOverTag(rule.responseMessage || '');
        if (isRuleGameOver) {
          gameState.isGameOver = true;
        }

        if (rule.stateChange) {
          if (sc.setFlags) Object.assign(gameState.flags, sc.setFlags);
          if (sc.addItems && Object.keys(sc.addItems).length > 0) {
            for (var ak in sc.addItems) {
              var an = Math.floor(Number(sc.addItems[ak]) || 0);
              if (gameState.inventory.indexOf(ak) === -1) {
                for (var ac = 0; ac < an; ac++) gameState.inventory.push(ak);
              }
              const addedItem = PROJECT.inventoryItems.find(i => i.id === ak);
              if (addedItem && !itemImgSrc && !alreadyHasItems) {
                itemImgSrc = getImageSrc(addedItem);
                if (itemImgSrc) {
                  addedImgHtml = '<div style="margin-top: 0.75rem; text-align: center;"><img src="' + escapeHTML(itemImgSrc) + '" alt="' + escapeHTML(addedItem.name) + '" style="max-height: 160px; max-width: 100%; border-radius: 8px; border: 1px solid var(--accent); margin: 0 auto; display: block;" /></div>';
                }
              }
            }
          } else if (sc.addItemId) {
            if (gameState.inventory.indexOf(sc.addItemId) === -1) {
              gameState.inventory.push(sc.addItemId);
            }
            const addedItem = PROJECT.inventoryItems.find(i => i.id === sc.addItemId);
            if (addedItem && !itemImgSrc && !alreadyHasItems) {
              itemImgSrc = getImageSrc(addedItem);
              if (itemImgSrc) {
                addedImgHtml = '<div style="margin-top: 0.75rem; text-align: center;"><img src="' + escapeHTML(itemImgSrc) + '" alt="' + escapeHTML(addedItem.name) + '" style="max-height: 160px; max-width: 100%; border-radius: 8px; border: 1px solid var(--accent); margin: 0 auto; display: block;" /></div>';
              }
            }
          }

          if (sc.removeItems && Object.keys(sc.removeItems).length > 0) {
            for (var rk in sc.removeItems) {
              var rn = Math.floor(Number(sc.removeItems[rk]) || 0);
              for (var rc = 0; rc < rn; rc++) {
                var ridx = gameState.inventory.indexOf(rk);
                if (ridx !== -1) gameState.inventory.splice(ridx, 1);
              }
            }
          } else if (sc.removeItemId) {
            var rmidx = gameState.inventory.indexOf(sc.removeItemId);
            if (rmidx !== -1) gameState.inventory.splice(rmidx, 1);
          }
          if (sc.appendStoryText) {
            if (!gameState.appendedTexts[gameState.currentSceneId]) {
              gameState.appendedTexts[gameState.currentSceneId] = [];
            }
            const currentList = gameState.appendedTexts[gameState.currentSceneId];
            const parentBlock = (scene.textBlocks || []).find(function(b) {
              if (isWordMatchInText(hs.word, b.text)) return true;
              return currentList.some(function(item) {
                if (typeof item !== 'string' && item.blockId === b.id) {
                  return isWordMatchInText(hs.word, item.text);
                }
                return false;
              });
            });
            const entryObj = {
              text: sc.appendStoryText,
              blockId: parentBlock ? parentBlock.id : null
            };
            const exists = currentList.some(function(item) {
              return (typeof item === 'string' ? item : item.text) === sc.appendStoryText;
            });
            if (!exists) {
              currentList.push(entryObj);
            }
            if (checkGameOverTag(sc.appendStoryText)) {
              gameState.isGameOver = true;
            }
          }
          if (sc.goToSceneId) {
            gameState.currentSceneId = sc.goToSceneId;
          }
        }
        responseBox.innerHTML = '<div>' + escapeHTML(msg) + '</div>' + addedImgHtml;

        const VERB_ICONS = {
          mirar: '👁️',
          examinar: '🔍',
          coger: '✋',
          tomar: '✋',
          usar: '⚙️',
          hablar: '💬',
          ir: '🚪',
          abrir: '📂',
          empujar: '🫸',
          tirar: '🫷',
          dar: '🎁',
          combinar: '🧩'
        };
        const actionIcon = VERB_ICONS[verbToUse] || '👁️';

        if (isRuleGameOver) {
          showPopupModal('FIN DE PARTIDA', escapeHTML(msg), itemImgSrc, '💀');
        } else if (itemImgSrc) {
          showPopupModal('Objeto', escapeHTML(msg), itemImgSrc, '📦');
        } else {
          // Action message: no text header, ONLY the verb icon
          showPopupModal('', escapeHTML(msg), itemImgSrc, actionIcon);
        }
      } else {
        // Fallback response - check if any rule for this verb specifies fail configurations
        const VERB_ICONS = {
          mirar: '👁️',
          examinar: '🔍',
          coger: '✋',
          tomar: '✋',
          usar: '⚙️',
          hablar: '💬',
          ir: '🚪',
          abrir: '📂',
          empujar: '🫸',
          tirar: '🫷',
          dar: '🎁',
          combinar: '🧩'
        };
        const actionIcon = VERB_ICONS[verbToUse] || '👁️';

        var failedRule = null;
        for (var fi = 0; fi < rulesForVerb.length; fi++) {
          var r = rulesForVerb[fi];
          if (r.failMessage || r.failStateChange || r.failIsGameOver || r.failSoundEffect) {
            failedRule = r;
            break;
          }
        }

        const fallback = (failedRule && failedRule.failMessage) ||
                         (hs.customDefaultResponses && hs.customDefaultResponses[verbToUse]) ||
                         (PROJECT.defaultResponses && PROJECT.defaultResponses[verbToUse]) ||
                         'Eso no parece funcionar.';

        if (failedRule && failedRule.failSoundEffect && failedRule.failSoundEffect !== 'none') {
          playSound(failedRule.failSoundEffect);
        } else {
          playSound('error');
        }

        const isFailGameOver = !!(failedRule && failedRule.failIsGameOver) ||
                               !!(failedRule && failedRule.failStateChange && failedRule.failStateChange.isGameOver) ||
                               checkGameOverTag(failedRule ? failedRule.failMessage || '' : '');

        if (isFailGameOver) {
          gameState.isGameOver = true;
        }

        let failImgSrc = '';
        if (failedRule && failedRule.failStateChange) {
          const fsc = failedRule.failStateChange;
          if (fsc.setFlags) Object.assign(gameState.flags, fsc.setFlags);
          if (fsc.addItems && Object.keys(fsc.addItems).length > 0) {
            for (var fak in fsc.addItems) {
              var fan = Math.floor(Number(fsc.addItems[fak]) || 0);
              for (var fac = 0; fac < fan; fac++) gameState.inventory.push(fak);
              const addedItem = PROJECT.inventoryItems.find(i => i.id === fak);
              if (addedItem && !failImgSrc) failImgSrc = getImageSrc(addedItem);
            }
          } else if (fsc.addItemId) {
            gameState.inventory.push(fsc.addItemId);
            const addedItem = PROJECT.inventoryItems.find(i => i.id === fsc.addItemId);
            if (addedItem) failImgSrc = getImageSrc(addedItem);
          }

          if (fsc.removeItems && Object.keys(fsc.removeItems).length > 0) {
            for (var frk in fsc.removeItems) {
              var frn = Math.floor(Number(fsc.removeItems[frk]) || 0);
              for (var frc = 0; frc < frn; frc++) {
                var fridx = gameState.inventory.indexOf(frk);
                if (fridx !== -1) gameState.inventory.splice(fridx, 1);
              }
            }
          } else if (fsc.removeItemId) {
            var frmidx = gameState.inventory.indexOf(fsc.removeItemId);
            if (frmidx !== -1) gameState.inventory.splice(frmidx, 1);
          }
          if (fsc.appendStoryText) {
            if (!gameState.appendedTexts[gameState.currentSceneId]) {
              gameState.appendedTexts[gameState.currentSceneId] = [];
            }
            const currentList = gameState.appendedTexts[gameState.currentSceneId];
            const parentBlock = (scene.textBlocks || []).find(function(b) {
              if (isWordMatchInText(hs.word, b.text)) return true;
              return currentList.some(function(item) {
                if (typeof item !== 'string' && item.blockId === b.id) {
                  return isWordMatchInText(hs.word, item.text);
                }
                return false;
              });
            });
            const entryObj = {
              text: fsc.appendStoryText,
              blockId: parentBlock ? parentBlock.id : null
            };
            const exists = currentList.some(function(item) {
              return (typeof item === 'string' ? item : item.text) === fsc.appendStoryText;
            });
            if (!exists) {
              currentList.push(entryObj);
            }
            if (checkGameOverTag(fsc.appendStoryText)) {
              gameState.isGameOver = true;
            }
          }
          if (fsc.goToSceneId) {
            gameState.currentSceneId = fsc.goToSceneId;
          }
        }

        const cleanFb = stripGameOverTag(fallback);
        responseBox.innerText = cleanFb;

        if (isFailGameOver) {
          showPopupModal('FIN DE PARTIDA', escapeHTML(cleanFb), failImgSrc, '💀');
        } else if (failImgSrc) {
          showPopupModal('Objeto', escapeHTML(cleanFb), failImgSrc, '📦');
        } else {
          showPopupModal('', escapeHTML(cleanFb), failImgSrc, actionIcon);
        }
      }

      clearSentence();
      render();
    }

    function saveGame() {
      try {
        localStorage.setItem('html_adventure_save_' + PROJECT.id, JSON.stringify(gameState));
        showPopupModal('💾 Guardar Partida', '¡Partida guardada correctamente en este navegador!');
      } catch (e) {
        showPopupModal('⚠️ Error', 'No se pudo guardar la partida en el almacenamiento local del navegador.');
      }
    }

    function loadGame() {
      try {
        const data = localStorage.getItem('html_adventure_save_' + PROJECT.id);
        if (data) {
          gameState = JSON.parse(data);
          if (!gameState.verbUseCounts) gameState.verbUseCounts = {};
          if (!gameState.usedHotspotIds) gameState.usedHotspotIds = [];
          if (!gameState.difficulty) gameState.difficulty = PROJECT.difficultyMode || 'easy';
          if (gameState.isGameOver === undefined) gameState.isGameOver = false;
          showPopupModal('📂 Cargar Partida', '¡Partida cargada correctamente!');
          render();
        } else {
          showPopupModal('📂 Cargar Partida', 'No hay ninguna partida guardada en este navegador.');
        }
      } catch (e) {
        showPopupModal('⚠️ Error', 'No se pudo acceder a la partida guardada en el almacenamiento local.');
      }
    }

    function resetGame() {
      if (confirm('¿Quieres reiniciar la partida? Se perderá el progreso no guardado.')) {
        gameState = {
          currentSceneId: PROJECT.initialSceneId,
          inventory: [],
          flags: Object.assign({}, PROJECT.globalFlags || {}),
          appendedTexts: {},
          usedHotspotIds: [],
          verbUseCounts: {},
          difficulty: PROJECT.difficultyMode || 'easy',
          isGameOver: false
        };
        document.getElementById('response-box').style.display = 'none';
        clearSentence();
        render();
      }
    }

    render();
  </script>
</body>
</html>`;
}

function escapeHTML(str: string): string {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
