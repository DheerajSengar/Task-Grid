import { Alert, AlertButton, Platform } from 'react-native';

/**
 * Cross-platform alert and confirmation dialog helper.
 * Delegates to native Alert.alert on Android/iOS, and falls back to
 * window.confirm / window.alert on Web where react-native-web ignores button callbacks.
 */
export function showCrossPlatformAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[]
): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  if (typeof window === 'undefined') {
    return;
  }

  const fullText = message ? `${title}\n\n${message}` : title;

  if (!buttons || buttons.length === 0) {
    window.alert(fullText);
    return;
  }

  const actionableButton =
    buttons.find((b) => b.style === 'destructive') ||
    buttons.find((b) => b.style !== 'cancel' && typeof b.onPress === 'function');

  const cancelButton = buttons.find((b) => b.style === 'cancel');

  if (buttons.length === 1 && !cancelButton) {
    window.alert(fullText);
    buttons[0].onPress?.();
    return;
  }

  if (actionableButton) {
    const confirmed = window.confirm(fullText);
    if (confirmed) {
      actionableButton.onPress?.();
    } else {
      cancelButton?.onPress?.();
    }
    return;
  }

  window.alert(fullText);
}
