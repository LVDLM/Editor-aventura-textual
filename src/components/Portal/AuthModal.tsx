import React, { useState } from 'react';
import { X, UserCheck, Shield, Key, Mail, User, LogOut, CheckCircle, RefreshCw } from 'lucide-react';
import { UserProfile, UserRole } from '../../types';
import { auth, createOrUpdateUserProfile, setUserRoleInDb } from '../../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInAnonymously } from 'firebase/auth';

interface AuthModalProps {
  currentUser: UserProfile | null;
  onClose: () => void;
  onUserChanged: (user: UserProfile | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ currentUser, onClose, onUserChanged }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('author');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegistering) {
        if (!email || !password) {
          throw new Error('Por favor completa todos los campos requeridos.');
        }
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const profile = await createOrUpdateUserProfile(
          userCred.user.uid,
          userCred.user.email || email,
          displayName || email.split('@')[0],
          selectedRole
        );
        onUserChanged(profile);
      } else {
        if (!email || !password) {
          throw new Error('Por favor ingresa tu correo y contraseña.');
        }
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        const profile = await createOrUpdateUserProfile(
          userCred.user.uid,
          userCred.user.email || email,
          userCred.user.displayName || email.split('@')[0],
          'author'
        );
        onUserChanged(profile);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error durante la autenticación.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousDemoLogin = async (roleToUse: UserRole = 'author') => {
    setError(null);
    setLoading(true);
    try {
      const cred = await signInAnonymously(auth);
      const name = roleToUse === 'admin' ? 'Administrador Demo' : 'Autor Registrado';
      const fakeEmail = roleToUse === 'admin' ? 'admin@plataforma.com' : 'autor@plataforma.com';
      const profile = await createOrUpdateUserProfile(
        cred.user.uid,
        fakeEmail,
        name,
        roleToUse
      );
      onUserChanged(profile);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Error al iniciar sesión de demostración.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRoleDemo = async () => {
    if (!currentUser) return;
    setLoading(true);
    const newRole: UserRole = currentUser.role === 'admin' ? 'author' : 'admin';
    try {
      await setUserRoleInDb(currentUser.uid, newRole);
      const updated = { ...currentUser, role: newRole };
      onUserChanged(updated);
    } catch (err: any) {
      console.error(err);
      setError('No se pudo actualizar el rol.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      onUserChanged(null);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-[#0f172a] border border-amber-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-200 relative cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {currentUser ? (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                {currentUser.role === 'admin' ? <Shield className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{currentUser.displayName}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${
                    currentUser.role === 'admin' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  }`}>
                    {currentUser.role === 'admin' ? 'ADMINISTRADOR' : 'AUTOR / USUARIO'}
                  </span>
                </h2>
                <p className="text-xs text-slate-400">{currentUser.email}</p>
              </div>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-white/5 space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Permisos de tu cuenta</h3>
              {currentUser.role === 'admin' ? (
                <ul className="text-xs text-slate-300 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Publicar historias directamente en la web principal.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Revisar, editar o rechazar las historias enviadas por autores.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Mantener y modificar cualquier historia en desarrollo.</span>
                  </li>
                </ul>
              ) : (
                <ul className="text-xs text-slate-300 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Crear y mantener múltiples historias guardadas en la nube.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Solicitar la publicación de tus historias para revisión del administrador.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Descargar los archivos HTML/ZIP de tus historias en cualquier momento.</span>
                  </li>
                </ul>
              )}
            </div>

            {/* Quick Role Switcher for Demo Evaluation */}
            <div className="bg-amber-950/30 border border-amber-500/30 p-3.5 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" /> Probador de Roles (Demo)
                </span>
                <button
                  onClick={handleToggleRoleDemo}
                  disabled={loading}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors"
                >
                  Cambiar a {currentUser.role === 'admin' ? 'Autor' : 'Administrador'}
                </button>
              </div>
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                Usa este botón para alternar tu rol al instante y probar tanto la perspectiva del <strong>Autor</strong> como del <strong>Administrador</strong>.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleLogout}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-rose-950/60 hover:bg-rose-900/60 text-rose-200 border border-rose-500/40 rounded-xl text-xs font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-amber-500/30">
                <Key className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Acceso a la Plataforma</h2>
              <p className="text-xs text-slate-400 mt-1">
                {isRegistering
                  ? 'Crea tu cuenta de autor para guardar y solicitar publicación de historias.'
                  : 'Ingresa a tu cuenta para gestionar tus aventuras narrativas.'}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {isRegistering && (
                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Nombre o Apodo</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Ej: Laura Cuentacuentos"
                      className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@ejemplo.com"
                    required
                    className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Contraseña</label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              {isRegistering && (
                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Tipo de Cuenta</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('author')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                        selectedRole === 'author'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      <span>Autor (Creador)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('admin')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                        selectedRole === 'admin'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                          : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Shield className="w-4 h-4" />
                      <span>Administrador</span>
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-lg"
              >
                {loading ? 'Cargando...' : isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError(null);
                }}
                className="text-xs text-amber-400 hover:underline"
              >
                {isRegistering ? '¿Ya tienes cuenta? Inicia sesión aquí' : '¿No tienes cuenta? Regístrate gratis'}
              </button>
            </div>

            {/* Quick Demo Access Bar */}
            <div className="mt-6 pt-4 border-t border-white/10 space-y-2 text-center">
              <span className="text-[11px] text-slate-400 block font-medium">Acceso Rápido de Demostración:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleAnonymousDemoLogin('author')}
                  disabled={loading}
                  className="py-2 px-3 bg-sky-950/60 hover:bg-sky-900/60 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <User className="w-3.5 h-3.5" /> Entrar como Autor
                </button>
                <button
                  type="button"
                  onClick={() => handleAnonymousDemoLogin('admin')}
                  disabled={loading}
                  className="py-2 px-3 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Shield className="w-3.5 h-3.5" /> Entrar como Admin
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
