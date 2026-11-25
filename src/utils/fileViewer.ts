import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { TaskAttachment } from '@/types/task';

/**
 * Checks if an attachment is an image based on mimeType, extension, or data URL
 */
export function isImageAttachment(att: TaskAttachment): boolean {
  if (att.mimeType?.startsWith('image/')) return true;
  if (/\.(png|jpe?g|webp|gif|bmp|svg|heic)$/i.test(att.name)) return true;
  if (att.url?.startsWith('data:image')) return true;
  return false;
}

/**
 * Opens any attachment (photo, PDF, document) across Web, Android, and iOS
 */
export async function openAttachmentFile(att: TaskAttachment): Promise<void> {
  const url = att.url;
  if (!url) return;

  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        const win = window.open(url, '_blank');
        if (win) {
          win.focus();
        } else {
          // If popup blocked, create anchor element and click
          const a = document.createElement('a');
          a.href = url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.download = att.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      }
    } else {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        await WebBrowser.openBrowserAsync(url);
      } else {
        await Linking.openURL(url);
      }
    }
  } catch (error) {
    console.warn('Error opening attachment file:', error);
    try {
      await Linking.openURL(url);
    } catch (fallbackError) {
      console.warn('Fallback linking also failed:', fallbackError);
    }
  }
}
