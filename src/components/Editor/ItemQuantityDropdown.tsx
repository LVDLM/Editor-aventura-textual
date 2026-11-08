import React from 'react';
import { ChevronDown } from 'lucide-react';
import { InventoryItem } from '../../types';

interface ItemQuantityDropdownProps {
  label: string;
  /** Clases de la etiqueta (por defecto, la del editor de escenas) */
  labelClassName?: string;
  /** Texto de la cabecera del desplegable (p. ej. "Retirar Objetos") */
  panelTitle: string;
  /** Texto del tooltip del campo de unidades: se completa con el nombre del objeto */
  unitsTitle: string;
  items: InventoryItem[];
  value: Record<string, number>;
  onChange: (next: Record<string, number>) => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  /** '+' para entregar, '-' para retirar/gastar */
  sign: '+' | '-';
  /** 'emerald' para efectos de éxito, 'rose' para efectos de fallo / gasto */
  tone?: 'emerald' | 'rose';
}

const TONES = {
  emerald: {
    summary: 'text-emerald-300',
    chevron: 'text-emerald-400',
    checked: 'bg-emerald-950/70 text-emerald-200 border border-emerald-500/40',
    checkbox: 'text-emerald-500',
  },
  rose: {
    summary: 'text-rose-300',
    chevron: 'text-rose-400',
    checked: 'bg-rose-950/70 text-rose-200 border border-rose-500/40',
    checkbox: 'text-rose-500',
  },
} as const;

/**
 * Desplegable con una casilla por objeto del inventario y un campo numérico de unidades.
 * Es el mismo patrón que "Entregar Objeto(s)", pero reutilizable para "Retirar / Gastar".
 */
export const ItemQuantityDropdown: React.FC<ItemQuantityDropdownProps> = ({
  label,
  labelClassName = 'block text-[10px] text-slate-400 mb-1',
  panelTitle,
  unitsTitle,
  items,
  value,
  onChange,
  isOpen,
  onToggle,
  onClose,
  sign,
  tone = 'emerald',
}) => {
  const t = TONES[tone];
  const entries = Object.entries(value).filter(([, q]) => Number(q) > 0);

  return (
    <div className="relative">
      <label className={labelClassName}>{label}</label>
      <button
        type="button"
        onClick={onToggle}
        className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 flex items-center justify-between gap-1 text-left cursor-pointer transition-colors"
      >
        <span className="truncate">
          {entries.length === 0 ? (
            <span className="text-slate-400">-- Ninguno --</span>
          ) : (
            <span className={`${t.summary} font-medium`}>
              {sign}{' '}
              {entries
                .map(([id, qty]) => {
                  const name = items.find((i) => i.id === id)?.name || id;
                  return Number(qty) > 1 ? `${qty}x ${name}` : name;
                })
                .join(', ')}
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? `rotate-180 ${t.chevron}` : ''}`}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <div className="absolute left-0 top-full mt-1.5 w-72 z-50 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl p-2 max-h-56 overflow-y-auto space-y-1.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 px-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{panelTitle}</span>
              {entries.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange({})}
                  className="text-[10px] text-rose-400 hover:underline cursor-pointer font-medium"
                >
                  Quitar todos
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic p-2">Sin objetos creados en el juego.</p>
            ) : (
              items.map((item) => {
                const qty = value[item.id] || 0;
                const isChecked = qty > 0;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors ${
                      isChecked ? t.checked : 'text-slate-300 hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const next = { ...value };
                          if (e.target.checked) next[item.id] = 1;
                          else delete next[item.id];
                          onChange(next);
                        }}
                        className={`rounded border-slate-700 bg-slate-900 ${t.checkbox} focus:ring-0 cursor-pointer w-3.5 h-3.5`}
                      />
                      <span className="truncate text-xs font-medium" title={item.name}>
                        {item.name}
                      </span>
                    </label>

                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="number"
                        min="0"
                        max="999"
                        value={qty > 0 ? qty : ''}
                        placeholder="0"
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          const next = { ...value };
                          if (isNaN(val) || val <= 0) delete next[item.id];
                          else next[item.id] = val;
                          onChange(next);
                        }}
                        className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-center font-mono font-bold text-amber-300 focus:border-amber-400 outline-none"
                        title={`${unitsTitle} ${item.name}`}
                      />
                      <span className="text-[10px] text-slate-500 font-mono">uds</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};
