import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { TaskProvider } from '@/context/TaskContext';
import { NotificationService } from '@/services/notificationService';
import AuthScreen from './auth';

function RootNavigation() {
  const { user, loading } = useAuth();
  const segments = useSegments();

  // Keep route synced with authentication state
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      router.replace('/auth');
    }
  }, [user, loading, segments]);

  // FCM Push Notifications & Foreground/Tap Listeners
  useEffect(() => {
    const unsubscribe = NotificationService.setupNotificationListeners(
      (notification) => {
        console.log('[FCM] Notification received in foreground:', notification.request.content);
      },
      (response) => {
        console.log('[FCM] Notification tapped:', response.notification.request.content);
        const data = response.notification.request.content.data;
        if (data?.taskId) {
          router.push(`/edit-task?id=${data.taskId}` as any);
        } else if (data?.screen) {
          router.push(data.screen as any);
        } else {
          router.push('/reminders');
        }
      }
    );

    // Auto-fetch & print FCM Token to Metro terminal console
    (async () => {
      try {
        const token = await NotificationService.getFCMDeviceToken();
        if (token) {
          console.log('\n==============================================');
          console.log('🔥 FCM TOKEN:', token);
          console.log('==============================================\n');
        } else {
          console.log('[FCM] No device push token returned yet. Allow notifications on device.');
        }
      } catch (err) {
        console.warn('[FCM] Error fetching FCM token:', err);
      }
    })();

    if (user?.uid) {
      NotificationService.registerFCMForUser(user.uid).catch(() => {});
    }

    return () => {
      unsubscribe();
    };
  }, [user?.uid]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  // Strict Auth Gate: Unauthenticated users always see AuthScreen
  if (!user) {
    return <AuthScreen />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      {/* 0. Index Redirect */}
      <Stack.Screen name="index" options={{ headerShown: false }} />

      {/* 1. Main 3-Tab Group (Home, Add Task, Summary) */}
      <Stack.Screen name="tabs" options={{ headerShown: false }} />

      {/* 2. User Profile (Opened by tapping Avatar / Welcome on Home) */}
      <Stack.Screen
        name="profile"
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />

      {/* 3. Interactive Calendar Screen */}
      <Stack.Screen
        name="calendar"
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />

      {/* 4. Edit Task Screen */}
      <Stack.Screen
        name="edit-task"
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />

      {/* 5. Auth Screen */}
      <Stack.Screen
        name="auth"
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />

      {/* 6. Task Reminder Screen (Opened via Bell icon on Home & Profile) */}
      <Stack.Screen
        name="reminders"
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />

      {/* 7. Terms and Conditions Screen */}
      <Stack.Screen
        name="terms"
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />

      {/* 8. Privacy Policy Screen */}
      <Stack.Screen
        name="privacy"
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />

      {/* 9. Documentation Screen */}
      <Stack.Screen
        name="docs"
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <TaskProvider>
        <RootNavigation />
      </TaskProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAF9',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
