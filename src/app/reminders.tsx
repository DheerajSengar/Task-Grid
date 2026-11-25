import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useTasks } from '@/context/TaskContext';
import { useAuth } from '@/context/AuthContext';
import { NotificationService, ScheduledReminderInfo } from '@/services/notificationService';
import { CATEGORY_PASTELS } from '@/constants/designTheme';
import { showCrossPlatformAlert } from '@/utils/platformAlert';

export default function TaskReminderScreen() {
  const { tasks } = useTasks();
  const { user } = useAuth();
  const [scheduledReminders, setScheduledReminders] = useState<ScheduledReminderInfo[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(true);
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());
  const [activeTab, setActiveTab] = useState<'all' | 'scheduled'>('all');
  const [statusToast, setStatusToast] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean>(true);

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(''), 3500);
  };

  const loadReminders = useCallback(async () => {
    try {
      const list = await NotificationService.getAllStoredReminders();
      setScheduledReminders(list);
      setCurrentTime(Date.now());
    } catch (err) {
      console.warn('Failed to load reminders:', err);
      setScheduledReminders([]);
    } finally {
      setLoadingReminders(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    NotificationService.getAllStoredReminders()
      .then((list) => {
        if (isMounted) {
          setScheduledReminders(list);
          setCurrentTime(Date.now());
          setLoadingReminders(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingReminders(false);
      });

    NotificationService.requestPermissions().then((granted) => {
      if (isMounted) setHasPermission(granted);
    });

    if (user?.uid) {
      NotificationService.registerFCMForUser(user.uid).catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  // Tasks approaching due date (Today, Tomorrow, or Upcoming)
  const dueTasks = useMemo(() => {
    return tasks.filter((t) => !t.completed && t.dueDate);
  }, [tasks]);


  // Schedule a test 5-second reminder
  const handleTestReminder = async () => {
    try {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}

      const sampleTask = tasks[0] || {
        id: 'test-reminder-' + Date.now(),
        title: 'Review Task Manager Deliverables',
        dueDate: 'Today',
        priority: 'high',
      };

      const id = await NotificationService.scheduleReminderForTask(
        {
          id: sampleTask.id,
          title: sampleTask.title,
          dueDate: sampleTask.dueDate,
          priority: sampleTask.priority,
        },
        { delaySeconds: 5 }
      );

      if (id) {
        showToast('5-second smart reminder scheduled! Watch for alarm.');
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
        await loadReminders();
      } else {
        const details = await NotificationService.requestDetailedPermissions();
        showToast(details.message || 'Could not schedule reminder. Check notification permissions.');
      }
    } catch {
      showToast('Error scheduling test reminder.');
    }
  };


  // Copy Device Push / FCM Registration Token & sync to Firestore
  const handleCopyToken = async () => {
    try {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
      showToast('Fetching & syncing device token...');
      const token = await NotificationService.getFCMDeviceToken(user?.uid);
      if (token) {
        if (user?.uid) {
          await NotificationService.registerFCMForUser(user.uid, token);
        }
        await Clipboard.setStringAsync(token);
        showToast('FCM Token copied & saved to Firestore!');
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
        showCrossPlatformAlert(
          'FCM Registration Token',
          `Token:\n\n${token}\n\n✓ Copied to clipboard\n✓ Saved to user profile in Cloud Firestore (/users/${user?.uid || 'user'})`,
          [
            {
              text: 'Copy Again',
              onPress: async () => {
                await Clipboard.setStringAsync(token);
                showToast('Token copied to clipboard!');
              },
            },
            { text: 'Done', style: 'default' },
          ]
        );
      } else {
        showToast('Could not fetch token.');
      }
    } catch (err: any) {
      showToast('Failed to copy token.');
      showCrossPlatformAlert('Error', err?.message || 'Could not retrieve push token.');
    }
  };

  // Cancel / Dismiss a reminder
  const handleCancelReminder = async (taskId: string, title?: string) => {
    try {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}

      await NotificationService.cancelReminder(taskId);
      showToast(`Reminder dismissed${title ? ` for "${title}"` : ''}.`);
      await loadReminders();
    } catch {
      showToast('Failed to dismiss reminder.');
    }
  };

  // Clear all reminders
  const handleClearAll = async () => {
    try {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}

      await NotificationService.clearAllReminders();
      showToast('All scheduled reminders cleared.');
      await loadReminders();
    } catch {
      showToast('Failed to clear reminders.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/tabs');
            }
          }}
          style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Back to Dashboard">
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Task Reminder</Text>
          <View style={styles.liveIndicatorRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Real-time Notifications</Text>
          </View>
        </View>

        <View style={styles.headerActionsGroup}>
          <Pressable
            onPress={handleCopyToken}
            style={({ pressed }) => [styles.tokenBtn, pressed && styles.btnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Copy FCM Token">
            <Ionicons name="copy-outline" size={13} color="#065F46" />
            <Text style={styles.tokenBtnText}>Token</Text>
          </Pressable>

          <Pressable
            onPress={handleTestReminder}
            style={({ pressed }) => [styles.testBtn, pressed && styles.btnPressed]}>
            <Ionicons name="notifications-outline" size={13} color="#065F46" />
            <Text style={styles.testBtnText}>+ Test (5s)</Text>
          </Pressable>
        </View>
      </View>

      {/* Toast Banner */}
      {statusToast ? (
        <View style={styles.toastBanner}>
          <Ionicons name="checkmark-circle" size={16} color="#065F46" />
          <Text style={styles.toastText}>{statusToast}</Text>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Permission Banner if not enabled on web/native */}
        {!hasPermission && (
          <Pressable
            onPress={async () => {
              const res = await NotificationService.requestDetailedPermissions();
              setHasPermission(res.granted);
              if (res.granted) {
                showToast('Notifications enabled successfully!');
              } else if (res.message) {
                showToast(res.message);
              }
            }}
            style={styles.permissionCard}>
            <Ionicons name="alert-circle-outline" size={20} color="#B45309" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.permissionTitle}>Notifications Disabled</Text>
              <Text style={styles.permissionSub}>Tap to allow browser & device reminders</Text>
            </View>
            <View style={styles.enableBtn}>
              <Text style={styles.enableBtnText}>Enable</Text>
            </View>
          </Pressable>
        )}

        {/* Filter Navigation Tabs */}
        <View style={styles.filterBar}>
          <Pressable
            onPress={() => setActiveTab('all')}
            style={[styles.filterTab, activeTab === 'all' && styles.filterTabActive]}>
            <Text
              style={[
                styles.filterTabText,
                activeTab === 'all' && styles.filterTabTextActive,
              ]}>
              All Reminders ({scheduledReminders.length + dueTasks.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('scheduled')}
            style={[styles.filterTab, activeTab === 'scheduled' && styles.filterTabActive]}>
            <Text
              style={[
                styles.filterTabText,
                activeTab === 'scheduled' && styles.filterTabTextActive,
              ]}>
              Scheduled ({scheduledReminders.length})
            </Text>
          </Pressable>
        </View>

        {loadingReminders ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#10B981" />
            <Text style={styles.loadingText}>Syncing task reminders...</Text>
          </View>
        ) : null}

        {/* SECTION 1: Scheduled Alarms & Alerts */}
        {(activeTab === 'all' || activeTab === 'scheduled') && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="notifications-circle" size={20} color="#10B981" />
                <Text style={styles.sectionTitle}>Scheduled Task Reminders</Text>
              </View>
              {scheduledReminders.length > 0 && (
                <Pressable onPress={handleClearAll}>
                  <Text style={styles.clearAllText}>Clear All</Text>
                </Pressable>
              )}
            </View>

            {scheduledReminders.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="notifications-off-outline" size={32} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No scheduled alarms right now</Text>
                <Text style={styles.emptySubtitle}>
                  Set reminders for your tasks below or tap &apos;+ Test (5s)&apos; to preview notifications.
                </Text>
              </View>
            ) : (
              scheduledReminders.map((rem) => {
                const isPast = rem.scheduledTime <= currentTime;
                const timeStr = new Date(rem.scheduledTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const dateStr = new Date(rem.scheduledTime).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <View key={rem.notificationId} style={styles.reminderCard}>
                    <View style={styles.reminderCardLeft}>
                      <View
                        style={[
                          styles.reminderBellCircle,
                          isPast ? { backgroundColor: '#F1F5F9' } : { backgroundColor: '#ECFDF5' },
                        ]}>
                        <Ionicons
                          name={isPast ? 'checkmark-circle-outline' : 'alarm-outline'}
                          size={18}
                          color={isPast ? '#64748B' : '#10B981'}
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.reminderTaskTitle}>{rem.taskTitle}</Text>
                        <View style={styles.reminderMetaRow}>
                          <Ionicons name="time-outline" size={13} color="#64748B" />
                          <Text style={styles.reminderTimeText}>
                            {dateStr} at {timeStr}
                          </Text>
                          <View
                            style={[
                              styles.statusBadge,
                              isPast
                                ? { backgroundColor: '#F1F5F9' }
                                : { backgroundColor: '#D1FADF' },
                            ]}>
                            <Text
                              style={[
                                styles.statusBadgeText,
                                isPast ? { color: '#64748B' } : { color: '#065F46' },
                              ]}>
                              {isPast ? 'Delivered' : 'Scheduled'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    <View style={styles.reminderCardActions}>
                      <Pressable
                        onPress={() => router.push(`/edit-task?id=${rem.taskId}` as any)}
                        style={styles.openTaskBtn}>
                        <Text style={styles.openTaskBtnText}>View</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleCancelReminder(rem.taskId, rem.taskTitle)}
                        style={styles.dismissBtn}>
                        <Ionicons name="close" size={16} color="#94A3B8" />
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* SECTION 2: Upcoming Task Due Dates */}
        {activeTab === 'all' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="calendar-sharp" size={18} color="#065F46" />
                <Text style={styles.sectionTitle}>Upcoming Task Due Dates</Text>
              </View>
              <Text style={styles.sectionCountText}>{dueTasks.length} tasks</Text>
            </View>

            {dueTasks.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="checkmark-done-circle-outline" size={32} color="#10B981" />
                <Text style={styles.emptyTitle}>All tasks are on track!</Text>
                <Text style={styles.emptySubtitle}>No pending tasks with upcoming due dates.</Text>
              </View>
            ) : (
              dueTasks.map((t) => {
                const isHigh = t.priority === 'high';
                const palette = CATEGORY_PASTELS[t.category] || CATEGORY_PASTELS.Work;
                const hasActiveAlarm = scheduledReminders.some((r) => r.taskId === t.id);

                return (
                  <Pressable
                    key={t.id}
                    onPress={() => router.push(`/edit-task?id=${t.id}` as any)}
                    style={({ pressed }) => [
                      styles.taskAlertCard,
                      pressed && styles.taskAlertCardPressed,
                    ]}>
                    <View style={styles.taskAlertContent}>
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <View
                            style={[
                              styles.categoryBadge,
                              { backgroundColor: palette.tagBg },
                            ]}>
                            <Text style={[styles.categoryBadgeText, { color: palette.tagText }]}>
                              {t.category}
                            </Text>
                          </View>
                          {isHigh && (
                            <View style={styles.highPriorityBadge}>
                              <Ionicons name="flame" size={11} color="#DC2626" />
                              <Text style={styles.highPriorityText}>HIGH</Text>
                            </View>
                          )}
                          {hasActiveAlarm && (
                            <View style={styles.alarmActiveBadge}>
                              <Ionicons name="alarm" size={11} color="#065F46" />
                              <Text style={styles.alarmActiveText}>Alarm Set</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.taskAlertTitle}>{t.title}</Text>
                        <View style={styles.dueInfoRow}>
                          <Ionicons name="calendar-outline" size={13} color="#64748B" />
                          <Text style={styles.dueInfoText}>Due: {t.dueDate}</Text>
                        </View>
                      </View>

                      <View style={styles.openTaskBtn}>
                        <Text style={styles.openTaskBtnText}>Open</Text>
                        <Ionicons name="chevron-forward" size={13} color="#065F46" />
                      </View>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E9E7',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAF9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E9E7',
  },
  btnPressed: {
    opacity: 0.7,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
  },
  headerActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tokenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  tokenBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1FADF',
  },
  testBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FADF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065F46',
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  permissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  permissionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  permissionSub: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  enableBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  enableBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E9E7',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  filterTabActive: {
    backgroundColor: '#10B981',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  sectionCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E9E7',
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E9E7',
  },
  reminderCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderBellCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderTaskTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  reminderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  reminderTimeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  reminderCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 10,
  },
  openTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1FADF',
  },
  openTaskBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  dismissBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8FAF9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E9E7',
  },
  taskAlertCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E9E7',
  },
  taskAlertCardPressed: {
    backgroundColor: '#F8FAF9',
  },
  taskAlertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  highPriorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  highPriorityText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },
  alarmActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#D1FADF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  alarmActiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  taskAlertTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  dueInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dueInfoText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
});
