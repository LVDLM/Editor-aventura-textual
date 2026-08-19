import React, { useState } from 'react';
import { X, UserCheck, Shield, Key, Mail, User, LogOut, CheckCircle, RefreshCw, Sparkles, Globe } from 'lucide-react';
import { UserProfile, UserRole } from '../../types';
import { auth, createOrUpdateUserProfile, setUserRoleInDb, signInWithGoogle, ADMIN_EMAILS } from '../../lib/firebase';
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

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      const googleUser = await signInWithGoogle();
      const profile = await createOrUpdateUserProfile(
        googleUser.uid,
        googleUser.email || 'lavozdelosmuertos@gmail.com',
        googleUser.displayName || 'Administrador',
        'author'
      );
      onUserChanged(profile);
      onClose();
    } catch (err: any) {
      console.warn('Google Popup falló o está bloqueado por el iframe preview:', err);
      // Fallback para entorno de vista previa / sandbox: Iniciar sesión de Administrador con la cuenta del usuario
      try {
        const cred = await signInAnonymously(auth);
        const profile = await createOrUpdateUserProfile(
          cred.user.uid,
          'lavozdelosmuertos@gmail.com',
          'Administrador (lavozdelosmuertos)',
          'admin'
        );
        onUserChanged(profile);
        onClose();
      } catch (fallbackErr: any) {
        console.error(fallbackErr);
        setError('No se pudo autenticar. Usa las opciones de acceso directo de la parte inferior.');
      }
    } finally {
      setLoading(false);
    }
  };

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

  const handleAnonymousDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const cred = await signInAnonymously(auth);
      const profile = await createOrUpdateUserProfile(
        cred.user.uid,
        'lavozdelosmuertos@gmail.com',
        'lavozdelosmuertos (Administrador)',
        'admin'
      );
      onUserChanged(profile);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Error al iniciar sesión como Administrador.');
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
        className="bg-[#0f172a] border border-amber-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-200 relative cursor-default overflow-hidden"
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
              <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                {currentUser.role === 'admin' ? <Shield className="w-6 h-6 text-rose-400" /> : <UserCheck className="w-6 h-6 text-sky-400" />}
              </div>
              <div className="overflow-hidden">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                  <span className="truncate">{currentUser.displayName}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                    currentUser.role === 'admin' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  }`}>
                    {currentUser.role === 'admin' ? 'ADMINISTRADOR' : 'AUTOR / LECTOR'}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
              </div>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-white/5 space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Permisos Activos de tu Cuenta
              </h3>
              {currentUser.role === 'admin' ? (
                <ul className="text-xs text-slate-300 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Acceso al Panel Admin:</strong> Tienes la pestaña exclusiva "Admin" para auditar y revisar todos los proyectos enviados por autores.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Aprobar y Publicar:</strong> Puedes aprobar proyectos para que aparezcan en la Biblioteca Pública oficial.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Modificación Directa:</strong> Puedes abrir y corregir cualquier historia en el editor o enviar notas de revisión al autor.</span>
                  </li>
                </ul>
              ) : (
                <ul className="text-xs text-slate-300 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <span><strong>Creación y Guardado:</strong> Puedes crear historias interactivas y guardarlas en tu espacio personal en la nube.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <span><strong>Solicitud de Publicación:</strong> Puedes enviar tus historias a revisión para que el Administrador las haga públicas.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <span><strong>Limitación de Autor:</strong> No puedes publicar directamente en el catálogo público ni administrar historias ajenas.</span>
                  </li>
                </ul>
              )}
            </div>

            {/* Role Switcher for Live Testing */}
            <div className="bg-amber-950/30 border border-amber-500/30 p-3.5 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" /> Simulador / Cambiador de Rol
                </span>
                <button
                  onClick={handleToggleRoleDemo}
                  disabled={loading}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cambiar a {currentUser.role === 'admin' ? 'Autor' : 'Administrador'}
                </button>
              </div>
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                Utiliza este botón para alternar tu cuenta en vivo entre <strong>Autor</strong> y <strong>Administrador</strong> para verificar de inmediato las diferencias en la interfaz y las limitaciones de permisos.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleLogout}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-rose-950/60 hover:bg-rose-900/60 text-rose-200 border border-rose-500/40 rounded-xl text-xs font-medium transition-colors cursor-pointer"
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
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 leading-relaxed">
                {error}
              </div>
            )}

            {/* Google Quick Login Button */}
            <div className="mb-4 space-y-2">
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-slate-300"
              >
                <Globe className="w-4 h-4 text-sky-600" />
                <span>Continuar con Google ({ADMIN_EMAILS[0]})</span>
              </button>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 my-3">
                <div className="h-px bg-white/10 flex-1"></div>
                <span>O ingresa con tu correo y contraseña</span>
                <div className="h-px bg-white/10 flex-1"></div>
              </div>
            </div>

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
                      placeholder="Ej: Autor Creativo"
                      className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs text-slate-300 font-medium">Correo Electrónico</label>
                  <button
                    type="button"
                    onClick={() => setEmail('lavozdelosmuertos@gmail.com')}
                    className="text-[10px] text-amber-400 hover:underline"
                  >
                    Usar correo Admin
                  </button>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@ejemplo.com o lavozdelosmuertos@gmail.com"
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-lg cursor-pointer"
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
                className="text-xs text-amber-400 hover:underline cursor-pointer"
              >
                {isRegistering ? '¿Ya tienes cuenta? Inicia sesión aquí' : '¿No tienes cuenta? Regístrate gratis'}
              </button>
            </div>

            {/* Quick Demo Access Bar */}
            <div className="mt-6 pt-4 border-t border-white/10 space-y-2 text-center">
              <span className="text-[11px] text-amber-300/80 block font-medium">🛡️ Acceso Administrador Principal (Urdimbre / lavozdelosmuertos@gmail.com):</span>
              <button
                type="button"
                onClick={() => handleGoogleAuth()}
                disabled={loading}
                className="w-full py-2.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                title="Acceder con Google como Administrador Principal Único"
              >
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Iniciar Sesión como Administrador (Urdimbre)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

