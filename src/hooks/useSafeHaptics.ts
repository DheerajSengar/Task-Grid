import * as Haptics from 'expo-haptics';

export const SafeHaptics = {
  impact: (style = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      Haptics.impactAsync(style).catch(() => {});
    } catch {}
  },
  selection: () => {
    try {
      Haptics.selectionAsync().catch(() => {});
    } catch {}
  },
  notification: (type = Haptics.NotificationFeedbackType.Success) => {
    try {
      Haptics.notificationAsync(type).catch(() => {});
    } catch {}
  },
};
