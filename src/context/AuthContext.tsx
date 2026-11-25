import { AccountManager } from '@/services/accountManager';
import { UserRepository } from '@/repositories/userRepository';
import { AuthService, formatEmailToDisplayName } from '@/services/authService';
import { auth } from '@/services/firebase';
import { FirestoreService } from '@/services/firestoreService';
import { NotificationService } from '@/services/notificationService';
import { AuthUser, SavedAccount } from '@/types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateProfile } from 'firebase/auth';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  savedAccounts: SavedAccount[];
  avatarUrl: string | null;
  updateUserPhoto: (photoUri: string) => Promise<void>;
  updateUserName: (newName: string) => Promise<void>;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name?: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchAccount: (targetIdentifier: string) => Promise<boolean>;
  removeSavedAccount: (uid: string) => Promise<void>;
  refreshSavedAccounts: () => Promise<void>;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  loading: true,
  savedAccounts: [],
  avatarUrl: null,
  updateUserPhoto: async () => { },
  updateUserName: async () => { },
  signIn: async () => { },
  signUp: async () => { },
  sendPasswordReset: async () => { },
  signOut: async () => { },
  switchAccount: async () => false,
  removeSavedAccount: async () => { },
  refreshSavedAccounts: async () => { },
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const isExplicitAuthSwitchRef = useRef<boolean>(false);

  const refreshSavedAccounts = useCallback(async () => {
    try {
      const list = await UserRepository.getSavedAccounts();
      setSavedAccounts(list);
    } catch {
      setSavedAccounts([]);
    }
  }, []);

  useEffect(() => {
    UserRepository.getSavedAccounts()
      .then((list) => {
        setSavedAccounts(list);
      })
      .catch(() => {
        setSavedAccounts([]);
      });

    const unsubscribe = AuthService.subscribeAuth(async (currentUser) => {
      setLoading(false);

      // If an explicit login, signup or switch is currently in progress, do not let listeners race
      if (isExplicitAuthSwitchRef.current) {
        return;
      }

      if (currentUser) {
        // Authoritative Firebase user session: persist active UID
        await AsyncStorage.setItem('@task_manager_active_account_uid', currentUser.uid);

        // Resolve custom display name & avatar
        let resolvedDisplayName = currentUser.displayName;
        try {
          const savedName = await AsyncStorage.getItem(`@task_manager_user_name_${currentUser.uid}`);
          if (savedName?.trim()) {
            resolvedDisplayName = savedName.trim();
          } else if (!resolvedDisplayName && currentUser.email) {
            resolvedDisplayName = formatEmailToDisplayName(currentUser.email);
          }
        } catch {}

        let resolvedAvatar: string | null = null;
        try {
          const savedAvatar = await UserRepository.getUserAvatar(currentUser.uid);
          if (savedAvatar) {
            resolvedAvatar = savedAvatar;
          } else if (currentUser.photoURL && !currentUser.photoURL.startsWith('file://')) {
            resolvedAvatar = currentUser.photoURL;
          }
        } catch {}

        const resolvedUser: AuthUser = {
          ...currentUser,
          displayName: resolvedDisplayName || 'User',
          photoURL: resolvedAvatar,
        };

        setUser(resolvedUser);
        setAvatarUrl(resolvedAvatar);

        // Record in saved accounts history and refresh list
        await UserRepository.recordAccount(resolvedUser);
        const list = await UserRepository.getSavedAccounts();
        setSavedAccounts(list);
      } else {
        // Firebase is offline or signed out: check if local offline account can be restored
        try {
          const activeUid = await AsyncStorage.getItem('@task_manager_active_account_uid');
          if (activeUid && activeUid !== '__pending__' && activeUid !== '__signed_out__') {
            const accounts = await UserRepository.getSavedAccounts();
            const matched = accounts.find((a) => a.uid === activeUid);
            if (matched) {
              const savedName = await AsyncStorage.getItem(`@task_manager_user_name_${matched.uid}`);
              const localUser: AuthUser = {
                uid: matched.uid,
                email: matched.email,
                displayName:
                  savedName?.trim() ||
                  matched.displayName ||
                  (matched.email ? formatEmailToDisplayName(matched.email) : 'User'),
                photoURL: matched.photoURL,
                isAnonymous: matched.isAnonymous,
              };
              setUser(localUser);
              const savedAvatar = await UserRepository.getUserAvatar(matched.uid);
              setAvatarUrl(savedAvatar || matched.photoURL || null);
              return;
            }
          }
        } catch {}
        setUser(null);
        setAvatarUrl(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Per-user profile and avatar synchronization effect
  useEffect(() => {
    let isMounted = true;
    let profileUnsub: (() => void) | undefined;
    const currentUid = user?.uid;
    const userPhoto = user?.photoURL;

    if (!currentUid) {
      queueMicrotask(() => {
        if (isMounted) {
          setAvatarUrl(null);
        }
      });
      return;
    }

    // Always fetch the exact avatar strictly for currentUid
    UserRepository.getUserAvatar(currentUid).then((avatar) => {
      if (!isMounted) return;
      if (avatar) {
        setAvatarUrl(avatar);
      } else if (userPhoto && !userPhoto.startsWith('file://')) {
        setAvatarUrl(userPhoto);
      } else {
        setAvatarUrl(null);
      }
    });

    // Real-time Cloud Firestore Profile Sync strictly for currentUid
    if (!currentUid.startsWith('guest_')) {
      // Auto-register & persist FCM token in Cloud Firestore user profile
      NotificationService.registerFCMForUser(currentUid).catch(() => {});

      try {
        profileUnsub = UserRepository.subscribeUserProfile(
          currentUid,
          (cloudProfile) => {
            if (!isMounted) return;
            if (cloudProfile.avatarUrl) {
              setAvatarUrl(cloudProfile.avatarUrl);
              UserRepository.saveUserAvatar(currentUid, cloudProfile.avatarUrl);
            }
            if (cloudProfile.displayName) {
              setUser((prev) =>
                prev && prev.uid === currentUid
                  ? { ...prev, displayName: cloudProfile.displayName || prev.displayName }
                  : prev
              );
              AsyncStorage.setItem(`@task_manager_user_name_${currentUid}`, cloudProfile.displayName);
            }
          }
        );
      } catch (subErr) {
        console.warn('Could not subscribe to cloud profile:', subErr);
      }
    }

    return () => {
      isMounted = false;
      if (profileUnsub) {
        profileUnsub();
      }
    };
  }, [user?.uid, user?.photoURL]);

  const signIn = useCallback(async (email: string, pass: string) => {
    isExplicitAuthSwitchRef.current = true;
    await AsyncStorage.setItem('@task_manager_active_account_uid', '__pending__');
    try {
      // 1. Cleanly sign out current Firebase session to reset persistence state
      try {
        await AuthService.signOut();
      } catch {}

      // 2. Authenticate the target account fresh
      const authUser = await AuthService.signIn(email, pass);
      await AsyncStorage.setItem('@task_manager_active_account_uid', authUser.uid);
      const userAvatar = await UserRepository.getUserAvatar(authUser.uid);
      const finalAvatar = userAvatar || (authUser.photoURL && !authUser.photoURL.startsWith('file://') ? authUser.photoURL : null);
      setAvatarUrl(finalAvatar);
      const resolvedUser: AuthUser = {
        ...authUser,
        photoURL: finalAvatar,
      };
      setUser(resolvedUser);
      await UserRepository.recordAccount(resolvedUser);
      await refreshSavedAccounts();
    } finally {
      isExplicitAuthSwitchRef.current = false;
    }
  }, [refreshSavedAccounts]);

  const signUp = useCallback(async (email: string, pass: string, name?: string) => {
    isExplicitAuthSwitchRef.current = true;
    await AsyncStorage.setItem('@task_manager_active_account_uid', '__pending__');
    try {
      // 1. Cleanly sign out current Firebase session
      try {
        await AuthService.signOut();
      } catch {}

      // 2. Create target account fresh
      const authUser = await AuthService.signUp(email, pass, name);
      await AsyncStorage.setItem('@task_manager_active_account_uid', authUser.uid);
      setAvatarUrl(null);
      setUser(authUser);
      await UserRepository.recordAccount(authUser);
      await refreshSavedAccounts();
    } finally {
      isExplicitAuthSwitchRef.current = false;
    }
  }, [refreshSavedAccounts]);

  const signOut = useCallback(async () => {
    isExplicitAuthSwitchRef.current = true;
    try {
      await AsyncStorage.setItem('@task_manager_active_account_uid', '__signed_out__');
      await AuthService.signOut();
    } catch (err) {
      console.warn('Error during sign out:', err);
    } finally {
      isExplicitAuthSwitchRef.current = false;
      setUser(null);
      setAvatarUrl(null);
      await refreshSavedAccounts();
    }
  }, [refreshSavedAccounts]);

  const removeSavedAccount = useCallback(async (uid: string) => {
    const activeUid = await AsyncStorage.getItem('@task_manager_active_account_uid');
    if (activeUid === uid) {
      await AsyncStorage.removeItem('@task_manager_active_account_uid');
    }
    const updated = await UserRepository.removeAccount(uid);
    setSavedAccounts(updated);
  }, []);

  const sendPasswordReset = useCallback(async (emailToReset: string) => {
    await AuthService.sendPasswordReset(emailToReset);
  }, []);

  const updateUserPhoto = useCallback(async (photoUri: string) => {
    if (!user) return;
    // 1. Immediately update local state & repository
    setAvatarUrl(photoUri);
    await UserRepository.saveUserAvatar(user.uid, photoUri);
    const updatedUser: AuthUser = { ...user, photoURL: photoUri };
    setUser(updatedUser);
    await UserRepository.recordAccount(updatedUser);
    await refreshSavedAccounts();

    // 2. Update Firebase Auth profile if not a local phone-only file path
    try {
      if (auth.currentUser && !photoUri.startsWith('file://')) {
        await updateProfile(auth.currentUser, { photoURL: photoUri });
      }
    } catch { }
  }, [user, refreshSavedAccounts]);

  const updateUserName = useCallback(
    async (newName: string) => {
      if (!user) return;
      const trimmed = newName.trim();
      if (!trimmed) return;

      await AsyncStorage.setItem(`@task_manager_user_name_${user.uid}`, trimmed);

      // Sync display name to Cloud Firestore for cross-device consistency
      try {
        await FirestoreService.saveUserProfile(user.uid, { displayName: trimmed });
      } catch (cloudErr) {
        console.warn('Could not sync display name to Cloud Firestore:', cloudErr);
      }

      try {
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: trimmed });
        }
      } catch (err) {
        console.warn('Could not update Firebase displayName:', err);
      }

      const updatedUser: AuthUser = { ...user, displayName: trimmed };
      setUser(updatedUser);
      await UserRepository.recordAccount(updatedUser);
      await refreshSavedAccounts();
    },
    [user, refreshSavedAccounts]
  );

  const switchAccount = useCallback(
    async (targetIdentifier: string): Promise<boolean> => {
      try {
        setLoading(true);
        const lowerTarget = targetIdentifier.trim().toLowerCase();
        const existingAccounts = await UserRepository.getSavedAccounts();
        const targetAcc = existingAccounts.find(
          (acc) =>
            acc.uid === targetIdentifier ||
            acc.email?.trim().toLowerCase() === lowerTarget
        );

        if (!targetAcc) {
          console.warn('Target account not found in saved accounts:', targetIdentifier);
          return false;
        }

        // 1. Resolve target user details (name & avatar)
        const savedName = await AsyncStorage.getItem(`@task_manager_user_name_${targetAcc.uid}`);
        const finalDisplayName =
          savedName?.trim() ||
          targetAcc.displayName ||
          (targetAcc.email ? formatEmailToDisplayName(targetAcc.email) : 'User');

        const savedAvatar = await UserRepository.getUserAvatar(targetAcc.uid);
        const finalAvatar = savedAvatar || targetAcc.photoURL || null;

        const switchedUser: AuthUser = {
          uid: targetAcc.uid,
          email: targetAcc.email,
          displayName: finalDisplayName,
          photoURL: finalAvatar,
          isAnonymous: targetAcc.isAnonymous,
        };

        // 2. Persist active account selection across restarts
        await AsyncStorage.setItem('@task_manager_active_account_uid', targetAcc.uid);

        // 3. Immediately update UI state
        setUser(switchedUser);
        setAvatarUrl(finalAvatar);

        // 4. Update lastActive in saved accounts
        await UserRepository.recordAccount(switchedUser);
        await refreshSavedAccounts();

        // 5. If credentials saved, cleanly re-authenticate with Firebase
        if (targetAcc.email) {
          const savedPass = await AccountManager.getAccountPassword(targetAcc.email);
          if (savedPass) {
            isExplicitAuthSwitchRef.current = true;
            try {
              try {
                await AuthService.signOut();
              } catch {}
              await AuthService.signIn(targetAcc.email, savedPass);
            } catch (authErr) {
              console.warn('Firebase sign-in with saved credential failed (continuing with active session):', authErr);
            } finally {
              isExplicitAuthSwitchRef.current = false;
            }
          }
        }

        return true;
      } catch (err) {
        console.warn('Switch account failed:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [refreshSavedAccounts]
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      savedAccounts,
      avatarUrl,
      updateUserPhoto,
      updateUserName,
      signIn,
      signUp,
      sendPasswordReset,
      signOut,
      switchAccount,
      removeSavedAccount,
      refreshSavedAccounts,
    }),
    [
      user,
      loading,
      savedAccounts,
      avatarUrl,
      updateUserPhoto,
      updateUserName,
      signIn,
      signUp,
      sendPasswordReset,
      signOut,
      switchAccount,
      removeSavedAccount,
      refreshSavedAccounts,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context || defaultAuthContext;
}
