import React from 'react';
import { HelpCircle, X, MousePointer, BookOpen, Download } from 'lucide-react';
import { UserProfile } from '../types';

interface HelpModalProps {
  onClose: () => void;
  currentUser?: UserProfile | null;
  currentView?: string;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose, currentUser, currentView }) => {
  const isRegisteredInEditor = !!currentUser && currentView === 'edit';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-[#0f0f12] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-500" />
            <h3 className="font-medium text-lg text-white">Instrucciones y Preguntas Frecuentes</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/40 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-white/80 text-sm leading-relaxed">
          
          {/* Section 1: Cómo Jugar (Pública para todos) */}
          <div className="space-y-3">
            <h4 className="font-medium text-base text-amber-300 flex items-center gap-2">
              <MousePointer className="w-5 h-5 text-amber-500" />
              <span>Instrucciones de Juego</span>
            </h4>

            <ul className="space-y-3 text-xs bg-black/50 p-4 rounded-xl border border-white/10">
              <li className="flex items-start gap-2 leading-relaxed">
                <span className="text-amber-500 font-bold">•</span>
                <span>
                  <strong>Exploración en el texto:</strong> Lee la narración de la escena y decide qué hacer. En el modo fácil, las palabras destacadas en amarillo con fondo translúcido son interactivas. En los modos Normal y Difícil, no se dan pistas sobre qué palabras son interactivas y en el modo difícil se mantienen sin cambios incluso después de interactuar con ellas.
                </span>
              </li>
              <li className="flex items-start gap-2 leading-relaxed">
                <span className="text-amber-500 font-bold">•</span>
                <span>
                  <strong>Seleccionar acciones (Verbos):</strong> Pulsa un verbo de la barra inferior (Mirar, Usar, Abrir, Coger, Hablar, etc.) y luego pulsa en una palabra interactiva del texto.
                </span>
              </li>
              <li className="flex items-start gap-2 leading-relaxed">
                <span className="text-amber-500 font-bold">•</span>
                <span>
                  <strong>Menú rápido al hacer clic:</strong> También puedes hacer clic directamente sobre cualquier palabra interactiva para abrir un menú contextual con las acciones disponibles.
                </span>
              </li>
              <li className="flex items-start gap-2 leading-relaxed">
                <span className="text-amber-500 font-bold">•</span>
                <span>
                  <strong>Uso de Inventario:</strong> Si encuentras u obtienes objetos (como llaves o linternas), pulsa sobre el objeto en tu panel de Inventario y luego selecciona la palabra donde deseas usarlo.
                </span>
              </li>
            </ul>
          </div>

          {/* Section 2: Editor (Solo para usuarios registrados que accedan al modo Editor) */}
          {isRegisteredInEditor && (
            <>
              <div className="space-y-3 pt-2 border-t border-white/10">
                <h4 className="font-medium text-base text-amber-300 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-500" />
                  <span>Instrucciones del Editor de Aventuras</span>
                </h4>

                <ol className="space-y-2 text-xs bg-black/50 p-4 rounded-xl border border-white/10 list-decimal list-inside leading-relaxed">
                  <li>
                    <strong>Crea Escenas:</strong> Redacta la historia en párrafos narrativos.
                  </li>
                  <li>
                    <strong>Marca Palabras Clave:</strong> Resalta cualquier palabra con el ratón dentro del texto y pulsa el botón <em>"Convertir en Palabra Clave"</em>.
                  </li>
                  <li>
                    <strong>Configura Acciones y Respuestas:</strong> Define qué ocurre cuando el jugador elige <em>Mirar</em>, <em>Usar</em>, <em>Abrir</em> o <em>Coger</em> sobre esa palabra.
                  </li>
                  <li>
                    <strong>Agrega Consecuencias:</strong> Puedes hacer que una acción entregue un objeto al inventario, active una bandera (por ejemplo <code className="text-amber-300">luz_encendida</code>), añada párrafos extra o envíe al jugador a otra escena.
                  </li>
                </ol>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-base text-amber-300 flex items-center gap-2">
                  <Download className="w-5 h-5 text-amber-500" />
                  <span>Exportación HTML / ZIP</span>
                </h4>
                <p className="text-xs text-white/60 leading-relaxed bg-black/50 p-3 rounded-xl border border-white/10">
                  Pulsa en <strong>"Exportar HTML"</strong> o <strong>"ZIP"</strong> para generar un juego ejecutable autónomo. Este archivo contiene todo el motor de juego e imágenes y se puede jugar offline en cualquier navegador web sin necesidad de servidor.
                </p>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

