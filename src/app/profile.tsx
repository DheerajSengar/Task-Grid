import { DesignTheme } from '@/constants/designTheme';
import { useAuth } from '@/context/AuthContext';
import { useTasks } from '@/context/TaskContext';
import { formatEmailToDisplayName } from '@/services/authService';
import { StorageService } from '@/services/storageService';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const {
    user,
    signOut,
    savedAccounts,
    removeSavedAccount,
    avatarUrl,
    updateUserPhoto,
    updateUserName,
    switchAccount,
    refreshSavedAccounts,
  } = useAuth();
  const { stats, isCloudConnected } = useTasks();
  const [reminderStatus, setReminderStatus] = useState<string>('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showManageAccounts, setShowManageAccounts] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newNameInput, setNewNameInput] = useState('');
  const [switchingEmail, setSwitchingEmail] = useState<string | null>(null);

  useEffect(() => {
    refreshSavedAccounts();
  }, [refreshSavedAccounts]);

  const displayName =
    user?.displayName ||
    (user?.email ? formatEmailToDisplayName(user.email) : 'User');
  const displayEmail = user?.email || 'Not signed in';
  const avatarLetter = (displayName[0] || 'U').toUpperCase();

  const validSavedAccounts = useMemo(() => {
    const list = [...savedAccounts.filter((acc) => !acc.isAnonymous && !!acc.email)];
    if (user && user.email && !user.isAnonymous) {
      const alreadyInList = list.some(
        (a) => a.uid === user.uid || (a.email && a.email.toLowerCase() === user.email?.toLowerCase())
      );
      if (!alreadyInList) {
        list.unshift({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || formatEmailToDisplayName(user.email),
          photoURL: user.photoURL,
          isAnonymous: user.isAnonymous,
          lastActive: 0,
        });
      }
    }
    return list;
  }, [savedAccounts, user]);

  const handlePickAndUploadAvatar = async () => {
    if (!user) {
      setReminderStatus('Please sign in to save an avatar.');
      setTimeout(() => setReminderStatus(''), 3000);
      return;
    }

    try {
      setIsUploadingAvatar(true);
      setReminderStatus('Opening photo library...');

      const asset = await StorageService.pickImage();
      if (!asset) {
        setIsUploadingAvatar(false);
        setReminderStatus('');
        return;
      }

      setReminderStatus('Saving profile photo...');
      await updateUserPhoto(asset.uri);

      setReminderStatus('Profile photo updated!');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch { }
      setTimeout(() => setReminderStatus(''), 3000);
    } catch (err) {
      console.error('Avatar upload failed:', err);
      setReminderStatus('Upload failed. Please try again.');
      setTimeout(() => setReminderStatus(''), 4000);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch { }
      router.replace('/auth');
    } catch (err) {
      console.error('Sign out error:', err);
      router.replace('/auth');
    }
  };

  const handleSwitchAccount = async (targetIdentifier: string, targetName: string) => {
    try {
      setSwitchingEmail(targetIdentifier);
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch { }

      const success = await switchAccount(targetIdentifier);
      if (success) {
        setReminderStatus(`Switched to ${targetName}`);
        setTimeout(() => {
          setReminderStatus('');
          router.replace('/tabs');
        }, 350);
      } else {
        setReminderStatus(`Could not switch to ${targetName}.`);
        setTimeout(() => setReminderStatus(''), 3000);
      }
    } catch (err) {
      console.error('Error switching account:', err);
      setReminderStatus(`Failed to switch account.`);
      setTimeout(() => setReminderStatus(''), 3000);
    } finally {
      setSwitchingEmail(null);
    }
  };


  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header: < Profile */}
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/tabs');
              }
            }}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Back to Home">
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </Pressable>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Cover Banner & Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.coverBanner}>
            <View style={styles.avatarWrap}>
              <Pressable
                onPress={handlePickAndUploadAvatar}
                disabled={isUploadingAvatar}
                style={styles.avatarCircle}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{avatarLetter}</Text>
                )}
                <View style={styles.avatarEditPill}>
                  <Ionicons
                    name={isUploadingAvatar ? 'cloud-upload' : 'camera'}
                    size={12}
                    color="#FFFFFF"
                  />
                </View>
              </Pressable>
              <View
                style={[
                  styles.onlineBadge,
                  { backgroundColor: isCloudConnected ? '#10B981' : '#F59E0B' },
                ]}
              />
            </View>
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Text style={styles.userName}>{displayName}</Text>
                  {user?.isAnonymous && (
                    <View style={styles.guestBadge}>
                      <Text style={styles.guestBadgeText}>Guest</Text>
                    </View>
                  )}
                  {user && !user.isAnonymous && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                      <Text style={styles.verifiedBadgeText}>Verified</Text>
                    </View>
                  )}
                  <Pressable
                    onPress={() => {
                      setNewNameInput(displayName);
                      setIsEditingName(true);
                    }}
                    style={styles.editNameIconBtn}
                    hitSlop={8}
                    accessibilityLabel="Edit User Name">
                    <Ionicons name="pencil" size={12} color="#065F46" />
                  </Pressable>
                </View>
                <Text style={styles.userEmail}>{displayEmail}</Text>
              </View>

              <Pressable
                style={styles.editProfileBtn}
                onPress={() => setShowManageAccounts(!showManageAccounts)}>
                <Ionicons name="people-outline" size={16} color="#065F46" />
              </Pressable>
            </View>

            {/* Quick Metrics */}
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{stats.total}</Text>
                <Text style={styles.metricLbl}>Total Tasks</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{stats.completed}</Text>
                <Text style={styles.metricLbl}>Completed</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{stats.pending}</Text>
                <Text style={styles.metricLbl}>Pending</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Status notification toast */}
        {reminderStatus ? (
          <View style={styles.statusToast}>
            <Ionicons name="information-circle" size={16} color="#065F46" />
            <Text style={styles.statusToastText}>{reminderStatus}</Text>
          </View>
        ) : null}

        {/* Dedicated Manage Accounts Section (Shows all signed in accounts on device) */}
        {showManageAccounts && (
          <View style={styles.manageAccountsCard}>
            <View style={styles.manageAccountsHeader}>
              <View>
                <Text style={styles.manageAccountsTitle}>Manage Accounts</Text>
                <Text style={styles.manageAccountsSubtitle}>
                  Signed in on this device ({savedAccounts.length || (user ? 1 : 0)})
                </Text>
              </View>
              <Pressable
                onPress={() => setShowManageAccounts(false)}
                style={styles.closeManageBtn}>
                <Ionicons name="close" size={18} color="#6B7280" />
              </Pressable>
            </View>

            {/* Account List */}
            {validSavedAccounts.length > 0 ? (
              validSavedAccounts.map((acc) => {
                const isCurrentActive = acc.uid === user?.uid;
                const accName = acc.displayName || acc.email?.split('@')[0] || 'User';
                const accLetter = (accName[0] || 'U').toUpperCase();
                const accPhoto = isCurrentActive ? (avatarUrl || acc.photoURL) : acc.photoURL;

                return (
                  <View key={acc.uid} style={[styles.accountItem, isCurrentActive && styles.accountItemActive]}>
                    <View style={styles.accountAvatar}>
                      {accPhoto ? (
                        <Image source={{ uri: accPhoto }} style={styles.accountAvatarImg} />
                      ) : (
                        <Text style={styles.accountAvatarText}>{accLetter}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.accountItemName}>{accName}</Text>
                      <Text style={styles.accountItemEmail}>
                        {acc.email || 'No email'}
                      </Text>
                      {isCurrentActive ? (
                        <View style={styles.activeTag}>
                          <View style={styles.activeDot} />
                          <Text style={styles.activeTagText}>Active Account</Text>
                        </View>
                      ) : null}
                    </View>

                    {!isCurrentActive && (
                      <View style={styles.accountItemActions}>
                        <Pressable
                          onPress={() => handleSwitchAccount(acc.uid, accName)}
                          disabled={switchingEmail === acc.uid}
                          style={[styles.switchAccountBtn, switchingEmail === acc.uid && { opacity: 0.7 }]}>
                          {switchingEmail === acc.uid ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text style={styles.switchAccountBtnText}>Switch</Text>
                          )}
                        </Pressable>
                        <Pressable
                          onPress={() => removeSavedAccount(acc.uid)}
                          style={styles.removeAccountBtn}
                          hitSlop={6}>
                          <Ionicons name="trash-outline" size={15} color="#EF4444" />
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <View style={styles.accountItem}>
                <View style={styles.accountAvatar}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.accountAvatarImg} />
                  ) : (
                    <Text style={styles.accountAvatarText}>{avatarLetter}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.accountItemName}>{displayName}</Text>
                  <Text style={styles.accountItemEmail}>{displayEmail}</Text>
                  <View style={styles.activeTag}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeTagText}>Active Account</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Action buttons inside Manage Accounts */}
            <View style={styles.manageAccountsFooter}>
              <Pressable
                onPress={() => {
                  router.push({
                    pathname: '/auth',
                    params: { addAccount: 'true', mode: 'signin' },
                  });
                }}
                style={styles.addAccountBtn}>
                <Ionicons name="person-add-outline" size={15} color="#065F46" />
                <Text style={styles.addAccountBtnText}>+ Add another account</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Menu Items matching user's design reference */}
        <View style={styles.menuContainer}>
          {/* Manage Account */}
          <Pressable
            onPress={() => setShowManageAccounts(!showManageAccounts)}
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIconBox}>
                <Ionicons name="person-outline" size={18} color="#065F46" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuItemTitle}>Manage Account</Text>
                <Text style={styles.menuItemSubtext}>
                  {savedAccounts.length > 0 ? `${savedAccounts.length} accounts on device` : '1 active account'}
                </Text>
              </View>
            </View>
            <Ionicons
              name={showManageAccounts ? 'chevron-down' : 'chevron-forward'}
              size={16}
              color="#9CA3AF"
            />
          </Pressable>

          <View style={styles.menuDivider} />

          {/* Smart Due Date Reminders (Task Reminder Screen) */}
          <Pressable
            onPress={() => router.push('/reminders' as any)}
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIconBox}>
                <Ionicons name="alarm-outline" size={18} color="#065F46" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuItemTitle}>Task Reminders & Alerts</Text>
                <Text style={styles.menuItemSubtext}>View active notifications & set reminders</Text>
              </View>
            </View>
            <View style={styles.menuItemRight}>
              <View style={styles.activeRemindersPill}>
                <Text style={styles.activeRemindersText}>
                  {stats.activeReminders ?? 0} Active
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </View>
          </Pressable>

          <View style={styles.menuDivider} />

          {/* Sign Out or Sign In */}
          <Pressable
            onPress={user ? handleSignOut : () => router.replace('/auth')}
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIconBox}>
                <Ionicons
                  name={user ? 'log-out-outline' : 'log-in-outline'}
                  size={18}
                  color={user ? '#EF4444' : '#10B981'}
                />
              </View>
              <Text style={[styles.menuItemTitle, { color: user ? '#EF4444' : '#065F46' }]}>
                {user ? 'Sign Out' : 'Sign In to Account'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={user ? '#EF4444' : '#10B981'} />
          </Pressable>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>© 2026 TaskManager • Light & Green Edition</Text>
      </ScrollView>

      {/* Edit Display Name Modal */}
      <Modal
        visible={isEditingName}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditingName(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.editNameModalCard}>
            <View style={styles.editNameModalHeader}>
              <View style={styles.editNameIconBox}>
                <Ionicons name="person-outline" size={20} color="#065F46" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.editNameModalTitle}>Edit User Name</Text>
                <Text style={styles.editNameModalSub}>
                  This name appears on your Home dashboard and Profile.
                </Text>
              </View>
            </View>

            <TextInput
              value={newNameInput}
              onChangeText={setNewNameInput}
              placeholder="Enter your name (e.g. Dheeraj Sengar)"
              placeholderTextColor="#94A3B8"
              style={styles.editNameInput}
              autoFocus
            />

            <View style={styles.editNameModalActions}>
              <Pressable
                onPress={() => setIsEditingName(false)}
                style={({ pressed }) => [styles.editNameCancelBtn, pressed && { opacity: 0.7 }]}>
                <Text style={styles.editNameCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={async () => {
                  const trimmed = newNameInput.trim();
                  if (!trimmed) return;
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch { }
                  await updateUserName(trimmed);
                  setIsEditingName(false);
                  setReminderStatus(`User name updated to ${trimmed}`);
                  try {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  } catch { }
                  setTimeout(() => setReminderStatus(''), 3000);
                }}
                disabled={!newNameInput.trim()}
                style={({ pressed }) => [
                  styles.editNameSaveBtn,
                  !newNameInput.trim() && { backgroundColor: '#E5E7EB' },
                  pressed && { opacity: 0.85 },
                ]}>
                <Ionicons name="checkmark-circle" size={16} color={!newNameInput.trim() ? '#9CA3AF' : '#FFFFFF'} />
                <Text style={[styles.editNameSaveText, !newNameInput.trim() && { color: '#9CA3AF' }]}>Save Name</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DesignTheme.colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    maxWidth: 600,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E9E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPressed: {
    backgroundColor: '#E8F9EE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  profileCard: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E9E7',
    overflow: 'hidden',
    marginBottom: 16,
  },
  coverBanner: {
    height: 100,
    backgroundColor: '#E8F9EE',
    position: 'relative',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
  },
  avatarWrap: {
    position: 'absolute',
    bottom: -32,
    left: 20,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#065F46',
  },
  avatarEditPill: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  onlineBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    paddingTop: 42,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  userEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  guestBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  guestBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  editProfileBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F9EE',
    borderWidth: 1,
    borderColor: '#D1FADF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAF9',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E9E7',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  metricLbl: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E9E7',
  },
  statusToast: {
    width: '100%',
    maxWidth: 600,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F9EE',
    borderWidth: 1,
    borderColor: '#D1FADF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  statusToastText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065F46',
    flex: 1,
  },
  manageAccountsCard: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#10B981',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  manageAccountsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F2',
  },
  manageAccountsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  manageAccountsSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  closeManageBtn: {
    padding: 4,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAF9',
    borderWidth: 1,
    borderColor: '#E5E9E7',
    marginBottom: 8,
  },
  accountItemActive: {
    backgroundColor: '#E8F9EE',
    borderColor: '#A7F3D0',
  },
  accountAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  accountAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
  },
  accountAvatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#065F46',
  },
  accountItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  accountItemEmail: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  activeTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  accountItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  switchAccountBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  switchAccountBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  removeAccountBtn: {
    padding: 6,
  },
  manageAccountsFooter: {
    marginTop: 6,
  },
  addAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E8F9EE',
    borderWidth: 1,
    borderColor: '#D1FADF',
    borderRadius: 12,
    paddingVertical: 10,
  },
  addAccountBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  menuContainer: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E9E7',
    overflow: 'hidden',
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: '100%',
  },
  menuItemPressed: {
    backgroundColor: '#F8FAF9',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  menuIconBox: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  menuItemSubtext: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  menuItemValue: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F1F5F2',
    marginLeft: 46,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F9EE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1FADF',
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  syncText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  activeRemindersPill: {
    backgroundColor: '#E8F9EE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1FADF',
  },
  activeRemindersText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '500',
  },
  editNameIconBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8F9EE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1FADF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  editNameModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    gap: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      },
      default: {
        elevation: 8,
      },
    }),
  },
  editNameModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editNameIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F9EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editNameModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  editNameModalSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  editNameInput: {
    backgroundColor: '#F8FAF9',
    borderWidth: 1,
    borderColor: '#E5E9E7',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  editNameModalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  editNameCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  editNameCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  editNameSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#10B981',
  },
  editNameSaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
