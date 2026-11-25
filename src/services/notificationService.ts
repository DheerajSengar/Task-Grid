import { Task } from '@/types/task';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { FirestoreService } from '@/services/firestoreService';

const REMINDER_STORAGE_KEY = '@task_reminders_map_v1';

let _notifications: typeof import('expo-notifications') | null = null;
let _notificationsAttempted = false;

function getNotifications(): typeof import('expo-notifications') | null {
  if (_notificationsAttempted) return _notifications;
  _notificationsAttempted = true;
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _notifications = require('expo-notifications');
    _notifications?.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (err) {
    console.warn('[NotificationService] Native notifications not available:', err);
    _notifications = null;
  }
  return _notifications;
}

/**
 * Gentle Web Audio Synthesizer Chime for Web browsers
 * Plays a pleasant 2-tone notification sound when alarms trigger on web.
 */
function playWebNotificationChime() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Tone 1: 523.25 Hz (C5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    // Tone 2: 659.25 Hz (E5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);
    gain2.gain.setValueAtTime(0.18, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.6);
  } catch {
    // Ignore audio autoplay restrictions
  }
}

export interface ScheduledReminderInfo {
  taskId: string;
  taskTitle: string;
  notificationId: string;
  scheduledTime: number; // timestamp
}

export interface PermissionDetails {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
  message?: string;
}

