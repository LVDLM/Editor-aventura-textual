import React, { useState, useEffect } from 'react';
import { Play, Download, Search, BookOpen, Sparkles, Filter, Package, FileCode, Clock, User, ShieldAlert, Info, X, Award } from 'lucide-react';
import { CloudProjectDoc, GameProject } from '../../types';
import { getPublishedProjects, saveProjectToCloud } from '../../lib/firebase';
import { sampleGameProject } from '../../data/sampleGame';
import { generateStandaloneHTML } from '../../utils/htmlExporter';
import { exportProjectAsZip } from '../../utils/zipExporter';

interface PublicCatalogProps {
  onPlayProject: (project: GameProject) => void;
  onOpenWorkspace: () => void;
}

export const PublicCatalog: React.FC<PublicCatalogProps> = ({ onPlayProject, onOpenWorkspace }) => {
  const [publishedProjects, setPublishedProjects] = useState<CloudProjectDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [seeding, setSeeding] = useState(false);
  const [selectedDocModal, setSelectedDocModal] = useState<CloudProjectDoc | null>(null);

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

  const getThemeBadge = (themeStr: string) => {
    switch (themeStr) {
      case 'classic-retro':
        return <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">🕹️ Retro LucasArts</span>;
      case 'modern-dark':
        return <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">🌙 Oscuro Elegante</span>;
      case 'sepia-parchment':
        return <span className="text-[11px] px-2 py-0.5 rounded bg-yellow-950/40 text-yellow-200 border border-yellow-700/40">📜 Pergamino Sepia</span>;
      case 'cyber-terminal':
        return <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">💻 Terminal Cyber</span>;
      case 'emerald-vintage':
        return <span className="text-[11px] px-2 py-0.5 rounded bg-teal-950/40 text-teal-300 border border-teal-500/30">🌲 Esmeralda Vintage</span>;
      default:
        return <span className="text-[11px] px-2 py-0.5 rounded bg-white/10 text-white/80">Aventura</span>;
    }
  };

  return (
    <div className="flex-1 bg-[#0a0a0c] text-slate-200 p-4 sm:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Portal Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-slate-950 border border-amber-500/20 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Portal de Lecturas Interactivas
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
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg flex items-center gap-2"
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

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
            className="bg-slate-950 border border-white/10 text-xs text-slate-300 rounded-xl px-3 py-2 outline-none focus:border-amber-500 w-full sm:w-auto cursor-pointer"
          >
            <option value="all">Todos los Estilos Visuales</option>
            <option value="classic-retro">LucasArts Retro</option>
            <option value="modern-dark">Oscuro Elegante</option>
            <option value="sepia-parchment">Pergamino Sepia</option>
            <option value="cyber-terminal">Terminal Cyber</option>
            <option value="emerald-vintage">Esmeralda Vintage</option>
          </select>
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
            className="px-5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-2 mx-auto"
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
            const theme = doc.projectData?.theme || 'classic-retro';
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
                    {getThemeBadge(theme)}
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
                      onClick={() => setSelectedDocModal(doc)}
                      className="py-2 px-3 bg-slate-950 hover:bg-slate-800 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Ver sinopsis completa, portada e información detallada"
                    >
                      <Info className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ver Detalles</span>
                    </button>

                    <button
                      onClick={() => onPlayProject(doc.projectData)}
                      className="py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      <span>Jugar Historia</span>
                    </button>
                  </div>

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
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                  {getThemeBadge(selectedDocModal.projectData?.theme || 'classic-retro')}
                </div>
                <p className="text-xs text-amber-400 font-medium">
                  Autor / Creador: <strong className="text-amber-200">{selectedDocModal.authorName}</strong>
                </p>
              </div>

              {/* Synopsis Section */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-white/10 space-y-2">
                <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Sinopsis del Texto-Juego
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
                  <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" />
                    Créditos, Fuentes de Imágenes y Colaboradores
                  </h4>
                  <p className="text-slate-300 font-mono text-xs leading-relaxed whitespace-pre-line bg-slate-900 p-3 rounded-lg border border-slate-800">
                    {selectedDocModal.projectData.credits}
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
                <button
                  onClick={() => {
                    handleDownloadHTML(selectedDocModal);
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>Descargar HTML</span>
                </button>
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
