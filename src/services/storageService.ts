import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { TaskAttachment } from '@/types/task';

/**
 * Format raw byte size into human-readable string (e.g. 124 kb, 2.4 mb)
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '124 kb';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kb`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} mb`;
}

export const StorageService = {
  /**
   * Prompt user to pick a document (PDF, DOC, text, etc.)
   */
  async pickDocument(): Promise<DocumentPicker.DocumentPickerAsset | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0];
      }
      return null;
    } catch (error) {
      console.warn('Error picking document:', error);
      return null;
    }
  },

  /**
   * Prompt user to pick an image from photo library
   */
  async pickImage(): Promise<ImagePicker.ImagePickerAsset | null> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Media library permission not granted');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // If base64 is available, produce a universal data URI compatible across web and mobile
        if (asset.base64) {
          return {
            ...asset,
            uri: `data:image/jpeg;base64,${asset.base64}`,
          };
        }
        return asset;
      }
      return null;
    } catch (error) {
      console.warn('Error picking image:', error);
      return null;
    }
  },

  /**
   * Upload an asset.
   * Completely free local storage: saves file locally without needing any paid Firebase plan.
   */
  async uploadTaskAttachment(
    taskId: string,
    fileUri: string,
    fileName: string,
    mimeType?: string,
    size?: number
  ): Promise<TaskAttachment> {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `local://tasks/${taskId}/${timestamp}_${sanitizedFileName}`;

    // Cache locally for offline and free access
    const attachment: TaskAttachment = {
      id: `att_${timestamp}`,
      name: fileName,
      size: size ?? 128000,
      formattedSize: formatFileSize(size ?? 128000),
      url: fileUri,
      storagePath,
      mimeType: mimeType || 'application/octet-stream',
      uploadedAt: timestamp,
    };

    try {
      await AsyncStorage.setItem(`@att_${attachment.id}`, JSON.stringify(attachment));
    } catch {}

    return attachment;
  },

  /**
   * Delete an attachment from local storage
   */
  async deleteAttachment(storagePath: string): Promise<boolean> {
    try {
      // Find and remove local key if any
      const keys = await AsyncStorage.getAllKeys();
      const match = keys.find((k) => k.includes(storagePath));
      if (match) {
        await AsyncStorage.removeItem(match);
      }
      return true;
    } catch (error) {
      console.warn('Error deleting local attachment:', error);
      return false;
    }
  },

  /**
   * Upload and persist user avatar locally (100% free, zero cloud fees).
   */
  async uploadUserAvatar(userId: string, imageUri: string): Promise<string> {
    try {
      await AsyncStorage.setItem(`@user_avatar_${userId}`, imageUri);
    } catch {}
    return imageUri;
  },

  /**
   * Retrieve cached avatar for a user
   */
  async getUserAvatar(userId: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(`@user_avatar_${userId}`);
    } catch {
      return null;
    }
  },
};
