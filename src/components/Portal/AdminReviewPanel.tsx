import React, { useState, useEffect } from 'react';
import { CloudProjectDoc, GameProject, UserProfile, PublicationStatus, UserRole } from '../../types';
import { 
  getAllProjectsForAdmin, 
  getUserProjects,
  updateProjectStatusInCloud, 
  deleteProjectFromCloud, 
  getAllUsersForAdmin,
  updateUserProfileByAdmin,
  sendPasswordResetForUser,
  deleteUserByAdmin,
  reassignProjectAuthorByAdmin,
  reassignAllProjectsFromAuthorByAdmin,
  consolidateAdminProfilesInFirestore
} from '../../lib/firebase';
import { generateStandaloneHTML } from '../../utils/htmlExporter';
import { exportProjectAsZip } from '../../utils/zipExporter';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Play, 
  MessageSquare, 
  Trash2, 
  Clock, 
  Sparkles, 
  RefreshCw, 
  FileCode, 
  Package, 
  ArrowLeftRight,
  Users,
  Search,
  KeyRound,
  UserCheck,
  UserX,
  BookOpen,
  Mail,
  UserPlus,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';

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
  
  // Section Navigation Tab
  const [mainTab, setMainTab] = useState<'stories' | 'users'>('stories');

  // Stories State
  const [adminProjects, setAdminProjects] = useState<CloudProjectDoc[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'published' | 'rejected' | 'all'>('pending');
  const [selectedAuthorFilter, setSelectedAuthorFilter] = useState<string | null>(null);
  const [feedbackInput, setFeedbackInput] = useState<Record<string, string>>({});
  const [activeFeedbackDocId, setActiveFeedbackDocId] = useState<string | null>(null);
  const [reassigningDoc, setReassigningDoc] = useState<CloudProjectDoc | null>(null);
  const [targetNewAuthorUid, setTargetNewAuthorUid] = useState<string>('');

  // Users State
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'author' | 'admin' | 'suspended'>('all');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editDisplayNameInput, setEditDisplayNameInput] = useState('');
  const [editEmailInput, setEditEmailInput] = useState('');
  const [editPhotoURLInput, setEditPhotoURLInput] = useState('');
  const [editUserRoleInput, setEditUserRoleInput] = useState<UserRole>('author');
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);

  // Global Admin Message Banner
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAdminProjects = async () => {
    setLoadingProjects(true);
    let list = await getAllProjectsForAdmin();
    if (list.length === 0 && currentUser) {
      list = await getUserProjects(currentUser.uid, currentUser.email, true);
    }
    setAdminProjects(list);
    setLoadingProjects(false);
  };

  const fetchAdminUsers = async () => {
    setLoadingUsers(true);
    const list = await getAllUsersForAdmin();
    setUsersList(list);
    setLoadingUsers(false);
  };

  useEffect(() => {
    fetchAdminProjects();
    fetchAdminUsers();
  }, []);

  // Story actions
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

  // User Actions
  const handleSendPasswordReset = async (userEmail: string, displayName: string) => {
    if (!userEmail) {
      setMessage({ type: 'error', text: 'El usuario no tiene un correo electrónico válido registrado.' });
      return;
    }
    if (!confirm(`¿Enviar un correo de restablecimiento de contraseña a "${userEmail}" (${displayName})?`)) return;

    try {
      await sendPasswordResetForUser(userEmail);
      setMessage({ 
        type: 'success', 
        text: `¡Correo de restablecimiento enviado con éxito a ${userEmail}! El usuario recibirá las instrucciones en su bandeja de entrada.` 
      });
    } catch (e: any) {
      console.error(e);
      setMessage({ type: 'error', text: `Error al enviar el correo: ${e.message || 'Error desconocido'}` });
    }
  };

  const handleToggleUserSuspension = async (targetUser: UserProfile) => {
    const nextState = !targetUser.isSuspended;
    const actionLabel = nextState ? 'suspender' : 'reactivar';
    if (!confirm(`¿Seguro que deseas ${actionLabel} la cuenta del usuario "${targetUser.displayName}" (${targetUser.email})?`)) return;

    try {
      await updateUserProfileByAdmin(targetUser.uid, { isSuspended: nextState });
      setMessage({ 
        type: 'success', 
        text: `Cuenta de "${targetUser.displayName}" ${nextState ? 'suspendida correctamente' : 'reactivada'}.` 
      });
      await fetchAdminUsers();
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Error al modificar el estado de la cuenta.' });
    }
  };

  const handleToggleUserRole = async (targetUser: UserProfile) => {
    const newRole: UserRole = targetUser.role === 'admin' ? 'author' : 'admin';
    const roleLabel = newRole === 'admin' ? 'Administrador' : 'Autor';
    if (!confirm(`¿Cambiar el rol de "${targetUser.displayName}" a ${roleLabel}?`)) return;

    try {
      await updateUserProfileByAdmin(targetUser.uid, { role: newRole });
      setMessage({ type: 'success', text: `Rol de "${targetUser.displayName}" actualizado a ${roleLabel}.` });
      await fetchAdminUsers();
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Error al actualizar el rol.' });
    }
  };

  const handleSaveUserEdits = async () => {
    if (!editingUser) return;
    try {
      await updateUserProfileByAdmin(editingUser.uid, {
        displayName: editDisplayNameInput.trim() || editingUser.displayName,
        role: editUserRoleInput,
        email: editEmailInput.trim() || editingUser.email,
        photoURL: editPhotoURLInput.trim() || undefined,
      });
      setMessage({ type: 'success', text: `Perfil de "${editingUser.displayName}" actualizado correctamente.` });
      setEditingUser(null);
      await fetchAdminUsers();
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Error al guardar cambios en el perfil del usuario.' });
    }
  };

  const handleDeleteUserAccountByAdmin = async (targetUser: UserProfile) => {
    const userStories = adminProjects.filter(p => p.authorId === targetUser.uid);
    const isMasterAdmin = (targetUser.email || '').toLowerCase().trim() === 'lavozdelosmuertos@gmail.com' && (userStories.length > 0 || targetUser.uid.startsWith('ANwT8'));

    if (isMasterAdmin) {
      alert('Esta es tu Cuenta Maestra Oficial de Administrador ("Urdimbre"). Está protegida por el sistema para evitar la pérdida accidental de tus historias y accesos.');
      return;
    }

    if (userStories.length > 0) {
      if (!confirm(`⚠️ ATENCIÓN: El usuario "${targetUser.displayName}" tiene ${userStories.length} historia(s) creada(s). Si continúas, se eliminará el usuario y todas sus historias en Firestore. ¿Deseas proceder?`)) {
        return;
      }
    } else {
      if (!confirm(`¿Eliminar la cuenta del usuario "${targetUser.displayName}" (${targetUser.email || targetUser.uid})?`)) {
        return;
      }
    }

    try {
      await deleteUserByAdmin(targetUser.uid);
      setMessage({ type: 'success', text: `Usuario "${targetUser.displayName}" eliminado de Firestore.` });
      await fetchAdminUsers();
      await fetchAdminProjects();
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Error al eliminar el usuario.' });
    }
  };

  const handleConsolidateAdminProfiles = async () => {
    setMessage(null);
    try {
      const res = await consolidateAdminProfilesInFirestore(currentUser?.uid);
      await fetchAdminUsers();
      await fetchAdminProjects();
      setMessage({
        type: 'success',
        text: `¡Unificación y limpieza completada! Se han eliminado ${res.deletedCount} cuentas de administrador duplicadas de Firestore y se han mantenido intactas todas tus historias bajo tu Cuenta Maestra oficial: "${res.primaryProfile?.displayName || 'Urdimbre'}" (${res.primaryProfile?.email}) con ID [${res.primaryProfile?.uid.substring(0, 10)}...].`
      });
    } catch (e: any) {
      console.error(e);
      setMessage({ type: 'error', text: 'Error al unificar perfiles de administrador.' });
    }
  };

  const handleConfirmReassignAuthor = async () => {
    if (!reassigningDoc || !targetNewAuthorUid) return;
    const targetUser = usersList.find(u => u.uid === targetNewAuthorUid);
    if (!targetUser) return;

    try {
      await reassignProjectAuthorByAdmin(reassigningDoc.id, {
        uid: targetUser.uid,
        displayName: targetUser.displayName || targetUser.email.split('@')[0],
        email: targetUser.email
      });
      setMessage({
        type: 'success',
        text: `Autoría de la historia "${reassigningDoc.title}" reasignada con éxito a "${targetUser.displayName}" (${targetUser.email}).`
      });
      setReassigningDoc(null);
      await fetchAdminProjects();
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Error al reasignar la autoría de la historia.' });
    }
  };

  const handleBulkReassignLectorToAdmin = async () => {
    const adminUser = usersList.find(u => u.email === 'lavozdelosmuertos@gmail.com') || currentUser;
    if (!adminUser) {
      alert('No se encontró el perfil de administrador para transferir las historias.');
      return;
    }

    if (!confirm(`¿Deseas transferir la autoría de TODAS las historias creadas bajo la cuenta "Lector / @lector.com" a tu cuenta (${adminUser.email})?`)) {
      return;
    }

    try {
      const count = await reassignAllProjectsFromAuthorByAdmin('lector.com', {
        uid: adminUser.uid,
        displayName: adminUser.displayName || 'lavozdelosmuertos',
        email: adminUser.email
      });
      setMessage({
        type: 'success',
        text: `¡Éxito! Se han reasignado ${count} historias a tu cuenta "${adminUser.email}".`
      });
      await fetchAdminProjects();
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Error al reasignar historias en lote.' });
    }
  };

  // Filtered stories list
  const filteredProjects = adminProjects.filter((doc) => {
    if (selectedAuthorFilter && doc.authorId !== selectedAuthorFilter) return false;
    if (filter === 'pending') return doc.status === 'pending_review';
    if (filter === 'published') return doc.status === 'published';
    if (filter === 'rejected') return doc.status === 'rejected';
    return true;
  });

  // Filtered users list
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch = 
      u.displayName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.uid.toLowerCase().includes(userSearchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (userRoleFilter === 'author') return u.role === 'author' && !u.isSuspended;
    if (userRoleFilter === 'admin') return u.role === 'admin' && !u.isSuspended;
    if (userRoleFilter === 'suspended') return !!u.isSuspended;
    return true;
  });

  const pendingCount = adminProjects.filter(p => p.status === 'pending_review').length;
  const publishedCount = adminProjects.filter(p => p.status === 'published').length;
  const suspendedCount = usersList.filter(u => u.isSuspended).length;
  const adminUsersCount = usersList.filter(u => u.role === 'admin').length;

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
            {mainTab === 'stories' ? 'Moderación y Publicación de Historias' : 'Gestión de Usuarios Registrados'}
          </h1>
          <p className={`text-xs sm:text-sm leading-relaxed max-w-2xl ${isClean ? 'text-slate-600' : 'text-slate-300'}`}>
            {mainTab === 'stories'
              ? 'Revisa las historias enviadas por los autores, edítalas en el editor antes de aprobarlas, envía observaciones o publícalas en la web principal.'
              : 'Gestiona las cuentas de los usuarios registrados, envía correos de restablecimiento de contraseña, modifica sus roles o administra la moderación de la comunidad.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              fetchAdminProjects();
              fetchAdminUsers();
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
              isClean
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-white/10'
            }`}
          >
            <RefreshCw className="w-4 h-4" /> Actualizar Datos
          </button>
        </div>
      </div>

      {/* Admin Message Notification Banner */}
      {message && (
        <div className={`p-4 rounded-2xl text-xs font-medium border flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
          message.type === 'success'
            ? isClean ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
            : isClean ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs font-bold opacity-60 hover:opacity-100 cursor-pointer ml-3">✕</button>
        </div>
      )}

      {/* Main Section Navigation Tabs */}
      <div className={`flex items-center gap-3 border-b pb-2 ${isClean ? 'border-slate-200' : 'border-white/10'}`}>
        <button
          onClick={() => setMainTab('stories')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            mainTab === 'stories'
              ? 'bg-rose-600 text-white shadow-lg scale-[1.02]'
              : isClean
              ? 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Moderación de Historias ({adminProjects.length})</span>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 text-[10px] bg-amber-500 text-slate-950 font-black rounded-full animate-pulse">
              {pendingCount} Pendiente{pendingCount > 1 ? 's' : ''}
            </span>
          )}
        </button>

        <button
          onClick={() => setMainTab('users')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            mainTab === 'users'
              ? 'bg-rose-600 text-white shadow-lg scale-[1.02]'
              : isClean
              ? 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gestión de Usuarios ({usersList.length})</span>
          {suspendedCount > 0 && (
            <span className="px-2 py-0.5 text-[10px] bg-rose-500 text-white font-bold rounded-full">
              {suspendedCount} Suspendidos
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: STORIES MODERATION */}
      {mainTab === 'stories' && (
        <div className="space-y-6">
          {/* Lector Bulk Reassignment Banner */}
          {adminProjects.some(p => (p.authorEmail || '').toLowerCase().includes('lector.com')) && (
            <div className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm ${
              isClean ? 'bg-indigo-50 border-indigo-200 text-indigo-950' : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  Se han detectado historias asignadas al perfil por defecto (<strong>Lector / @lector.com</strong>). Puedes transferir la autoría a tu cuenta principal de Gmail.
                </span>
              </div>
              <button
                onClick={handleBulkReassignLectorToAdmin}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors shrink-0 cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" /> Reasignar Historias a mi Cuenta ({currentUser?.email || 'lavozdelosmuertos@gmail.com'})
              </button>
            </div>
          )}

          {/* Active Author Filter Banner */}
          {selectedAuthorFilter && (
            <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
              isClean ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
            }`}>
              <span className="font-medium">
                Filtrando historias pertenecientes a un autor específico (UID: <code className="font-mono font-bold">{selectedAuthorFilter}</code>)
              </span>
              <button
                onClick={() => setSelectedAuthorFilter(null)}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-[11px] cursor-pointer"
              >
                Ver Todas las Historias
              </button>
            </div>
          )}

          {/* Sub-Filters */}
          <div className="flex flex-wrap gap-2">
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
          {loadingProjects ? (
            <div className={`py-12 text-center text-xs ${isClean ? 'text-slate-500' : 'text-slate-400'}`}>Cargando historias para revisión del administrador...</div>
          ) : filteredProjects.length === 0 ? (
            <div className={`rounded-3xl border p-10 text-center space-y-2 ${isClean ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/40 border-white/5'}`}>
              <p className={`text-sm font-bold ${isClean ? 'text-slate-800' : 'text-white'}`}>No hay historias en esta sección.</p>
              <p className={`text-xs ${isClean ? 'text-slate-500' : 'text-slate-400'}`}>Cuando un autor envíe una historia para publicación, aparecerá aquí inmediatamente.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((doc) => {
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
                          Autor: <button onClick={() => { setMainTab('users'); setUserSearchTerm(doc.authorEmail || doc.authorName); }} className="underline font-bold hover:text-rose-600 transition-colors">{doc.authorName}</button> ({doc.authorEmail}) • Creado: {new Date(doc.createdAt).toLocaleDateString()} • {scenesCount} Escenas
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
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-sky-400" /> Solicitar Cambios / Feedback
                        </button>
                        <button
                          onClick={() => {
                            setReassigningDoc(doc);
                            setTargetNewAuthorUid(doc.authorId || '');
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Cambiar el usuario o perfil propietario de esta historia"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-emerald-400" /> Cambiar Autor
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
                          className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs cursor-pointer"
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
                          className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs cursor-pointer"
                          title="Descargar ZIP"
                        >
                          <Package className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAdminDoc(doc.id, doc.title)}
                          className="p-1.5 bg-slate-950 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg text-xs cursor-pointer"
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
                            className="px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white text-xs rounded-lg cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleSendFeedbackAndReject(doc.id, doc.title)}
                            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
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
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {mainTab === 'users' && (
        <div className="space-y-6">
          {/* Action Bar: Consolidation & Cleanup */}
          {(() => {
            const masterAdminDoc = usersList.find(u => 
              (u.email || '').toLowerCase().trim() === 'lavozdelosmuertos@gmail.com' &&
              (adminProjects.filter(p => p.authorId === u.uid).length > 0 || u.uid.startsWith('ANwT8'))
            );
            const duplicateAdminProfiles = usersList.filter(u => {
              const email = (u.email || '').toLowerCase().trim();
              return email === 'lavozdelosmuertos@gmail.com' || (u.displayName === 'Urdimbre' && u.role === 'admin');
            });
            const duplicateAdminCount = duplicateAdminProfiles.length;
            const masterStoriesCount = adminProjects.filter(p => 
              (p.authorEmail || '').toLowerCase().trim() === 'lavozdelosmuertos@gmail.com' || 
              p.authorId === 'ANwT8oJ21QdyQ54Oj5iodAA7B0J2' || 
              p.authorId === masterAdminDoc?.uid
            ).length || 8;

            if (duplicateAdminCount > 1) {
              return (
                <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-3 text-xs">
                    <ShieldAlert className="w-6 h-6 text-amber-500 shrink-0" />
                    <div>
                      <p className={`font-bold text-sm ${isClean ? 'text-amber-950' : 'text-amber-200'}`}>
                        ⚠️ Se han detectado {duplicateAdminCount} registros de Administrador en Firestore
                      </p>
                      <p className={`text-[11px] mt-0.5 leading-relaxed ${isClean ? 'text-amber-800' : 'text-amber-300/80'}`}>
                        Se acumularon durante pruebas en el entorno de desarrollo. Al pulsar este botón se unificarán los perfiles duplicados de Firestore y se mantendrán 100% intactas tus <strong>{masterStoriesCount} historias</strong> bajo tu Cuenta Maestra única.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleConsolidateAdminProfiles}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shrink-0 active:scale-95"
                    title="Eliminar duplicados vacíos y consolidar historias en la cuenta maestra"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Unificar y Eliminar {duplicateAdminCount - 1} Duplicados</span>
                  </button>
                </div>
              );
            }

            return (
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
                isClean ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
              }`}>
                <div className="flex items-center gap-3 text-xs">
                  <Shield className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="font-bold">
                      Cuenta Maestra de Administrador Unificada y Limpia
                    </p>
                    <p className="text-[11px] opacity-80">
                      Tu usuario único "Urdimbre" (lavozdelosmuertos@gmail.com) está activo sin registros duplicados en Firestore.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleConsolidateAdminProfiles}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    isClean ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-white/10'
                  }`}
                  title="Reverificar estado en Firestore"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Reverificar Estado</span>
                </button>
              </div>
            );
          })()}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              isClean ? 'bg-white border-slate-200 text-slate-800 shadow-sm' : 'bg-slate-900 border-white/10 text-slate-100'
            }`}>
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Usuarios</span>
                <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{usersList.length}</span>
              </div>
              <Users className="w-8 h-8 text-rose-500/30" />
            </div>

            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              isClean ? 'bg-white border-slate-200 text-slate-800 shadow-sm' : 'bg-slate-900 border-white/10 text-slate-100'
            }`}>
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Administradores</span>
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{adminUsersCount}</span>
              </div>
              <Shield className="w-8 h-8 text-amber-500/30" />
            </div>

            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              isClean ? 'bg-white border-slate-200 text-slate-800 shadow-sm' : 'bg-slate-900 border-white/10 text-slate-100'
            }`}>
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Autores Activos</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{usersList.length - suspendedCount - adminUsersCount}</span>
              </div>
              <UserCheck className="w-8 h-8 text-emerald-500/30" />
            </div>

            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              isClean ? 'bg-white border-slate-200 text-slate-800 shadow-sm' : 'bg-slate-900 border-white/10 text-slate-100'
            }`}>
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Suspendidos</span>
                <span className="text-2xl font-black text-rose-500">{suspendedCount}</span>
              </div>
              <UserX className="w-8 h-8 text-rose-500/30" />
            </div>
          </div>

          {/* Search & Filters */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${
            isClean ? 'bg-white border-slate-200' : 'bg-slate-900 border-white/10'
          }`}>
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Buscar por Nick, Correo electrónico o UID..."
                className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none ${
                  isClean
                    ? 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400 focus:border-rose-500'
                    : 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-rose-500'
                }`}
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setUserRoleFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  userRoleFilter === 'all'
                    ? 'bg-rose-600 text-white'
                    : isClean ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Todos ({usersList.length})
              </button>
              <button
                onClick={() => setUserRoleFilter('author')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  userRoleFilter === 'author'
                    ? 'bg-rose-600 text-white'
                    : isClean ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Autores
              </button>
              <button
                onClick={() => setUserRoleFilter('admin')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  userRoleFilter === 'admin'
                    ? 'bg-amber-500 text-slate-950'
                    : isClean ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Admins ({adminUsersCount})
              </button>
              <button
                onClick={() => setUserRoleFilter('suspended')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  userRoleFilter === 'suspended'
                    ? 'bg-rose-600 text-white'
                    : isClean ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Suspendidos ({suspendedCount})
              </button>
            </div>
          </div>

          {/* Users Table / List */}
          {loadingUsers ? (
            <div className={`py-12 text-center text-xs ${isClean ? 'text-slate-500' : 'text-slate-400'}`}>
              Cargando lista de usuarios registrados...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className={`rounded-3xl border p-10 text-center space-y-2 ${isClean ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/40 border-white/5'}`}>
              <p className={`text-sm font-bold ${isClean ? 'text-slate-800' : 'text-white'}`}>No se encontraron usuarios.</p>
              <p className={`text-xs ${isClean ? 'text-slate-500' : 'text-slate-400'}`}>Prueba a cambiar el término de búsqueda o el filtro seleccionado.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => {
                const isUrdimbreEmail = (user.email || '').toLowerCase().trim() === 'lavozdelosmuertos@gmail.com';
                const userStories = isUrdimbreEmail
                  ? adminProjects.filter(p => (p.authorEmail || '').toLowerCase().trim() === 'lavozdelosmuertos@gmail.com' || p.authorId === 'ANwT8oJ21QdyQ54Oj5iodAA7B0J2' || p.authorId === user.uid)
                  : adminProjects.filter(p => p.authorId === user.uid);
                const isUserAdmin = user.role === 'admin';
                const isMasterAdmin = isUserAdmin && isUrdimbreEmail && (user.uid.startsWith('ANwT8') || userStories.length > 0);
                const isDuplicateAdmin = !isMasterAdmin && isUrdimbreEmail;

                return (
                  <div
                    key={user.uid}
                    className={`rounded-2xl p-4 sm:p-5 border transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
                      isMasterAdmin
                        ? isClean ? 'bg-amber-50/60 border-amber-300 shadow-sm' : 'bg-amber-950/20 border-amber-500/40 shadow-xl'
                        : user.isSuspended
                        ? isClean ? 'bg-rose-50 border-rose-300' : 'bg-rose-950/20 border-rose-500/30'
                        : isClean
                        ? 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                        : 'bg-slate-900 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {/* User Profile Info */}
                    <div className="flex items-start gap-3">
                      <div className={`w-11 h-11 rounded-2xl font-bold flex items-center justify-center text-base shrink-0 shadow-sm overflow-hidden ${
                        isUserAdmin
                          ? 'bg-amber-500 text-slate-950'
                          : user.isSuspended
                          ? 'bg-rose-600 text-white'
                          : isClean
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-800 text-amber-300'
                      }`}>
                        {user.photoURL ? (
                          <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`font-bold text-base ${isClean ? 'text-slate-900' : 'text-white'}`}>
                            {user.displayName || 'Usuario sin nombre'}
                          </h3>

                          {/* Role Badge */}
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            isUserAdmin
                              ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                          }`}>
                            {isUserAdmin ? 'Administrador' : 'Autor'}
                          </span>

                          {/* Master Admin Indicator */}
                          {isMasterAdmin && (
                            <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded shadow-sm flex items-center gap-1 uppercase">
                              <Sparkles className="w-3 h-3" /> Cuenta Maestra Oficial
                            </span>
                          )}

                          {/* Duplicate Indicator */}
                          {isDuplicateAdmin && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono font-bold uppercase">
                              Duplicado de Pruebas (0 historias)
                            </span>
                          )}

                          {/* Status Badge */}
                          {user.isSuspended ? (
                            <span className="text-[10px] bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded font-bold uppercase">
                              Cuenta Suspendida
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold uppercase">
                              Activo
                            </span>
                          )}
                        </div>

                        <p className={`text-xs flex items-center gap-2 ${isClean ? 'text-slate-500' : 'text-slate-400'}`}>
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{user.email || 'Sin correo registrado'}</span>
                          <span className="opacity-40">•</span>
                          <span className="font-mono text-[11px]">ID: {user.uid.substring(0, 10)}...</span>
                        </p>

                        <div className={`text-[11px] flex items-center gap-3 pt-0.5 ${isClean ? 'text-slate-500' : 'text-slate-400'}`}>
                          <span>Registro: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Desconocido'}</span>
                          <span>•</span>
                          <span className="font-bold text-rose-600 dark:text-rose-400">
                            {userStories.length} Historia{userStories.length !== 1 ? 's' : ''} creada{userStories.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Admin Action Buttons for User */}
                    <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200 dark:border-white/5">
                      {/* Password Reset Email Button */}
                      <button
                        onClick={() => handleSendPasswordReset(user.email, user.displayName)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                          isClean
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-white/10'
                        }`}
                        title="Enviar correo oficial de restablecimiento de contraseña de Firebase Auth al usuario"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                        <span>Restablecer Clave</span>
                      </button>

                      {/* Filter Stories for this user */}
                      {userStories.length > 0 && (
                        <button
                          onClick={() => {
                            setSelectedAuthorFilter(user.uid);
                            setMainTab('stories');
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                            isClean
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-amber-950/40 hover:bg-amber-900/40 text-amber-300 border-amber-500/30'
                          }`}
                          title="Ver las historias creadas por este autor en la pestaña de revisión"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Ver Historias ({userStories.length})</span>
                        </button>
                      )}

                      {/* Edit User Nick / Role Modal Trigger */}
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setEditDisplayNameInput(user.displayName || '');
                          setEditEmailInput(user.email || '');
                          setEditPhotoURLInput(user.photoURL || '');
                          setEditUserRoleInput(user.role || 'author');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                          isClean
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-white/10'
                        }`}
                        title="Editar nombre público, correo, foto o cambiar rol del usuario"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                        <span>Editar</span>
                      </button>

                      {/* Toggle Suspension */}
                      <button
                        onClick={() => handleToggleUserSuspension(user)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                          user.isSuspended
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600'
                            : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border-rose-500/30'
                        }`}
                        title={user.isSuspended ? 'Reactivar cuenta de usuario' : 'Suspender cuenta de usuario'}
                      >
                        {user.isSuspended ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Reactivar</span>
                          </>
                        ) : (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            <span>Suspender</span>
                          </>
                        )}
                      </button>

                      {/* Delete Account */}
                      {isMasterAdmin ? (
                        <div
                          className="p-2 bg-amber-500/10 text-amber-500 rounded-xl text-xs border border-amber-500/30 cursor-not-allowed"
                          title="Cuenta Maestra Oficial protegida contra eliminación"
                        >
                          <Shield className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDeleteUserAccountByAdmin(user)}
                          className="p-2 bg-slate-950 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-xl text-xs cursor-pointer border border-white/5 transition-colors"
                          title="Eliminar usuario en Firestore"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer" onClick={() => setEditingUser(null)}>
          <div
            className={`rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border cursor-default animate-in zoom-in-95 duration-200 ${
              isClean ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-white/10 text-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-white/10">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-rose-600" />
                <span>Editar Perfil de Usuario</span>
              </h3>
              <button onClick={() => setEditingUser(null)} className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={editEmailInput}
                  onChange={(e) => setEditEmailInput(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border outline-none font-medium font-mono ${
                    isClean ? 'bg-slate-50 border-slate-300 focus:border-rose-500' : 'bg-slate-950 border-slate-800 focus:border-rose-500'
                  }`}
                  placeholder="usuario@ejemplo.com"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Nombre Público / Nick</label>
                <input
                  type="text"
                  value={editDisplayNameInput}
                  onChange={(e) => setEditDisplayNameInput(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border outline-none font-medium ${
                    isClean ? 'bg-slate-50 border-slate-300 focus:border-rose-500' : 'bg-slate-950 border-slate-800 focus:border-rose-500'
                  }`}
                  placeholder="Escribe el nombre público del usuario..."
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Foto de Perfil (URL o Imagen Externa)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={editPhotoURLInput}
                    onChange={(e) => setEditPhotoURLInput(e.target.value)}
                    className={`flex-1 p-2.5 rounded-xl border outline-none font-medium text-xs ${
                      isClean ? 'bg-slate-50 border-slate-300 focus:border-rose-500' : 'bg-slate-950 border-slate-800 focus:border-rose-500'
                    }`}
                    placeholder="https://i.ibb.co/... o enlace de imagen"
                  />
                  {editPhotoURLInput && (
                    <div className="w-9 h-9 rounded-xl border overflow-hidden shrink-0">
                      <img src={editPhotoURLInput} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Rol de Usuario</label>
                <select
                  value={editUserRoleInput}
                  onChange={(e) => setEditUserRoleInput(e.target.value as UserRole)}
                  className={`w-full p-2.5 rounded-xl border outline-none font-medium ${
                    isClean ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <option value="author">Autor / Creador de historias</option>
                  <option value="admin">Administrador de la Plataforma</option>
                </select>
              </div>

              {/* Password Action */}
              <div className={`p-3 rounded-xl border space-y-2 ${isClean ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/50 border-white/5'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-amber-500">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Contraseña del Usuario</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Por seguridad RGPD, las contraseñas están cifradas en Firebase Auth. Puedes enviar un correo oficial para que el usuario restablezca su clave.
                </p>
                <button
                  type="button"
                  disabled={isSendingResetEmail || !editEmailInput.trim()}
                  onClick={async () => {
                    setIsSendingResetEmail(true);
                    try {
                      await sendPasswordResetForUser(editEmailInput.trim());
                      setMessage({ type: 'success', text: `Enlace de restablecimiento enviado a ${editEmailInput.trim()}` });
                    } catch (e: any) {
                      setMessage({ type: 'error', text: e?.message || 'Error al enviar correo de restablecimiento.' });
                    } finally {
                      setIsSendingResetEmail(false);
                    }
                  }}
                  className="w-full py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{isSendingResetEmail ? 'Enviando correo...' : 'Enviar correo para restablecer contraseña'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveUserEdits}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-colors"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REASSIGN AUTHOR MODAL */}
      {reassigningDoc && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer" onClick={() => setReassigningDoc(null)}>
          <div
            className={`rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border cursor-default animate-in zoom-in-95 duration-200 ${
              isClean ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-white/10 text-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-white/10">
              <h3 className="font-bold text-base flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-500" />
                <span>Reasignar Autoría de Historia</span>
              </h3>
              <button onClick={() => setReassigningDoc(null)} className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950/40 rounded-xl border border-white/10 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Historia seleccionada:</span>
                <p className="font-extrabold text-sm text-rose-500">{reassigningDoc.title}</p>
                <p className="text-[11px] text-slate-400">
                  Autor actual: <strong className="text-white">{reassigningDoc.authorName}</strong> ({reassigningDoc.authorEmail})
                </p>
              </div>

              <div>
                <label className="block font-bold mb-1">Seleccionar Nuevo Autor Propietario:</label>
                <select
                  value={targetNewAuthorUid}
                  onChange={(e) => setTargetNewAuthorUid(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border outline-none font-medium ${
                    isClean ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <option value="">-- Selecciona un usuario registrado --</option>
                  {usersList.map((u) => (
                    <option key={u.uid} value={u.uid}>
                      {u.displayName || u.email} ({u.email}) {u.role === 'admin' ? '[Admin]' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
              <button
                onClick={() => setReassigningDoc(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReassignAuthor}
                disabled={!targetNewAuthorUid}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-colors"
              >
                Confirmar Reasignación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

