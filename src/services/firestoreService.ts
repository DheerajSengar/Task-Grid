import { auth, db } from '@/services/firebase';
import { Task, TaskCategory, TaskPriority } from '@/types/task';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  Timestamp,
  where,
  writeBatch,
} from 'firebase/firestore';

const TASKS_COLLECTION = 'tasks';
const USERS_COLLECTION = 'users';

function mapDocToTask(id: string, data: any): Task {
  let createdAt = Date.now();
  if (data.createdAt) {
    if (typeof data.createdAt.toMillis === 'function') {
      createdAt = data.createdAt.toMillis();
    } else if (typeof data.createdAt === 'number') {
      createdAt = data.createdAt;
    }
  }

  const completed = data.completed ?? data.isCompleted ?? false;
  const category: TaskCategory = data.category || 'Work';
  const priority: TaskPriority = data.priority || 'medium';
  const progress =
    typeof data.progress === 'number'
      ? data.progress
      : completed
        ? 100
        : 0;

  return {
    id,
    userId: data.userId || undefined,
    title: data.title || 'Untitled Task',
    subtitle: data.subtitle || '',
    description: data.description || '',
    category,
    priority,
    dueDate: data.dueDate || '',
    progress,
    completed,
    isCompleted: completed,
    isStarred: !!data.isStarred,
    subtasks: Array.isArray(data.subtasks) ? data.subtasks : [],
    listName: data.listName || 'My Tasks',
    createdAt,
    completedAt: data.completedAt || undefined,
    attachments: data.attachments || [],
    teamMembers: data.teamMembers || [],
    focusHours: typeof data.focusHours === 'number' ? data.focusHours : undefined,
    weeklyActivity: Array.isArray(data.weeklyActivity) ? data.weeklyActivity : undefined,
  };
}

export interface UserCloudProfile {
  avatarUrl?: string;
  displayName?: string;
  fcmToken?: string;
  updatedAt?: number;
}

