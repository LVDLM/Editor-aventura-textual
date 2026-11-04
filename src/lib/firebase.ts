import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  updateProfile,
  updateEmail,
  updatePassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, CloudProjectDoc, GameProject, UserRole, SoundDefinition, PublicationStatus } from '../types';
import { DEFAULT_SOUND_LIBRARY, setGlobalSoundLibrary } from '../utils/audio';

// Designated Admin Emails
export const ADMIN_EMAILS = ['lavozdelosmuertos@gmail.com', 'admin@plataforma.com'];

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use the explicit firestoreDatabaseId from configuration if present
const databaseId = (firebaseConfig as any).firestoreDatabaseId || undefined;
export const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);

export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

// Profile Helper
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      const currentAuthEmail = (auth.currentUser?.email || '').toLowerCase().trim();
      const docEmail = (data.email || '').toLowerCase().trim();
      const effectiveEmail = currentAuthEmail || docEmail;

      const isAdminEmail = ADMIN_EMAILS.some((adminE) => {
        const normAdmin = adminE.toLowerCase().trim();
        return normAdmin === effectiveEmail || normAdmin === currentAuthEmail || normAdmin === docEmail || effectiveEmail.includes('lavozdelosmuertos');
      });

      let needsUpdate = false;
      const updatePayload: Partial<UserProfile> = {};

      if (currentAuthEmail && currentAuthEmail !== docEmail) {
        data.email = currentAuthEmail;
        updatePayload.email = currentAuthEmail;
        needsUpdate = true;
      }

      if (isAdminEmail && data.role !== 'admin') {
        data.role = 'admin';
        updatePayload.role = 'admin';
        needsUpdate = true;
      }

      const isGenericName = !data.displayName || 
        ['administrador', 'usuario', 'lector', 'lavozdelosmuertos', 'urdimbre (administrador)', 'lavozdelosmuertos (administrador)'].includes(data.displayName.toLowerCase().trim()) ||
        data.displayName.toLowerCase().includes('administrador') ||
        data.displayName.toLowerCase().includes('usuario');

      if (isAdminEmail && isGenericName) {
        data.displayName = 'Urdimbre';
        updatePayload.displayName = 'Urdimbre';
        needsUpdate = true;
      }

      // Preserve custom profile picture: Only set photoURL from auth.currentUser if data.photoURL is empty.
      // If data.photoURL is already set by the user (custom upload or link), NEVER overwrite with Google's avatar!
      if (!data.photoURL && auth.currentUser?.photoURL) {
        data.photoURL = auth.currentUser.photoURL;
        updatePayload.photoURL = auth.currentUser.photoURL;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await setDoc(userRef, updatePayload, { merge: true });
      }

      return data;
    }
  } catch (e) {
    console.error('Error fetching user profile:', e);
  }
  return null;
}

/**
 * Retrieves the primary/master admin user profile for lavozdelosmuertos@gmail.com (e.g., 'Urdimbre' with 6 stories)
 */
export async function getMasterAdminProfile(): Promise<UserProfile | null> {
  try {
    const q = query(collection(db, 'users'), where('email', '==', 'lavozdelosmuertos@gmail.com'));
    const snap = await getDocs(q);
    if (snap.empty) {
      // Fallback: check all users
      const allUsers = await getAllUsersForAdmin();
      const match = allUsers.find(u => (u.email || '').toLowerCase().includes('lavozdelosmuertos') || u.displayName === 'Urdimbre');
      return match || null;
    }

    const matchingUsers: UserProfile[] = [];
    snap.forEach((d) => matchingUsers.push({ uid: d.id, ...d.data() } as UserProfile));

    if (matchingUsers.length === 1) return matchingUsers[0];

    // If multiple documents exist in Firestore, prioritize the master account that has stories (or starts with ANwT8)
    const allProjects = await getAllProjectsForAdmin();
    let bestUser = matchingUsers[0];
    let maxStories = -1;

    for (const u of matchingUsers) {
      const storyCount = allProjects.filter((p) => p.authorId === u.uid).length;
      if (storyCount > maxStories || (storyCount === maxStories && u.uid.startsWith('ANwT8'))) {
        maxStories = storyCount;
        bestUser = u;
      }
    }
    return bestUser;
  } catch (e) {
    console.error('Error fetching master admin profile:', e);
    return null;
  }
}

