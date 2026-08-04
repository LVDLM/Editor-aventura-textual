import React, { useState, useEffect } from 'react';
import { UserProfile, CloudProjectDoc, GameProject, SaveSlotData } from '../../types';
import {
  updateUserProfileName,
  getUserProjects,
  deleteProjectFromCloud,
  deleteUserAccountAndData,
  auth,
} from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import {
  User,
  Shield,
  Edit3,
  BookOpen,
  FolderOpen,
  Trash2,
  LogOut,
  AlertTriangle,
  Check,
  Clock,
  Sparkles,
  ShieldCheck,
  FileText,
  Play,
  Layers,
  MapPin,
  RefreshCw,
  Info,
} from 'lucide-react';

interface UserProfilePageProps {
  currentUser: UserProfile;
  setCurrentUser: (profile: UserProfile | null) => void;
  onLoadProjectToEditor: (projData: GameProject, cloudDocId: string | null) => void;
  onLoadGameStateToPlay: (projData: GameProject, gameStateSlot: SaveSlotData) => void;
  setCurrentView: (view: 'catalog' | 'play' | 'edit' | 'workspace' | 'admin' | 'profile') => void;
  onOpenPrivacyModal: () => void;
}

interface LocalSavedGameItem {
  key: string;
  slotData: SaveSlotData;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({
  currentUser,
  setCurrentUser,
  onLoadProjectToEditor,
  onLoadGameStateToPlay,
  setCurrentView,
  onOpenPrivacyModal,
}) => {
  // Nick editing state
  const [displayNameInput, setDisplayNameInput] = useState(currentUser.displayName || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSuccessMessage, setNameSuccessMessage] = useState<string | null>(null);

  // User projects state (Historial de publicaciones)
  const [userProjects, setUserProjects] = useState<CloudProjectDoc[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  // User reading history state (Historial de lecturas)
  const [readingHistory, setReadingHistory] = useState<LocalSavedGameItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Modal states for story deletion and account deletion
  const [projectToDelete, setProjectToDelete] = useState<CloudProjectDoc | null>(null);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadUserPublications();
    loadUserReadingHistory();
  }, [currentUser.uid]);

  const loadUserPublications = async () => {
    setIsLoadingProjects(true);
    try {
      const list = await getUserProjects(currentUser.uid);
      setUserProjects(list);
    } catch (e) {
      console.error('Error loading publications:', e);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const loadUserReadingHistory = () => {
    setIsLoadingHistory(true);
    const items: LocalSavedGameItem[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('text_adventure_save_slot_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as SaveSlotData;
              if (parsed.gameTitle && parsed.currentSceneId) {
                items.push({ key, slotData: parsed });
              }
            } catch {
              // Ignore corrupt keys
            }
          }
        }
      }
      // Sort history by timestamp newest first
      items.sort((a, b) => (b.slotData.timestamp || '').localeCompare(a.slotData.timestamp || ''));
      setReadingHistory(items);
    } catch (err) {
      console.error('Error loading reading history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Handle Nick update
  const handleSaveDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayNameInput.trim()) return;

    setIsSavingName(true);
    setNameSuccessMessage(null);
    setErrorMsg(null);

    try {
      const updated = await updateUserProfileName(currentUser.uid, displayNameInput.trim());
      setCurrentUser(updated);
      setNameSuccessMessage('¡Tu Nick / Nombre de usuario se ha actualizado correctamente!');
      setTimeout(() => setNameSuccessMessage(null), 3500);
    } catch (err) {
      console.error('Error updating profile name:', err);
      setErrorMsg('No se pudo actualizar el nombre. Inténtalo de nuevo.');
    } finally {
      setIsSavingName(false);
    }
  };

