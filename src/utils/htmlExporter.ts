import { GameProject } from '../types';

/**
 * Generates a self-contained single-file HTML game that requires no external dependencies or servers.
 * It contains the full play runtime, styles, save/load engine, and embedded project data.
 */
export function generateStandaloneHTML(project: GameProject): string {
  const jsonProject = JSON.stringify(project).replace(/</g, '\\u003c');

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
  </style>
</head>
<body>
  <header>
    <div>
      <h1 id="game-title">Aventura</h1>
      <div class="author" id="game-author"></div>
    </div>
    <div>
      <button class="btn" onclick="saveGame()">💾 Guardar</button>
      <button class="btn" onclick="loadGame()">📂 Cargar</button>
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

  <script>
    const PROJECT = ${jsonProject};

    let gameState = {
      currentSceneId: PROJECT.initialSceneId,
      inventory: [],
      flags: Object.assign({}, PROJECT.globalFlags || {}),
      appendedTexts: {}
    };

    let activeVerb = null;
    let selectedInventoryItem = null;

    document.getElementById('game-title').innerText = PROJECT.title;
    document.getElementById('game-author').innerText = 'Por ' + PROJECT.author;

    function render() {
      const scene = PROJECT.scenes.find(s => s.id === gameState.currentSceneId);
      if (!scene) return;

      const storyCard = document.getElementById('story-content');
      let combinedHTML = '';

      // Text blocks
      scene.textBlocks.forEach(block => {
        if (checkConditions(block.visibleIfFlags, block.hiddenIfFlags)) {
          combinedHTML += '<p style="margin-bottom: 1rem;">' + parseInteractiveText(block.text, scene) + '</p>';
        }
      });

      // Appended texts for scene
      const appended = gameState.appendedTexts[scene.id] || [];
      appended.forEach(t => {
        combinedHTML += '<p style="margin-bottom: 1rem; color: #fef08a;">' + parseInteractiveText(t, scene) + '</p>';
      });

      storyCard.innerHTML = combinedHTML;
      renderInventory();
      updateSentenceBar();
    }

    function parseInteractiveText(text, scene) {
      let result = text;
      scene.hotspots.forEach(hs => {
        if (!hs.initialVisible) return;
        if (!checkConditions(hs.visibleIfFlags, hs.hiddenIfFlags)) return;

        const regex = new RegExp('(\\\\b' + escapeRegExp(hs.word) + '\\\\b)', 'gi');
        result = result.replace(regex, '<span class="hotspot" onclick="clickHotspot(\\'' + hs.id + '\\', event)">$1</span>');
      });
      return result;
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
        return '<div class="inv-item ' + isSel + '" onclick="selectInventoryItem(\\'' + itemId + '\\')">📦 ' + escapeHTML(item.name) + '</div>';
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
      event.stopPropagation();
      const scene = PROJECT.scenes.find(s => s.id === gameState.currentSceneId);
      if (!scene) return;
      const hs = scene.hotspots.find(h => h.id === hotspotId);
      if (!hs) return;

      const verbToUse = activeVerb || 'mirar';

      // Find action rule
      const rule = hs.actions.find(a => {
        if (a.verb !== verbToUse) return false;
        if (a.requiredItemId && selectedInventoryItem !== a.requiredItemId && !gameState.inventory.includes(a.requiredItemId)) {
          return false;
        }
        return true;
      });

      const responseBox = document.getElementById('response-box');
      responseBox.style.display = 'block';

      if (rule) {
        responseBox.innerText = rule.responseMessage;
        
        if (rule.stateChange) {
          const sc = rule.stateChange;
          if (sc.setFlags) Object.assign(gameState.flags, sc.setFlags);
          if (sc.addItemId && !gameState.inventory.includes(sc.addItemId)) {
            gameState.inventory.push(sc.addItemId);
          }
          if (sc.removeItemId) {
            gameState.inventory = gameState.inventory.filter(i => i !== sc.removeItemId);
          }
          if (sc.appendStoryText) {
            if (!gameState.appendedTexts[gameState.currentSceneId]) {
              gameState.appendedTexts[gameState.currentSceneId] = [];
            }
            gameState.appendedTexts[gameState.currentSceneId].push(sc.appendStoryText);
          }
          if (sc.goToSceneId) {
            gameState.currentSceneId = sc.goToSceneId;
          }
        }
      } else {
        // Fallback response
        const fallback = (hs.customDefaultResponses && hs.customDefaultResponses[verbToUse]) ||
                         (PROJECT.defaultResponses && PROJECT.defaultResponses[verbToUse]) ||
                         'Eso no parece funcionar.';
        responseBox.innerText = fallback;
      }

      clearSentence();
      render();
    }

    function saveGame() {
      localStorage.setItem('html_adventure_save_' + PROJECT.id, JSON.stringify(gameState));
      alert('¡Partida guardada correctamente!');
    }

    function loadGame() {
      const data = localStorage.getItem('html_adventure_save_' + PROJECT.id);
      if (data) {
        gameState = JSON.parse(data);
        alert('¡Partida cargada!');
        render();
      } else {
        alert('No hay ninguna partida guardada.');
      }
    }

    function resetGame() {
      if (confirm('¿Quieres reiniciar la partida? Se perderá el progreso no guardado.')) {
        gameState = {
          currentSceneId: PROJECT.initialSceneId,
          inventory: [],
          flags: Object.assign({}, PROJECT.globalFlags || {}),
          appendedTexts: {}
        };
        document.getElementById('response-box').style.display = 'none';
        clearSentence();
        render();
      }
    }

    function escapeRegExp(string) {
      return string.replace(/[.*+?^$\\{}()|[\\]\\\\]/g, '\\\\$&');
    }

    function escapeHTML(str) {
      return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    render();
  </script>
</body>
</html>`;
}

function escapeHTML(str: string): string {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
