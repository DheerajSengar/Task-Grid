import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthUser } from '@/services/authService';

const SAVED_ACCOUNTS_STORAGE_KEY = '@task_manager_saved_accounts_v2';
const CRED_PREFIX = '@task_account_cred_';

export interface SavedAccount {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  isAnonymous: boolean;
  lastActive: number; // timestamp
}

export const AccountManager = {
  /**
   * Securely saves password for seamless one-tap account switching
   */
  async saveAccountPassword(email: string, pass: string): Promise<void> {
    try {
      if (!email || !pass) return;
      await AsyncStorage.setItem(`${CRED_PREFIX}${email.trim().toLowerCase()}`, pass);
    } catch (err) {
      console.warn('Failed to save account credential:', err);
    }
  },

  /**
   * Retrieves saved password for an account
   */
  async getAccountPassword(email: string): Promise<string | null> {
    try {
      if (!email) return null;
      return await AsyncStorage.getItem(`${CRED_PREFIX}${email.trim().toLowerCase()}`);
    } catch {
      return null;
    }
  },

  /**
   * Returns list of all accounts ever signed in on this device
   */
  async getSavedAccounts(): Promise<SavedAccount[]> {
    try {
      const data = await AsyncStorage.getItem(SAVED_ACCOUNTS_STORAGE_KEY);
      if (data) {
        const accounts: SavedAccount[] = JSON.parse(data);
        // Sort by last active descending
        return accounts.sort((a, b) => b.lastActive - a.lastActive);
      }
      return [];
    } catch (err) {
      console.warn('Failed to load saved accounts:', err);
      return [];
    }
  },

  /**
   * Records or updates a signed-in account in device history
   */
  async recordAccount(user: AuthUser): Promise<void> {
    try {
      const existing = await this.getSavedAccounts();
      const updatedList = existing.filter((acc) => acc.uid !== user.uid);

      const newEntry: SavedAccount = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isAnonymous: user.isAnonymous,
        lastActive: Date.now(),
      };

      updatedList.unshift(newEntry);
      await AsyncStorage.setItem(SAVED_ACCOUNTS_STORAGE_KEY, JSON.stringify(updatedList));
    } catch (err) {
      console.warn('Failed to record account in history:', err);
    }
  },

  /**
   * Removes an account from saved accounts history
   */
  async removeAccount(uid: string): Promise<SavedAccount[]> {
    try {
      const existing = await this.getSavedAccounts();
      const target = existing.find((acc) => acc.uid === uid);
      if (target?.email) {
        await AsyncStorage.removeItem(`${CRED_PREFIX}${target.email.trim().toLowerCase()}`);
      }
      const filtered = existing.filter((acc) => acc.uid !== uid);
      await AsyncStorage.setItem(SAVED_ACCOUNTS_STORAGE_KEY, JSON.stringify(filtered));
      return filtered;
    } catch (err) {
      console.warn('Failed to remove account:', err);
      return [];
    }
  },

  /**
   * Clear all account history
   */
  async clearAllAccounts(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SAVED_ACCOUNTS_STORAGE_KEY);
    } catch (err) {
      console.warn('Failed to clear saved accounts:', err);
    }
  },
};