  // Handle story deletion
  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
      await deleteProjectFromCloud(projectToDelete.id);
      setUserProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
      setProjectToDelete(null);
    } catch (err) {
      alert('Error al eliminar la historia.');
    }
  };

  // Handle deleting a save slot from reading history
  const handleDeleteSaveSlot = (key: string) => {
    localStorage.removeItem(key);
    loadUserReadingHistory();
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await auth.signOut();
      setCurrentUser(null);
      setCurrentView('catalog');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  // Handle Account Deletion (RGPD Derecho al olvido)
  const handleConfirmAccountDeletion = async () => {
    if (deleteConfirmationText.trim().toUpperCase() !== 'ELIMINAR') return;
    setIsDeletingAccount(true);
    setErrorMsg(null);
    try {
      await deleteUserAccountAndData(currentUser.uid);
      setCurrentUser(null);
      setCurrentView('catalog');
    } catch (err: any) {
      console.error('Account deletion error:', err);
      setErrorMsg(
        'Error al eliminar la cuenta. Si llevas mucho tiempo autenticado, por seguridad vuelve a iniciar sesión e inténtalo de nuevo.'
      );
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-[#0a0a0d] text-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Profile Hero Card */}
        <div className="bg-gradient-to-r from-slate-900 via-[#12131a] to-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            
            {/* Left: User Avatar & Information */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-bold text-2xl sm:text-3xl shadow-lg shrink-0 border-2 border-amber-400/40">
                {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'L'}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-white">
                    {currentUser.displayName || 'Usuario Lector'}
                  </h1>
                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                      currentUser.role === 'admin'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {currentUser.role === 'admin' ? '🛡️ Administrador' : '✍️ Autor / Lector'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">{currentUser.email}</p>
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-600" />
                  <span>Miembro desde: {new Date(currentUser.createdAt).toLocaleDateString('es-ES')}</span>
                </p>
              </div>
            </div>

            {/* Right: Quick Stats & Sign Out */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-white/10 hover:border-white/20 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-950/40 border border-rose-500/40 text-rose-300 p-4 rounded-2xl text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Section 1: Editar Nombre / Nick */}
        <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <User className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-bold text-white text-base">Nick de Usuario y Nombre Público</h2>
              <p className="text-[11px] text-slate-400">
                Este es el nombre o alias que se mostrará por defecto al crear o firmar tus historias interactivas.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveDisplayName} className="space-y-3 max-w-xl">
            {nameSuccessMessage && (
              <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{nameSuccessMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Editar Nombre de Usuario / Nick
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  placeholder="Ej: Laura Martínez"
                  className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={isSavingName || !displayNameInput.trim()}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-md shrink-0 flex items-center gap-1.5"
                >
                  {isSavingName ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Edit3 className="w-4 h-4" />
                  )}
                  <span>Guardar Nick</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Section 2: Historial de Publicaciones */}
        <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="font-bold text-white text-base">Historial de Publicaciones (Mis Obras)</h2>
                <p className="text-[11px] text-slate-400">
                  Todas las historias interactivas de texto creadas, editadas o subidas a la nube con tu cuenta.
                </p>
              </div>
            </div>
            <button
              onClick={() => setCurrentView('workspace')}
              className="px-3 py-1.5 bg-sky-950/80 border border-sky-500/30 hover:border-sky-500 text-sky-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Abrir Gestor de Proyectos</span>
            </button>
          </div>

          {isLoadingProjects ? (
            <div className="py-8 text-center space-y-2 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" />
              <p className="text-xs">Cargando tus historias creadas...</p>
            </div>
          ) : userProjects.length === 0 ? (
            <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-8 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="space-y-1">
                <p className="font-bold text-slate-200 text-sm">Aún no has creado ninguna historia pública</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Puedes comenzar creando tu propio relato interactivo en el Editor o utilizando la plantilla del tutorial.
                </p>
              </div>
              <button
                onClick={() => setCurrentView('workspace')}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow"
              >
                <Sparkles className="w-4 h-4" />
                <span>Crear Nuevo Relato</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userProjects.map((docItem) => (
                <div
                  key={docItem.id}
                  className="bg-slate-950 border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-amber-500/40 transition-all shadow-md"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-white text-sm line-clamp-1">{docItem.title}</h3>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                          docItem.status === 'published'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : docItem.status === 'pending_review'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : docItem.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {docItem.status === 'published'
                          ? 'Publicado'
                          : docItem.status === 'pending_review'
                          ? 'En revisión'
                          : docItem.status === 'rejected'
                          ? 'Rechazado'
                          : 'Borrador'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {docItem.description || 'Sin descripción'}
                    </p>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                      <span>Autor: <strong className="text-slate-300">{docItem.authorName}</strong></span>
                      <span>{docItem.projectData?.scenes?.length || 0} escenas</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => {
                        if (docItem.projectData) {
                          onLoadProjectToEditor(docItem.projectData, docItem.id);
                        }
                      }}
                      className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Editar</span>
                    </button>

                    <button
                      onClick={() => setProjectToDelete(docItem)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Eliminar relato"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Historial de Lecturas */}
        <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <FolderOpen className="w-5 h-5 text-sky-400" />
              <div>
                <h2 className="font-bold text-white text-base">Historial de Lecturas (Partidas Guardadas)</h2>
                <p className="text-[11px] text-slate-400">
                  Partidas en curso y progresos de lectura guardados en tu dispositivo local.
                </p>
              </div>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {readingHistory.length} partida(s) registrada(s)
            </span>
          </div>

          {isLoadingHistory ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Cargando historial de lecturas...
            </div>
          ) : readingHistory.length === 0 ? (
            <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-6 text-center text-xs text-slate-400 space-y-2">
              <FolderOpen className="w-8 h-8 text-slate-600 mx-auto" />
              <p>No tienes partidas guardadas en el historial de lecturas.</p>
              <p className="text-[11px] text-slate-500">
                Al jugar cualquier relato y usar la opción de guardado o autoguardado, aparecerá aquí listado.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {readingHistory.map(({ key, slotData }) => (
                <div
                  key={key}
                  className="bg-slate-950 border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-sky-500/40 transition-all shadow-md"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 truncate">
                        {slotData.gameTitle || 'Historia Interactiva'}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0 font-mono">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {slotData.timestamp}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-200">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">Escena: {slotData.currentSceneName}</span>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      Objetos en inventario: {slotData.inventoryItemIds?.length || 0}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => {
                        // Dummy project shell with ID to trigger loading in play view
                        const dummyProj: GameProject = {
                          id: slotData.gameId,
                          title: slotData.gameTitle,
                          author: 'Autor',
                          version: '1.0',
                          description: '',
                          theme: 'classic-retro',
                          initialSceneId: slotData.currentSceneId,
                          defaultResponses: {
                            mirar: '',
                            usar: '',
                            abrir: '',
                            coger: '',
                            hablar: '',
                            empujar: '',
                            ir_a: '',
                          },
                          globalFlags: {},
                          inventoryItems: [],
                          scenes: [],
                        };
                        onLoadGameStateToPlay(dummyProj, slotData);
                      }}
                      className="flex-1 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      <span>Reanudar Partida</span>
                    </button>

                    <button
                      onClick={() => handleDeleteSaveSlot(key)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Borrar registro de lectura"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Privacidad y Normativa de la UE (RGPD) */}
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="font-bold text-white text-base">Protección de Datos y Privacidad (RGPD / UE)</h2>
                <p className="text-[11px] text-slate-400">
                  Garantías de privacidad en cumplimiento del Reglamento General de Protección de Datos de la Unión Europea.
                </p>
              </div>
            </div>
            <button
              onClick={onOpenPrivacyModal}
              className="px-3.5 py-1.5 bg-emerald-950/80 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Ver Política Completa de Privacidad</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="bg-slate-950 p-3 rounded-xl border border-white/5 space-y-1">
              <span className="font-bold text-emerald-300 flex items-center gap-1">
                <span>🔒</span> Transparencia
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Tus datos solo se usan para prestar el servicio. No comercializamos ni rastreamos tu actividad con cookies publicitarias.
              </p>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-white/5 space-y-1">
              <span className="font-bold text-emerald-300 flex items-center gap-1">
                <span>📥</span> Portabilidad (Art. 20)
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Puedes exportar libremente el código completo de tus historias en HTML/JSON autónomo en cualquier momento.
              </p>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-white/5 space-y-1">
              <span className="font-bold text-emerald-300 flex items-center gap-1">
                <span>🗑️</span> Derecho al Olvido (Art. 17)
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Dispones del derecho a la supresión completa e inmediata de tu cuenta y todos tus datos mediante la zona peligrosa.
              </p>
            </div>
          </div>
        </div>

        {/* Section 5: Zona Peligrosa - Eliminar Cuenta */}
        <div className="bg-gradient-to-r from-rose-950/30 via-slate-900 to-rose-950/30 border border-rose-500/40 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-rose-500/30 pb-3">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <div>
              <h2 className="font-bold text-rose-200 text-base">Zona de Gestión de Cuenta y Supresión</h2>
              <p className="text-[11px] text-slate-400">
                Opciones irreversibles para eliminar tu presencia y todos los datos en la plataforma.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950/80 p-4 rounded-xl border border-rose-500/20">
            <div className="space-y-0.5">
              <p className="font-bold text-xs text-rose-300">Eliminar cuenta y suprimir todos mis datos personales</p>
              <p className="text-[11px] text-slate-400 leading-relaxed max-w-xl">
                Esta acción borrará de manera permanente tu perfil en Firestore, todas las historias de tu autoría alojadas en la nube y tus partidas locales.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteAccountModal(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar Cuenta</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Confirm Project Deletion */}
      {projectToDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setProjectToDelete(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl cursor-default text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-400 border-b border-white/10 pb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-white">¿Eliminar relato de la nube?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Estás a punto de borrar definitivamente la historia <strong className="text-white">&quot;{projectToDelete.title}&quot;</strong>. Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteProject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow"
              >
                Sí, Eliminar Historia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Account Deletion (RGPD Derecha al olvido) */}
      {showDeleteAccountModal && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setShowDeleteAccountModal(false)}
        >
          <div
            className="bg-[#0f0b10] border border-rose-500/50 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl cursor-default text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-400 border-b border-rose-500/30 pb-3">
              <AlertTriangle className="w-7 h-7 text-rose-500 shrink-0" />
              <div>
                <h3 className="font-bold text-lg text-rose-200">Supresión Irreversible de Cuenta (RGPD)</h3>
                <p className="text-[11px] text-rose-300/80">Derecho al Olvido (Reglamento UE 2016/679)</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                Al confirmar esta acción, procederemos inmediatamente a:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                <li>Eliminar tu cuenta de usuario y credenciales de acceso.</li>
                <li>Eliminar tu perfil y registro en la base de datos Firestore.</li>
                <li>Borrar todas las historias y relatos de tu autoría alojados en el servidor.</li>
                <li>Limpiar tus partidas guardadas locales en el navegador.</li>
              </ul>
              <div className="bg-rose-950/60 border border-rose-500/30 rounded-xl p-3 text-[11px] text-rose-200 font-semibold">
                ⚠️ ATENCIÓN: Esta operación es permanente e irrevocable. No se podrán recuperar las historias borradas.
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                Escribe <span className="text-rose-400 font-mono font-black">ELIMINAR</span> para confirmar:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Escribe ELIMINAR"
                className="w-full bg-slate-950 border border-rose-500/40 rounded-xl px-3.5 py-2 text-sm text-rose-200 focus:border-rose-400 outline-none font-mono tracking-wider"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteAccountModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAccountDeletion}
                disabled={deleteConfirmationText.trim().toUpperCase() !== 'ELIMINAR' || isDeletingAccount}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isDeletingAccount && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>Confirmar y Eliminar Todo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
