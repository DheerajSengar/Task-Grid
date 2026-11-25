import { AccountManager } from '@/services/accountManager';
import { auth } from '@/services/firebase';
import { AuthUser } from '@/types/user';
import {
  AuthError,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';

export { AuthUser };

export function formatEmailToDisplayName(email: string | null): string {
  if (!email) return 'User';
  const prefix = email.split('@')[0];
  if (!prefix) return 'User';

  const lower = prefix.toLowerCase();
  // Specifically detect dheerajsengar
  if (lower.includes('dheeraj') && lower.includes('sengar')) {
    return 'Dheeraj Sengar';
  }

  // Remove trailing numbers (e.g. dheerajsengar2004 -> dheerajsengar, john123 -> john)
  const noNumbers = prefix.replace(/\d+$/, '');

  // Split on dots, underscores, dashes
  const parts = noNumbers.split(/[._-]+/).filter(Boolean);
  if (parts.length > 0) {
    return parts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(' ');
  }

  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}

function mapFirebaseUser(user: User | null, customDisplayName?: string | null): AuthUser | null {
  if (!user) return null;
  const resolvedName =
    customDisplayName?.trim() ||
    user.displayName?.trim() ||
    (user.isAnonymous ? 'Guest User' : formatEmailToDisplayName(user.email));

  return {
    uid: user.uid,
    email: user.email,
    displayName: resolvedName,
    photoURL: user.photoURL || null,
    isAnonymous: user.isAnonymous,
  };
}

export function formatAuthError(error: any): string {
  const code = (error as AuthError)?.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. If you forgot your password, tap "Forgot Password?" to reset it, or switch to "Sign Up" to create an account.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please switch to "Sign In" above to log in, or reset your password.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later or reset your password.';
    default:
      return error?.message || 'Authentication failed. Please check your credentials and try again.';
  }
}

export const AuthService = {
  /**
   * Updates current user's display name
   */
  async updateDisplayName(name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Please enter a valid name.');
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: trimmed });
    }
  },

  /**
   * Signs in a user with email & password
   */
  async signIn(email: string, password: string): Promise<AuthUser> {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    await AccountManager.saveAccountPassword(email, password);
    const mapped = mapFirebaseUser(cred.user);
    if (!mapped) throw new Error('Could not resolve user session.');
    return mapped;
  },

  /**
   * Creates a new user account with email, password, and optional display name
   */
  async signUp(email: string, password: string, displayName?: string): Promise<AuthUser> {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await AccountManager.saveAccountPassword(email, password);
    if (displayName?.trim() && cred.user) {
      try {
        await updateProfile(cred.user, { displayName: displayName.trim() });
      } catch (err) {
        console.warn('Could not update display name:', err);
      }
    }
    const mapped = mapFirebaseUser(cred.user);
    if (!mapped) throw new Error('Could not resolve user session.');
    return mapped;
  },

  /**
   * Sends password reset email
   */
  async sendPasswordReset(email: string): Promise<void> {
    const trimmed = email.trim();
    if (!trimmed) {
      throw new Error('Please enter your email address to receive a password reset link.');
    }
    await sendPasswordResetEmail(auth, trimmed);
  },

  /**
   * Signs out the current user safely
   */
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Firebase signOut caught:', err);
    }
  },

  /**
   * Realtime listener for authentication state changes
   */
  subscribeAuth(callback: (user: AuthUser | null) => void): () => void {
    return onAuthStateChanged(auth, (firebaseUser) => {
      callback(mapFirebaseUser(firebaseUser));
    });
  },

  /**
   * Returns currently signed-in user snapshot
   */
  getCurrentUser(): AuthUser | null {
    return mapFirebaseUser(auth.currentUser);
  },
};
