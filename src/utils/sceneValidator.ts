import { GameProject, Scene } from '../types';

export interface SceneValidationIssue {
  id: string;
  sceneId: string;
  sceneName: string;
  type: 'unlinked' | 'dead_end' | 'no_return';
  severity: 'error' | 'warning';
  title: string;
  message: string;
  suggestion: string;
}

export function validateProjectScenes(project: GameProject): SceneValidationIssue[] {
  const issues: SceneValidationIssue[] = [];
  const scenes = project.scenes || [];
  if (scenes.length === 0) return issues;

  // Track incoming connections (who links TO sceneId) and outgoing connections (who sceneId links TO)
  const incomingMap: Record<string, Set<string>> = {};
  const outgoingMap: Record<string, Set<string>> = {};
  const hasGameOverAction: Record<string, boolean> = {};

  scenes.forEach((s) => {
    incomingMap[s.id] = new Set();
    outgoingMap[s.id] = new Set();
    hasGameOverAction[s.id] = false;

    // Check if any block has game over flag, type 'final', or text tag like [Terminar / Cargar partida]
    if (
      s.type === 'final' ||
      s.textBlocks?.some(
        (b) =>
          b.isGameOver ||
          b.type === 'final' ||
          /\[(?:Terminar \/ Cargar partida|Terminar|Fin de partida|Fin|Game Over|Cargar partida|FIN)\]/i.test(
            b.text || ''
          )
      )
    ) {
      hasGameOverAction[s.id] = true;
    }

    // Check hotspots and actions
    s.hotspots?.forEach((h) => {
      h.actions?.forEach((act) => {
        if (act.isGameOver || act.stateChange?.isGameOver) {
          hasGameOverAction[s.id] = true;
        }
        const targetId = act.stateChange?.goToSceneId;
        if (targetId && targetId !== s.id) {
          outgoingMap[s.id].add(targetId);
        }
      });
    });

    // Check QTE config
    if (s.qteConfig) {
      if (s.qteConfig.isFailGameOver) {
        hasGameOverAction[s.id] = true;
      }
      if (s.qteConfig.onSuccessSceneId && s.qteConfig.onSuccessSceneId !== s.id) {
        outgoingMap[s.id].add(s.qteConfig.onSuccessSceneId);
      }
      if (s.qteConfig.onFailSceneId && s.qteConfig.onFailSceneId !== s.id) {
        outgoingMap[s.id].add(s.qteConfig.onFailSceneId);
      }
    }
  });

  // Populate incoming connections map
  Object.entries(outgoingMap).forEach(([fromId, targetIds]) => {
    targetIds.forEach((toId) => {
      if (incomingMap[toId]) {
        incomingMap[toId].add(fromId);
      }
    });
  });

  // Perform validation on each scene / paragraph
  scenes.forEach((scene) => {
    const isInitial = scene.id === project.initialSceneId || scene.type === 'portada';
    const isPortada = scene.type === 'portada';
    const incoming = incomingMap[scene.id] || new Set();
    const outgoing = outgoingMap[scene.id] || new Set();

    // 1. Unlinked / Orphan scene (No incoming links)
    if (!isInitial && incoming.size === 0) {
      issues.push({
        id: `unlinked_${scene.id}`,
        sceneId: scene.id,
        sceneName: scene.name,
        type: 'unlinked',
        severity: 'error',
        title: 'Párrafo / Escena no vinculado',
        message: `El párrafo/escena "${scene.name}" no está vinculado desde ningún otro párrafo. Ninguna opción ni palabra clave redirige a esta escena.`,
        suggestion: 'En otra escena, crea una palabra clave con la acción "Cambiar de Escena" hacia esta escena para conectar la historia.',
      });
    }

    // 2. Dead end (No outgoing links to other scenes and no GameOver or Final marker)
    if (outgoing.size === 0 && !hasGameOverAction[scene.id] && !isPortada && scene.type !== 'final') {
      issues.push({
        id: `dead_end_${scene.id}`,
        sceneId: scene.id,
        sceneName: scene.name,
        type: 'dead_end',
        severity: 'warning',
        title: 'Callejón sin salida (Sin enlaces salientes)',
        message: `El párrafo/escena "${scene.name}" no ofrece ninguna acción para avanzar a otra escena ni está marcado como Párrafo Final.`,
        suggestion: 'Añade una acción "Cambiar de Escena" en alguna palabra clave o cambia el tipo de párrafo/escena a "Final".',
      });
    }

    // 3. No return option to previous paragraph/scene (excluding portada, introducción, final, or initial scenes)
    if (!isInitial && incoming.size > 0 && !hasGameOverAction[scene.id] && !isPortada && scene.type !== 'introduccion' && scene.type !== 'final') {
      const incomingList = Array.from(incoming);

      // Filter out parents that are portada, introducción, or initial scene
      const nonCoverParents = incomingList.filter((parentId) => {
        const parentScene = scenes.find((s) => s.id === parentId);
        if (!parentScene) return false;
        return (
          parentScene.type !== 'portada' &&
          parentScene.type !== 'introduccion' &&
          parentScene.id !== project.initialSceneId
        );
      });

      if (nonCoverParents.length > 0) {
        // Check if scene points back to ANY of its non-cover parent scenes
        const returnsToParent = nonCoverParents.some((parentId) => outgoing.has(parentId));

        if (!returnsToParent) {
          const parentNames = nonCoverParents
            .map((id) => scenes.find((s) => s.id === id)?.name || id)
            .join(', ');

          issues.push({
            id: `no_return_${scene.id}`,
            sceneId: scene.id,
            sceneName: scene.name,
            type: 'no_return',
            severity: 'warning',
            title: 'Sin posibilidad de regresar al párrafo anterior',
            message: `Se puede acceder al párrafo "${scene.name}" desde "${parentNames}", pero no se ofrece ninguna acción o palabra clave que permita al jugador regresar al párrafo/escena anterior.`,
            suggestion: 'Agrega una palabra clave o acción (por ejemplo: "Volver", "Regresar" o "Salir") que redirija a la escena previa.',
          });
        }
      }
    }
  });

  return issues;
}
