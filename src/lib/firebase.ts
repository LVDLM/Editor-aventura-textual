import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  updateProfile,
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

export async function createOrUpdateUserProfile(
  uid: string, 
  email: string, 
  displayName: string, 
  role: UserRole = 'author'
): Promise<UserProfile> {
  const existing = await getUserProfile(uid);
  const normalizedEmail = (email || auth.currentUser?.email || '').toLowerCase().trim();
  const isAdminEmail = ADMIN_EMAILS.some((adminE) => {
    const normAdmin = adminE.toLowerCase().trim();
    return normAdmin === normalizedEmail || normalizedEmail.includes('lavozdelosmuertos');
  });

  let finalRole: UserRole = role;
  if (isAdminEmail || role === 'admin') {
    finalRole = 'admin';
  } else if (existing) {
    finalRole = existing.role;
  }

  const finalEmail = email || auth.currentUser?.email || (isAdminEmail ? 'lavozdelosmuertos@gmail.com' : `${uid.substring(0, 6)}@lector.com`);

  const profile: UserProfile = {
    uid,
    email: finalEmail,
    displayName: displayName || auth.currentUser?.displayName || finalEmail.split('@')[0] || 'Lector',
    role: finalRole,
    createdAt: existing ? existing.createdAt : new Date().toISOString()
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

  const currentPubVersion = existingData?.publishedVersion || 0;
  let publishedData = existingData?.publishedData || null;
  let publishedVersion = existingData?.publishedVersion || (status === 'published' ? 1 : null);
  let publishedAt = existingData?.publishedAt || null;
  let hasUnpublishedChanges = existingData?.hasUnpublishedChanges || false;

  if (status === 'published') {
    publishedData = projectData; // Create live snapshot
    publishedVersion = currentPubVersion + 1;
    publishedAt = now;
    hasUnpublishedChanges = false;
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
    status: status,
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
  const authorName = newAuthor.displayName || newAuthor.email.split('@')[0] || 'Autor';

  const updatePayload: Record<string, any> = {
    authorId: newAuthor.uid,
    authorName: authorName,
    authorEmail: newAuthor.email,
    updatedAt: new Date().toISOString()
  };

  if (data.projectData) {
    updatePayload.projectData = {
      ...data.projectData,
      author: authorName
    };
  }
  if (data.publishedData) {
    updatePayload.publishedData = {
      ...data.publishedData,
      author: authorName
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
export async function consolidateAdminProfilesInFirestore(primaryUid?: string): Promise<{
  updatedCount: number;
  reassignedProjectsCount: number;
  primaryProfile: UserProfile | null;
}> {
  try {
    const allUsers = await getAllUsersForAdmin();
    const adminEmail = 'lavozdelosmuertos@gmail.com';
    const targetEmailLower = adminEmail.toLowerCase();

    // Find all user documents matching lavozdelosmuertos@gmail.com or admin emails
    const matchingUsers = allUsers.filter((u) => {
      const uEmail = (u.email || '').toLowerCase().trim();
      return uEmail === targetEmailLower || uEmail.includes('lavozdelosmuertos');
    });

    if (matchingUsers.length === 0) {
      return { updatedCount: 0, reassignedProjectsCount: 0, primaryProfile: null };
    }

    // Determine primary user:
    // 1. If primaryUid is provided and exists among matchingUsers, use it
    // 2. Otherwise pick non-anonymous / real account (e.g. named "Urdimbre" or customized)
    // 3. Fallback to the first matching user
    let primaryUser = matchingUsers.find((u) => u.uid === primaryUid);
    if (!primaryUser) {
      primaryUser =
        matchingUsers.find(
          (u) =>
            u.displayName &&
            u.displayName !== 'Administrador' &&
            u.displayName !== 'Usuario Lector'
        ) || matchingUsers[0];
    }

    let updatedCount = 0;
    let reassignedProjectsCount = 0;

    if (primaryUser) {
      // Ensure primary user profile has role 'admin' in Firestore
      if (primaryUser.role !== 'admin') {
        const userRef = doc(db, 'users', primaryUser.uid);
        await updateDoc(userRef, { role: 'admin', email: adminEmail });
        primaryUser.role = 'admin';
        updatedCount++;
      }

      // Reassign stories/projects authored by secondary duplicate profiles to primary user
      for (const duplicateUser of matchingUsers) {
        if (duplicateUser.uid !== primaryUser.uid) {
          const count = await reassignAllProjectsFromAuthorByAdmin(duplicateUser.uid, {
            uid: primaryUser.uid,
            displayName: primaryUser.displayName || 'Urdimbre',
            email: adminEmail,
          });
          reassignedProjectsCount += count;
          // Clean up duplicate user document from Firestore
          try {
            await deleteDoc(doc(db, 'users', duplicateUser.uid));
            updatedCount++;
          } catch (e) {
            console.warn(`Could not delete duplicate user doc ${duplicateUser.uid}:`, e);
          }
        }
      }
    }

    return { updatedCount, reassignedProjectsCount, primaryProfile: primaryUser };
  } catch (err) {
    console.error('Error consolidating admin profiles:', err);
    return { updatedCount: 0, reassignedProjectsCount: 0, primaryProfile: null };
  }
}