export async function createOrUpdateUserProfile(
  uid: string, 
  email: string, 
  displayName: string, 
  role: UserRole = 'author'
): Promise<UserProfile> {
  const normalizedEmail = (email || auth.currentUser?.email || '').toLowerCase().trim();
  const isAdminEmail = ADMIN_EMAILS.some((adminE) => {
    const normAdmin = adminE.toLowerCase().trim();
    return normAdmin === normalizedEmail || normalizedEmail.includes('lavozdelosmuertos');
  });

  // If this is the administrator identity, ensure we NEVER spawn duplicate documents for transient/test UIDs
  if (isAdminEmail) {
    const master = await getMasterAdminProfile();
    if (master) {
      if (master.uid === uid) {
        // We are logged in as the master UID: update master doc cleanly
        const updatedMaster: UserProfile = {
          ...master,
          role: 'admin',
          displayName: master.displayName || 'Urdimbre',
          email: 'lavozdelosmuertos@gmail.com',
        };
        await setDoc(doc(db, 'users', uid), updatedMaster, { merge: true });
        return updatedMaster;
      }
      // If current session is a temporary/test UID, do NOT create a new document in 'users'!
      // Return the persistent master profile to avoid cluttering Firestore.
      return master;
    }
  }

  const existing = await getUserProfile(uid);

  let finalRole: UserRole = role;
  if (isAdminEmail || role === 'admin') {
    finalRole = 'admin';
  } else if (existing) {
    finalRole = existing.role;
  }

  const finalEmail = email || auth.currentUser?.email || (isAdminEmail ? 'lavozdelosmuertos@gmail.com' : `${uid.substring(0, 6)}@lector.com`);

  let finalDisplayName = displayName || existing?.displayName || auth.currentUser?.displayName || (isAdminEmail ? 'Urdimbre' : finalEmail.split('@')[0]);
  const isGeneric = !finalDisplayName ||
    ['administrador', 'usuario', 'lector', 'lavozdelosmuertos', 'urdimbre (administrador)', 'lavozdelosmuertos (administrador)'].includes(finalDisplayName.toLowerCase().trim()) ||
    finalDisplayName.toLowerCase().includes('administrador') ||
    finalDisplayName.toLowerCase().includes('usuario');

  if (isAdminEmail && (isGeneric || !existing?.displayName)) {
    finalDisplayName = 'Urdimbre';
  }

  // Preserve custom photo: If existing profile already has a photoURL, keep it; do NOT let Google overwrite it!
  const finalPhotoURL = existing?.photoURL || auth.currentUser?.photoURL || undefined;

  const profile: UserProfile = {
    uid,
    email: finalEmail,
    displayName: finalDisplayName,
    role: finalRole,
    createdAt: existing ? existing.createdAt : new Date().toISOString(),
    ...(finalPhotoURL ? { photoURL: finalPhotoURL } : {})
  };

  try {
    await setDoc(doc(db, 'users', uid), profile, { merge: true });
  } catch (e) {
    console.error('Error setting user profile:', e);
  }
  return profile;
}

export async function setUserRoleInDb(uid: string, role: UserRole): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { role });
}

/**
 * Admin: Fetch all registered users from Firestore
 */