export const FirestoreService = {
  /**
   * Real-time subscription to the Firestore 'tasks' collection.
   * Scoped to the current authenticated user. If no userId is present, does not issue unauthorized requests.
   */
  subscribeTasks(
    userId: string | undefined,
    onSuccess: (tasks: Task[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const effectiveUid = userId || auth.currentUser?.uid;

    if (!effectiveUid) {
      // Do not perform unscoped root queries when unauthenticated
      return () => { };
    }

    const tasksRef = collection(db, TASKS_COLLECTION);
    const tasksQuery = query(tasksRef, where('userId', '==', effectiveUid));

    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const tasks: Task[] = [];
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          // Filter out special profile documents
          if (data.type === 'user_profile' || docSnap.id.startsWith('profile_')) {
            return;
          }
          tasks.push(mapDocToTask(docSnap.id, data));
        });

        // Sort: pending first, then by creation date descending
        tasks.sort((a, b) => {
          if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
          }
          return b.createdAt - a.createdAt;
        });

        onSuccess(tasks);
      },
      (error) => {
        console.warn('Firestore subscription error:', error.message);
        onError?.(error);
      }
    );

    return unsubscribe;
  },

  /**
   * Adds a new task directly to Cloud Firestore with userId scoping.
   */
  async addTask(
    data: Omit<Task, 'id' | 'createdAt' | 'completed'>,
    userId?: string
  ): Promise<string> {
    const effectiveUid = userId || auth.currentUser?.uid;
    if (!effectiveUid) {
      throw new Error('User must be authenticated to add tasks to Cloud Firestore.');
    }

    const tasksRef = collection(db, TASKS_COLLECTION);
    const docRef = await addDoc(tasksRef, {
      userId: effectiveUid,
      title: data.title,
      subtitle: data.subtitle || '',
      description: data.description || '',
      category: data.category || 'Work',
      priority: data.priority || 'medium',
      dueDate: data.dueDate || '',
      progress: data.progress ?? 0,
      completed: false,
      isCompleted: false,
      isStarred: !!data.isStarred,
      subtasks: data.subtasks || [],
      listName: data.listName || 'My Tasks',
      attachments: data.attachments || [],
      teamMembers: data.teamMembers || [],
      focusHours: data.focusHours ?? 0,
      weeklyActivity: data.weeklyActivity || null,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  },

  /**
   * Toggles completion status in the cloud.
   */
  async toggleTask(id: string, currentCompleted: boolean): Promise<void> {
    const taskRef = doc(db, TASKS_COLLECTION, id);
    const nextCompleted = !currentCompleted;
    await setDoc(
      taskRef,
      {
        completed: nextCompleted,
        isCompleted: nextCompleted,
        progress: nextCompleted ? 100 : 0,
        completedAt: nextCompleted ? Timestamp.now() : null,
      },
      { merge: true }
    );
  },

  /**
   * Upserts task details in Cloud Firestore.
   * Uses setDoc with merge: true so new tasks with client-generated IDs are created seamlessly.
   */
  async updateTask(task: Task): Promise<void> {
    const taskRef = doc(db, TASKS_COLLECTION, task.id);
    const effectiveUid = task.userId || auth.currentUser?.uid || '';
    const createdAtTimestamp =
      task.createdAt && typeof task.createdAt === 'number'
        ? Timestamp.fromMillis(task.createdAt)
        : Timestamp.now();

    await setDoc(
      taskRef,
      {
        userId: effectiveUid,
        title: task.title,
        subtitle: task.subtitle || '',
        description: task.description || '',
        category: task.category,
        priority: task.priority,
        dueDate: task.dueDate || '',
        progress: task.progress ?? (task.completed ? 100 : 0),
        completed: task.completed,
        isCompleted: task.completed,
        isStarred: !!task.isStarred,
        subtasks: task.subtasks || [],
        listName: task.listName || 'My Tasks',
        attachments: task.attachments || [],
        teamMembers: task.teamMembers || [],
        createdAt: createdAtTimestamp,
        ...(typeof task.focusHours === 'number' ? { focusHours: task.focusHours } : {}),
        ...(task.weeklyActivity ? { weeklyActivity: task.weeklyActivity } : {}),
      },
      { merge: true }
    );
  },

  /**
   * Deletes a task document from Firestore.
   */
  async deleteTask(id: string): Promise<void> {
    const taskRef = doc(db, TASKS_COLLECTION, id);
    await deleteDoc(taskRef);
  },

  /**
   * Clears all completed tasks in a single batch.
   */
  async clearCompleted(completedTasks: Task[]): Promise<void> {
    const batch = writeBatch(db);
    completedTasks.forEach((task) => {
      const taskRef = doc(db, TASKS_COLLECTION, task.id);
      batch.delete(taskRef);
    });
    await batch.commit();
  },

  /**
   * Universal User Profile in Firestore
   * Stores avatar URL and display name scoped to user in the dedicated 'users' collection.
   */
  async saveUserProfile(
    userId: string,
    profile: { avatarUrl?: string; displayName?: string; fcmToken?: string; updatedAt?: number }
  ): Promise<void> {
    if (!userId) return;
    const userRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(
      userRef,
      {
        userId,
        ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
        ...(profile.displayName ? { displayName: profile.displayName } : {}),
        ...(profile.fcmToken ? { fcmToken: profile.fcmToken } : {}),
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  },

  /**
   * Subscribe to real-time User Profile changes (avatar, name) across all devices
   */
  subscribeUserProfile(
    userId: string | undefined,
    onUpdate: (profile: UserCloudProfile) => void
  ): () => void {
    const effectiveUid = userId || auth.currentUser?.uid;
    if (!effectiveUid) return () => { };

    const userRef = doc(db, USERS_COLLECTION, effectiveUid);
    return onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          onUpdate({
            avatarUrl: data.avatarUrl,
            displayName: data.displayName,
            fcmToken: data.fcmToken,
            updatedAt: data.updatedAt?.toMillis?.() || Date.now(),
          });
        }
      },
      (err) => {
        console.warn('User profile subscription warning:', err.message);
      }
    );
  },

  /**
   * Fetch user profile once from cloud (with fallback for legacy documents)
   */
  async getUserProfile(userId: string): Promise<UserCloudProfile | null> {
    try {
      // 1. Try dedicated users collection
      const userRef = doc(db, USERS_COLLECTION, userId);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          avatarUrl: data.avatarUrl,
          displayName: data.displayName,
          fcmToken: data.fcmToken,
        };
      }

      // 2. Fallback to legacy profile_ in tasks collection if needed
      const legacyRef = doc(db, TASKS_COLLECTION, `profile_${userId}`);
      const legacySnap = await getDoc(legacyRef);
      if (legacySnap.exists()) {
        const data = legacySnap.data();
        return {
          avatarUrl: data.avatarUrl,
          displayName: data.displayName,
          fcmToken: data.fcmToken,
        };
      }
      return null;
    } catch {
      return null;
    }
  },
};
