import { StateChange } from '../types';

/**
 * Reglas de inventario compartidas por el reproductor del editor.
 *
 * El inventario es una lista de ids con repeticiones: 3 balas = ['bala', 'bala', 'bala'].
 *
 * Dos reglas:
 *  1. No se puede gastar más de lo que se tiene (canAfford).
 *  2. Cada fuente de entrega de una escena (una acción, un QTE, una opción de diálogo) entrega
 *     sus objetos UNA sola vez, también si el jugador repite la acción o vuelve a la escena después.
 *     Se registra con una clave en `deliveredRuleKeys` (que se guarda con la partida). Entregar el
 *     mismo objeto desde otra fuente sí se acumula (más balas en otra escena).
 *
 * El HTML exportado (utils/htmlExporter.ts) lleva una copia en JavaScript de esta lógica:
 * si cambias una, cambia la otra.
 */

export const countItem = (inventory: string[], itemId: string): number =>
  inventory.reduce((n, id) => (id === itemId ? n + 1 : n), 0);

/** Objetos que retira un StateChange, como { id: unidades }. Acepta el formato antiguo (1 unidad). */
export const getRemovals = (sc?: StateChange): Record<string, number> => {
  const out: Record<string, number> = {};
  if (sc?.removeItems && Object.keys(sc.removeItems).length > 0) {
    Object.entries(sc.removeItems).forEach(([id, qty]) => {
      const n = Math.floor(Number(qty) || 0);
      if (n > 0) out[id] = n;
    });
    return out;
  }
  if (sc?.removeItemId) out[sc.removeItemId] = 1;
  if (sc?.removeItem2Id) out[sc.removeItem2Id] = (out[sc.removeItem2Id] || 0) + 1;
  return out;
};

/** Objetos que entrega un StateChange, como { id: unidades }. */
export const getGrants = (sc?: StateChange): Record<string, number> => {
  const out: Record<string, number> = {};
  if (sc?.addItems && Object.keys(sc.addItems).length > 0) {
    Object.entries(sc.addItems).forEach(([id, qty]) => {
      const n = Math.floor(Number(qty) || 0);
      if (n > 0) out[id] = n;
    });
    return out;
  }
  if (sc?.addItemId) out[sc.addItemId] = 1;
  return out;
};

/** ¿Tiene el jugador las unidades que el StateChange pide gastar? */
export const canAfford = (sc: StateChange | undefined, inventory: string[]): boolean =>
  Object.entries(getRemovals(sc)).every(([id, n]) => countItem(inventory, id) >= n);

/** Unidades que faltan, para mensajes: { bala: 1 } si pide 2 y solo hay 1. Vacío si alcanza. */
export const missingItems = (sc: StateChange | undefined, inventory: string[]): Record<string, number> => {
  const out: Record<string, number> = {};
  Object.entries(getRemovals(sc)).forEach(([id, n]) => {
    const missing = n - countItem(inventory, id);
    if (missing > 0) out[id] = missing;
  });
  return out;
};

/** Clave de una fuente de entrega: escena + fuente (+ sufijo). Ej.: 'sala::hs_cajon::act_1::fail'. */
export const deliveryKey = (...parts: (string | undefined)[]): string => parts.map((p) => p || '').join('::');

export const hasGrants = (sc?: StateChange): boolean => Object.keys(getGrants(sc)).length > 0;

export const isDelivered = (deliveredKeys: string[] | undefined, sc: StateChange | undefined, key: string): boolean =>
  hasGrants(sc) && (deliveredKeys || []).includes(key);

export interface ItemEffectsResult {
  inventory: string[];
  deliveredRuleKeys: string[];
  /** true si esta fuente ya había entregado sus objetos: no se entrega ni se gasta nada */
  alreadyDelivered: boolean;
}

/**
 * Aplica al inventario lo que gasta y entrega un StateChange.
 *  - Si la fuente ya entregó sus objetos antes, no hace nada con los objetos (ni entrega ni gasta):
 *    la operación ya se hizo, repetirla no debe duplicar objetos ni cobrar dos veces.
 *  - Gasta primero y entrega después. Nunca deja una cantidad negativa.
 */
export const applyItemEffects = (
  inventory: string[],
  deliveredKeys: string[] | undefined,
  sc: StateChange | undefined,
  key: string
): ItemEffectsResult => {
  const delivered = deliveredKeys || [];
  const grants = getGrants(sc);
  const grantsSomething = Object.keys(grants).length > 0;

  if (grantsSomething && delivered.includes(key)) {
    return { inventory: [...inventory], deliveredRuleKeys: delivered, alreadyDelivered: true };
  }

  const next = [...inventory];
  Object.entries(getRemovals(sc)).forEach(([id, n]) => {
    for (let i = 0; i < n; i++) {
      const idx = next.indexOf(id);
      if (idx !== -1) next.splice(idx, 1);
    }
  });
  Object.entries(grants).forEach(([id, n]) => {
    for (let i = 0; i < n; i++) next.push(id);
  });

  return {
    inventory: next,
    deliveredRuleKeys: grantsSomething ? [...delivered, key] : delivered,
    alreadyDelivered: false,
  };
};
