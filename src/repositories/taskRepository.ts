import { FirestoreService } from '@/services/firestoreService';
import { TaskStorage } from '@/services/taskStorage';
import { Task } from '@/types/task';

export interface ITaskRepository {
  getTasks(userId?: string): Promise<Task[]>;
  saveTask(task: Task, userId?: string): Promise<void>;
  deleteTask(taskId: string, userId?: string): Promise<void>;
  subscribeTasks(
    userId: string,
    onTasksChanged: (tasks: Task[]) => void,
    onError?: (err: any) => void
  ): () => void;
  clearCompletedTasks(userId?: string): Promise<void>;
}

class TaskRepositoryImpl implements ITaskRepository {
  private pendingSaves = new Map<string, Task>();

  /**
   * Retrieves tasks from local offline-first cache (0ms instant access)
   */
  async getTasks(userId?: string): Promise<Task[]> {
    return await TaskStorage.getTasks(userId);
  }

  /**
   * Saves task locally and syncs to Cloud Firestore if user is authenticated
   */
  async saveTask(task: Task, userId?: string): Promise<void> {
    this.pendingSaves.set(task.id, task);

    // 1. Optimistic local persistence
    const currentTasks = await TaskStorage.getTasks(userId);
    const existingIndex = currentTasks.findIndex((t) => t.id === task.id);
    let updatedList: Task[];
    if (existingIndex >= 0) {
      updatedList = currentTasks.map((t) => (t.id === task.id ? task : t));
    } else {
      updatedList = [task, ...currentTasks];
    }
    await TaskStorage.saveTasks(updatedList, userId);

    // 2. Non-blocking Cloud Firestore sync if authenticated (never block UI navigation)
    if (userId && !userId.startsWith('guest_')) {
      FirestoreService.updateTask(task)
        .then(() => {
          this.pendingSaves.delete(task.id);
        })
        .catch((err) => {
          console.warn('[TaskRepository] Cloud sync deferred/failed:', err);
        });
    }
  }

  /**
   * Deletes task locally and from Cloud Firestore
   */
  async deleteTask(taskId: string, userId?: string): Promise<void> {
    // 1. Record deletion tombstone to prevent sync race resurrection
    await TaskStorage.recordDeletedTaskId(taskId, userId);

    // 2. Local delete
    const currentTasks = await TaskStorage.getTasks(userId);
    const updated = currentTasks.filter((t) => t.id !== taskId);
    await TaskStorage.saveTasks(updated, userId);

    // 3. Non-blocking Cloud delete if authenticated
    if (userId && !userId.startsWith('guest_')) {
      FirestoreService.deleteTask(taskId).catch((err) => {
        console.warn('[TaskRepository] Cloud delete deferred/failed:', err);
      });
    }
  }

  /**
   * Sets up real-time bidirectional Firestore subscription
   */
  subscribeTasks(
    userId: string,
    onTasksChanged: (tasks: Task[]) => void,
    onError?: (err: any) => void
  ): () => void {
    if (!userId || userId.startsWith('guest_')) {
      return () => {};
    }

    return FirestoreService.subscribeTasks(
      userId,
      async (remoteTasks) => {
        try {
          // Safe merge: preserve any locally created tasks not yet received from remote
          const localTasks = await TaskStorage.getTasks(userId);
          const deletedIds = await TaskStorage.getDeletedTaskIds(userId);
          const taskMap = new Map<string, Task>();

          // Remote tasks take precedence (excluding any locally deleted tasks)
          remoteTasks.forEach((t) => {
            if (!deletedIds.has(t.id)) {
              taskMap.set(t.id, t);
            }
          });

          // Retain any local tasks or pending in-flight saves not yet in remote and sync them to Firestore
          for (const lt of localTasks) {
            if (!deletedIds.has(lt.id) && !taskMap.has(lt.id)) {
              taskMap.set(lt.id, lt);
              FirestoreService.updateTask({ ...lt, userId }).catch(() => {});
            }
          }
          for (const [id, pt] of this.pendingSaves.entries()) {
            if (!deletedIds.has(id) && (!pt.userId || pt.userId === userId)) {
              taskMap.set(id, pt);
            }
          }

          const mergedTasks = Array.from(taskMap.values()).sort((a, b) => {
            if (a.completed !== b.completed) {
              return a.completed ? 1 : -1;
            }
            return (b.createdAt || 0) - (a.createdAt || 0);
          });

          await TaskStorage.saveTasks(mergedTasks, userId);
          onTasksChanged(mergedTasks);
        } catch (err) {
          console.warn('[TaskRepository] Error merging remote and local tasks:', err);
          onTasksChanged(remoteTasks);
        }
      },
      onError
    );
  }

  /**
   * Clears all completed tasks locally and remotely
   */
  async clearCompletedTasks(userId?: string): Promise<void> {
    const tasks = await TaskStorage.getTasks(userId);
    const completed = tasks.filter((t) => t.completed);
    const remaining = tasks.filter((t) => !t.completed);

    for (const t of completed) {
      await TaskStorage.recordDeletedTaskId(t.id, userId);
    }

    await TaskStorage.saveTasks(remaining, userId);

    if (userId && !userId.startsWith('guest_')) {
      try {
        await FirestoreService.clearCompleted(completed);
      } catch (err) {
        console.warn('[TaskRepository] Cloud batch clear deferred:', err);
      }
    }
  }
}

export const TaskRepository = new TaskRepositoryImpl();
