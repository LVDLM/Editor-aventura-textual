import React, { useState, useEffect } from 'react';
import { Play, Download, Search, BookOpen, Filter, Package, Clock, User, Info, X, Lock, Sun, Moon, CheckCircle2, Compass, Layers, ArrowRight, Tag, ChevronLeft, ChevronRight, Maximize2, Share2, Check } from 'lucide-react';
import { CloudProjectDoc, GameProject, UserProfile, GENRE_TAGS } from '../../types';
import { getPublishedProjects, saveProjectToCloud } from '../../lib/firebase';
import { sampleGameProject } from '../../data/sampleGame';
import { exportProjectAsZip } from '../../utils/zipExporter';
import { renderTextWithLinks } from '../../utils/textUtils';

interface PublicCatalogProps {
  onPlayProject: (project: GameProject) => void;
  onOpenWorkspace: () => void;
  currentUser?: UserProfile | null;
  webAspect?: 'clean' | 'classic';
  onAspectChange?: (aspect: 'clean' | 'classic') => void;
}

export const PublicCatalog: React.FC<PublicCatalogProps> = ({
  onPlayProject,
  onOpenWorkspace,
  currentUser,
  webAspect = 'clean',
  onAspectChange,
}) => {
  const [publishedProjects, setPublishedProjects] = useState<CloudProjectDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [seeding, setSeeding] = useState(false);
  const [selectedDocModal, setSelectedDocModal] = useState<CloudProjectDoc | null>(null);
  const [fullCoverImage, setFullCoverImage] = useState<{ src: string; title: string } | null>(null);
  const [showAllStories, setShowAllStories] = useState(false);

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

  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);

  const handleShareGameLink = (docId: string) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?juego=${encodeURIComponent(docId)}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopiedDocId(docId);
        setTimeout(() => setCopiedDocId(null), 3000);
      }).catch(() => {
        prompt('Copia la dirección única de este juego:', shareUrl);
      });
    } else {
      prompt('Copia la dirección única de este juego:', shareUrl);
    }
  };

  const handleDownloadJSON = (doc: CloudProjectDoc) => {
    const dataToUse = doc.publishedData || doc.projectData;
    const blob = new Blob([JSON.stringify(dataToUse, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataToUse.id || 'historia'}_v${doc.publishedVersion || 1}.adventure.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadZIP = async (doc: CloudProjectDoc) => {
    try {
      const dataToUse = doc.publishedData || doc.projectData;
      const blob = await exportProjectAsZip(dataToUse);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dataToUse.id || 'historia'}_v${doc.publishedVersion || 1}_paquete.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Error al generar el ZIP de la historia.');
    }
  };

  // Filter projects by search term and selected genre tag
  const filtered = publishedProjects.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.authorName.toLowerCase().includes(searchTerm.toLowerCase());

    const docTags = doc.genreTags || doc.projectData?.genreTags || [];
    const matchesGenre =
      selectedGenre === 'all' ||
      docTags.includes(selectedGenre) ||
      (doc.genre && doc.genre.toLowerCase() === selectedGenre.toLowerCase());

    return matchesSearch && matchesGenre;
  });

  // Limit to max 6 stories initially
  const visibleStories = showAllStories ? filtered : filtered.slice(0, 6);

  const isClean = webAspect === 'clean';

  return (
    <div className={`flex-1 transition-colors duration-300 w-full min-h-full ${
      isClean ? 'bg-[#f8fafc] text-slate-800' : 'bg-[#0a0a0c] text-slate-200'
    }`}>
      <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8">
        
        {/* HERO HEADER SECTION (NO ICONS ON SPECIFIED TEXTS) */}
        {isClean ? (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              {/* NO ICON beside "Biblioteca Abierta de Textoaventuras Interactivas" */}
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold">
                <span>Biblioteca Abierta de Textoaventuras Interactivas</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Una aventura gráfica donde los gráficos los pone tu imaginación
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Disfruta de una experiencia visual única adaptable a cualquier tipo de resolución de pantalla, ya sea con una imagen pixelada o con todos los detalles. Haz clic sobre palabras clave y objetos dentro del texto para explorar cada escena, resolver acertijos y decidir el rumbo del relato.
              </p>
            </div>

            {/* Creator Callout Card (NO ICONS beside "Espacio de creación" and "Crear mi Aventura Ahora") */}
            <div className="w-full md:w-80 shrink-0 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-3 text-slate-900 shadow-sm">
              <div className="text-amber-900 font-extrabold text-xs uppercase tracking-wider">
                <span>Espacio de creación</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                Crea tu propio texto-juego Point &amp; Click sin escribir una sola línea de código. Publica para la comunidad o exporta archivos HTML y paquetes ZIP independientes.
              </p>
              <button
                onClick={onOpenWorkspace}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-sm hover:shadow flex items-center justify-center cursor-pointer active:scale-95"
              >
                <span>Crear mi Aventura Ahora</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-slate-950 border border-amber-500/20 p-6 sm:p-10 shadow-2xl">
            <div className="relative z-10 max-w-3xl space-y-4">
              {/* NO ICON beside "Biblioteca Abierta de Textoaventuras Interactivas" */}
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                <span>Biblioteca Abierta de Textoaventuras Interactivas</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Una aventura gráfica donde los gráficos los pone tu imaginación
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Disfruta de una experiencia visual única adaptable a cualquier tipo de resolución de pantalla, ya sea con una imagen pixelada o con todos los detalles. Haz clic sobre palabras clave y objetos dentro del texto para explorar cada escena, resolver acertijos y decidir el rumbo del relato.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={onOpenWorkspace}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg flex items-center cursor-pointer"
                >
                  <span>Crear mi Aventura Ahora</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SEARCH BAR & GENRE TAG FILTERS (POSITIONED ABOVE THE TEXTS SECTION) */}
        <div className={`p-5 rounded-2xl border space-y-4 shadow-sm ${
          isClean ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-white/10'
        }`}>
          {/* Search Bar Input */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search className={`w-4 h-4 absolute left-3.5 top-3 ${isClean ? 'text-slate-400' : 'text-slate-400'}`} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar lecturas por título, autor o sinopsis..."
                className={`w-full rounded-xl py-2 pl-9 pr-3 text-xs outline-none transition-all ${
                  isClean
                    ? 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:bg-white'
                    : 'bg-slate-950 border border-white/10 text-white placeholder-slate-500 focus:border-amber-500'
                }`}
              />
            </div>

            <span className={`text-xs font-semibold ${isClean ? 'text-slate-600' : 'text-slate-400'}`}>
              {filtered.length} {filtered.length === 1 ? 'historia disponible' : 'historias disponibles'}
            </span>
          </div>

          {/* Alphabetical Genre Tags Selector Chips */}
          <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
              <Tag className="w-3.5 h-3.5" />
              <span>Filtrar por Género:</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedGenre('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedGenre === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : isClean
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                    : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-white/10'
                }`}
              >
                Todas
              </button>

              {GENRE_TAGS.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                    selectedGenre === genre
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : isClean
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                      : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-white/10'
                  }`}
                >
                  #{genre}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* PUBLISHED STORIES SECTION (MAX 6 CARDS INITIALLY + SEE MORE OPTION) */}
        {loading ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className={`text-xs font-medium ${isClean ? 'text-slate-500' : 'text-slate-400'}`}>
              Cargando biblioteca de lecturas interactivas...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={`rounded-3xl border p-10 text-center space-y-4 max-w-xl mx-auto shadow-sm ${
            isClean ? 'bg-white border-slate-200' : 'bg-slate-900/40 border-white/5'
          }`}>
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className={`text-lg font-bold ${isClean ? 'text-slate-900' : 'text-white'}`}>
              No hay historias publicadas en esta categoría
            </h3>
            <p className={`text-xs leading-relaxed ${isClean ? 'text-slate-600' : 'text-slate-400'}`}>
              Sé el primero en publicar una historia o inicializa la plataforma con la aventura de demostración oficial.
            </p>
            {/* NO ICON beside "Publicar Aventura de Ejemplo" */}
            <button
              onClick={handleSeedDemoGame}
              disabled={seeding}
              className="px-5 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center mx-auto cursor-pointer shadow-sm hover:shadow"
            >
              <span>{seeding ? 'Publicando demo...' : 'Publicar Aventura de Ejemplo ("El Misterio de la Habitación Oscura")'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleStories.map((doc) => {
                const targetData = doc.publishedData || doc.projectData;
                const scenesCount = targetData?.scenes?.length || 0;
                const itemsCount = targetData?.inventoryItems?.length || 0;
                const coverImg = getProjectCoverImage(targetData);
                const synopsisText = targetData?.synopsis || targetData?.description || doc.description;
                const storyTags = doc.genreTags || targetData?.genreTags || [];

                return (
                  <div
                    key={doc.id}
                    className={`border rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-md group overflow-hidden ${
                      isClean
                        ? 'bg-white border-slate-200 hover:border-amber-500/60'
                        : 'bg-slate-900/80 hover:bg-slate-900 border-white/10 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Cover thumbnail preview if available */}
                      {coverImg && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setFullCoverImage({ src: coverImg, title: doc.title });
                          }}
                          className={`w-full h-40 rounded-xl overflow-hidden border relative cursor-pointer group-hover:border-amber-500/50 transition-colors shadow-inner ${
                            isClean ? 'border-slate-200 bg-slate-100' : 'border-white/10 bg-slate-950'
                          }`}
                          title="Haz clic para ver la portada completa"
                        >
                          <img
                            src={coverImg}
                            alt={`Portada de ${doc.title}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2.5">
                            <span className="text-[10px] text-amber-300 font-bold bg-slate-950/90 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1 hover:bg-amber-500 hover:text-slate-950 transition-colors">
                              <Maximize2 className="w-3 h-3 text-amber-400" /> Ver Portada completa
                            </span>
                          </div>
                        </div>
                      )}

                      <div>
                        <h3
                          onClick={() => setSelectedDocModal(doc)}
                          className={`text-lg font-black group-hover:text-amber-600 transition-colors line-clamp-1 cursor-pointer flex items-center gap-2 ${
                            isClean ? 'text-slate-900' : 'text-white'
                          }`}
                        >
                          <span className="truncate">{doc.title}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 shrink-0 font-bold">
                            v{doc.publishedVersion || 1}
                          </span>
                        </h3>
                        <p className={`text-xs flex items-center gap-1 mt-1 ${isClean ? 'text-slate-500' : 'text-slate-400'}`}>
                          <User className="w-3.5 h-3.5 text-amber-600" />
                          <span>Por <strong className={isClean ? 'text-slate-800' : 'text-slate-200'}>{doc.authorName}</strong></span>
                        </p>
                      </div>

                      {/* Genre Tags on Card */}
                      {storyTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {storyTags.map((t) => (
                            <span
                              key={t}
                              className={`text-[10px] px-2 py-0.5 rounded-md font-semibold capitalize ${
                                isClean
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                  : 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Synopsis block */}
                      <div
                        onClick={() => setSelectedDocModal(doc)}
                        title="Haz click para ver la ficha de lectura completa"
                        className={`p-3.5 rounded-xl cursor-pointer transition-colors border relative group/synopsis ${
                          isClean
                            ? 'bg-slate-50 border-slate-100 hover:bg-amber-50/80 hover:border-amber-300/80 text-slate-700'
                            : 'bg-slate-950/80 border-white/5 hover:border-amber-500/40 text-slate-300'
                        }`}
                      >
                        <p className="text-xs leading-relaxed line-clamp-3 font-serif italic">
                          "{synopsisText || 'Sin descripción disponible.'}"
                        </p>
                        <div className="mt-2 text-[10px] text-amber-600 dark:text-amber-400 font-sans font-bold flex items-center gap-1 opacity-70 group-hover/synopsis:opacity-100 transition-opacity">
                          <Info className="w-3 h-3 text-amber-500" /> Haz click para ver la ficha de lectura completa
                        </div>
                      </div>

                      <div className={`flex items-center gap-4 text-[11px] pt-2 border-t font-medium ${
                        isClean ? 'border-slate-100 text-slate-500' : 'border-white/5 text-slate-400 font-mono'
                      }`}>
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

                    {/* Card Action Buttons */}
                    <div className="pt-5 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => onPlayProject(doc.publishedData || doc.projectData)}
                          className="py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                        >
                          <Play className="w-3.5 h-3.5 fill-slate-950" />
                          <span>Leer e Interactuar</span>
                        </button>

                        <button
                          onClick={() => setSelectedDocModal(doc)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border ${
                            isClean
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                              : 'bg-slate-950 hover:bg-slate-800 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          <Info className="w-3.5 h-3.5 text-amber-600" />
                          <span>Más detalles</span>
                        </button>
                      </div>

                      {/* Download option check */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => handleShareGameLink(doc.id)}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer border ${
                            copiedDocId === doc.id
                              ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-600'
                              : isClean
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                              : 'bg-slate-950 hover:bg-slate-800 text-amber-300 border-amber-500/30'
                          }`}
                          title="Copiar enlace único para compartir este texto-juego"
                        >
                          {copiedDocId === doc.id ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>¡Enlace copiado!</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span>Compartir URL</span>
                            </>
                          )}
                        </button>

                        {(() => {
                          const isAuthor = currentUser && doc.authorId === currentUser.uid;
                          const isAdmin = currentUser?.role === 'admin';
                          const isAllowed = doc.allowDownload ?? doc.projectData?.allowDownload ?? false;
                          const canDownload = isAllowed || isAuthor || isAdmin;

                          if (canDownload) {
                            return (
                              <button
                                onClick={() => handleDownloadJSON(doc)}
                                className={`py-1.5 px-2 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer border ${
                                  isClean
                                    ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                    : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-white/10'
                                }`}
                                title="Descargar archivo del juego en JSON"
                              >
                                <Download className="w-3.5 h-3.5 text-amber-600" />
                                <span>JSON</span>
                              </button>
                            );
                          }
                          return (
                            <div className={`py-1.5 px-2 rounded-lg text-[10px] italic text-center font-mono flex items-center justify-center gap-1 border ${
                              isClean ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-black/40 border-white/5 text-slate-500'
                            }`}>
                              <Lock className="w-3 h-3" />
                              <span>Privado</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* "Ver más lecturas" Button / Carousel Toggle when more than 6 stories exist */}
            {filtered.length > 6 && (
              <div className="text-center pt-4">
                <button
                  onClick={() => setShowAllStories(!showAllStories)}
                  className={`px-6 py-3 rounded-2xl text-xs font-bold transition-all border shadow-sm cursor-pointer ${
                    isClean
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                      : 'bg-slate-900 hover:bg-slate-800 border-amber-500/40 text-amber-300'
                  }`}
                >
                  {showAllStories
                    ? 'Mostrar solo las 6 historias principales'
                    : `Ver más lecturas (${filtered.length - 6} historias restantes en catálogo)`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* "CÓMO FUNCIONA" BANNER (PLACED STRICTLY BELOW THE PUBLISHED TEXT STORIES SECTION) */}
        <div className={`rounded-3xl p-6 sm:p-8 shadow-md flex flex-col lg:flex-row items-center justify-between gap-6 border ${
          isClean
            ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-slate-700'
            : 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 text-white border-amber-500/30'
        }`}>
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
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

      </div>

      {/* Selected Story Details Modal */}
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
              {/* Cover Image */}
              {(selectedDocModal.publishedData ? getProjectCoverImage(selectedDocModal.publishedData) : getProjectCoverImage(selectedDocModal.projectData)) && (
                <div
                  className="w-full text-center group cursor-pointer relative"
                  onClick={() => {
                    const cover = selectedDocModal.publishedData ? getProjectCoverImage(selectedDocModal.publishedData) : getProjectCoverImage(selectedDocModal.projectData);
                    if (cover) setFullCoverImage({ src: cover, title: selectedDocModal.title });
                  }}
                  title="Haz clic para ver la portada completa"
                >
                  <img
                    src={(selectedDocModal.publishedData ? getProjectCoverImage(selectedDocModal.publishedData) : getProjectCoverImage(selectedDocModal.projectData))!}
                    alt={`Carátula de ${selectedDocModal.title}`}
                    className="w-full max-h-64 object-cover rounded-xl border-2 border-amber-500/40 shadow-xl mx-auto group-hover:border-amber-400 transition-all"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                    <span className="text-xs bg-slate-950/90 text-amber-300 font-bold px-3 py-1.5 rounded-lg border border-amber-500/40 flex items-center gap-1.5 shadow-lg">
                      <Maximize2 className="w-4 h-4 text-amber-400" /> Ver Portada completa
                    </span>
                  </div>
                </div>
              )}

              {/* Title, Author & Tags */}
              <div className="space-y-2">
                <h2 className="text-xl font-extrabold text-white">{selectedDocModal.title}</h2>
                <p className="text-xs text-amber-400 font-medium">
                  Autor / Creador: <strong className="text-amber-200">{selectedDocModal.authorName}</strong>
                </p>

                {(selectedDocModal.genreTags || selectedDocModal.projectData?.genreTags)?.length ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(selectedDocModal.genreTags || selectedDocModal.projectData?.genreTags)?.map((t) => (
                      <span key={t} className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md font-semibold capitalize">
                        #{t}
                      </span>
                    ))}
                  </div>
                ) : null}
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

              {/* Credits & Sources */}
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

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-black/40 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShareGameLink(selectedDocModal.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                    copiedDocId === selectedDocModal.id
                      ? 'bg-emerald-500 text-slate-950 border-emerald-600'
                      : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {copiedDocId === selectedDocModal.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>¡Enlace copiado al portapapeles!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Compartir URL</span>
                    </>
                  )}
                </button>

                {(() => {
                  const isAuthor = currentUser && selectedDocModal.authorId === currentUser.uid;
                  const isAdmin = currentUser?.role === 'admin';
                  const isAllowed = selectedDocModal.allowDownload ?? selectedDocModal.projectData?.allowDownload ?? false;
                  const canModalDownload = isAllowed || isAuthor || isAdmin;

                  if (canModalDownload) {
                    return (
                      <button
                        onClick={() => handleDownloadJSON(selectedDocModal)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Descargar archivo JSON del proyecto"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-400" />
                        <span>Descargar JSON</span>
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
                    const data = selectedDocModal.publishedData || selectedDocModal.projectData;
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

      {/* Full Cover Image Viewer Modal */}
      {fullCoverImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
          onClick={() => setFullCoverImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[92vh] w-full h-full flex flex-col items-center justify-center cursor-default space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between text-white bg-slate-900/90 px-4 py-3 rounded-xl border border-white/10 max-w-3xl shadow-xl">
              <span className="font-bold text-sm sm:text-base text-amber-400 truncate flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> {fullCoverImage.title} — Portada completa
              </span>
              <button
                onClick={() => setFullCoverImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Cerrar vista de portada"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 w-full flex items-center justify-center overflow-hidden p-2">
              <img
                src={fullCoverImage.src}
                alt={`Portada completa de ${fullCoverImage.title}`}
                className="max-w-full max-h-[78vh] object-contain rounded-2xl border-2 border-amber-500/50 shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