export async function getAllUsersForAdmin(): Promise<UserProfile[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const list: UserProfile[] = [];
    snap.forEach((docSnap) => {
      list.push({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
    });
    return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  } catch (err) {
    console.error('Error fetching all users for admin:', err);
    return [];
  }
}

/**
 * Admin: Update user profile (display name, role, suspended status)
 */
export async function updateUserProfileByAdmin(
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const sanitized = JSON.parse(JSON.stringify(updates));
  await updateDoc(userRef, sanitized);
}

/**
 * Admin: Send password reset email to user's registered address
 */
export async function sendPasswordResetForUser(email: string): Promise<void> {
  if (!email || !email.includes('@')) {
    throw new Error('Dirección de correo electrónico no válida.');
  }
  await sendPasswordResetEmail(auth, email);
}

/**
 * Admin: Delete a user profile and all their projects from Firestore
 */
export async function deleteUserByAdmin(uid: string): Promise<void> {
  const userProjects = await getUserProjects(uid);
  for (const proj of userProjects) {
    try {
      await deleteProjectFromCloud(proj.id);
    } catch (e) {
      console.warn(`Error deleting user project ${proj.id}:`, e);
    }
  }
  const userRef = doc(db, 'users', uid);
  await deleteDoc(userRef);
}

export async function updateUserProfileName(uid: string, newDisplayName: string): Promise<UserProfile> {
  const userRef = doc(db, 'users', uid);
  const trimmed = newDisplayName.trim() || 'Lector';
  await updateDoc(userRef, { displayName: trimmed });
  
  if (auth.currentUser && auth.currentUser.uid === uid) {
    try {
      await updateProfile(auth.currentUser, { displayName: trimmed });
    } catch (e) {
      console.warn('Error updating auth profile:', e);
    }
  }

  const updated = await getUserProfile(uid);
  if (updated) return updated;

  return {
    uid,
    email: auth.currentUser?.email || '',
    displayName: trimmed,
    role: 'author',
    createdAt: new Date().toISOString()
  };
}

/**
 * Update user email address in Firebase Auth and Firestore
 */
export async function updateUserEmail(uid: string, newEmail: string): Promise<UserProfile> {
  const trimmedEmail = newEmail.trim().toLowerCase();
  if (!trimmedEmail || !trimmedEmail.includes('@')) {
    throw new Error('Por favor, introduce un correo electrónico válido.');
  }

  // 1. Update Firebase Auth if current user is logged in
  if (auth.currentUser && auth.currentUser.uid === uid) {
    await updateEmail(auth.currentUser, trimmedEmail);
  }

  // 2. Update Firestore user document
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { email: trimmedEmail });

  const updated = await getUserProfile(uid);
  if (updated) return updated;

  return {
    uid,
    email: trimmedEmail,
    displayName: auth.currentUser?.displayName || 'Lector',
    role: 'author',
    createdAt: new Date().toISOString()
  };
}

/**
 * Update user password in Firebase Auth
 */
export async function updateUserPassword(newPassword: string): Promise<void> {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('La contraseña debe tener un mínimo de 6 caracteres.');
  }
  if (!auth.currentUser) {
    throw new Error('No hay una sesión de usuario activa.');
  }
  await updatePassword(auth.currentUser, newPassword);
}

/**
 * Update user profile photo (photoURL) in Firebase Auth and Firestore
 */
export async function updateUserProfilePhoto(uid: string, photoURL: string): Promise<UserProfile> {
  const trimmed = photoURL.trim();
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { photoURL: trimmed });

  if (auth.currentUser && auth.currentUser.uid === uid) {
    try {
      await updateProfile(auth.currentUser, { photoURL: trimmed });
    } catch (e) {
      console.warn('Error updating auth photo URL:', e);
    }
  }

  const updated = await getUserProfile(uid);
  if (updated) return updated;

  return {
    uid,
    email: auth.currentUser?.email || '',
    displayName: auth.currentUser?.displayName || 'Lector',
    role: 'author',
    photoURL: trimmed,
    createdAt: new Date().toISOString()
  };
}

/**
 * Delete account and all user data (RGPD / GDPR Right to be forgotten)
 */
