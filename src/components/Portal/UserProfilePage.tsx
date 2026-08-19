import React, { useState, useEffect } from 'react';
import { UserProfile, CloudProjectDoc, GameProject, SaveSlotData, UserRole } from '../../types';
import {
  updateUserProfileName,
  getUserProjects,
  getAllProjectsForAdmin,
  deleteProjectFromCloud,
  deleteUserAccountAndData,
  setUserRoleInDb,
  auth,
} from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import {
  User,
  Users,
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
  webAspect?: 'clean' | 'classic';
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
  webAspect = 'clean',
}) => {
  const isClean = webAspect === 'clean';
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

  // Role switching state
  const [isChangingRole, setIsChangingRole] = useState(false);

  const handleToggleRole = async (targetRole: UserRole) => {
    setIsChangingRole(true);
    setErrorMsg(null);
    try {
      await setUserRoleInDb(currentUser.uid, targetRole);
      setCurrentUser({ ...currentUser, role: targetRole });
    } catch (err) {
      console.error('Error changing role:', err);
      setErrorMsg('No se pudo cambiar el rol. Inténtalo de nuevo.');
    } finally {
      setIsChangingRole(false);
    }
  };

  useEffect(() => {
    loadUserPublications();
    loadUserReadingHistory();
  }, [currentUser.uid]);

  const loadUserPublications = async () => {
    setIsLoadingProjects(true);
    try {
      if (currentUser.role === 'admin' || currentUser.email === 'lavozdelosmuertos@gmail.com') {
        const allProjects = await getAllProjectsForAdmin();
        const userOrDemo = allProjects.filter((p) => 
          p.authorId === currentUser.uid || 
          p.authorEmail === currentUser.email ||
          p.authorEmail === 'lavozdelosmuertos@gmail.com' ||
          p.authorId === 'system_admin_seed' ||
          p.id === 'sample_misterio_habitacion' ||
          p.id === 'el_misterio_de_la_habitacion'
        );
        setUserProjects(userOrDemo);
      } else {
        const list = await getUserProjects(currentUser.uid);
        setUserProjects(list);
      }
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
    <div className={`min-h-[calc(100vh-60px)] py-8 px-4 sm:px-6 transition-colors duration-200 ${
      isClean ? 'bg-[#F4EFE3] text-[#2A2118]' : 'bg-[#1F1913] text-[#F4EFE3]'
    }`}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Profile Hero Card */}
        <div className={`rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden border ${
          isClean
            ? 'bg-[#FFFDF6] border-[#E5DCB8] text-[#2A2118]'
            : 'bg-[#2C241C] border-[#42362B] text-[#F4EFE3]'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            
            {/* Left: User Avatar & Information */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#A4332A] flex items-center justify-center text-white font-serif font-bold text-2xl sm:text-3xl shadow-sm shrink-0 border-2 border-[#8B2A22]">
                {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'L'}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className={`text-xl sm:text-2xl font-serif font-bold ${isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}`}>
                    {currentUser.displayName || 'Usuario Lector'}
                  </h1>
                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border font-sans ${
                      currentUser.role === 'admin'
                        ? 'bg-[#A4332A]/10 text-[#A4332A] border-[#A4332A]/30'
                        : 'bg-[#E5DCB8]/60 text-[#2A2118] border-[#E5DCB8]'
                    }`}
                  >
                    {currentUser.role === 'admin' ? '🛡️ Administrador' : '✍️ Autor / Lector'}
                  </span>
                </div>
                <p className={`text-xs font-mono ${isClean ? 'text-[#6B5C46]' : 'text-[#D1C7B7]'}`}>{currentUser.email}</p>
                <p className={`text-[11px] flex items-center gap-1 ${isClean ? 'text-[#6B5C46]' : 'text-[#D1C7B7]'}`}>
                  <Clock className="w-3 h-3 text-[#C9A24B]" />
                  <span>Miembro desde: {new Date(currentUser.createdAt).toLocaleDateString('es-ES')}</span>
                </p>
              </div>
            </div>

            {/* Right: Quick Stats & Sign Out */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <button
                onClick={handleSignOut}
                className={`px-4 py-2 border text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                  isClean
                    ? 'bg-[#F4EFE3] hover:bg-[#E5DCB8] text-[#2A2118] border-[#E5DCB8]'
                    : 'bg-[#1F1913] hover:bg-[#382E25] text-[#F4EFE3] border-[#42362B]'
                }`}
              >
                <LogOut className="w-4 h-4 text-[#A4332A]" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-[#A4332A]/10 border border-[#A4332A]/30 text-[#A4332A] dark:text-rose-300 p-4 rounded-2xl text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Section 1: Editar Nombre / Nick */}
        <div className={`border rounded-2xl p-6 shadow-sm space-y-4 ${
          isClean ? 'bg-[#FFFDF6] border-[#E5DCB8]' : 'bg-[#2C241C] border-[#42362B]'
        }`}>
          <div className={`flex items-center gap-2.5 border-b pb-3 ${isClean ? 'border-[#E5DCB8]' : 'border-[#42362B]'}`}>
            <User className="w-5 h-5 text-[#A4332A]" />
            <div>
              <h2 className={`font-serif font-bold text-base ${isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}`}>Nick de Usuario y Nombre Público</h2>
              <p className={`text-[11px] ${isClean ? 'text-[#6B5C46]' : 'text-[#D1C7B7]'}`}>
                Este es el nombre o alias que se mostrará por defecto al crear o firmar tus historias interactivas.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveDisplayName} className="space-y-3 max-w-xl">
            {nameSuccessMessage && (
              <div className="bg-[#3B6D11]/20 border border-[#3B6D11]/40 text-[#3B6D11] dark:text-emerald-300 px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-[#3B6D11]" />
                <span>{nameSuccessMessage}</span>
              </div>
            )}

            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}`}>
                Editar Nombre de Usuario / Nick
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  placeholder="Ej: Laura Martínez"
                  className={`flex-1 border rounded-xl px-4 py-2.5 text-sm outline-none transition-colors ${
                    isClean
                      ? 'bg-[#F4EFE3] border-[#E5DCB8] text-[#2A2118] focus:border-[#A4332A]'
                      : 'bg-[#1F1913] border-[#42362B] text-[#F4EFE3] focus:border-[#C9A24B]'
                  }`}
                />
                <button
                  type="submit"
                  disabled={isSavingName || !displayNameInput.trim()}
                  className="px-5 py-2.5 bg-[#A4332A] hover:bg-[#8B2A22] text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-sm shrink-0 flex items-center gap-1.5"
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

        {/* Section 1.5: Panel de Control de Funciones de Administrador */}
        {currentUser.role === 'admin' && (
          <div className={`border rounded-2xl p-6 shadow-sm space-y-4 ${
            isClean ? 'bg-[#FFFDF6] border-[#E5DCB8]' : 'bg-[#2C241C] border-[#42362B]'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 flex-wrap gap-2 ${isClean ? 'border-[#E5DCB8]' : 'border-[#42362B]'}`}>
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-[#A4332A]" />
                <div>
                  <h2 className={`font-serif font-bold text-base ${isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}`}>
                    Gestión y Funciones de Administrador Principal
                  </h2>
                  <p className={`text-[11px] ${isClean ? 'text-[#6B5C46]' : 'text-[#D1C7B7]'}`}>
                    Tu cuenta (<strong className="text-[#A4332A]">{currentUser.email}</strong>) posee permisos globales para auditar relatos y gestionar la plataforma.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border font-sans bg-[#A4332A]/10 text-[#A4332A] border-[#A4332A]/30">
                🛡️ Administrador Activo
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                isClean ? 'bg-[#F4EFE3]/80 border-[#E5DCB8]' : 'bg-[#1F1913] border-[#42362B]'
              }`}>
                <div className="space-y-2">
                  <h3 className={`font-bold text-sm flex items-center gap-2 ${isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}`}>
                    <BookOpen className="w-4 h-4 text-[#A4332A]" /> Moderación y Aprobación de Relatos
                  </h3>
                  <p className={`text-xs leading-relaxed ${isClean ? 'text-[#6B5C46]' : 'text-[#D1C7B7]'}`}>
                    Audita, aprueba, publica o rechaza todas las historias interactivas enviadas por autores de la comunidad.
                  </p>
                </div>
                <button
                  onClick={() => setCurrentView('admin')}
                  className="w-full py-2.5 bg-[#A4332A] hover:bg-[#8B2A22] text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Shield className="w-4 h-4 text-white" />
                  <span>Abrir Panel de Control de Relatos</span>
                </button>
              </div>

              <div className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                isClean ? 'bg-[#F4EFE3]/80 border-[#E5DCB8]' : 'bg-[#1F1913] border-[#42362B]'
              }`}>
                <div className="space-y-2">
                  <h3 className={`font-bold text-sm flex items-center gap-2 ${isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}`}>
                    <Users className="w-4 h-4 text-[#C9A24B]" /> Gestión de Usuarios y Permisos
                  </h3>
                  <p className={`text-xs leading-relaxed ${isClean ? 'text-[#6B5C46]' : 'text-[#D1C7B7]'}`}>
                    Consulta el listado completo de usuarios registrados, gestiona sus roles, reasigna relatos o restablece contraseñas.
                  </p>
                </div>
                <button
                  onClick={() => setCurrentView('admin')}
                  className={`w-full py-2.5 border rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                    isClean
                      ? 'bg-[#FFFDF6] hover:bg-[#E5DCB8] text-[#2A2118] border-[#E5DCB8]'
                      : 'bg-[#2C241C] hover:bg-[#382E25] text-[#F4EFE3] border-[#42362B]'
                  }`}
                >
                  <Users className="w-4 h-4 text-[#C9A24B]" />
                  <span>Gestionar Usuarios y Permisos</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Historial de Publicaciones */}
        <div className={`border rounded-2xl p-6 shadow-sm space-y-4 ${
          isClean ? 'bg-[#FFFDF6] border-[#E5DCB8]' : 'bg-[#2C241C] border-[#42362B]'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 flex-wrap gap-2 ${isClean ? 'border-[#E5DCB8]' : 'border-[#42362B]'}`}>
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-[#A4332A]" />
              <div>
                <h2 className={`font-serif font-bold text-base ${isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}`}>Historial de Publicaciones (Mis Obras)</h2>
                <p className={`text-[11px] ${isClean ? 'text-[#6B5C46]' : 'text-[#D1C7B7]'}`}>
                  Todas las historias interactivas de texto creadas, editadas o subidas a la nube con tu cuenta.
                </p>
              </div>
            </div>
            <button
              onClick={() => setCurrentView('workspace')}
              className="px-3 py-1.5 bg-[#A4332A] hover:bg-[#8B2A22] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
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
            <div className={`border rounded-2xl p-8 text-center space-y-3 ${
              isClean ? 'bg-[#F4EFE3] border-[#E5DCB8]' : 'bg-[#1F1913] border-[#42362B]'
            }`}>
              <BookOpen className="w-10 h-10 text-[#6B5C46] mx-auto" />
              <div className="space-y-1">
                <p className={`font-serif font-bold text-sm ${isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}`}>Aún no has creado ninguna historia pública</p>
                <p className={`text-xs max-w-md mx-auto leading-relaxed ${isClean ? 'text-[#6B5C46]' : 'text-[#D1C7B7]'}`}>
                  Puedes comenzar creando tu propio relato interactivo en el Editor o utilizando la plantilla del tutorial.
                </p>
              </div>
              <button
                onClick={() => setCurrentView('workspace')}
                className="px-4 py-2 bg-[#A4332A] hover:bg-[#8B2A22] text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
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
                  className={`border rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all ${
                    isClean ? 'bg-[#FFFDF6] border-[#E5DCB8]' : 'bg-[#1F1913] border-[#42362B]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`font-serif font-bold text-sm line-clamp-1 ${isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}`}>{docItem.title}</h3>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                          docItem.status === 'published'
                            ? 'bg-[#3B6D11]/20 text-[#3B6D11] border-[#3B6D11]/40'
                            : docItem.status === 'pending_review'
                            ? 'bg-[#C9A24B]/20 text-[#8F6F20] border-[#C9A24B]/40'
                            : docItem.status === 'rejected'
                            ? 'bg-[#A4332A]/20 text-[#A4332A] border-[#A4332A]/40'
                            : 'bg-slate-200 text-slate-700 border-slate-300'
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

                    <p className={`text-xs line-clamp-2 leading-relaxed ${isClean ? 'text-[#6B5C46]' : 'text-[#D1C7B7]'}`}>
                      {docItem.description || 'Sin descripción'}
                    </p>

                    <div className={`text-[11px] flex items-center justify-between pt-1 ${isClean ? 'text-[#6B5C46]' : 'text-[#D1C7B7]'}`}>
                      <span>Autor: <strong className={isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}>{docItem.authorName}</strong></span>
                      <span>{docItem.projectData?.scenes?.length || 0} escenas</span>
                    </div>
                  </div>

                  <div className={`flex items-center gap-2 pt-2 border-t ${isClean ? 'border-[#E5DCB8]' : 'border-[#42362B]'}`}>
                    <button
                      onClick={() => {
                        if (docItem.projectData) {
                          onLoadProjectToEditor(docItem.projectData, docItem.id);
                        }
                      }}
                      className={`flex-1 py-1.5 border rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                        isClean
                          ? 'bg-[#F4EFE3] hover:bg-[#E5DCB8] text-[#2A2118] border-[#E5DCB8]'
                          : 'bg-[#2C241C] hover:bg-[#382E25] text-[#F4EFE3] border-[#42362B]'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#A4332A]" />
                      <span>Editar</span>
                    </button>

                    <button
                      onClick={() => setProjectToDelete(docItem)}
                      className={`p-1.5 transition-colors ${isClean ? 'text-[#6B5C46] hover:text-[#A4332A]' : 'text-[#D1C7B7] hover:text-rose-400'}`}
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
        <div className={`border rounded-2xl p-6 shadow-sm space-y-4 ${
          isClean ? 'bg-[#FFFDF6] border-[#E5DCB8]' : 'bg-[#2C241C] border-[#42362B]'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 flex-wrap gap-2 ${isClean ? 'border-[#E5DCB8]' : 'border-[#42362B]'}`}>
            <div className="flex items-center gap-2.5">
              <FolderOpen className="w-5 h-5 text-[#C9A24B]" />
              <div>
                <h2 className={`font-serif font-bold text-base ${isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}`}>Historial de Lecturas (Partidas Guardadas)</h2>
                <p className={`text-[11px] ${isClean ? 'text-[#6B5C46]' : 'text-[#D1C7B7]'}`}>
                  Partidas en curso y progresos de lectura guardados en tu dispositivo local.
                </p>
              </div>
            </div>
            <span className={`text-xs font-mono ${isClean ? 'text-[#6B5C46]' : 'text-[#D1C7B7]'}`}>
              {readingHistory.length} partida(s) registrada(s)
            </span>
          </div>

          {isLoadingHistory ? (
            <div className={`py-8 text-center text-xs ${isClean ? 'text-[#6B5C46]' : 'text-[#D1C7B7]'}`}>
              Cargando historial de lecturas...
            </div>
          ) : readingHistory.length === 0 ? (
            <div className={`border rounded-2xl p-6 text-center text-xs space-y-2 ${
              isClean ? 'bg-[#F4EFE3] border-[#E5DCB8] text-[#6B5C46]' : 'bg-[#1F1913] border-[#42362B] text-[#D1C7B7]'
            }`}>
              <FolderOpen className="w-8 h-8 text-[#6B5C46] mx-auto" />
              <p className={`font-bold font-serif ${isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}`}>No tienes partidas guardadas en el historial de lecturas.</p>
              <p className="text-[11px]">
                Al jugar cualquier relato y usar la opción de guardado o autoguardado, aparecerá aquí listado.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {readingHistory.map(({ key, slotData }) => (
                <div
                  key={key}
                  className={`border rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all ${
                    isClean ? 'bg-[#FFFDF6] border-[#E5DCB8]' : 'bg-[#1F1913] border-[#42362B]'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-serif font-bold truncate ${isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}`}>
                        {slotData.gameTitle || 'Historia Interactiva'}
                      </span>
                      <span className={`text-[10px] flex items-center gap-1 shrink-0 font-mono ${isClean ? 'text-[#6B5C46]' : 'text-[#D1C7B7]'}`}>
                        <Clock className="w-3 h-3 text-[#C9A24B]" />
                        {slotData.timestamp}
                      </span>
                    </div>

                    <div className={`flex items-center gap-1.5 text-xs ${isClean ? 'text-[#2A2118]' : 'text-[#D1C7B7]'}`}>
                      <MapPin className="w-3.5 h-3.5 text-[#C9A24B] shrink-0" />
                      <span className="truncate font-serif">Escena: {slotData.currentSceneName}</span>
                    </div>

                    <p className={`text-[11px] ${isClean ? 'text-[#6B5C46]' : 'text-[#D1C7B7]'}`}>
                      Objetos en inventario: {slotData.inventoryItemIds?.length || 0}
                    </p>
                  </div>

                  <div className={`flex items-center gap-2 pt-2 border-t ${isClean ? 'border-[#E5DCB8]' : 'border-[#42362B]'}`}>
                    <button
                      onClick={() => {
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
                      className="flex-1 py-1.5 bg-[#3B6D11] hover:bg-[#2F570E] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Reanudar Partida</span>
                    </button>

                    <button
                      onClick={() => handleDeleteSaveSlot(key)}
                      className={`p-1.5 transition-colors ${isClean ? 'text-[#6B5C46] hover:text-[#A4332A]' : 'text-[#D1C7B7] hover:text-rose-400'}`}
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

        {/* Section 4: Privacidad y Normativa de la UE (RGPD) - Compact / Discreet */}
        <div className={`border rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isClean ? 'bg-[#FFFDF6] border-[#E5DCB8]' : 'bg-[#2C241C] border-[#42362B]'
        }`}>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#3B6D11] shrink-0" />
            <div>
              <h2 className={`font-serif font-bold text-sm ${isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}`}>Protección de Datos y Privacidad (RGPD)</h2>
              <p className={`text-xs ${isClean ? 'text-[#6B5C46]' : 'text-[#D1C7B7]'}`}>
                Cumplimiento del Reglamento General de Protección de Datos de la Unión Europea (RGPD). No rastreamos tus datos personales.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenPrivacyModal}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              isClean
                ? 'bg-[#F4EFE3] hover:bg-[#E5DCB8] text-[#2A2118] border-[#E5DCB8]'
                : 'bg-[#1F1913] hover:bg-[#382E25] text-[#F4EFE3] border-[#42362B]'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#A4332A]" />
            <span>Ver Política de Privacidad</span>
          </button>
        </div>

        {/* Section 5: Zona Peligrosa - Eliminar Cuenta */}
        <div className={`border rounded-2xl p-6 shadow-sm space-y-4 ${
          isClean ? 'bg-[#FFFDF6] border-[#A4332A]/30' : 'bg-[#2C241C] border-[#A4332A]/40'
        }`}>
          <div className="flex items-center gap-2.5 border-b border-[#A4332A]/20 pb-3">
            <AlertTriangle className="w-5 h-5 text-[#A4332A]" />
            <div>
              <h2 className={`font-serif font-bold text-base ${isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}`}>Gestión y Supresión de Cuenta</h2>
              <p className={`text-[11px] ${isClean ? 'text-[#6B5C46]' : 'text-[#D1C7B7]'}`}>
                Opciones irreversibles para borrar tu presencia y datos en la plataforma.
              </p>
            </div>
          </div>

          <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border ${
            isClean ? 'bg-[#F4EFE3] border-[#E5DCB8]' : 'bg-[#1F1913] border-[#42362B]'
          }`}>
            <div className="space-y-0.5">
              <p className="font-bold text-xs text-[#A4332A]">Eliminar cuenta y suprimir todos mis datos personales</p>
              <p className={`text-[11px] leading-relaxed max-w-xl ${isClean ? 'text-[#6B5C46]' : 'text-[#D1C7B7]'}`}>
                Esta acción borrará de manera permanente tu perfil en Firestore, todas las historias de tu autoría alojadas en la nube y tus partidas locales.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteAccountModal(true)}
              className="px-4 py-2 bg-[#A4332A] hover:bg-[#8B2A22] text-white font-bold rounded-xl text-xs shadow-sm transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
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
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setProjectToDelete(null)}
        >
          <div
            className={`border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl cursor-default ${
              isClean ? 'bg-[#FFFDF6] border-[#E5DCB8] text-[#2A2118]' : 'bg-[#2C241C] border-[#42362B] text-[#F4EFE3]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-[#A4332A] border-b border-[#A4332A]/20 pb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-serif font-bold text-base">¿Eliminar relato de la nube?</h3>
            </div>
            <p className={`text-xs leading-relaxed ${isClean ? 'text-[#6B5C46]' : 'text-[#D1C7B7]'}`}>
              Estás a punto de borrar definitivamente la historia <strong className={isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}>&quot;{projectToDelete.title}&quot;</strong>. Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setProjectToDelete(null)}
                className={`px-4 py-2 border text-xs font-semibold rounded-xl cursor-pointer ${
                  isClean ? 'bg-[#F4EFE3] hover:bg-[#E5DCB8] text-[#2A2118] border-[#E5DCB8]' : 'bg-[#1F1913] hover:bg-[#382E25] text-[#F4EFE3] border-[#42362B]'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteProject}
                className="px-4 py-2 bg-[#A4332A] hover:bg-[#8B2A22] text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
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
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setShowDeleteAccountModal(false)}
        >
          <div
            className={`border rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl cursor-default ${
              isClean ? 'bg-[#FFFDF6] border-[#A4332A]/40 text-[#2A2118]' : 'bg-[#2C241C] border-[#A4332A]/40 text-[#F4EFE3]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-[#A4332A] border-b border-[#A4332A]/20 pb-3">
              <AlertTriangle className="w-7 h-7 text-[#A4332A] shrink-0" />
              <div>
                <h3 className="font-serif font-bold text-lg text-[#A4332A]">Supresión Irreversible de Cuenta (RGPD)</h3>
                <p className={`text-[11px] ${isClean ? 'text-[#6B5C46]' : 'text-[#D1C7B7]'}`}>Derecho al Olvido (Reglamento UE 2016/679)</p>
              </div>
            </div>

            <div className={`space-y-3 text-xs leading-relaxed ${isClean ? 'text-[#6B5C46]' : 'text-[#D1C7B7]'}`}>
              <p>
                Al confirmar esta acción, procederemos inmediatamente a:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Eliminar tu cuenta de usuario y credenciales de acceso.</li>
                <li>Eliminar tu perfil y registro en la base de datos Firestore.</li>
                <li>Borrar todas las historias y relatos de tu autoría alojados en el servidor.</li>
                <li>Limpiar tus partidas guardadas locales en el navegador.</li>
              </ul>
              <div className="bg-[#A4332A]/10 border border-[#A4332A]/30 rounded-xl p-3 text-[11px] text-[#A4332A] font-semibold">
                ⚠️ ATENCIÓN: Esta operación es permanente e irrevocable. No se podrán recuperar las historias borradas.
              </div>
            </div>

            <div className="space-y-2">
              <label className={`block text-xs font-bold ${isClean ? 'text-[#2A2118]' : 'text-[#F4EFE3]'}`}>
                Escribe <span className="text-[#A4332A] font-mono font-black">ELIMINAR</span> para confirmar:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Escribe ELIMINAR"
                className={`w-full border rounded-xl px-3.5 py-2 text-sm focus:border-[#A4332A] outline-none font-mono tracking-wider ${
                  isClean
                    ? 'bg-[#F4EFE3] border-[#E5DCB8] text-[#A4332A]'
                    : 'bg-[#1F1913] border-[#42362B] text-rose-300'
                }`}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteAccountModal(false)}
                className={`px-4 py-2 border text-xs font-semibold rounded-xl cursor-pointer ${
                  isClean ? 'bg-[#F4EFE3] hover:bg-[#E5DCB8] text-[#2A2118] border-[#E5DCB8]' : 'bg-[#1F1913] hover:bg-[#382E25] text-[#F4EFE3] border-[#42362B]'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAccountDeletion}
                disabled={deleteConfirmationText.trim().toUpperCase() !== 'ELIMINAR' || isDeletingAccount}
                className="px-5 py-2 bg-[#A4332A] hover:bg-[#8B2A22] text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer"
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
