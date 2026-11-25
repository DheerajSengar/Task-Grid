import { useAuth } from '@/context/AuthContext';
import { TaskRepository } from '@/repositories/taskRepository';
import { NotificationService } from '@/services/notificationService';
import { Task, TaskCategory, TaskFilter, TaskStats } from '@/types/task';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface TaskContextType {
  tasks: Task[];
  filteredTasks: Task[];
  loading: boolean;
  isCloudConnected: boolean;
  filter: TaskFilter;
  selectedCategory: TaskCategory | 'All';
  searchQuery: string;
  stats: TaskStats;
  taskLists: string[];
  createList: (name: string) => Promise<void>;
  renameList: (oldName: string, newName: string) => Promise<void>;
  deleteList: (name: string) => Promise<void>;
  setFilter: (filter: TaskFilter) => void;
  setSelectedCategory: (category: TaskCategory | 'All') => void;
  setSearchQuery: (query: string) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => Promise<string | void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  toggleStarred: (id: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  clearCompleted: () => Promise<void>;
  scheduleReminder: (
    taskId: string,
    options?: { delaySeconds?: number; targetDate?: Date }
  ) => Promise<boolean>;
  refreshTasks: () => Promise<void>;
}

const defaultTaskStats: TaskStats = {
  total: 0,
  completed: 0,
  pending: 0,
  highPriority: 0,
  activeReminders: 0,
};

const defaultTaskContext: TaskContextType = {
  tasks: [],
  filteredTasks: [],
  loading: true,
  isCloudConnected: false,
  filter: 'all',
  selectedCategory: 'All',
  searchQuery: '',
  stats: defaultTaskStats,
  taskLists: ['My Tasks', 'Work', 'Personal', 'Shopping list'],
  createList: async () => { },
  renameList: async () => { },
  deleteList: async () => { },
  setFilter: () => { },
  setSelectedCategory: () => { },
  setSearchQuery: () => { },
  addTask: async () => { },
  updateTask: async () => { },
  deleteTask: async () => { },
  toggleTask: async () => { },
  toggleStarred: async () => { },
  toggleSubtask: async () => { },
  clearCompleted: async () => { },
  scheduleReminder: async () => false,
  refreshTasks: async () => { },
};

const TaskContext = createContext<TaskContextType>(defaultTaskContext);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRemindersCount, setActiveRemindersCount] = useState(0);

  // 1. Initial 0ms Local Cache Load via TaskRepository
  const loadLocalTasks = useCallback(async (uid?: string) => {
    try {
      const stored = await TaskRepository.getTasks(uid);
      setTasks(stored);
    } catch (error) {
      console.error('[TaskContext] Error loading tasks from local cache', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update active reminders count
  const refreshRemindersCount = useCallback(async () => {
    try {
      const active = await NotificationService.getAllActiveReminders();
      setActiveRemindersCount(active.length);
    } catch {
      setActiveRemindersCount(0);
    }
  }, []);

  // Dynamic Task Lists Management
  const DEFAULT_LISTS = useMemo(() => ['My Tasks', 'Work', 'Personal', 'Shopping list'], []);
  const [persistedLists, setPersistedLists] = useState<string[]>(DEFAULT_LISTS);

  const loadLists = useCallback(async (uid?: string) => {
    try {
      const key = uid ? `@task_manager_lists_${uid}` : '@task_manager_lists_guest';
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPersistedLists(parsed);
          return;
        }
      }
      setPersistedLists(DEFAULT_LISTS);
    } catch {
      setPersistedLists(DEFAULT_LISTS);
    }
  }, [DEFAULT_LISTS]);

  const saveLists = async (lists: string[], uid?: string) => {
    setPersistedLists(lists);
    try {
      const key = uid ? `@task_manager_lists_${uid}` : '@task_manager_lists_guest';
      await AsyncStorage.setItem(key, JSON.stringify(lists));
    } catch (err) {
      console.warn('Failed to persist task lists:', err);
    }
  };

  // 2. Real-time Cloud Sync Subscription via TaskRepository
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const currentUid = user?.uid;

    queueMicrotask(() => {
      loadLocalTasks(currentUid);
      loadLists(currentUid);
      refreshRemindersCount();
    });

    if (!currentUid || currentUid.startsWith('guest_')) {
      queueMicrotask(() => {
        setIsCloudConnected(false);
      });
      return;
    }

    try {
      unsubscribe = TaskRepository.subscribeTasks(
        currentUid,
        (cloudTasks) => {
          setIsCloudConnected(true);
          setTasks(cloudTasks);
          setLoading(false);
        },
        (error) => {
          console.warn('[TaskContext] Firestore listener error, using local cache:', error?.message);
          setIsCloudConnected(false);
          loadLocalTasks(currentUid);
        }
      );
    } catch (err) {
      console.warn('[TaskContext] Could not initialize Firestore listener:', err);
      queueMicrotask(() => {
        setIsCloudConnected(false);
        loadLocalTasks(currentUid);
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.uid, loadLocalTasks, refreshRemindersCount, loadLists]);

  // 3. Optimistic Add Task
  const addTask = async (data: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    const targetUid = user?.uid;
    const createdId = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);

    const newTask: Task = {
      ...data,
      id: createdId,
      userId: targetUid,
      completed: false,
      createdAt: Date.now(),
    };

    // Optimistic UI update
    setTasks((prev) => [newTask, ...prev]);

    // Save through repository (local + cloud)
    await TaskRepository.saveTask(newTask, targetUid);

    // Automatically schedule a smart reminder if due date is provided (non-blocking)
    if (data.dueDate) {
      NotificationService.scheduleReminderForTask({
        id: createdId,
        title: data.title,
        dueDate: data.dueDate,
        priority: data.priority,
      })
        .then(() => refreshRemindersCount())
        .catch(() => {});
    }

    return createdId;
  };

  // 4. Optimistic Update Task
  const updateTask = useCallback(
    async (updatedTask: Task) => {
      // Optimistic UI update
      setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));

      // Persist through repository
      await TaskRepository.saveTask(updatedTask, user?.uid);

      // Update reminder if needed (non-blocking)
      if (updatedTask.dueDate && !updatedTask.completed) {
        NotificationService.scheduleReminderForTask(updatedTask)
          .then(() => refreshRemindersCount())
          .catch(() => {});
      }
    },
    [user?.uid, refreshRemindersCount]
  );

  // 5. Optimistic Delete Task
  const deleteTask = useCallback(
    async (id: string) => {
      // Cancel notification
      await NotificationService.cancelReminder(id);
      refreshRemindersCount();

      // Optimistic UI update
      setTasks((prev) => prev.filter((t) => t.id !== id));

      // Persist through repository
      await TaskRepository.deleteTask(id, user?.uid);
    },
    [user?.uid, refreshRemindersCount]
  );

  // 6. Optimistic Toggle Task Completion
  const toggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const nextCompleted = !task.completed;

    if (nextCompleted) {
      await NotificationService.cancelReminder(id);
      refreshRemindersCount();
    }

    const updatedTask: Task = {
      ...task,
      completed: nextCompleted,
      progress: nextCompleted ? 100 : 0,
      completedAt: nextCompleted ? Date.now() : undefined,
    };

    const updatedList = tasks.map((t) => (t.id === id ? updatedTask : t));
    setTasks(updatedList);

    await TaskRepository.saveTask(updatedTask, user?.uid);
  };

  // 7. Optimistic Toggle Starred
  const toggleStarred = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const nextStarred = !task.isStarred;
    const updatedTask: Task = {
      ...task,
      isStarred: nextStarred,
      priority: nextStarred ? 'high' : (task.priority === 'high' ? 'medium' : task.priority),
    };

    const updatedList = tasks.map((t) => (t.id === id ? updatedTask : t));
    setTasks(updatedList);

    await TaskRepository.saveTask(updatedTask, user?.uid);
  };

  // 8. Optimistic Toggle Subtask
  const toggleSubtask = async (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.subtasks) return;

    const nextSubtasks = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    const completedCount = nextSubtasks.filter((st) => st.completed).length;
    const progress = Math.round((completedCount / nextSubtasks.length) * 100);

    const updatedTask: Task = {
      ...task,
      subtasks: nextSubtasks,
      progress,
    };

    const updatedList = tasks.map((t) => (t.id === taskId ? updatedTask : t));
    setTasks(updatedList);

    await TaskRepository.saveTask(updatedTask, user?.uid);
  };

  // 9. Clear Completed
  const clearCompleted = async () => {
    const activeOnly = tasks.filter((t) => !t.completed);
    setTasks(activeOnly);

    await TaskRepository.clearCompletedTasks(user?.uid);
  };

  // 10. Schedule Reminder Helper
  const scheduleReminder = async (
    taskId: string,
    options?: { delaySeconds?: number; targetDate?: Date }
  ): Promise<boolean> => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return false;

    const notifId = await NotificationService.scheduleReminderForTask(task, options);
    refreshRemindersCount();
    return !!notifId;
  };

  // 11. Dynamic Task Lists Management
  const taskLists = useMemo(() => {
    const listSet = new Set<string>(persistedLists);
    tasks.forEach((t) => {
      if (t.listName && t.listName !== 'starred') listSet.add(t.listName);
      if (t.category && typeof t.category === 'string' && t.category !== 'Other' && t.category !== 'All') {
        listSet.add(t.category);
      }
    });
    return Array.from(listSet);
  }, [persistedLists, tasks]);

  const createList = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      if (!persistedLists.includes(trimmed)) {
        const updated = [...persistedLists, trimmed];
        await saveLists(updated, user?.uid);
      }
    },
    [persistedLists, user?.uid]
  );

  const renameList = useCallback(
    async (oldName: string, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed || trimmed === oldName) return;
      const updated = persistedLists.map((l) => (l === oldName ? trimmed : l));
      await saveLists(updated, user?.uid);

      // Update all tasks that belonged to oldName
      const toUpdate = tasks.filter((t) => t.category === oldName || t.listName === oldName);
      for (const t of toUpdate) {
        await updateTask({
          ...t,
          category: trimmed as any,
          listName: trimmed,
        });
      }
    },
    [persistedLists, tasks, user?.uid, updateTask]
  );

  const deleteList = useCallback(
    async (name: string) => {
      const updated = persistedLists.filter((l) => l !== name);
      const finalLists = updated.length > 0 ? updated : ['My Tasks'];
      await saveLists(finalLists, user?.uid);

      // Delete all tasks in this list
      const toDelete = tasks.filter(
        (t) =>
          (name === 'My Tasks' && (!t.category || t.category === 'Work' || t.category === 'Other')) ||
          t.category === name ||
          t.listName === name
      );
      for (const t of toDelete) {
        await deleteTask(t.id);
      }
    },
    [persistedLists, tasks, user?.uid, deleteTask]
  );

  // 11. Refresh Tasks
  const refreshTasks = async () => {
    await loadLocalTasks();
  };

  // Computed: Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filter === 'pending' && task.completed) return false;
      if (filter === 'completed' && !task.completed) return false;
      if (selectedCategory !== 'All' && task.category !== selectedCategory) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = task.description?.toLowerCase().includes(query) ?? false;
        return matchesTitle || matchesDesc;
      }

      return true;
    });
  }, [tasks, filter, selectedCategory, searchQuery]);

  // Computed: Stats
  const stats = useMemo<TaskStats>(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const highPriority = tasks.filter((t) => t.priority === 'high' && !t.completed).length;

    return {
      total,
      completed,
      pending,
      highPriority,
      activeReminders: activeRemindersCount,
    };
  }, [tasks, activeRemindersCount]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        filteredTasks,
        loading,
        isCloudConnected,
        filter,
        selectedCategory,
        searchQuery,
        stats,
        setFilter,
        setSelectedCategory,
        setSearchQuery,
        addTask,
        updateTask,
        deleteTask,
        toggleTask,
        toggleStarred,
        toggleSubtask,
        clearCompleted,
        scheduleReminder,
        refreshTasks,
        taskLists,
        createList,
        renameList,
        deleteList,
      }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}