export async function deleteUserAccountAndData(uid: string): Promise<void> {
  try {
    // 1. Delete user projects from cloud
    const userProjects = await getUserProjects(uid);
    for (const proj of userProjects) {
      try {
        await deleteProjectFromCloud(proj.id);
      } catch (e) {
        console.warn(`Error deleting project ${proj.id}:`, e);
      }
    }

    // 2. Delete user profile doc from Firestore
    const userRef = doc(db, 'users', uid);
    await deleteDoc(userRef);

    // 3. Clear local storage save slots
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('text_adventure_save_slot_')) {
        localStorage.removeItem(key);
      }
    }

    // 4. Delete Firebase Auth user if logged in
    if (auth.currentUser && auth.currentUser.uid === uid) {
      await auth.currentUser.delete();
    }
    await signOut(auth);
  } catch (err) {
    console.error('Error during account deletion:', err);
    throw err;
  }
}

// Projects Cloud Operations

export async function getProjectByIdFromCloud(docId: string): Promise<CloudProjectDoc | null> {
  try {
    const ref = doc(db, 'projects', docId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as CloudProjectDoc;
    }
  } catch (e) {
    console.error('Error fetching project by ID:', e);
  }
  return null;
}

/**
 * Fetch all published projects for the public portal (using published snapshot if present)
 */
export async function getPublishedProjects(): Promise<CloudProjectDoc[]> {
  try {
    const q = query(
      collection(db, 'projects'),
      where('status', '==', 'published')
    );
    const snap = await getDocs(q);
    const list: CloudProjectDoc[] = [];
    snap.forEach((docSnap) => {
      const data = { id: docSnap.id, ...docSnap.data() } as CloudProjectDoc;
      if (data.status === 'published' || data.publishedData) {
        list.push(data);
      }
    });
    // Sort client-side by publishedAt / updatedAt
    return list.sort((a, b) => new Date(b.publishedAt || b.updatedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.updatedAt || a.createdAt).getTime());
  } catch (err) {
    console.error('Error fetching published projects:', err);
    return [];
  }
}

/**
 * Fetch projects authored by a specific user
 */
/**
 * Fetch projects authored by a specific user, with email and admin fallback
 */
export async function getUserProjects(
  authorId: string,
  userEmail?: string,
  isAdmin?: boolean
): Promise<CloudProjectDoc[]> {
  try {
    const list: CloudProjectDoc[] = [];
    const seenIds = new Set<string>();

    const normEmail = (userEmail || '').toLowerCase().trim();
    const isAdminUser = isAdmin || normEmail === 'lavozdelosmuertos@gmail.com' || normEmail.includes('lavozdelosmuertos');

    if (isAdminUser) {
      // For administrator / editorial account, fetch and filter all relevant stories
      const allProjects = await getAllProjectsForAdmin();
      for (const p of allProjects) {
        const pEmail = (p.authorEmail || '').toLowerCase().trim();
        const pAuthorName = (p.authorName || '').toLowerCase().trim();
        const pProjAuthor = (p.projectData?.author || '').toLowerCase().trim();

        const isMine =
          p.authorId === authorId ||
          (normEmail && pEmail === normEmail) ||
          pEmail === 'lavozdelosmuertos@gmail.com' ||
          pAuthorName === 'urdimbre' ||
          pAuthorName.includes('lavozdelosmuertos') ||
          pProjAuthor === 'urdimbre' ||
          p.authorId === 'system_admin_seed' ||
          p.id === 'sample_misterio_habitacion' ||
          p.id === 'el_misterio_de_la_habitacion';

        if (isMine && !seenIds.has(p.id)) {
          seenIds.add(p.id);
          list.push(p);
        }
      }
    } else {
      // Standard author: query by authorId
      const qAuthor = query(
        collection(db, 'projects'),
        where('authorId', '==', authorId)
      );
      const snapAuthor = await getDocs(qAuthor);
      snapAuthor.forEach((docSnap) => {
        if (!seenIds.has(docSnap.id)) {
          seenIds.add(docSnap.id);
          list.push({ id: docSnap.id, ...docSnap.data() } as CloudProjectDoc);
        }
      });

      // Also query by authorEmail if user has an email, recovering projects across logins
      if (normEmail) {
        const qEmail = query(
          collection(db, 'projects'),
          where('authorEmail', '==', normEmail)
        );
        const snapEmail = await getDocs(qEmail);
        snapEmail.forEach((docSnap) => {
          if (!seenIds.has(docSnap.id)) {
            seenIds.add(docSnap.id);
            const data = { id: docSnap.id, ...docSnap.data() } as CloudProjectDoc;
            if (data.authorId !== authorId) {
              try {
                updateDoc(doc(db, 'projects', docSnap.id), { authorId });
              } catch (e) {
                console.warn('Auto-syncing authorId for user project:', e);
              }
            }
            list.push(data);
          }
        });
      }
    }

    return list.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  } catch (err) {
    console.error('Error fetching user projects:', err);
    return [];
  }
}

