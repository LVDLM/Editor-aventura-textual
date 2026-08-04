import React, { useState, useEffect } from 'react';
import { GameProject, UserProfile, CloudProjectDoc, PublicationStatus } from '../../types';
import { getUserProjects, saveProjectToCloud, updateProjectStatusInCloud, deleteProjectFromCloud } from '../../lib/firebase';
import { generateStandaloneHTML } from '../../utils/htmlExporter';
import { exportProjectAsZip } from '../../utils/zipExporter';
import { Plus, Edit3, Play, CloudUpload, Send, Trash2, FileCode, Package, AlertCircle, Clock, CheckCircle2, Shield, Sparkles, FolderOpen } from 'lucide-react';

interface ProjectWorkspaceProps {
  currentUser: UserProfile | null;
  activeProject: GameProject;
  onSelectProject: (proj: GameProject, cloudDocId: string | null) => void;
  onOpenEditor: () => void;
  onPlayProject: (proj: GameProject) => void;
  onCreateNewProject: () => void;
  onOpenAuth: () => void;
}

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({
  currentUser,
  activeProject,
  onSelectProject,
  onOpenEditor,
  onPlayProject,
  onCreateNewProject,
  onOpenAuth,
}) => {
  const [cloudProjects, setCloudProjects] = useState<CloudProjectDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<PublicationStatus | 'all'>('all');
  const [savingCloudId, setSavingCloudId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchProjects = async () => {
    if (!currentUser) return;
    setLoading(true);
    const list = await getUserProjects(currentUser.uid);
    setCloudProjects(list);
    setLoading(false);
  };

  useEffect(() => {
    if (currentUser) {
      fetchProjects();
    }
  }, [currentUser]);

  const handleSaveActiveToCloud = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    setSavingCloudId('active');
    setMessage(null);
    try {
      const docId = await saveProjectToCloud(
        activeProject.id,
        activeProject,
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          email: currentUser.email
        },
        'draft'
      );
      setMessage({ type: 'success', text: `¡Proyecto "${activeProject.title}" guardado en la nube correctamente!` });
      await fetchProjects();
    } catch (e: any) {
      console.error(e);
      setMessage({ type: 'error', text: 'Error al guardar el proyecto en la nube.' });
    } finally {
      setSavingCloudId(null);
    }
  };

  const handleSubmitForReview = async (doc: CloudProjectDoc) => {
    if (!currentUser) return;
    setMessage(null);
    try {
      await updateProjectStatusInCloud(doc.id, 'pending_review');
      setMessage({ type: 'success', text: `Solicitud de publicación enviada para "${doc.title}". El administrador la revisará.` });
      await fetchProjects();
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'No se pudo enviar la solicitud de publicación.' });
    }
  };

  const handleDeleteProject = async (docId: string, title: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la historia "${title}" de la nube?`)) return;
    try {
      await deleteProjectFromCloud(docId);
      setMessage({ type: 'success', text: 'Proyecto eliminado de la nube.' });
      await fetchProjects();
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Error al eliminar el proyecto.' });
    }
  };

  const filteredProjects = cloudProjects.filter((p) => {
    if (statusFilter === 'all') return true;
    return p.status === statusFilter;
  });

  const getStatusBadge = (status: PublicationStatus) => {
    switch (status) {
      case 'published':
        return <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-semibold">🟢 Publicado en la Web</span>;
      case 'pending_review':
        return <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 font-semibold">⏳ En Revisión por Admin</span>;
      case 'rejected':
        return <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 font-semibold">❌ Correcciones Requeridas</span>;
      default:
        return <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1 font-semibold">📝 Borrador Privado</span>;
    }
  };

  if (!currentUser) {
    return (
      <div className="flex-1 bg-[#0a0a0c] p-8 flex items-center justify-center">
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-lg w-full text-center space-y-4 shadow-2xl">
          <FolderOpen className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Taller de Proyectos en la Nube</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Inicia sesión o crea una cuenta para guardar tus historias en diferentes fases de desarrollo (borradores, en revisión, publicadas) y solicitar su publicación en el portal principal.
          </p>
          <button
            onClick={onOpenAuth}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-lg"
          >
            Iniciar Sesión / Registrarme
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0a0a0c] text-slate-200 p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>Gestor de Historias y Proyectos</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              {currentUser.role === 'admin' ? 'Modo Administrador' : 'Modo Autor'}
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Guarda tus borrador en la nube, mantén múltiples proyectos y solicita la revisión para su publicación web.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveActiveToCloud}
            disabled={savingCloudId === 'active'}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
            title="Guardar el proyecto actualmente cargado en el editor a tu espacio en la nube"
          >
            <CloudUpload className="w-4 h-4" />
            <span>{savingCloudId === 'active' ? 'Guardando...' : 'Guardar Actual en la Nube'}</span>
          </button>
          <button
            onClick={onCreateNewProject}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Proyecto</span>
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-3.5 rounded-xl text-xs font-medium border flex items-center justify-between ${
          message.type === 'success' ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/5 pb-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            statusFilter === 'all' ? 'bg-white/10 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Todas ({cloudProjects.length})
        </button>
        <button
          onClick={() => setStatusFilter('draft')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            statusFilter === 'draft' ? 'bg-slate-800 text-slate-200 font-bold border border-slate-700' : 'text-slate-400 hover:text-white'
          }`}
        >
          📝 Borradores ({cloudProjects.filter(p => p.status === 'draft').length})
        </button>
        <button
          onClick={() => setStatusFilter('pending_review')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            statusFilter === 'pending_review' ? 'bg-amber-950/60 text-amber-300 font-bold border border-amber-500/40' : 'text-slate-400 hover:text-white'
          }`}
        >
          ⏳ En Revisión ({cloudProjects.filter(p => p.status === 'pending_review').length})
        </button>
        <button
          onClick={() => setStatusFilter('published')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            statusFilter === 'published' ? 'bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-500/40' : 'text-slate-400 hover:text-white'
          }`}
        >
          🟢 Publicadas ({cloudProjects.filter(p => p.status === 'published').length})
        </button>
        <button
          onClick={() => setStatusFilter('rejected')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            statusFilter === 'rejected' ? 'bg-rose-950/60 text-rose-300 font-bold border border-rose-500/40' : 'text-slate-400 hover:text-white'
          }`}
        >
          ❌ Con Observaciones ({cloudProjects.filter(p => p.status === 'rejected').length})
        </button>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Cargando tus proyectos guardados en la nube...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-slate-900/30 rounded-2xl border border-white/5 p-8 text-center space-y-3">
          <p className="text-xs text-slate-400">No hay proyectos en esta sección.</p>
          <button
            onClick={handleSaveActiveToCloud}
            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold"
          >
            Guardar proyecto activo ({activeProject.title}) en la nube
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((doc) => {
            const isCurrentlyLoaded = activeProject.id === doc.projectData.id;
            return (
              <div
                key={doc.id}
                className={`bg-slate-900 border rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all ${
                  isCurrentlyLoaded ? 'border-amber-500 shadow-lg bg-slate-900/90' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span>{doc.title}</span>
                        {isCurrentlyLoaded && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold">
                            Cargado en Editor
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400">Actualizado: {new Date(doc.updatedAt).toLocaleDateString()}</p>
                    </div>
                    {getStatusBadge(doc.status)}
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2">{doc.description || 'Sin descripción.'}</p>

                  {doc.reviewFeedback && (
                    <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-200 space-y-1">
                      <span className="font-bold text-rose-300 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Comentarios del Administrador:
                      </span>
                      <p>{doc.reviewFeedback}</p>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        onSelectProject(doc.projectData, doc.id);
                        onOpenEditor();
                      }}
                      className="py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Abrir en Editor
                    </button>
                    <button
                      onClick={() => {
                        onSelectProject(doc.projectData, doc.id);
                        onPlayProject(doc.projectData);
                      }}
                      className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 text-amber-400" /> Probar Juego
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {doc.status === 'draft' || doc.status === 'rejected' ? (
                      <button
                        onClick={() => handleSubmitForReview(doc)}
                        className="flex-1 py-1.5 bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                        title="Enviar historia al Administrador para que la revise y la publique en la web principal"
                      >
                        <Send className="w-3.5 h-3.5" /> Solicitar Publicación Web
                      </button>
                    ) : doc.status === 'pending_review' ? (
                      <span className="text-xs text-amber-300/80 italic flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Esperando revisión del administrador...
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Publicado en el catálogo público
                      </span>
                    )}

                    <div className="flex items-center gap-1">
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
                        className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded-lg text-xs"
                        title="Descargar HTML Autónomo"
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
                        className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-sky-400 rounded-lg text-xs"
                        title="Descargar ZIP Completo"
                      >
                        <Package className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(doc.id, doc.title)}
                        className="p-2 bg-slate-950 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg text-xs"
                        title="Eliminar de la Nube"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
