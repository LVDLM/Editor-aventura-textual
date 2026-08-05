import React, { useState, useEffect } from 'react';
import { Play, Download, Search, BookOpen, Sparkles, Filter, Package, FileCode, Clock, User, ShieldAlert, Info, X, Award, Lock, Sun, Moon, Feather, PenTool, CheckCircle2, Compass, Layers, ArrowRight } from 'lucide-react';
import { CloudProjectDoc, GameProject, UserProfile } from '../../types';
import { getPublishedProjects, saveProjectToCloud } from '../../lib/firebase';
import { sampleGameProject } from '../../data/sampleGame';
import { generateStandaloneHTML } from '../../utils/htmlExporter';
import { exportProjectAsZip } from '../../utils/zipExporter';
import { renderTextWithLinks } from '../../utils/textUtils';

interface PublicCatalogProps {
  onPlayProject: (project: GameProject) => void;
  onOpenWorkspace: () => void;
  currentUser?: UserProfile | null;
}

export const PublicCatalog: React.FC<PublicCatalogProps> = ({ onPlayProject, onOpenWorkspace, currentUser }) => {
  const [publishedProjects, setPublishedProjects] = useState<CloudProjectDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [seeding, setSeeding] = useState(false);
  const [selectedDocModal, setSelectedDocModal] = useState<CloudProjectDoc | null>(null);

  // Web aspect selector state: 'clean' (Luminoso y Diáfano) vs 'classic' (Oscuro Clásico Portal)
  const [webAspect, setWebAspect] = useState<'clean' | 'classic'>(() => {
    return (localStorage.getItem('portal_web_aspect') as 'clean' | 'classic') || 'clean';
  });

  const handleAspectChange = (aspect: 'clean' | 'classic') => {
    setWebAspect(aspect);
    localStorage.setItem('portal_web_aspect', aspect);
  };

  const fetchCatalog = async () => {
    setLoading(true);
    const list = await getPublishedProjects();
    setPublishedProjects(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const getProjectCoverImage = (projectData: GameProject): string | null => {
    if (!projectData || !projectData.scenes) return null;
    const portadaScene =
      projectData.scenes.find((s) => s.type === 'portada') ||
      projectData.scenes.find((s) => s.id === projectData.initialSceneId) ||
      projectData.scenes[0];
    if (!portadaScene) return null;
    const blockWithImg = portadaScene.textBlocks?.find((b) => b.imageFileData || b.imageUrl);
    return blockWithImg ? blockWithImg.imageFileData || blockWithImg.imageUrl || null : null;
  };

  const handleSeedDemoGame = async () => {
    setSeeding(true);
    try {
      await saveProjectToCloud(
        'sample_misterio_habitacion',
        sampleGameProject,
        {
          uid: 'system_admin_seed',
          displayName: 'Editorial Narrativa',
          email: 'contacto@narrativa.com'
        },
        'published'
      );
      await fetchCatalog();
    } catch (e) {
      console.error('Error seeding demo story:', e);
    } finally {
      setSeeding(false);
    }
  };

  const handleDownloadHTML = (doc: CloudProjectDoc) => {
    const html = generateStandaloneHTML(doc.projectData);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.projectData.id || 'historia'}_autonomo.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadZIP = async (doc: CloudProjectDoc) => {
    try {
      const blob = await exportProjectAsZip(doc.projectData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.projectData.id || 'historia'}_paquete.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Error al generar el ZIP de la historia.');
    }
  };

  const filtered = publishedProjects.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.authorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTheme = selectedTheme === 'all' || doc.projectData.theme === selectedTheme;
    return matchesSearch && matchesTheme;
  });

  return (
    <div className={`flex-1 transition-colors duration-300 w-full min-h-full ${
      webAspect === 'clean' ? 'bg-[#f8fafc] text-slate-800' : 'bg-[#0a0a0c] text-slate-200'
    }`}>
      <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8">
        
        {/* Web Aspect Selector Header */}
        <div className={`flex flex-wrap items-center justify-between gap-3 pb-3 border-b ${
          webAspect === 'clean' ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <Compass className={`w-5 h-5 ${webAspect === 'clean' ? 'text-amber-600' : 'text-amber-400'}`} />
            <span className={`font-bold text-xs uppercase tracking-wider ${
              webAspect === 'clean' ? 'text-slate-700' : 'text-slate-300'
            }`}>
              Diseño de la Web General:
            </span>
          </div>

          <div className={`flex items-center p-1 rounded-xl text-xs font-semibold shadow-inner ${
            webAspect === 'clean' ? 'bg-slate-200/80 border border-slate-300/80' : 'bg-slate-950 border border-slate-800'
          }`}>
            <button
              onClick={() => handleAspectChange('clean')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                webAspect === 'clean'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Diseño Luminoso, Diáfano y Enfocado en Lecturas e Información del Creador"
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Luminoso y Diáfano</span>
            </button>

            <button
              onClick={() => handleAspectChange('classic')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                webAspect === 'classic'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Diseño Portal Oscuro Clásico Retro"
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Oscuro Clásico</span>
            </button>
          </div>
        </div>

        {/* RENDER BRANCH 1: CLEAN & DIAPHANOUS DESIGN MODE */}
        {webAspect === 'clean' ? (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Clean Hero Header */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Biblioteca Abierta de Textoaventuras Interactivas</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  Historias de texto vivas, decisiones e interacción directa
                </h1>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  Sumérgete en historias escritas para ser jugadas. Haz clic sobre palabras clave y objetos dentro del texto para explorar cada escena, resolver acertijos y decidir el rumbo del relato.
                </p>
              </div>

              {/* Creator Callout Card embedded inside Hero */}
              <div className="w-full md:w-80 shrink-0 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-3 text-slate-900 shadow-sm">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs uppercase tracking-wider">
                  <PenTool className="w-4 h-4 text-amber-600" />
                  <span>Espacio de Creación</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  Crea tu propio texto-juego Point &amp; Click sin escribir una sola línea de código. Publica para la comunidad o exporta archivos HTML y paquetes ZIP independientes.
                </p>
                <button
                  onClick={onOpenWorkspace}
                  className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Feather className="w-4 h-4" />
                  <span>Crear mi Aventura Ahora</span>
                </button>
              </div>
            </div>

            {/* Prominent Creation Info Section */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col lg:flex-row items-center justify-between gap-6 border border-slate-700">
              <div className="space-y-2 max-w-3xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Entorno de Creación sin Código</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-amber-400">
                  ¿Cómo funciona el Espacio del Creador?
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Con nuestro motor visual, redactas tus escenas, seleccionas palabras dentro del texto para convertirlas en objetos usables o destinos de escena, administras inventarios y ves el resultado en tiempo real. Al finalizar, tu obra puede ser leída en la web o descargada en un archivo ejecutable en cualquier navegador.
                </p>
                <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 text-xs text-slate-300 font-medium">
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Editor visual interactivo</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Inventarios y palabras usables</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Guardado en la Nube y Exportación HTML/ZIP</span>
                </div>
              </div>

              <div className="shrink-0 w-full lg:w-auto">
                <button
                  onClick={onOpenWorkspace}
                  className="w-full lg:w-auto px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>Ir al Editor de Historias</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search Bar (Light Style) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar lecturas por título, autor o sinopsis..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:bg-white outline-none transition-all"
                />
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                {filtered.length} {filtered.length === 1 ? 'historia disponible' : 'historias disponibles'}
              </span>
            </div>

            {/* Published Stories Grid (Diaphanous Light Style) */}
            {loading ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-medium">Cargando biblioteca de textos interactivos...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-4 max-w-xl mx-auto shadow-sm">
                <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900">No hay historias publicadas todavía</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sé el primero en publicar una obra narrativa o inicializa la plataforma con la aventura de demostración.
                </p>
                <button
                  onClick={handleSeedDemoGame}
                  disabled={seeding}
                  className="px-5 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-2 mx-auto cursor-pointer shadow-sm hover:shadow"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{seeding ? 'Publicando demo...' : 'Publicar Aventura de Ejemplo ("El Misterio de la Habitación Oscura")'}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((doc) => {
                  const scenesCount = doc.projectData?.scenes?.length || 0;
                  const itemsCount = doc.projectData?.inventoryItems?.length || 0;
                  const coverImg = getProjectCoverImage(doc.projectData);
                  const synopsisText = doc.projectData?.synopsis || doc.projectData?.description || doc.description;

                  return (
                    <div
                      key={doc.id}
                      className="bg-white border border-slate-200 hover:border-amber-500/60 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-md group overflow-hidden"
                    >
                      <div className="space-y-3">
                        {/* Cover thumbnail preview */}
                        {coverImg && (
                          <div
                            onClick={() => setSelectedDocModal(doc)}
                            className="w-full h-40 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative cursor-pointer group-hover:border-amber-500/50 transition-colors shadow-inner"
                          >
                            <img
                              src={coverImg}
                              alt={`Portada de ${doc.title}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-2.5">
                              <span className="text-[10px] text-amber-200 font-bold bg-slate-950/90 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                                <BookOpen className="w-3 h-3 text-amber-400" /> Ver Portada Completa
                              </span>
                            </div>
                          </div>
                        )}

                        <div>
                          <h3
                            onClick={() => setSelectedDocModal(doc)}
                            className="text-lg font-black text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-1 cursor-pointer"
                          >
                            {doc.title}
                          </h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <User className="w-3.5 h-3.5 text-amber-600" />
                            <span>Por <strong className="text-slate-800">{doc.authorName}</strong></span>
                          </p>
                        </div>

                        {/* Synopsis block prominently featured */}
                        <div
                          onClick={() => setSelectedDocModal(doc)}
                          className="bg-slate-50 border border-slate-100 hover:bg-amber-50/50 hover:border-amber-200 p-3.5 rounded-xl cursor-pointer transition-colors"
                        >
                          <p className="text-xs text-slate-700 leading-relaxed line-clamp-4 font-serif italic">
                            "{synopsisText || 'Sin descripción disponible.'}"
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-100 font-medium">
                          <span>🎬 {scenesCount} escenas</span>
                          <span>📦 {itemsCount} objetos</span>
                          {doc.publishedAt && (
                            <span className="flex items-center gap-1 ml-auto">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {new Date(doc.publishedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Primary Actions */}
                      <div className="pt-5 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => onPlayProject(doc.projectData)}
                            className="py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                          >
                            <Play className="w-3.5 h-3.5 fill-slate-950" />
                            <span>Leer e Interactuar</span>
                          </button>

                          <button
                            onClick={() => setSelectedDocModal(doc)}
                            className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Info className="w-3.5 h-3.5 text-amber-700" />
                            <span>Más detalles</span>
                          </button>
                        </div>

                        {/* Check download permissions */}
                        {(() => {
                          const isAuthor = currentUser && doc.authorId === currentUser.uid;
                          const isAdmin = currentUser?.role === 'admin';
                          const isAllowed = doc.allowDownload ?? doc.projectData?.allowDownload ?? false;
                          const canDownload = isAllowed || isAuthor || isAdmin;

                          if (canDownload) {
                            return (
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                  onClick={() => handleDownloadHTML(doc)}
                                  className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                  title="Descargar archivo HTML autónomo"
                                >
                                  <FileCode className="w-3.5 h-3.5 text-amber-600" />
                                  <span>HTML</span>
                                </button>
                                <button
                                  onClick={() => handleDownloadZIP(doc)}
                                  className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                  title="Descargar paquete ZIP autónomo"
                                >
                                  <Package className="w-3.5 h-3.5 text-sky-600" />
                                  <span>Paquete ZIP</span>
                                </button>
                              </div>
                            );
                          } else {
                            return (
                              <div className="py-1 px-2 bg-slate-100 border border-slate-200 rounded-lg text-[10px] text-slate-400 italic text-center font-mono flex items-center justify-center gap-1 mt-1">
                                <Lock className="w-3 h-3 text-slate-400" />
                                <span>Descarga restringida</span>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* RENDER BRANCH 2: CLASSIC RETRO PORTAL DARK MODE */
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Portal Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-slate-950 border border-amber-500/20 p-6 sm:p-10 shadow-2xl">
              <div className="relative z-10 max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                  Portal de Lecturas Interactivas
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Descubre y juega a increíbles Aventuras de Texto
                </h1>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Explora la colección de historias interactivas estilo Point &amp; Click clásicas publicadas en la web. Elige una aventura para leerla e interactuar desde tu navegador, o descárgala para jugarla en tu equipo de forma autónoma.
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={onOpenWorkspace}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Crear mi propia Aventura</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-white/5">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por título, autor o sinopsis..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Published Catalog Grid */}
            {loading ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Cargando catálogo de lecturas interactivas...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-slate-900/40 rounded-3xl border border-white/5 p-10 text-center space-y-4 max-w-xl mx-auto">
                <BookOpen className="w-12 h-12 text-slate-500 mx-auto" />
                <h3 className="text-lg font-bold text-white">No hay historias publicadas todavía</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sé el primero en publicar una historia o inicializa la plataforma con la aventura de demostración oficial.
                </p>
                <button
                  onClick={handleSeedDemoGame}
                  disabled={seeding}
                  className="px-5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-2 mx-auto cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{seeding ? 'Publicando demo...' : 'Publicar Historia de Ejemplo ("El Misterio de la Habitación Oscura")'}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((doc) => {
                  const scenesCount = doc.projectData?.scenes?.length || 0;
                  const itemsCount = doc.projectData?.inventoryItems?.length || 0;
                  const coverImg = getProjectCoverImage(doc.projectData);
                  const synopsisText = doc.projectData?.synopsis || doc.projectData?.description || doc.description;

                  return (
                    <div
                      key={doc.id}
                      className="bg-slate-900/80 hover:bg-slate-900 border border-white/10 hover:border-amber-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 shadow-xl group overflow-hidden"
                    >
                      <div className="space-y-3">
                        {/* Cover thumbnail preview if available */}
                        {coverImg && (
                          <div
                            onClick={() => setSelectedDocModal(doc)}
                            className="w-full h-36 rounded-xl overflow-hidden border border-white/10 bg-slate-950 relative cursor-pointer group-hover:border-amber-500/50 transition-colors"
                          >
                            <img
                              src={coverImg}
                              alt={`Portada de ${doc.title}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2.5">
                              <span className="text-[10px] text-amber-300 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                                <BookOpen className="w-3 h-3" /> Ver Portada Completa
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3
                              onClick={() => setSelectedDocModal(doc)}
                              className="text-base font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1 cursor-pointer"
                            >
                              {doc.title}
                            </h3>
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <User className="w-3 h-3 text-amber-500" />
                              <span>Por <strong>{doc.authorName}</strong></span>
                            </p>
                          </div>
                        </div>

                        {/* Synopsis text preview */}
                        <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                          {synopsisText || 'Sin descripción disponible.'}
                        </p>

                        <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-2 border-t border-white/5 font-mono">
                          <span>🎬 {scenesCount} escenas</span>
                          <span>📦 {itemsCount} objetos</span>
                          {doc.publishedAt && (
                            <span className="flex items-center gap-1 ml-auto">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {new Date(doc.publishedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-5 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => onPlayProject(doc.projectData)}
                            className="py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 fill-slate-950" />
                            <span>Jugar</span>
                          </button>

                          <button
                            onClick={() => setSelectedDocModal(doc)}
                            className="py-2 px-3 bg-slate-950 hover:bg-slate-800 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                            title="Ver sinopsis completa, portada e información detallada"
                          >
                            <Info className="w-3.5 h-3.5 text-amber-400" />
                            <span>Más detalles</span>
                          </button>
                        </div>

                        {/* Check download permissions */}
                        {(() => {
                          const isAuthor = currentUser && doc.authorId === currentUser.uid;
                          const isAdmin = currentUser?.role === 'admin';
                          const isAllowed = doc.allowDownload ?? doc.projectData?.allowDownload ?? false;
                          const canDownload = isAllowed || isAuthor || isAdmin;

                          if (canDownload) {
                            return (
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => handleDownloadHTML(doc)}
                                  className="py-1.5 px-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-white/10 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                  title="Descargar archivo .html listo para abrir en cualquier navegador sin servidor"
                                >
                                  <FileCode className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Descargar HTML</span>
                                </button>
                                <button
                                  onClick={() => handleDownloadZIP(doc)}
                                  className="py-1.5 px-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-white/10 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                  title="Descargar paquete ZIP con archivo HTML e imágenes"
                                >
                                  <Package className="w-3.5 h-3.5 text-sky-400" />
                                  <span>Descargar ZIP</span>
                                </button>
                              </div>
                            );
                          } else {
                            return (
                              <div className="py-1 px-2 bg-black/40 border border-white/5 rounded-lg text-[10px] text-slate-400 italic text-center font-mono flex items-center justify-center gap-1">
                                <Lock className="w-3 h-3 text-slate-500" />
                                <span>Descarga restringida por el autor</span>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Selected Story Preview & Details Modal */}
      {selectedDocModal && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedDocModal(null)}
        >
          <div
            className="bg-[#0f121d] border border-amber-500/40 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden cursor-default animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Ficha del Texto-Juego</h3>
              </div>
              <button
                onClick={() => setSelectedDocModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-slate-300 text-xs sm:text-sm leading-relaxed">
              {/* Cover Image if present */}
              {getProjectCoverImage(selectedDocModal.projectData) && (
                <div className="w-full text-center">
                  <img
                    src={getProjectCoverImage(selectedDocModal.projectData)!}
                    alt={`Carátula de ${selectedDocModal.title}`}
                    className="w-full max-h-64 object-cover rounded-xl border-2 border-amber-500/40 shadow-xl mx-auto"
                  />
                </div>
              )}

              {/* Title, Author & Badges */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xl font-extrabold text-white">{selectedDocModal.title}</h2>
                </div>
                <p className="text-xs text-amber-400 font-medium">
                  Autor / Creador: <strong className="text-amber-200">{selectedDocModal.authorName}</strong>
                </p>
              </div>

              {/* Synopsis Section */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-white/10 space-y-2">
                <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider">
                  Sinopsis
                </h4>
                <p className="text-slate-200 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                  {selectedDocModal.projectData?.synopsis ||
                    selectedDocModal.projectData?.description ||
                    selectedDocModal.description ||
                    'Sin sinopsis disponible.'}
                </p>
              </div>

              {/* Credits & Sources Section */}
              {selectedDocModal.projectData?.credits && (
                <div className="bg-slate-950/80 p-4 rounded-xl border border-white/10 space-y-2">
                  <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider">
                    Créditos, Fuentes de Imágenes y Colaboradores
                  </h4>
                  <p className="text-slate-300 font-mono text-xs leading-relaxed whitespace-pre-line bg-slate-900 p-3 rounded-lg border border-slate-800">
                    {renderTextWithLinks(selectedDocModal.projectData.credits)}
                  </p>
                </div>
              )}

              {/* Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-white/5 text-center">
                  <span className="block text-slate-500 text-[10px] uppercase font-bold">Escenas</span>
                  <span className="font-bold text-slate-200">{selectedDocModal.projectData?.scenes?.length || 0}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-white/5 text-center">
                  <span className="block text-slate-500 text-[10px] uppercase font-bold">Objetos</span>
                  <span className="font-bold text-slate-200">{selectedDocModal.projectData?.inventoryItems?.length || 0}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-white/5 text-center col-span-2 sm:col-span-1">
                  <span className="block text-slate-500 text-[10px] uppercase font-bold">Publicado</span>
                  <span className="font-bold text-slate-200">
                    {selectedDocModal.publishedAt ? new Date(selectedDocModal.publishedAt).toLocaleDateString() : 'Reciente'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer with Play Button */}
            <div className="px-6 py-4 border-t border-white/10 bg-black/40 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {(() => {
                  const isAuthor = currentUser && selectedDocModal.authorId === currentUser.uid;
                  const isAdmin = currentUser?.role === 'admin';
                  const isAllowed = selectedDocModal.allowDownload ?? selectedDocModal.projectData?.allowDownload ?? false;
                  const canModalDownload = isAllowed || isAuthor || isAdmin;

                  if (canModalDownload) {
                    return (
                      <button
                        onClick={() => {
                          handleDownloadHTML(selectedDocModal);
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileCode className="w-3.5 h-3.5 text-amber-400" />
                        <span>Descargar HTML</span>
                      </button>
                    );
                  }
                  return (
                    <span className="text-xs text-slate-400 italic flex items-center gap-1 font-mono">
                      <Lock className="w-3.5 h-3.5 text-slate-500" /> Descarga no permitida por el autor
                    </span>
                  );
                })()}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedDocModal(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                >
                  Cerrar
                </button>

                <button
                  onClick={() => {
                    const data = selectedDocModal.projectData;
                    setSelectedDocModal(null);
                    onPlayProject(data);
                  }}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>¡Iniciar Texto-Juego!</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