/**
 * Fetch all projects for admins (all statuses)
 */
export async function getAllProjectsForAdmin(): Promise<CloudProjectDoc[]> {
  try {
    const q = query(collection(db, 'projects'));
    const snap = await getDocs(q);
    const list: CloudProjectDoc[] = [];
    snap.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as CloudProjectDoc);
    });
    return list.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  } catch (err) {
    console.error('Error fetching admin projects:', err);
    return [];
  }
}

/**
 * Save or update a project document in Cloud Firestore.
 * Supports preserving 'published' status when editing drafts so live readers are not interrupted.
 */
export async function saveProjectToCloud(
  docId: string | null,
  projectData: GameProject,
  author: { uid: string; displayName: string; email: string },
  status?: 'draft' | 'pending_review' | 'published' | 'preserve',
  reviewFeedback: string = '',
  publishNewVersion: boolean = false
): Promise<string> {
  const now = new Date().toISOString();
  let idToUse = docId || projectData.id || `proj_${Date.now()}`;
  let ref = doc(db, 'projects', idToUse);
  
  let existingData: CloudProjectDoc | null = null;
  try {
    const existingSnap = await getDoc(ref);
    if (existingSnap.exists()) {
      existingData = existingSnap.data() as CloudProjectDoc;
    }
  } catch (err) {
    console.warn('Checking project doc existence (may be a new project or draft):', err);
  }

  // If the target doc is the default sample game ('el_misterio_de_la_habitacion' or 'sample_misterio_habitacion')
  // and caller is NOT an admin/owner, or if it belongs to another author,
  // assign a fresh project ID so the caller gets their own copy safely.
  const isAdminUser = author.email === 'lavozdelosmuertos@gmail.com' || (author as any).role === 'admin';
  const isTargetDefaultDemo = idToUse === 'el_misterio_de_la_habitacion' || idToUse === 'sample_misterio_habitacion';

  if (
    (!isAdminUser && isTargetDefaultDemo) ||
    (existingData && existingData.authorId && existingData.authorId !== author.uid && !isAdminUser)
  ) {
    idToUse = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    ref = doc(db, 'projects', idToUse);
    existingData = null;
  }

  // Update working projectData with current ID
  projectData.id = idToUse;

  // Determine effective status:
  // If status is 'preserve' or not supplied, keep current status if existing
  let effectiveStatus: PublicationStatus = 'draft';
  if (status === 'preserve' || status === undefined) {
    effectiveStatus = existingData?.status || 'draft';
  } else if (status === 'draft') {
    // If status was already published, and caller specifically asked for 'draft', check if it was explicit hide
    effectiveStatus = 'draft';
  } else {
    effectiveStatus = status;
  }

  const currentPubVersion = existingData?.publishedVersion || 0;
  let publishedData = existingData?.publishedData || null;
  let publishedVersion = existingData?.publishedVersion || (effectiveStatus === 'published' ? 1 : null);
  let publishedAt = existingData?.publishedAt || null;
  let hasUnpublishedChanges = existingData?.hasUnpublishedChanges || false;

  if (effectiveStatus === 'published') {
    if (publishNewVersion || !existingData?.publishedData) {
      // Author / admin is officially publishing or updating the public live snapshot
      publishedData = projectData;
      publishedVersion = currentPubVersion + 1;
      publishedAt = now;
      hasUnpublishedChanges = false;
    } else {
      // "Solo editar (mantener visible)": Keep existing published snapshot live for readers!
      // Only projectData (working draft) gets updated.
      hasUnpublishedChanges = true;
    }
  } else {
    if (existingData?.publishedData) {
      hasUnpublishedChanges = true;
    }
  }

  const docPayload: Record<string, any> = {
    id: idToUse,
    title: projectData.title || 'Sin Título',
    description: projectData.description || '',
    authorId: author.uid,
    authorName: projectData.author || author.displayName || 'Autor Anónimo',
    authorEmail: author.email || '',
    status: effectiveStatus,
    allowDownload: projectData.allowDownload ?? existingData?.allowDownload ?? false,
    projectData: projectData, // Working draft
    updatedAt: now,
    createdAt: existingData?.createdAt || now,
    reviewFeedback: reviewFeedback || existingData?.reviewFeedback || '',
    publishedAt: publishedAt,
    hasUnpublishedChanges: hasUnpublishedChanges,
  };

  if (publishedData) {
    docPayload.publishedData = publishedData;
  }
  if (publishedVersion) {
    docPayload.publishedVersion = publishedVersion;
  }

  // Sanitize object to remove any 'undefined' properties which cause Firestore setDoc to fail
  const sanitizedPayload = JSON.parse(JSON.stringify(docPayload));

  await setDoc(ref, sanitizedPayload, { merge: true });
  return idToUse;
}