export const NotificationService = {
  /**
   * Request notification permissions and create Android channel.
   * Returns a detailed status object.
   */
  async requestDetailedPermissions(): Promise<PermissionDetails> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const currentPerm = window.Notification.permission;
        if (currentPerm === 'granted') {
          return { granted: true, canAskAgain: true, status: 'granted' };
        }
        if (currentPerm === 'denied') {
          return {
            granted: false,
            canAskAgain: false,
            status: 'denied',
            message:
              'Notifications are blocked in your browser. Click the site settings/lock icon in your URL bar and set Notifications to Allow.',
          };
        }
        try {
          const res = await window.Notification.requestPermission();
          if (res === 'granted') {
            return { granted: true, canAskAgain: true, status: 'granted' };
          }
          return {
            granted: false,
            canAskAgain: res !== 'denied',
            status: res,
            message:
              res === 'denied'
                ? 'Notifications were denied. Click the site icon in the address bar to allow them.'
                : 'Notification prompt was dismissed.',
          };
        } catch {
          return {
            granted: false,
            canAskAgain: false,
            status: 'error',
            message: 'Browser does not allow notification prompts in this context.',
          };
        }
      }
      return {
        granted: true,
        canAskAgain: true,
        status: 'web-fallback',
        message: 'Web audio chime fallback is active.',
      };
    }

    // Native iOS / Android
    const Notifications = getNotifications();
    if (!Notifications) {
      return {
        granted: true,
        canAskAgain: true,
        status: 'fallback',
        message: 'Native notification module bypassed safely.',
      };
    }

    try {
      const { status: existingStatus, canAskAgain } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const req = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = req.status;
      }

      // Configure Android Notification Channels with high importance (FCM compatible)
      if (Platform.OS === 'android') {
        try {
          const importance = Notifications.AndroidImportance?.HIGH ?? 4;
          // Primary Task Reminders channel
          await Notifications.setNotificationChannelAsync('task-reminders', {
            name: 'Task Reminders',
            importance,
            lightColor: '#10B981',
            showBadge: true,
          });
          // Default FCM Fallback channel (Firebase Cloud Messaging uses this by default on Android)
          await Notifications.setNotificationChannelAsync('fcm_fallback_notification_channel', {
            name: 'FCM Push Notifications',
            importance,
            lightColor: '#10B981',
            showBadge: true,
          });
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance,
            showBadge: true,
          });
        } catch (chanErr) {
          console.warn('Could not set Android notification channels:', chanErr);
        }
      }

      const isGranted = finalStatus === 'granted';
      return {
        granted: isGranted,
        canAskAgain: canAskAgain ?? false,
        status: finalStatus,
        message: isGranted
          ? 'Notifications enabled successfully.'
          : 'Please enable notifications in Android Settings > Apps > Expo Go / TaskManager > Notifications.',
      };
    } catch (error: any) {
      console.warn('Failed to get notification permissions:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'error',
        message: error?.message || 'Could not access device notification service.',
      };
    }
  },

  /**
   * Simple boolean permission request wrapper
   */
  async requestPermissions(): Promise<boolean> {
    const details = await this.requestDetailedPermissions();
    return details.granted;
  },

  /**
   * Schedules a smart reminder for a task.
   * Cross-platform: Uses expo-notifications on iOS/Android, and HTML5 Web Notifications + Web Chime on web.
   */
  async scheduleReminderForTask(
    task: Pick<Task, 'id' | 'title' | 'dueDate' | 'priority'>,
    options?: {
      delaySeconds?: number;
      targetDate?: Date;
    }
  ): Promise<string | null> {
    // Check/request permission
    const permDetails = await this.requestDetailedPermissions();
    if (!permDetails.granted && Platform.OS !== 'web') {
      console.warn('Notification permission not granted:', permDetails.message);
      return null;
    }

    try {
      // First cancel any existing reminder for this task
      await this.cancelReminder(task.id);

      let triggerDate: Date;

      if (options?.delaySeconds && options.delaySeconds > 0) {
        triggerDate = new Date(Date.now() + options.delaySeconds * 1000);
      } else if (options?.targetDate) {
        triggerDate = options.targetDate;
      } else if (task.dueDate) {
        const parsed = new Date(task.dueDate);
        if (!isNaN(parsed.getTime())) {
          parsed.setHours(9, 0, 0, 0);
          if (parsed.getTime() > Date.now()) {
            triggerDate = parsed;
          } else {
            triggerDate = new Date(Date.now() + 60 * 60 * 1000);
          }
        } else {
          triggerDate = new Date(Date.now() + 60 * 60 * 1000);
        }
      } else {
        triggerDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
      }

      const secondsFromNow = Math.max(5, Math.round((triggerDate.getTime() - Date.now()) / 1000));

      const priorityPrefix =
        task.priority === 'high' ? '🔥 High Priority: ' : task.priority === 'medium' ? '⚡ ' : '📝 ';

      let notificationId = 'web-notif-' + Date.now();
      const Notifications = getNotifications();

      if (Platform.OS !== 'web' && Notifications) {
        notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: `${priorityPrefix}${task.title}`,
            body: `Task reminder: Don't forget to complete "${task.title}".`,
            data: { taskId: task.id },
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: secondsFromNow,
            channelId: 'task-reminders',
          },
        });
      } else {
        // Web / fallback delivery: HTML5 desktop notification + Web Audio synthesizer chime
        const delayMs = Math.min(secondsFromNow * 1000, 2147483647);
        setTimeout(() => {
          try {
            if (
              typeof window !== 'undefined' &&
              'Notification' in window &&
              window.Notification.permission === 'granted'
            ) {
              new window.Notification(`${priorityPrefix}${task.title}`, {
                body: `Task reminder: Don't forget to complete "${task.title}".`,
                icon: '/favicon.png',
              });
            }
          } catch { }

          // Always play pleasant audio chime on web when alarm timer fires
          playWebNotificationChime();
        }, delayMs);
      }

      // Persist in local storage mapping
      await this.storeReminderMap(task.id, {
        taskId: task.id,
        taskTitle: task.title,
        notificationId,
        scheduledTime: triggerDate.getTime(),
      });

      return notificationId;
    } catch (err) {
      console.warn('Error scheduling notification:', err);
      return null;
    }
  },

  /**
   * Cancel reminder for a task
   */
  async cancelReminder(taskId: string): Promise<void> {
    try {
      const map = await this.getReminderMap();
      const info = map[taskId];
      if (info?.notificationId) {
        const Notifications = getNotifications();
        if (Platform.OS !== 'web' && !info.notificationId.startsWith('web-') && Notifications) {
          await Notifications.cancelScheduledNotificationAsync(info.notificationId);
        }
        delete map[taskId];
        await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(map));
      }
    } catch (err) {
      console.warn('Error cancelling reminder:', err);
    }
  },

  /**
   * Retrieve all currently active scheduled reminders
   */
  async getAllActiveReminders(): Promise<ScheduledReminderInfo[]> {
    try {
      const map = await this.getReminderMap();
      const now = Date.now();
      const active: ScheduledReminderInfo[] = [];

      for (const key of Object.keys(map)) {
        if (map[key].scheduledTime > now) {
          active.push(map[key]);
        }
      }

      return active;
    } catch {
      return [];
    }
  },

  /**
   * Retrieve all scheduled reminders (active and recent)
   */
  async getAllStoredReminders(): Promise<ScheduledReminderInfo[]> {
    try {
      const map = await this.getReminderMap();
      return Object.values(map).sort((a, b) => b.scheduledTime - a.scheduledTime);
    } catch {
      return [];
    }
  },

  /**
   * Clear all scheduled reminders
   */
  async clearAllReminders(): Promise<void> {
    try {
      const Notifications = getNotifications();
      if (Platform.OS !== 'web' && Notifications) {
        await Notifications.cancelAllScheduledNotificationsAsync();
      }
      await AsyncStorage.removeItem(REMINDER_STORAGE_KEY);
    } catch (err) {
      console.warn('Failed to clear reminders:', err);
    }
  },

  /**
   * Internal storage helpers
   */
  async getReminderMap(): Promise<Record<string, ScheduledReminderInfo>> {
    try {
      const raw = await AsyncStorage.getItem(REMINDER_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  async storeReminderMap(taskId: string, info: ScheduledReminderInfo): Promise<void> {
    try {
      const map = await this.getReminderMap();
      map[taskId] = info;
      await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(map));
    } catch (err) {
      console.warn('Failed to save reminder map:', err);
    }
  },

  /**
   * Generates or retrieves a persistent device push token for this device.
   */
  async getOrCreateDevicePushToken(userId?: string): Promise<string> {
    const cached = await AsyncStorage.getItem('@task_manager_fcm_token');
    if (cached && cached.trim()) {
      return cached.trim();
    }
    const cleanId = userId && !userId.startsWith('guest_') ? userId : 'device';
    const unique = Date.now().toString(36) + Math.random().toString(36).substring(2, 12);
    const token = `fcm_${cleanId}_${unique}`;
    await AsyncStorage.setItem('@task_manager_fcm_token', token);
    return token;
  },

  /**
   * Retrieves the native FCM Device Registration Token, falling back gracefully to device push token.
   */
  async getFCMDeviceToken(userId?: string): Promise<string | null> {
    try {
      const cached = await AsyncStorage.getItem('@task_manager_fcm_token');
      const Notifications = getNotifications();

      let token: string | null = null;

      // 1. Try native FCM Device Push Token directly from Android Firebase SDK (available on real builds)
      if (Notifications) {
        try {
          const devicePushToken = await Notifications.getDevicePushTokenAsync();
          if (devicePushToken?.data) {
            token =
              typeof devicePushToken.data === 'string'
                ? devicePushToken.data
                : JSON.stringify(devicePushToken.data);
          }
        } catch {
          // Native push token unavailable in Expo Go; fallback to Expo push token
        }

        // 2. Fallback to Expo Push Token if device push token is not available
        if (!token) {
          try {
            const expoPushToken = await Notifications.getExpoPushTokenAsync();
            if (expoPushToken?.data) {
              token = expoPushToken.data;
            }
          } catch {
            // Expo push token not available in offline/unregistered Expo Go
          }
        }
      }

      // 3. Fallback to cached or generated deterministic device push token
      if (!token) {
        token = cached || (await this.getOrCreateDevicePushToken(userId));
      }

      if (token) {
        await AsyncStorage.setItem('@task_manager_fcm_token', token);
        return token;
      }

      return cached || null;
    } catch (err) {
      console.warn('[NotificationService] Failed to retrieve FCM token:', err);
      return await this.getOrCreateDevicePushToken(userId);
    }
  },

  /**
   * Registers and syncs FCM token to Cloud Firestore for the active user's profile
   */
  async registerFCMForUser(userId?: string, customToken?: string): Promise<string | null> {
    if (!userId || userId.startsWith('guest_')) return null;

    let token: string | null = customToken || null;
    if (!token) {
      token = await this.getFCMDeviceToken(userId);
    }

    if (token) {
      await AsyncStorage.setItem('@task_manager_fcm_token', token);
      try {
        await FirestoreService.saveUserProfile(userId, {
          fcmToken: token,
          updatedAt: Date.now(),
        });
        console.log(`[FCM] Successfully persisted FCM token in Firestore profile for user ${userId}:`, token);
      } catch (err) {
        console.warn('[NotificationService] Cloud Firestore FCM sync error:', err);
      }
    }
    return token;
  },

  /**
   * Attaches foreground and tap listeners for FCM notifications
   */
  setupNotificationListeners(
    onReceived?: (notification: any) => void,
    onResponse?: (response: any) => void
  ): () => void {
    const Notifications = getNotifications();
    if (!Notifications) return () => {};

    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } catch {}
      onReceived?.(notification);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      onResponse?.(response);
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  },
};
