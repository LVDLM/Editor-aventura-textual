import { GameProject } from '../types';

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

    <div class="controls-grid">
      <div class="verbs-panel">
        <div class="verbs-title">Acciones (Verbos)</div>
        <div class="verb-buttons">
          <button class="verb-btn" id="verb-mirar" onclick="selectVerb('mirar')">👁️ Mirar</button>
          <button class="verb-btn" id="verb-usar" onclick="selectVerb('usar')">⚡ Usar</button>
          <button class="verb-btn" id="verb-abrir" onclick="selectVerb('abrir')">🚪 Abrir</button>
          <button class="verb-btn" id="verb-coger" onclick="selectVerb('coger')">✋ Coger</button>
          <button class="verb-btn" id="verb-hablar" onclick="selectVerb('hablar')">💬 Hablar</button>
          <button class="verb-btn" id="verb-empujar" onclick="selectVerb('empujar')">💪 Empujar</button>
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
    function playSound(type) {
      if (!type || type === 'none') return;
      try {
        if (!audioCtx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (AC) audioCtx = new AC();
        }
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        if (!audioCtx) return;
        const now = audioCtx.currentTime;

        if (type === 'click') {
          const o = audioCtx.createOscillator(), g = audioCtx.createGain();
          o.type = 'sine'; o.frequency.setValueAtTime(400, now); o.frequency.exponentialRampToValueAtTime(200, now + 0.05);
          g.gain.setValueAtTime(0.15, now); g.gain.linearRampToValueAtTime(0.01, now + 0.05);
          o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + 0.05);
        } else if (type === 'fanfare') {
          [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
            const o = audioCtx.createOscillator(), g = audioCtx.createGain();
            o.type = 'triangle'; o.frequency.setValueAtTime(f, now + i * 0.09);
            g.gain.setValueAtTime(0, now + i * 0.09); g.gain.linearRampToValueAtTime(0.25, now + i * 0.09 + 0.02);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.3);
            o.connect(g); g.connect(audioCtx.destination); o.start(now + i * 0.09); o.stop(now + i * 0.09 + 0.32);
          });
        } else if (type === 'door' || type === 'door_squeak') {
          const o = audioCtx.createOscillator(), g = audioCtx.createGain(), flt = audioCtx.createBiquadFilter();
          o.type = 'sawtooth'; o.frequency.setValueAtTime(420, now); o.frequency.linearRampToValueAtTime(750, now + 0.18); o.frequency.linearRampToValueAtTime(310, now + 0.38); o.frequency.linearRampToValueAtTime(550, now + 0.5);
          flt.type = 'bandpass'; flt.frequency.setValueAtTime(650, now); flt.Q.setValueAtTime(2.5, now);
          g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.18, now + 0.04); g.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
          o.connect(flt); flt.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + 0.54);
        } else if (type === 'damage') {
          const o = audioCtx.createOscillator(), g = audioCtx.createGain();
          o.type = 'square'; o.frequency.setValueAtTime(170, now); o.frequency.exponentialRampToValueAtTime(30, now + 0.25);
          g.gain.setValueAtTime(0.3, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
          o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + 0.3);
        } else if (type === 'gunshot') {
          const dur = 0.35, bufferSize = audioCtx.sampleRate * dur, buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate), data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
          const noise = audioCtx.createBufferSource(); noise.buffer = buffer;
          const filter = audioCtx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.setValueAtTime(3200, now); filter.frequency.exponentialRampToValueAtTime(180, now + dur);
          const gain = audioCtx.createGain(); gain.gain.setValueAtTime(0.45, now); gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
          noise.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination); noise.start(now);
        } else if (type === 'pickup') {
          const o = audioCtx.createOscillator(), g = audioCtx.createGain();
          o.type = 'sine'; o.frequency.setValueAtTime(440, now); o.frequency.exponentialRampToValueAtTime(880, now + 0.12);
          g.gain.setValueAtTime(0.2, now); g.gain.linearRampToValueAtTime(0.01, now + 0.12);
          o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + 0.12);
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
      const hasBlockGameOver = (scene.textBlocks || []).some(b => b.isGameOver || checkGameOverTag(b.text));
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

    function parseInteractiveText(text, scene) {
      if (!text) return '';
      if (isGameOverState()) return escapeHTML(text);
      if (!scene || !scene.hotspots || scene.hotspots.length === 0) return escapeHTML(text);

      const activeHotspots = scene.hotspots.filter(h => {
        if (!h.initialVisible) return false;
        return checkConditions(h.visibleIfFlags, h.hiddenIfFlags);
      });

      if (activeHotspots.length === 0) return escapeHTML(text);

      const sortedHotspots = [...activeHotspots].sort((a, b) => b.word.length - a.word.length);
      const pattern = new RegExp('(' + sortedHotspots.map(h => escapeRegExp(h.word)).join('|') + ')', 'gi');

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

    function renderTextBlock(text, scene) {
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
      return parseInteractiveText(text, scene);
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
      }

      // Text blocks
      (scene.textBlocks || []).forEach((block, bIdx) => {
        if (checkConditions(block.visibleIfFlags, block.hiddenIfFlags)) {
          const imgSrc = getImageSrc(block);
          const isPortada = block.type === 'portada' || scene.type === 'portada';
          const hasText = !!(block.text && block.text.trim().length > 0);

          combinedHTML += '<div id="block-' + block.id + '" style="margin-bottom: 1.25rem;">';

          if (imgSrc) {
            if (isPortada) {
              combinedHTML += '<div style="margin-bottom: 1rem; text-align: center;"><img src="' + escapeHTML(imgSrc) + '" alt="Portada" style="width: 100%; max-height: 380px; object-fit: cover; border-radius: 16px; border: 2px solid var(--accent); box-shadow: 0 8px 25px rgba(0,0,0,0.5);" /></div>';
            } else {
              combinedHTML += '<div style="margin-bottom: 1rem; text-align: center;"><img src="' + escapeHTML(imgSrc) + '" alt="Ilustración" style="display: block; width: 100%; max-height: 280px; object-fit: cover; border-radius: 12px; margin: 0 auto; border: 1px solid var(--border-color);" /></div>';
            }
          }

          if (hasText) {
            combinedHTML += '<p style="margin-bottom: 0.75rem;">' + renderTextBlock(block.text, scene) + '</p>';
          }

          combinedHTML += '</div>';
        }
      });

      // Appended texts for scene
      const appended = gameState.appendedTexts[scene.id] || [];
      appended.forEach(t => {
        combinedHTML += '<p style="margin-bottom: 1rem; color: #fef08a;">' + renderTextBlock(t, scene) + '</p>';
      });

      if (!combinedHTML) {
        combinedHTML = '<p style="color: #94a3b8; font-style: italic;">No hay texto disponible para mostrar en esta escena.</p>';
      }

      if (storyCard) storyCard.innerHTML = combinedHTML;
      renderInventory();
      updateSentenceBar();

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
      selectedInventoryItem = selectedInventoryItem === id ? null : id;
      renderInventory();
      updateSentenceBar();

      if (selectedInventoryItem) {
        const item = PROJECT.inventoryItems.find(i => i.id === selectedInventoryItem);
        if (item) {
          const responseBox = document.getElementById('response-box');
          responseBox.style.display = 'block';
          const cleanDesc = stripGameOverTag(item.description || '');
          let html = '<div style="font-weight: 700; font-size: 1.05rem; color: var(--accent); margin-bottom: 0.25rem;">📦 ' + escapeHTML(item.name) + '</div>' +
                     '<div>' + escapeHTML(cleanDesc || 'Sin descripción.') + '</div>';
          const itemImg = getImageSrc(item);
          if (itemImg) {
            html += '<div style="margin-top: 0.75rem; text-align: center;"><img src="' + escapeHTML(itemImg) + '" alt="' + escapeHTML(item.name) + '" style="max-height: 180px; max-width: 100%; border-radius: 8px; border: 1px solid var(--accent); margin: 0 auto; display: block;" /></div>';
          }
          responseBox.innerHTML = html;
          showPopupModal(escapeHTML(item.name), escapeHTML(cleanDesc || 'Sin descripción.'), itemImg, '📦');
        }
      }
    }

    function renderInventory() {
      const list = document.getElementById('inventory-list');
      if (gameState.inventory.length === 0) {
        list.innerHTML = '<span class="empty-inv">Tu inventario está vacío.</span>';
        return;
      }

      list.innerHTML = gameState.inventory.map(itemId => {
        const item = PROJECT.inventoryItems.find(i => i.id === itemId);
        if (!item) return '';
        const isSel = selectedInventoryItem === itemId ? 'selected' : '';
        return '<div class="inv-item ' + isSel + '" onclick="selectInventoryItem(\\\'' + itemId + '\\\')">📦 ' + escapeHTML(item.name) + '</div>';
      }).join('');
    }

    function updateSentenceBar() {
      const bar = document.getElementById('sentence-bar').querySelector('span');
      let text = '';
      if (activeVerb) {
        text += activeVerb.toUpperCase() + ' ';
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
      const matchingRules = hs.actions.filter(a => {
        if (a.verb !== verbToUse) return false;
        if (a.requiredItemId && selectedInventoryItem !== a.requiredItemId && !gameState.inventory.includes(a.requiredItemId)) {
          return false;
        }
        return true;
      });

      const useKey = hs.id + '_' + verbToUse;
      const currentUseCount = gameState.verbUseCounts[useKey] || 0;
      const ruleIndex = matchingRules.length > 0 ? Math.min(currentUseCount, matchingRules.length - 1) : -1;
      const rule = ruleIndex >= 0 ? matchingRules[ruleIndex] : null;

      gameState.verbUseCounts[useKey] = (gameState.verbUseCounts[useKey] || 0) + 1;

      const responseBox = document.getElementById('response-box');
      responseBox.style.display = 'block';

      if (rule) {
        if (rule.soundEffect && rule.soundEffect !== 'none') {
          playSound(rule.soundEffect);
        } else if (rule.stateChange && rule.stateChange.addItemId) {
          playSound('pickup');
        } else if (rule.stateChange && rule.stateChange.goToSceneId) {
          playSound('door');
        } else {
          playSound('click');
        }

        let msg = stripGameOverTag(rule.responseMessage || '');
        let addedImgHtml = '';
        let itemImgSrc = '';

        const isRuleGameOver = !!rule.isGameOver || !!(rule.stateChange && rule.stateChange.isGameOver) || checkGameOverTag(rule.responseMessage || '');
        if (isRuleGameOver) {
          gameState.isGameOver = true;
        }

        if (rule.stateChange) {
          const sc = rule.stateChange;
          if (sc.setFlags) Object.assign(gameState.flags, sc.setFlags);
          if (sc.addItemId && !gameState.inventory.includes(sc.addItemId)) {
            gameState.inventory.push(sc.addItemId);
            const addedItem = PROJECT.inventoryItems.find(i => i.id === sc.addItemId);
            if (addedItem) {
              itemImgSrc = getImageSrc(addedItem);
              if (itemImgSrc) {
                addedImgHtml = '<div style="margin-top: 0.75rem; text-align: center;"><img src="' + escapeHTML(itemImgSrc) + '" alt="' + escapeHTML(addedItem.name) + '" style="max-height: 160px; max-width: 100%; border-radius: 8px; border: 1px solid var(--accent); margin: 0 auto; display: block;" /></div>';
              }
            }
          }
          if (sc.removeItemId) {
            gameState.inventory = gameState.inventory.filter(i => i !== sc.removeItemId);
          }
          if (sc.appendStoryText) {
            if (!gameState.appendedTexts[gameState.currentSceneId]) {
              gameState.appendedTexts[gameState.currentSceneId] = [];
            }
            gameState.appendedTexts[gameState.currentSceneId].push(sc.appendStoryText);
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
        // Fallback response
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

        const fallback = (hs.customDefaultResponses && hs.customDefaultResponses[verbToUse]) ||
                         (PROJECT.defaultResponses && PROJECT.defaultResponses[verbToUse]) ||
                         'Eso no parece funcionar.';
        const cleanFb = stripGameOverTag(fallback);
        responseBox.innerText = cleanFb;
        showPopupModal('', escapeHTML(cleanFb), null, actionIcon);
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
