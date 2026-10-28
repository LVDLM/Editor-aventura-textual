import React, { useState, useEffect, useRef } from 'react';
import { GameProject, UserProfile, CloudProjectDoc, PublicationStatus } from '../../types';
import { getUserProjects, saveProjectToCloud, updateProjectStatusInCloud, deleteProjectFromCloud, toggleProjectVisibilityInGallery } from '../../lib/firebase';
import { exportProjectAsZip } from '../../utils/zipExporter';
import { Plus, Edit3, Play, CloudUpload, Send, Trash2, Package, AlertCircle, Clock, CheckCircle2, Shield, Sparkles, FolderOpen, Upload, FileJson } from 'lucide-react';
import { EditStoryModal } from './EditStoryModal';
import { ImportJSONModal, ImportPendingData } from './ImportJSONModal';

interface ProjectWorkspaceProps {
  currentUser: UserProfile | null;
  activeProject: GameProject;
  currentCloudDocId?: string | null;
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
  currentCloudDocId,
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
  const [editTargetDoc, setEditTargetDoc] = useState<CloudProjectDoc | null>(null);
  const [pendingImport, setPendingImport] = useState<ImportPendingData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProjects = async () => {
    if (!currentUser) return;
    setLoading(true);
    const list = await getUserProjects(
      currentUser.uid,
      currentUser.email,
      currentUser.role === 'admin'
    );
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
          if (currentUser) {
            // Find existing matching story in cloud (by exact doc ID, projectData ID, or matching title)
            const match = cloudProjects.find(
              (p) =>
                p.id === parsed.id ||
                p.projectData?.id === parsed.id ||
                (p.title && parsed.title && p.title.trim().toLowerCase() === parsed.title.trim().toLowerCase())
            );

            setPendingImport({
              fileProject: parsed,
              fileName: file.name,
              fileLastModified: file.lastModified,
              matchedCloudDoc: match || null,
            });
          } else {
            // Not logged in: open directly in editor
            onSelectProject(parsed, null);
            onOpenEditor();
            setMessage({
              type: 'success',
              text: `¡Proyecto "${parsed.title || 'Importado'}" cargado con éxito en el editor local!`
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

  const handleOverwriteCloud = async (targetDocId: string, project: GameProject) => {
    if (!currentUser) return;
    setSavingCloudId('active');
    setMessage(null);
    try {
      const savedDocId = await saveProjectToCloud(
        targetDocId,
        project,
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          email: currentUser.email
        },
        'preserve' // Preserves published snapshot so readers on live web are unaffected
      );
      onSelectProject(project, savedDocId);
      setPendingImport(null);
      setMessage({
        type: 'success',
        text: `¡Borrador de "${project.title || 'Historia'}" sobrescrito con éxito en la nube con el archivo local!`
      });
      await fetchProjects();
    } catch (err) {
      console.error(err);
      setMessage({
        type: 'error',
        text: 'Error al sobrescribir el proyecto en la nube.'
      });
    } finally {
      setSavingCloudId(null);
    }
  };

  const handleSaveAsNew = async (project: GameProject) => {
    if (!currentUser) return;
    setSavingCloudId('active');
    setMessage(null);
    try {
      const newId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const copy: GameProject = { ...project, id: newId };
      const savedDocId = await saveProjectToCloud(
        newId,
        copy,
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          email: currentUser.email
        },
        'draft'
      );
      onSelectProject(copy, savedDocId);
      setPendingImport(null);
      setMessage({
        type: 'success',
        text: `¡"${copy.title || 'Historia'}" guardada como nueva historia independiente en tu nube!`
      });
      await fetchProjects();
    } catch (err) {
      console.error(err);
      setMessage({
        type: 'error',
        text: 'Error al guardar la nueva historia en la nube.'
      });
    } finally {
      setSavingCloudId(null);
    }
  };

  const handleOpenLocalOnly = (project: GameProject, matchedDocId: string | null) => {
    onSelectProject(project, matchedDocId);
    setPendingImport(null);
    onOpenEditor();
    setMessage({
      type: 'success',
      text: `¡Proyecto cargado en el editor local sin modificar la nube!`
    });
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
      const targetDocId = currentCloudDocId || activeProject.id;
      const docId = await saveProjectToCloud(
        targetDocId,
        activeProject,
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          email: currentUser.email
        },
        'preserve'
      );
      if (docId && docId !== activeProject.id) {
        onSelectProject({ ...activeProject, id: docId }, docId);
      }
      setMessage({ type: 'success', text: `¡Proyecto "${activeProject.title}" guardado en la nube correctamente!` });
      await fetchProjects();
    } catch (e: any) {
      console.error(e);
      setMessage({ type: 'error', text: 'Error al guardar el proyecto en la nube.' });
    } finally {
      setSavingCloudId(null);
    }
  };

