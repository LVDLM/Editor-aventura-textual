import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  updateProfile,
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
import { UserProfile, CloudProjectDoc, GameProject, UserRole } from '../types';

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
      // Auto-assign admin if email matches designated admin list
      if (data.email && ADMIN_EMAILS.includes(data.email.toLowerCase().trim()) && data.role !== 'admin') {
        data.role = 'admin';
        await setDoc(userRef, { role: 'admin' }, { merge: true });
      }
      return data;
    }
  } catch (e) {
    console.error('Error fetching user profile:', e);
  }
  return null;
}

export async function createOrUpdateUserProfile(
  uid: string, 
  email: string, 
  displayName: string, 
  role: UserRole = 'author'
): Promise<UserProfile> {
  const existing = await getUserProfile(uid);
  const normalizedEmail = (email || '').toLowerCase().trim();
  const isAdminEmail = ADMIN_EMAILS.includes(normalizedEmail);

  let finalRole: UserRole = existing ? existing.role : role;
  if (isAdminEmail) {
    finalRole = 'admin';
  }

  const profile: UserProfile = {
    uid,
    email: email || `${uid.substring(0, 6)}@lector.com`,
    displayName: displayName || email.split('@')[0] || 'Lector',
    role: finalRole,
    createdAt: existing ? existing.createdAt : new Date().toISOString()
  };

  await setDoc(doc(db, 'users', uid), profile, { merge: true });
  return profile;
}

export async function setUserRoleInDb(uid: string, role: UserRole): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { role });
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

/**
 * Fetch all published projects for the public portal
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
      list.push({ id: docSnap.id, ...docSnap.data() } as CloudProjectDoc);
    });
    // Sort client-side in case index isn't ready
    return list.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  } catch (err) {
    console.error('Error fetching published projects:', err);
    return [];
  }
}

/**
 * Fetch projects authored by a specific user
 */
export async function getUserProjects(authorId: string): Promise<CloudProjectDoc[]> {
  try {
    const q = query(
      collection(db, 'projects'),
      where('authorId', '==', authorId)
    );
    const snap = await getDocs(q);
    const list: CloudProjectDoc[] = [];
    snap.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as CloudProjectDoc);
    });
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
 * Save or update a project document in Cloud Firestore
 */
export async function saveProjectToCloud(
  docId: string | null,
  projectData: GameProject,
  author: { uid: string; displayName: string; email: string },
  status: 'draft' | 'pending_review' | 'published' = 'draft',
  reviewFeedback: string = ''
): Promise<string> {
  const now = new Date().toISOString();
  const idToUse = docId || projectData.id || `proj_${Date.now()}`;
  const ref = doc(db, 'projects', idToUse);
  
  const existingSnap = await getDoc(ref);
  const existingData = existingSnap.exists() ? (existingSnap.data() as CloudProjectDoc) : null;

  const docPayload: Record<string, any> = {
    id: idToUse,
    title: projectData.title || 'Sin Título',
    description: projectData.description || '',
    authorId: author.uid,
    authorName: projectData.author || author.displayName || 'Autor Anónimo',
    authorEmail: author.email || '',
    status: status,
    allowDownload: projectData.allowDownload ?? existingData?.allowDownload ?? false,
    projectData: projectData,
    updatedAt: now,
    createdAt: existingData?.createdAt || now,
    reviewFeedback: reviewFeedback || existingData?.reviewFeedback || '',
    publishedAt: status === 'published' ? (existingData?.publishedAt || now) : (existingData?.publishedAt || null)
  };

  // Sanitize object to remove any 'undefined' properties which cause Firestore setDoc to fail
  const sanitizedPayload = JSON.parse(JSON.stringify(docPayload));

  await setDoc(ref, sanitizedPayload, { merge: true });
  return idToUse;
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
  const updateData: any = {
    status,
    updatedAt: new Date().toISOString()
  };
  if (status === 'published') {
    updateData.publishedAt = new Date().toISOString();
  }
  if (feedback !== undefined) {
    updateData.reviewFeedback = feedback;
  }
  await updateDoc(ref, updateData);
}

/**
 * Delete a project from cloud
 */
export async function deleteProjectFromCloud(docId: string): Promise<void> {
  const ref = doc(db, 'projects', docId);
  await deleteDoc(ref);
}
