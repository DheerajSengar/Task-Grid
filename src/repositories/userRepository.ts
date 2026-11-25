import { AccountManager, SavedAccount } from '@/services/accountManager';
import { FirestoreService, UserCloudProfile } from '@/services/firestoreService';
import { StorageService } from '@/services/storageService';
import { AuthUser } from '@/types/user';

export interface IUserRepository {
  getSavedAccounts(): Promise<SavedAccount[]>;
  recordAccount(user: AuthUser): Promise<void>;
  removeAccount(uid: string): Promise<SavedAccount[]>;
  getUserAvatar(uid: string): Promise<string | null>;
  saveUserAvatar(uid: string, avatarUri: string): Promise<void>;
  subscribeUserProfile(
    uid: string,
    onProfileChanged: (profile: UserCloudProfile) => void
  ): () => void;
}

class UserRepositoryImpl implements IUserRepository {
  async getSavedAccounts(): Promise<SavedAccount[]> {
    return await AccountManager.getSavedAccounts();
  }

  async recordAccount(user: AuthUser): Promise<void> {
    await AccountManager.recordAccount(user);
  }

  async removeAccount(uid: string): Promise<SavedAccount[]> {
    return await AccountManager.removeAccount(uid);
  }

  async getUserAvatar(uid: string): Promise<string | null> {
    const local = await StorageService.getUserAvatar(uid);
    if (local) return local;

    if (uid && !uid.startsWith('guest_')) {
      try {
        const cloudProfile = await FirestoreService.getUserProfile(uid);
        if (cloudProfile?.avatarUrl) {
          await StorageService.uploadUserAvatar(uid, cloudProfile.avatarUrl);
          return cloudProfile.avatarUrl;
        }
      } catch (err) {
        console.warn('[UserRepository] Could not fetch cloud avatar:', err);
      }
    }
    return null;
  }

  async saveUserAvatar(uid: string, avatarUri: string): Promise<void> {
    // 1. Local avatar storage
    await StorageService.uploadUserAvatar(uid, avatarUri);

    // 2. Cloud Firestore profile sync
    if (!uid.startsWith('guest_')) {
      try {
        await FirestoreService.saveUserProfile(uid, { avatarUrl: avatarUri });
      } catch (err) {
        console.warn('[UserRepository] Cloud avatar sync failed:', err);
      }
    }
  }

  subscribeUserProfile(
    uid: string,
    onProfileChanged: (profile: UserCloudProfile) => void
  ): () => void {
    if (!uid || uid.startsWith('guest_')) {
      return () => {};
    }
    return FirestoreService.subscribeUserProfile(uid, onProfileChanged);
  }
}

export const UserRepository = new UserRepositoryImpl();