  const handleConfirmEditMode = async (mode: 'keep_published' | 'hide_to_draft') => {
    if (!editTargetDoc) return;
    const docToEdit = editTargetDoc;
    setEditTargetDoc(null);

    if (mode === 'hide_to_draft' && docToEdit.status === 'published') {
      try {
        await toggleProjectVisibilityInGallery(docToEdit.id, false);
        await fetchProjects();
      } catch (err) {
        console.error('Error hiding project from gallery:', err);
      }
    }

    onSelectProject(docToEdit.projectData, docToEdit.id);
    onOpenEditor();
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
      <div className={`flex-1 p-8 flex items-center justify-center transition-colors ${isClean ? 'bg-[#F4EFE3]' : 'bg-[#1F1913]'}`}>
        <div className={`border rounded-3xl p-8 max-w-lg w-full text-center space-y-4 shadow-sm ${
          isClean ? 'bg-[#FFFDF6] border-[#E5DCB8] text-[#2A2118]' : 'bg-[#2C241C] border-[#42362B] text-[#F4EFE3]'
        }`}>
          <FolderOpen className="w-12 h-12 text-[#A4332A] mx-auto" />
          <h2 className={`text-xl font-serif font-bold ${isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}`}>Taller de Proyectos en la Nube</h2>
          <p className={`text-xs leading-relaxed ${isClean ? 'text-[#6B5C46]' : 'text-[#D1C7B7]'}`}>
            Inicia sesión o crea una cuenta para guardar tus historias en diferentes fases de desarrollo (borradores, en revisión, publicadas) y solicitar su publicación en el portal principal.
          </p>
          <button
            onClick={onOpenAuth}
            className="px-6 py-2.5 bg-[#A4332A] hover:bg-[#8B2A22] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            Iniciar Sesión / Registrarme
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full transition-colors duration-200 min-h-full ${
      isClean ? 'bg-[#F4EFE3] text-[#2A2118]' : 'bg-[#1F1913] text-[#F4EFE3]'
    }`}>
      {/* Header Bar */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b ${
        isClean ? 'border-[#E5DCB8]' : 'border-[#42362B]'
      }`}>
        <div>
          <h1 className={`text-2xl font-serif font-bold flex items-center gap-2 ${isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}`}>
            <span>Gestor de Historias y Proyectos</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#E5DCB8]/50 text-[#2A2118] border border-[#C9A24B]/30 font-bold font-sans">
              {currentUser.role === 'admin' ? 'Modo Administrador' : 'Modo Autor'}
            </span>
          </h1>
          <p className={`text-xs ${isClean ? 'text-[#6B5C46]' : 'text-[#D1C7B7]'}`}>
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
            className="px-3.5 py-2 bg-[#FFFDF6] hover:bg-[#E5DCB8] text-[#2A2118] border border-[#E5DCB8] font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            title="Cargar un archivo de aventura .json exportado previamente"
          >
            <Upload className="w-4 h-4 text-[#A4332A]" />
            <span>Importar .JSON</span>
          </button>
          <button
            onClick={handleSaveActiveToCloud}
            disabled={savingCloudId === 'active'}
            className="px-3.5 py-2 bg-[#3B6D11] hover:bg-[#2F570E] text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            title="Guardar el proyecto actualmente cargado en el editor a tu espacio en la nube"
          >
            <CloudUpload className="w-4 h-4" />
            <span>{savingCloudId === 'active' ? 'Guardando...' : 'Guardar Actual en Nube'}</span>
          </button>
          <button
            onClick={onCreateNewProject}
            className="px-3.5 py-2 bg-[#A4332A] hover:bg-[#8B2A22] text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Proyecto</span>
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-3.5 rounded-xl text-xs font-medium border flex items-center justify-between ${
          message.type === 'success' ? 'bg-[#3B6D11]/20 border-[#3B6D11]/40 text-[#3B6D11] dark:text-emerald-300' : 'bg-[#A4332A]/20 border-[#A4332A]/40 text-[#A4332A] dark:text-rose-300'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E5DCB8] pb-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            statusFilter === 'all' ? 'bg-[#A4332A] text-white font-bold' : isClean ? 'text-[#6B5C46] hover:text-[#2A2118]' : 'text-[#D1C7B7] hover:text-white'
          }`}
        >
          Todas ({cloudProjects.length})
        </button>
        <button
          onClick={() => setStatusFilter('draft')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            statusFilter === 'draft' ? 'bg-[#A4332A] text-white font-bold' : isClean ? 'text-[#6B5C46] hover:text-[#2A2118]' : 'text-[#D1C7B7] hover:text-white'
          }`}
        >
          📝 Borradores ({cloudProjects.filter(p => p.status === 'draft').length})
        </button>
        <button
          onClick={() => setStatusFilter('pending_review')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            statusFilter === 'pending_review' ? 'bg-[#A4332A] text-white font-bold' : isClean ? 'text-[#6B5C46] hover:text-[#2A2118]' : 'text-[#D1C7B7] hover:text-white'
          }`}
        >
          ⏳ En Revisión ({cloudProjects.filter(p => p.status === 'pending_review').length})
        </button>
        <button
          onClick={() => setStatusFilter('published')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            statusFilter === 'published' ? 'bg-[#A4332A] text-white font-bold' : isClean ? 'text-[#6B5C46] hover:text-[#2A2118]' : 'text-[#D1C7B7] hover:text-white'
          }`}
        >
          🟢 Publicadas ({cloudProjects.filter(p => p.status === 'published').length})
        </button>
        <button
          onClick={() => setStatusFilter('rejected')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            statusFilter === 'rejected' ? 'bg-[#A4332A] text-white font-bold' : isClean ? 'text-[#6B5C46] hover:text-[#2A2118]' : 'text-[#D1C7B7] hover:text-white'
          }`}
        >
          ❌ Con Observaciones ({cloudProjects.filter(p => p.status === 'rejected').length})
        </button>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-[#6B5C46]">Cargando tus proyectos guardados en la nube...</div>
      ) : filteredProjects.length === 0 ? (
        <div className={`rounded-2xl border p-8 text-center space-y-4 ${
          isClean ? 'bg-[#FFFDF6] border-[#E5DCB8]' : 'bg-[#2C241C] border-[#42362B]'
        }`}>
          <FileJson className="w-10 h-10 text-[#C9A24B] mx-auto" />
          <div>
            <p className={`text-sm font-bold font-serif ${isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}`}>No hay proyectos en esta categoría</p>
            <p className={`text-xs mt-1 ${isClean ? 'text-[#6B5C46]' : 'text-[#D1C7B7]'}`}>
              Puedes guardar tu proyecto actual en la nube o importar un archivo <code className="text-[#A4332A] font-mono">.json</code> exportado previamente.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              onClick={handleSaveActiveToCloud}
              className="px-4 py-2 bg-[#3B6D11] hover:bg-[#2F570E] text-white border rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              Guardar activo ({activeProject.title}) en la nube
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-[#FFFDF6] hover:bg-[#E5DCB8] text-[#2A2118] border border-[#E5DCB8] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Upload className="w-4 h-4 text-[#A4332A]" />
              <span>Subir Archivo .JSON</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((doc) => {
            const isCurrentlyLoaded = (currentCloudDocId && currentCloudDocId === doc.id) || activeProject.id === doc.projectData.id;
            return (
              <div
                key={doc.id}
                className={`border rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all ${
                  isClean
                    ? isCurrentlyLoaded ? 'bg-[#FFFDF6] border-[#A4332A] shadow-md' : 'bg-[#FFFDF6] border-[#E5DCB8]'
                    : isCurrentlyLoaded ? 'bg-[#2C241C] border-[#C9A24B] shadow-md' : 'bg-[#2C241C] border-[#42362B]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className={`text-base font-serif font-bold flex items-center gap-2 ${isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}`}>
                        <span>{doc.title}</span>
                        {isCurrentlyLoaded && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#A4332A] text-white font-bold font-sans">
                            Cargado en Editor
                          </span>
                        )}
                      </h3>
                      <p className={`text-xs ${isClean ? 'text-[#6B5C46]' : 'text-[#D1C7B7]'}`}>Actualizado: {new Date(doc.updatedAt).toLocaleDateString()}</p>
                    </div>
                    {getStatusBadge(doc)}
                  </div>

                  <p className={`text-xs line-clamp-2 font-serif italic ${isClean ? 'text-[#6B5C46]' : 'text-[#D1C7B7]'}`}>{doc.description || 'Sin descripción.'}</p>

                  {doc.publishedData && (
                    <div className={`flex items-center justify-between text-xs p-2.5 rounded-xl border ${
                      isClean ? 'bg-[#F4EFE3] border-[#E5DCB8]' : 'bg-[#1F1913] border-[#42362B]'
                    }`}>
                      <span className={`text-[11px] font-mono ${isClean ? 'text-[#2A2118]' : 'text-[#D1C7B7]'}`}>
                        Versión Web activa: <strong className="text-[#3B6D11] font-bold">v{doc.publishedVersion || 1}</strong>
                      </span>
                      <button
                        onClick={() => {
                          onPlayProject(doc.publishedData!);
                        }}
                        className="px-2.5 py-1 bg-[#3B6D11] hover:bg-[#2F570E] text-white rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Probar la versión pública activa en la Web"
                      >
                        <Play className="w-3 h-3 fill-white" /> Probar v{doc.publishedVersion || 1} en Vivo
                      </button>
                    </div>
                  )}

                  {doc.reviewFeedback && (
                    <div className="p-3 bg-[#A4332A]/10 border border-[#A4332A]/30 rounded-xl text-xs text-[#A4332A] dark:text-rose-300 space-y-1">
                      <span className="font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Comentarios del Administrador:
                      </span>
                      <p>{doc.reviewFeedback}</p>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className={`space-y-2 pt-2 border-t ${isClean ? 'border-[#E5DCB8]' : 'border-[#42362B]'}`}>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        if (doc.status === 'published') {
                          setEditTargetDoc(doc);
                        } else {
                          onSelectProject(doc.projectData, doc.id);
                          onOpenEditor();
                        }
                      }}
                      className="py-2 bg-[#A4332A] hover:bg-[#8B2A22] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Editar Borrador
                    </button>
                    <button
                      onClick={() => {
                        onSelectProject(doc.projectData, doc.id);
                        onPlayProject(doc.projectData);
                      }}
                      className={`py-2 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer border ${
                        isClean
                          ? 'bg-[#F4EFE3] hover:bg-[#E5DCB8] text-[#2A2118] border-[#E5DCB8]'
                          : 'bg-[#1F1913] hover:bg-[#382E25] text-[#F4EFE3] border-[#42362B]'
                      }`}
                      title="Probar los cambios actuales en tu borrador"
                    >
                      <Play className="w-3.5 h-3.5 text-[#C9A24B]" /> Probar Borrador
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {doc.status === 'draft' || doc.status === 'rejected' ? (
                      <button
                        onClick={() => handleSubmitForReview(doc)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer border ${
                          isClean
                            ? 'bg-[#F4EFE3] hover:bg-[#E5DCB8] text-[#2A2118] border-[#E5DCB8]'
                            : 'bg-[#1F1913] hover:bg-[#382E25] text-[#D1C7B7] border-[#42362B]'
                        }`}
                        title="Enviar historia al Administrador para que la revise y la publique en la web principal"
                      >
                        <Send className="w-3.5 h-3.5 text-[#A4332A]" /> Solicitar Publicación (v1)
                      </button>
                    ) : doc.status === 'published' && doc.hasUnpublishedChanges ? (
                      <button
                        onClick={() => handleSubmitForReview(doc)}
                        className="flex-1 py-1.5 bg-[#A4332A] hover:bg-[#8B2A22] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all shadow cursor-pointer active:scale-95"
                        title="Solicitar publicar los cambios de tu borrador como una nueva versión web"
                      >
                        <Send className="w-3.5 h-3.5" /> Publicar Nueva Versión v{(doc.publishedVersion || 1) + 1}
                      </button>
                    ) : doc.status === 'pending_review' ? (
                      <span className="text-xs text-[#C9A24B] italic flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> En revisión por el admin (v{(doc.publishedVersion || 0) + 1})...
                      </span>
                    ) : (
                      <span className="text-xs text-[#3B6D11] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Publicado (v{doc.publishedVersion || 1}) sin cambios pendientes
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          const blob = new Blob([JSON.stringify(doc.projectData, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${doc.projectData.id || 'historia'}.adventure.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className={`p-2 rounded-lg text-xs border ${
                          isClean ? 'bg-[#F4EFE3] hover:bg-[#E5DCB8] text-[#2A2118] border-[#E5DCB8]' : 'bg-[#1F1913] hover:bg-[#382E25] text-[#D1C7B7] border-[#42362B]'
                        }`}
                        title="Descargar Proyecto JSON"
                      >
                        <FileJson className="w-4 h-4 text-[#A4332A]" />
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
                        className={`p-2 rounded-lg text-xs border ${
                          isClean ? 'bg-[#F4EFE3] hover:bg-[#E5DCB8] text-[#2A2118] border-[#E5DCB8]' : 'bg-[#1F1913] hover:bg-[#382E25] text-[#D1C7B7] border-[#42362B]'
                        }`}
                        title="Descargar ZIP Completo"
                      >
                        <Package className="w-4 h-4 text-[#C9A24B]" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(doc.id, doc.title)}
                        className={`p-2 rounded-lg text-xs border ${
                          isClean ? 'bg-[#F4EFE3] hover:bg-[#E5DCB8] text-[#A4332A] border-[#E5DCB8]' : 'bg-[#1F1913] hover:bg-[#382E25] text-rose-400 border-[#42362B]'
                        }`}
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

      {/* Edit Story Choice Modal (Solo editar vs Ocultar y editar) */}
      <EditStoryModal
        projectDoc={editTargetDoc}
        isOpen={!!editTargetDoc}
        onClose={() => setEditTargetDoc(null)}
        onConfirm={handleConfirmEditMode}
        webAspect={webAspect}
      />

      {/* JSON Import Comparison & Overwrite Confirmation Modal */}
      <ImportJSONModal
        data={pendingImport}
        isOpen={!!pendingImport}
        onClose={() => setPendingImport(null)}
        onOverwriteCloud={handleOverwriteCloud}
        onSaveAsNew={handleSaveAsNew}
        onOpenLocalOnly={handleOpenLocalOnly}
        webAspect={webAspect}
      />
    </div>
  );
};
