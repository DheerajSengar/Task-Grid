import { z } from 'zod';

export const TaskPrioritySchema = z.enum(['low', 'medium', 'high']);
export const TaskCategorySchema = z.string().default('Work');

export const SubtaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'Subtask title cannot be empty'),
  completed: z.boolean(),
});

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Title too long'),
  subtitle: z.string().optional(),
  description: z.string().max(2000).optional(),
  category: TaskCategorySchema.default('Work'),
  priority: TaskPrioritySchema.default('medium'),
  dueDate: z.string().optional(),
  listName: z.string().optional(),
  isStarred: z.boolean().default(false),
  subtasks: z.array(SubtaskSchema).optional(),
});

export const TaskSchema = CreateTaskSchema.extend({
  id: z.string().min(1),
  userId: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  completed: z.boolean().default(false),
  createdAt: z.number(),
  completedAt: z.number().optional(),
  focusHours: z.number().min(0).optional(),
});

export type ValidatedTask = z.infer<typeof TaskSchema>;
export type ValidatedCreateTask = z.infer<typeof CreateTaskSchema>;
