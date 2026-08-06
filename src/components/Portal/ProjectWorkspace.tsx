import React, { useState, useEffect, useRef } from 'react';
import { GameProject, UserProfile, CloudProjectDoc, PublicationStatus } from '../../types';
import { getUserProjects, saveProjectToCloud, updateProjectStatusInCloud, deleteProjectFromCloud } from '../../lib/firebase';
import { generateStandaloneHTML } from '../../utils/htmlExporter';
import { exportProjectAsZip } from '../../utils/zipExporter';
import { Plus, Edit3, Play, CloudUpload, Send, Trash2, FileCode, Package, AlertCircle, Clock, CheckCircle2, Shield, Sparkles, FolderOpen, Upload, FileJson } from 'lucide-react';

interface ProjectWorkspaceProps {
  currentUser: UserProfile | null;
  activeProject: GameProject;
  onSelectProject: (proj: GameProject, cloudDocId: string | null) => void;
  onOpenEditor: () => void;
  onPlayProject: (proj: GameProject) => void;
  onCreateNewProject: () => void;
  onOpenAuth: () => void;
  webAspect?: 'clean' | 'classic';
}

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({
  currentUser,
  activeProject,
  onSelectProject,
  onOpenEditor,
  onPlayProject,
  onCreateNewProject,
  onOpenAuth,
  webAspect = 'clean',
}) => {
  const isClean = webAspect === 'clean';
  const [cloudProjects, setCloudProjects] = useState<CloudProjectDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<PublicationStatus | 'all'>('all');
  const [savingCloudId, setSavingCloudId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProjects = async () => {
    if (!currentUser) return;
    setLoading(true);
    const list = await getUserProjects(currentUser.uid);
    setCloudProjects(list);
    setLoading(false);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string) as GameProject;
        if (parsed.scenes && (parsed.initialSceneId || parsed.title)) {
          onSelectProject(parsed, null);
          
          if (currentUser) {
            try {
              const savedDocId = await saveProjectToCloud(
                parsed.id || `proj_${Date.now()}`,
                parsed,
                {
                  uid: currentUser.uid,
                  displayName: currentUser.displayName,
                  email: currentUser.email
                },
                'draft'
              );
              onSelectProject(parsed, savedDocId);
              setMessage({
                type: 'success',
                text: `¡Proyecto "${parsed.title || 'Importado'}" importado desde el archivo .JSON y guardado en tu nube!`
              });
              await fetchProjects();
            } catch (cloudErr) {
              console.error(cloudErr);
              setMessage({
                type: 'success',
                text: `¡Proyecto "${parsed.title || 'Importado'}" importado con éxito al editor local!`
              });
            }
          } else {
            setMessage({
              type: 'success',
              text: `¡Proyecto "${parsed.title || 'Importado'}" importado con éxito!`
            });
          }
        } else {
          setMessage({
            type: 'error',
            text: 'El archivo JSON no coincide con la estructura de un proyecto de juego (falta la lista de escenas).'
          });
        }
      } catch (err) {
        console.error(err);
        setMessage({
          type: 'error',
          text: 'Error al abrir el archivo JSON. Asegúrate de que tenga un formato correcto.'
        });
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
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

  const getStatusBadge = (doc: CloudProjectDoc) => {
    switch (doc.status) {
      case 'published':
        return (
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-semibold">
              🟢 Publicado v{doc.publishedVersion || 1}
            </span>
            {doc.hasUnpublishedChanges && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                ✏️ Cambios sin publicar (v{(doc.publishedVersion || 1) + 1} en edición)
              </span>
            )}
          </div>
        );
      case 'pending_review':
        return (
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 font-semibold">
              ⏳ En Revisión v{(doc.publishedVersion || 0) + 1}
            </span>
            {doc.publishedData && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                🟢 v{doc.publishedVersion} sigue activa en la Web
              </span>
            )}
          </div>
        );
      case 'rejected':
        return <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 font-semibold">❌ Correcciones Requeridas</span>;
      default:
        return <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1 font-semibold">📝 Borrador Privado</span>;
    }
  };

  if (!currentUser) {
    return (
      <div className={`flex-1 p-8 flex items-center justify-center transition-colors ${isClean ? 'bg-[#f8fafc]' : 'bg-[#0a0a0c]'}`}>
        <div className={`border rounded-3xl p-8 max-w-lg w-full text-center space-y-4 shadow-xl ${
          isClean ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-white/10 text-white'
        }`}>
          <FolderOpen className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className={`text-xl font-bold ${isClean ? 'text-slate-900' : 'text-white'}`}>Taller de Proyectos en la Nube</h2>
          <p className={`text-xs leading-relaxed ${isClean ? 'text-slate-600' : 'text-slate-300'}`}>
            Inicia sesión o crea una cuenta para guardar tus historias en diferentes fases de desarrollo (borradores, en revisión, publicadas) y solicitar su publicación en el portal principal.
          </p>
          <button
            onClick={onOpenAuth}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-lg cursor-pointer"
          >
            Iniciar Sesión / Registrarme
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full transition-colors duration-200 ${
      isClean ? 'bg-[#f8fafc] text-slate-800' : 'bg-[#0a0a0c] text-slate-200'
    }`}>
      {/* Header Bar */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b ${
        isClean ? 'border-slate-200' : 'border-white/10'
      }`}>
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-2 ${isClean ? 'text-slate-900' : 'text-white'}`}>
            <span>Gestor de Historias y Proyectos</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold">
              {currentUser.role === 'admin' ? 'Modo Administrador' : 'Modo Autor'}
            </span>
          </h1>
          <p className={`text-xs ${isClean ? 'text-slate-500' : 'text-slate-400'}`}>
            Guarda tus borradores en la nube, mantén múltiples proyectos y solicita la revisión para su publicación web.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportJSON}
            accept=".json,application/json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            title="Cargar un archivo de aventura .json exportado previamente"
          >
            <Upload className="w-4 h-4" />
            <span>Importar .JSON</span>
          </button>
          <button
            onClick={handleSaveActiveToCloud}
            disabled={savingCloudId === 'active'}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            title="Guardar el proyecto actualmente cargado en el editor a tu espacio en la nube"
          >
            <CloudUpload className="w-4 h-4" />
            <span>{savingCloudId === 'active' ? 'Guardando...' : 'Guardar Actual en Nube'}</span>
          </button>
          <button
            onClick={onCreateNewProject}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
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
        <div className="bg-slate-900/30 rounded-2xl border border-white/5 p-8 text-center space-y-4">
          <FileJson className="w-10 h-10 text-amber-500/60 mx-auto" />
          <div>
            <p className="text-sm font-bold text-slate-200">No hay proyectos en esta categoría</p>
            <p className="text-xs text-slate-400 mt-1">
              Puedes guardar tu proyecto actual en la nube o importar un archivo <code className="text-amber-300 font-mono">.json</code> exportado previamente.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              onClick={handleSaveActiveToCloud}
              className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Guardar activo ({activeProject.title}) en la nube
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Subir Archivo .JSON</span>
            </button>
          </div>
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
                    {getStatusBadge(doc)}
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2">{doc.description || 'Sin descripción.'}</p>

                  {doc.publishedData && (
                    <div className="flex items-center justify-between text-xs bg-slate-950/80 p-2.5 rounded-xl border border-emerald-500/30">
                      <span className="text-slate-300 text-[11px] font-mono">
                        Versión Web activa: <strong className="text-emerald-300 font-bold">v{doc.publishedVersion || 1}</strong>
                      </span>
                      <button
                        onClick={() => {
                          onPlayProject(doc.publishedData!);
                        }}
                        className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Probar la versión pública activa en la Web"
                      >
                        <Play className="w-3 h-3 fill-emerald-300" /> Probar v{doc.publishedVersion || 1} en Vivo
                      </button>
                    </div>
                  )}

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
                      className="py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Editar Borrador
                    </button>
                    <button
                      onClick={() => {
                        onSelectProject(doc.projectData, doc.id);
                        onPlayProject(doc.projectData);
                      }}
                      className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Probar los cambios actuales en tu borrador"
                    >
                      <Play className="w-3.5 h-3.5 text-amber-400" /> Probar Borrador
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {doc.status === 'draft' || doc.status === 'rejected' ? (
                      <button
                        onClick={() => handleSubmitForReview(doc)}
                        className="flex-1 py-1.5 bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Enviar historia al Administrador para que la revise y la publique en la web principal"
                      >
                        <Send className="w-3.5 h-3.5" /> Solicitar Publicación (v1)
                      </button>
                    ) : doc.status === 'published' && doc.hasUnpublishedChanges ? (
                      <button
                        onClick={() => handleSubmitForReview(doc)}
                        className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all shadow cursor-pointer active:scale-95"
                        title="Solicitar publicar los cambios de tu borrador como una nueva versión web"
                      >
                        <Send className="w-3.5 h-3.5" /> Publicar Nueva Versión v{(doc.publishedVersion || 1) + 1}
                      </button>
                    ) : doc.status === 'pending_review' ? (
                      <span className="text-xs text-amber-300/80 italic flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> En revisión por el admin (v{(doc.publishedVersion || 0) + 1})...
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Publicado (v{doc.publishedVersion || 1}) sin cambios pendientes
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
