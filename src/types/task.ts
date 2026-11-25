export type TaskPriority = 'low' | 'medium' | 'high';

export type TaskCategory = 'Work' | 'Personal' | 'Study' | 'Health' | 'Urgent' | 'Other' | string;

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskAttachment {
  id: string;
  name: string;
  size?: number; // bytes
  formattedSize?: string; // e.g. "124 kb"
  url: string;
  storagePath: string;
  mimeType?: string;
  uploadedAt: number;
}

export interface TeamMember {
  id: string;
  name: string;
  avatarUrl?: string;
  role?: string;
}

export interface Task {
  id: string;
  userId?: string;
  title: string;
  subtitle?: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  dueDate?: string; // e.g. YYYY-MM-DD or formatted string
  progress?: number; // 0 - 100
  completed: boolean;
  isCompleted?: boolean;
  hasReminder?: boolean;
  isStarred?: boolean;
  subtasks?: Subtask[];
  listName?: string;
  createdAt: number;
  completedAt?: number;
  attachments?: TaskAttachment[];
  teamMembers?: TeamMember[];
  focusHours?: number; // Total hours spent focusing on this task
  weeklyActivity?: { day: string; hours: number }[]; // Mon..Sun hours
}

export type TaskFilter = 'all' | 'pending' | 'completed';

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  highPriority: number;
  activeReminders?: number;
}

export const CATEGORIES: TaskCategory[] = [
  'Work',
  'Personal',
  'Study',
  'Health',
  'Urgent',
  'Other',
];

export const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];
