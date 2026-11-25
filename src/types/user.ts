export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  isAnonymous: boolean;
}

export interface SavedAccount {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  isAnonymous: boolean;
  lastActive: number; // timestamp
}

export interface UserProfile {
  displayName?: string;
  avatarUrl?: string;
  email?: string;
  bio?: string;
}