/**
 * Toggle project visibility in the public Gallery / Biblioteca.
 * visible: true -> status: 'published' (visible to everyone)
 * visible: false -> status: 'draft' (hidden from public gallery)
 */
export async function toggleProjectVisibilityInGallery(
  docId: string,
  visible: boolean
): Promise<void> {
  const ref = doc(db, 'projects', docId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() as CloudProjectDoc;
  const now = new Date().toISOString();

  if (visible) {
    await updateDoc(ref, {
      status: 'published',
      publishedData: data.publishedData || data.projectData,
      updatedAt: now,
    });
  } else {
    await updateDoc(ref, {
      status: 'draft',
      updatedAt: now,
    });
  }
}

/**
 * Update project status (e.g., publish, reject, submit for review)
 */
export async function updateProjectStatusInCloud(
  docId: string,
  status: 'draft' | 'pending_review' | 'published' | 'rejected',
  feedback: string = ''
): Promise<void> {
  const ref = doc(db, 'projects', docId);
  const snap = await getDoc(ref);
  const existingData = snap.exists() ? (snap.data() as CloudProjectDoc) : null;

  const now = new Date().toISOString();
  const updateData: any = {
    status,
    updatedAt: now
  };

  if (status === 'published') {
    updateData.publishedAt = now;
    if (existingData?.projectData) {
      updateData.publishedData = existingData.projectData;
      updateData.publishedVersion = (existingData.publishedVersion || 0) + 1;
      updateData.hasUnpublishedChanges = false;
    }
  } else if (existingData?.publishedData) {
    updateData.hasUnpublishedChanges = true;
  }

  if (feedback !== undefined) {
    updateData.reviewFeedback = feedback;
  }

  const sanitized = JSON.parse(JSON.stringify(updateData));
  await updateDoc(ref, sanitized);
}

/**
 * Delete a project from cloud
 */
export async function deleteProjectFromCloud(docId: string): Promise<void> {
  const ref = doc(db, 'projects', docId);
  await deleteDoc(ref);
}

/**
 * Admin: Reassign authorship of a single project document in Firestore
 */
export async function reassignProjectAuthorByAdmin(
  docId: string,
  newAuthor: { uid: string; displayName: string; email: string }
): Promise<void> {
  const ref = doc(db, 'projects', docId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data() as CloudProjectDoc;
  const fallbackAuthorName = newAuthor.displayName || newAuthor.email.split('@')[0] || 'Autor';
  const effectiveAuthorName = data.authorName || data.projectData?.author || fallbackAuthorName;

  const updatePayload: Record<string, any> = {
    authorId: newAuthor.uid,
    authorName: effectiveAuthorName,
    authorEmail: newAuthor.email,
    updatedAt: new Date().toISOString()
  };

  if (data.projectData) {
    updatePayload.projectData = {
      ...data.projectData,
      author: data.projectData.author || effectiveAuthorName
    };
  }
  if (data.publishedData) {
    updatePayload.publishedData = {
      ...data.publishedData,
      author: data.publishedData.author || effectiveAuthorName
    };
  }

  const sanitized = JSON.parse(JSON.stringify(updatePayload));
  await updateDoc(ref, sanitized);
}

/**
 * Admin: Bulk reassign all projects matching an email or authorId to a new author profile
 */
export async function reassignAllProjectsFromAuthorByAdmin(
  targetEmailOrId: string,
  newAuthor: { uid: string; displayName: string; email: string }
): Promise<number> {
  const allProjects = await getAllProjectsForAdmin();
  const searchLower = targetEmailOrId.toLowerCase().trim();
  let reassignedCount = 0;

  for (const proj of allProjects) {
    const projEmail = (proj.authorEmail || '').toLowerCase().trim();
    const projId = (proj.authorId || '').toLowerCase().trim();

    if (projEmail === searchLower || projId === searchLower || projEmail.includes(searchLower)) {
      await reassignProjectAuthorByAdmin(proj.id, newAuthor);
      reassignedCount++;
    }
  }

  return reassignedCount;
}

/**
 * Admin: Consolidate duplicate admin profiles in Firestore database.
 * Upgrades the main user profile for lavozdelosmuertos@gmail.com (e.g., 'Urdimbre') to 'admin'
 * and reassigns any projects from temporary/anonymous admin profiles to the primary user profile.
 */
export async function consolidateAdminProfilesInFirestore(activeSessionUid?: string): Promise<{
  updatedCount: number;
  reassignedProjectsCount: number;
  deletedCount: number;
  primaryProfile: UserProfile | null;
}> {
  try {
    const allUsers = await getAllUsersForAdmin();
    const allProjects = await getAllProjectsForAdmin();
    const adminEmail = 'lavozdelosmuertos@gmail.com';
    const targetEmailLower = adminEmail.toLowerCase();

    // Find all user documents matching lavozdelosmuertos@gmail.com or admin emails or Urdimbre
    const matchingUsers = allUsers.filter((u) => {
      const uEmail = (u.email || '').toLowerCase().trim();
      const uName = (u.displayName || '').toLowerCase().trim();
      return uEmail === targetEmailLower || uEmail.includes('lavozdelosmuertos') || (uName === 'urdimbre' && u.role === 'admin');
    });

    if (matchingUsers.length === 0) {
      return { updatedCount: 0, reassignedProjectsCount: 0, deletedCount: 0, primaryProfile: null };
    }

    // 1. IDENTIFY THE TRUE MASTER ACCOUNT:
    // The master account is the account that holds the stories (e.g. ANwT8oJ2lQ... with 6 stories)
    // or has the highest number of created stories.
    let bestCount = -1;
    let masterUser: UserProfile = matchingUsers[0];

    for (const u of matchingUsers) {
      const storiesCount = allProjects.filter((p) => p.authorId === u.uid).length;
      if (storiesCount > bestCount) {
        bestCount = storiesCount;
        masterUser = u;
      } else if (storiesCount === bestCount && u.uid.startsWith('ANwT8')) {
        // Prioritize the known authentic master UID
        masterUser = u;
      }
    }

    // Ensure master account attributes are pristine
    masterUser.role = 'admin';
    masterUser.email = adminEmail;
    masterUser.displayName = 'Urdimbre';

    // Preserve custom uploaded avatar from any matching duplicate if master has none or only google avatar
    if (!masterUser.photoURL || masterUser.photoURL.includes('googleusercontent.com')) {
      const customAvatarDoc = matchingUsers.find(
        (u) => u.photoURL && !u.photoURL.includes('googleusercontent.com')
      );
      if (customAvatarDoc?.photoURL) {
        masterUser.photoURL = customAvatarDoc.photoURL;
      }
    }

    // Save/update the master document in Firestore
    await setDoc(doc(db, 'users', masterUser.uid), masterUser, { merge: true });

    if (auth.currentUser && auth.currentUser.uid === masterUser.uid) {
      try {
        await updateProfile(auth.currentUser, { displayName: 'Urdimbre' });
      } catch (e) {
        console.warn('Could not update auth profile display name:', e);
      }
    }

    let reassignedProjectsCount = 0;
    let deletedCount = 0;

    // 2. PROCESS AND ELIMINATE DUPLICATE DOCUMENTS:
    // For every user document that is NOT the master account:
    // - Reassign any stories/projects it might have to the master account (NEVER LOSE STORIES)
    // - DELETE the duplicate document from Firestore
    for (const dup of matchingUsers) {
      if (dup.uid === masterUser.uid) {
        continue; // NEVER delete the master account!
      }

      // Reassign any projects authored by this duplicate
      const dupProjects = allProjects.filter((p) => p.authorId === dup.uid);
      for (const proj of dupProjects) {
        try {
          await updateDoc(doc(db, 'projects', proj.id), {
            authorId: masterUser.uid,
            authorName: 'Urdimbre',
            authorEmail: adminEmail,
            updatedAt: new Date().toISOString()
          });
          reassignedProjectsCount++;
        } catch (e) {
          console.warn(`Error reassigning project ${proj.id}:`, e);
        }
      }

      // DELETE the duplicate document from Firestore
      try {
        await deleteDoc(doc(db, 'users', dup.uid));
        deletedCount++;
      } catch (e) {
        console.warn(`Error deleting duplicate user ${dup.uid}:`, e);
      }
    }

    return {
      updatedCount: matchingUsers.length,
      reassignedProjectsCount,
      deletedCount,
      primaryProfile: masterUser,
    };
  } catch (err) {
    console.error('Error consolidating admin profiles:', err);
    return { updatedCount: 0, reassignedProjectsCount: 0, deletedCount: 0, primaryProfile: null };
  }
}

/**
 * Global Sound Library management in Firestore.
 * Allows administrators to save, edit, and expand the platform's official sound library,
 * and allows authors to listen and load these sounds in real-time.
 */

export async function fetchGlobalSoundLibraryFromFirestore(): Promise<SoundDefinition[]> {
  try {
    const docRef = doc(db, 'global_settings', 'sound_library');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.sounds) && data.sounds.length > 0) {
        setGlobalSoundLibrary(data.sounds);
        return data.sounds;
      }
    }
  } catch (e) {
    console.warn('Could not fetch global sound library from Firestore, using defaults:', e);
  }
  // Fallback to built-in presets
  setGlobalSoundLibrary(DEFAULT_SOUND_LIBRARY);
  return DEFAULT_SOUND_LIBRARY;
}

export async function saveGlobalSoundLibraryToFirestore(
  sounds: SoundDefinition[],
  adminEmail: string
): Promise<boolean> {
  try {
    const docRef = doc(db, 'global_settings', 'sound_library');
    await setDoc(docRef, {
      sounds,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail || 'admin',
    }, { merge: true });
    setGlobalSoundLibrary(sounds);
    return true;
  } catch (err) {
    console.error('Error saving global sound library to Firestore:', err);
    throw err;
  }
}

export async function resetGlobalSoundLibraryInFirestore(adminEmail: string): Promise<boolean> {
  return saveGlobalSoundLibraryToFirestore(DEFAULT_SOUND_LIBRARY, adminEmail);
}

