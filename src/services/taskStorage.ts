import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '@/types/task';

const LEGACY_STORAGE_KEY = '@task_manager_tasks_v1';

const getStorageKey = (userId?: string) => {
  if (!userId || userId.startsWith('guest_')) {
    return '@task_manager_tasks_guest';
  }
  return `@task_manager_tasks_${userId}`;
};

const INITIAL_SAMPLE_TASKS: Task[] = [
  {
    id: 'sample-1',
    title: 'Explore Cross-Platform TaskManager',
    description: 'Notice how this screen works seamlessly on both Web and Android.',
    category: 'Work',
    priority: 'high',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    completed: false,
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'sample-2',
    title: 'Set up Android Emulator & Expo Dev Server',
    description: 'Hardware GPU acceleration and Metro bundler configured.',
    category: 'Study',
    priority: 'medium',
    dueDate: new Date().toISOString().split('T')[0],
    completed: true,
    createdAt: Date.now() - 7200000,
    completedAt: Date.now() - 1800000,
  },
  {
    id: 'sample-3',
    title: 'Plan weekend outdoor run',
    description: '5km jog in the morning.',
    category: 'Health',
    priority: 'low',
    dueDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    completed: false,
    createdAt: Date.now() - 10800000,
  },
];

export const TaskStorage = {
  async getTasks(userId?: string): Promise<Task[]> {
    try {
      const key = getStorageKey(userId);
      const data = await AsyncStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
      // If signed-in user, start with clean empty list; Cloud Firestore will sync their tasks
      if (userId && !userId.startsWith('guest_')) {
        return [];
      }
      // Check legacy storage key for seamless initial migration on guest
      const legacy = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          await AsyncStorage.setItem(key, JSON.stringify(parsed));
          return parsed;
        }
      }
      // Seed with initial tasks on fresh install
      await AsyncStorage.setItem(key, JSON.stringify(INITIAL_SAMPLE_TASKS));
      return INITIAL_SAMPLE_TASKS;
    } catch (error) {
      console.error('Failed to load tasks from AsyncStorage', error);
      return [];
    }
  },

  async saveTasks(tasks: Task[], userId?: string): Promise<void> {
    try {
      const key = getStorageKey(userId);
      await AsyncStorage.setItem(key, JSON.stringify(tasks));
      if (!userId || userId.startsWith('guest_')) {
        await AsyncStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(tasks));
      }
    } catch (error) {
      console.error('Failed to save tasks to AsyncStorage', error);
      throw error;
    }
  },

  async clear(userId?: string): Promise<void> {
    try {
      const key = getStorageKey(userId);
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to clear tasks from AsyncStorage', error);
    }
  },

  async recordDeletedTaskId(taskId: string, userId?: string): Promise<void> {
    try {
      const key = `@task_manager_deleted_${userId || 'guest'}`;
      const data = await AsyncStorage.getItem(key);
      const list: string[] = data ? JSON.parse(data) : [];
      if (!list.includes(taskId)) {
        list.push(taskId);
        if (list.length > 150) list.shift();
        await AsyncStorage.setItem(key, JSON.stringify(list));
      }
    } catch {}
  },

  async getDeletedTaskIds(userId?: string): Promise<Set<string>> {
    try {
      const key = `@task_manager_deleted_${userId || 'guest'}`;
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const arr = JSON.parse(data);
        if (Array.isArray(arr)) {
          return new Set(arr);
        }
      }
      return new Set();
    } catch {
      return new Set();
    }
  },
};
