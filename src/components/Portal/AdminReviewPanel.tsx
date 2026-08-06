import React, { useState, useEffect } from 'react';
import { CloudProjectDoc, GameProject, UserProfile, PublicationStatus } from '../../types';
import { getAllProjectsForAdmin, updateProjectStatusInCloud, deleteProjectFromCloud, saveProjectToCloud } from '../../lib/firebase';
import { generateStandaloneHTML } from '../../utils/htmlExporter';
import { exportProjectAsZip } from '../../utils/zipExporter';
import { Shield, CheckCircle, XCircle, Edit3, Play, MessageSquare, Trash2, Clock, Sparkles, RefreshCw, FileCode, Package, ArrowLeftRight } from 'lucide-react';

interface AdminReviewPanelProps {
  currentUser: UserProfile | null;
  onSelectProject: (proj: GameProject, cloudDocId: string | null) => void;
  onOpenEditor: () => void;
  onPlayProject: (proj: GameProject) => void;
  webAspect?: 'clean' | 'classic';
}

export const AdminReviewPanel: React.FC<AdminReviewPanelProps> = ({
  currentUser,
  onSelectProject,
  onOpenEditor,
  onPlayProject,
  webAspect = 'clean',
}) => {
  const isClean = webAspect === 'clean';
  const [adminProjects, setAdminProjects] = useState<CloudProjectDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'published' | 'rejected' | 'all'>('pending');
  const [feedbackInput, setFeedbackInput] = useState<Record<string, string>>({});
  const [activeFeedbackDocId, setActiveFeedbackDocId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAdminProjects = async () => {
    setLoading(true);
    const list = await getAllProjectsForAdmin();
    setAdminProjects(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchAdminProjects();
  }, []);

  const handleApproveAndPublish = async (doc: CloudProjectDoc) => {
    setMessage(null);
    try {
      await updateProjectStatusInCloud(doc.id, 'published');
      setMessage({ type: 'success', text: `¡Historia "${doc.title}" aprobada y publicada con éxito en el portal web!` });
      await fetchAdminProjects();
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Error al publicar la historia.' });
    }
  };

  const handleUnpublish = async (doc: CloudProjectDoc) => {
    setMessage(null);
    try {
      await updateProjectStatusInCloud(doc.id, 'draft');
      setMessage({ type: 'success', text: `Historia "${doc.title}" retirada del catálogo público (mantenida como borrador).` });
      await fetchAdminProjects();
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Error al despublicar.' });
    }
  };

  const handleSendFeedbackAndReject = async (docId: string, title: string) => {
    const feedbackText = feedbackInput[docId] || 'Por favor revisa los textos o las interacciones antes de volver a solicitar la publicación.';
    setMessage(null);
    try {
      await updateProjectStatusInCloud(docId, 'rejected', feedbackText);
      setMessage({ type: 'success', text: `Comentarios enviados al autor de "${title}".` });
      setActiveFeedbackDocId(null);
      await fetchAdminProjects();
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Error al enviar observaciones.' });
    }
  };

  const handleDeleteAdminDoc = async (docId: string, title: string) => {
    if (!confirm(`¿Eliminar definitivamente la historia "${title}"?`)) return;
    try {
      await deleteProjectFromCloud(docId);
      setMessage({ type: 'success', text: 'Historia eliminada.' });
      await fetchAdminProjects();
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Error al eliminar.' });
    }
  };

  const filtered = adminProjects.filter((doc) => {
    if (filter === 'pending') return doc.status === 'pending_review';
    if (filter === 'published') return doc.status === 'published';
    if (filter === 'rejected') return doc.status === 'rejected';
    return true;
  });

  const pendingCount = adminProjects.filter(p => p.status === 'pending_review').length;
  const publishedCount = adminProjects.filter(p => p.status === 'published').length;

  return (
    <div className={`flex-1 p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full transition-colors duration-200 ${
      isClean ? 'bg-[#f8fafc] text-slate-800' : 'bg-[#0a0a0c] text-slate-200'
    }`}>
      {/* Admin Panel Header */}
      <div className={`rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border ${
        isClean
          ? 'bg-gradient-to-r from-rose-50 via-white to-slate-50 border-rose-200 text-slate-900'
          : 'bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-950 border-rose-500/30 text-white'
      }`}>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40 text-xs font-bold">
            <Shield className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Panel de Control de Administración
          </div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold ${isClean ? 'text-slate-900' : 'text-white'}`}>
            Moderación y Publicación de Historias
          </h1>
          <p className={`text-xs sm:text-sm leading-relaxed max-w-2xl ${isClean ? 'text-slate-600' : 'text-slate-300'}`}>
            Como Administrador, puedes revisar las historias enviadas por los autores, editarlas o corregir erratas en el editor antes de aprobarlas, solicitar correcciones con observaciones o publicarlas directamente en la web principal.
          </p>
        </div>

        <button
          onClick={fetchAdminProjects}
          className={`px-4 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
            isClean
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 shadow-sm'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-white/10'
          }`}
        >
          <RefreshCw className="w-4 h-4" /> Actualizar Lista
        </button>
      </div>

      {message && (
        <div className={`p-3.5 rounded-xl text-xs font-medium border flex items-center justify-between ${
          message.type === 'success'
            ? isClean ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
            : isClean ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-xs opacity-60 hover:opacity-100 cursor-pointer">✕</button>
        </div>
      )}

      {/* Admin Filter Tabs */}
      <div className={`flex flex-wrap gap-2 border-b pb-3 ${isClean ? 'border-slate-200' : 'border-white/10'}`}>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            filter === 'pending'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : isClean
              ? 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pendientes de Revisión ({pendingCount})</span>
        </button>
        <button
          onClick={() => setFilter('published')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            filter === 'published'
              ? 'bg-emerald-600 text-white shadow-md'
              : isClean
              ? 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Publicadas en la Web ({publishedCount})</span>
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            filter === 'rejected'
              ? 'bg-rose-600 text-white shadow-md'
              : isClean
              ? 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Con Correcciones Requeridas ({adminProjects.filter(p => p.status === 'rejected').length})</span>
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'all'
              ? isClean ? 'bg-slate-800 text-white shadow' : 'bg-white/10 text-white shadow'
              : isClean
              ? 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
          }`}
        >
          Todas las Historias ({adminProjects.length})
        </button>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className={`py-12 text-center text-xs ${isClean ? 'text-slate-500' : 'text-slate-400'}`}>Cargando historias para revisión del administrador...</div>
      ) : filtered.length === 0 ? (
        <div className={`rounded-3xl border p-10 text-center space-y-2 ${isClean ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/40 border-white/5'}`}>
          <p className={`text-sm font-bold ${isClean ? 'text-slate-800' : 'text-white'}`}>No hay historias en esta sección.</p>
          <p className={`text-xs ${isClean ? 'text-slate-500' : 'text-slate-400'}`}>Cuando un autor envíe una historia para publicación, aparecerá aquí inmediatamente.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((doc) => {
            const scenesCount = doc.projectData?.scenes?.length || 0;
            const isFeedbackOpen = activeFeedbackDocId === doc.id;

            return (
              <div
                key={doc.id}
                className={`rounded-2xl p-5 space-y-4 transition-all border ${
                  isClean
                    ? 'bg-white border-slate-200 text-slate-800 shadow-sm hover:border-slate-300'
                    : 'bg-slate-900 border-white/10 hover:border-white/20 text-slate-200 shadow-xl'
                }`}
              >
                <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b ${isClean ? 'border-slate-100' : 'border-white/5'}`}>
                  <div>
                    <h3 className={`text-lg font-bold flex items-center gap-2 ${isClean ? 'text-slate-900' : 'text-white'}`}>
                      <span>{doc.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        doc.status === 'published' ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40' :
                        doc.status === 'pending_review' ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40' :
                        doc.status === 'rejected' ? 'bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/40' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {doc.status === 'pending_review'
                          ? `SOLICITUD v${(doc.publishedVersion || 0) + 1}`
                          : doc.status === 'published'
                          ? `PUBLICADO v${doc.publishedVersion || 1}`
                          : doc.status.toUpperCase()}
                      </span>
                    </h3>
                    <p className={`text-xs mt-0.5 ${isClean ? 'text-slate-500' : 'text-slate-400'}`}>
                      Autor: <strong className={isClean ? 'text-slate-800' : 'text-slate-200'}>{doc.authorName}</strong> ({doc.authorEmail}) • Creado: {new Date(doc.createdAt).toLocaleDateString()} • {scenesCount} Escenas
                    </p>
                  </div>

                  {/* Top Action Controls */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {doc.status !== 'published' && (
                      <button
                        onClick={() => handleApproveAndPublish(doc)}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
                      >
                        <CheckCircle className="w-4 h-4" /> Aprobar y Publicar v{(doc.publishedVersion || 0) + 1}
                      </button>
                    )}

                    {doc.status === 'published' && (
                      <button
                        onClick={() => handleUnpublish(doc)}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" /> Despublicar (Mover a Borrador)
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {doc.description || 'Sin descripción disponible.'}
                </p>

                {doc.publishedData && (
                  <div className="flex items-center justify-between text-xs bg-slate-950/80 p-2.5 rounded-xl border border-emerald-500/30">
                    <span className="text-slate-300 text-[11px] font-mono">
                      Versión Web actual en catálogo: <strong className="text-emerald-300 font-bold">v{doc.publishedVersion || 1}</strong>
                    </span>
                    <button
                      onClick={() => {
                        onPlayProject(doc.publishedData!);
                      }}
                      className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      title="Probar la versión que ven actualmente los jugadores en la web"
                    >
                      <Play className="w-3 h-3 fill-emerald-300" /> Probar v{doc.publishedVersion || 1} en Vivo
                    </button>
                  </div>
                )}

                {doc.reviewFeedback && (
                  <div className="p-3 bg-slate-950 border border-white/10 rounded-xl text-xs text-slate-300">
                    <strong className="text-amber-400">Observaciones registradas:</strong> {doc.reviewFeedback}
                  </div>
                )}

                {/* Admin Toolbar per Project */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        onSelectProject(doc.projectData, doc.id);
                        onPlayProject(doc.projectData);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 text-amber-400" /> Probar Borrador v{(doc.publishedVersion || 0) + 1}
                    </button>
                    <button
                      onClick={() => {
                        onSelectProject(doc.projectData, doc.id);
                        onOpenEditor();
                      }}
                      className="px-3 py-1.5 bg-amber-950/40 hover:bg-amber-900/40 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Abrir en el editor para corregir erratas o ajustar hotspots como administrador"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Editar en Editor
                    </button>
                    <button
                      onClick={() => setActiveFeedbackDocId(isFeedbackOpen ? null : doc.id)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-sky-400" /> Solicitar Cambios / Feedback
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const html = generateStandaloneHTML(doc.projectData);
                        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${doc.projectData.id || 'historia'}_autonomo.html`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs"
                      title="Descargar HTML"
                    >
                      <FileCode className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const blob = await exportProjectAsZip(doc.projectData);
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${doc.projectData.id || 'historia'}_paquete.zip`;
                          a.click();
                          URL.revokeObjectURL(url);
                        } catch (e) {
                          alert('Error al generar ZIP.');
                        }
                      }}
                      className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs"
                      title="Descargar ZIP"
                    >
                      <Package className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAdminDoc(doc.id, doc.title)}
                      className="p-1.5 bg-slate-950 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg text-xs"
                      title="Eliminar de Firestore"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Feedback Input Dropdown */}
                {isFeedbackOpen && (
                  <div className="p-4 bg-slate-950 border border-amber-500/40 rounded-xl space-y-3 animate-fadeIn">
                    <label className="block text-xs font-bold text-amber-300">
                      Observaciones / Comentarios de revisión para el autor:
                    </label>
                    <textarea
                      rows={2}
                      value={feedbackInput[doc.id] || ''}
                      onChange={(e) => setFeedbackInput({ ...feedbackInput, [doc.id]: e.target.value })}
                      placeholder="Ej: Revisa la ortografía de la escena 2 o añade una pista para la combinación del armario..."
                      className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-amber-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setActiveFeedbackDocId(null)}
                        className="px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white text-xs rounded-lg"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleSendFeedbackAndReject(doc.id, doc.title)}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Enviar Observaciones y Marcar Requisito de Corrección
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
