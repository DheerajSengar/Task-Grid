import { TaskPriority } from '@/types/task';

export interface CategoryMeta {
  color: string;
  bgColor: string;
  icon: string;
}

export const CATEGORY_CONFIG: Record<string, CategoryMeta> = {
  Work: {
    color: '#2563EB',
    bgColor: '#EFF6FF',
    icon: 'briefcase-outline',
  },
  Personal: {
    color: '#059669',
    bgColor: '#ECFDF5',
    icon: 'person-outline',
  },
  Study: {
    color: '#7C3AED',
    bgColor: '#F5F3FF',
    icon: 'book-outline',
  },
  Health: {
    color: '#0D9488',
    bgColor: '#F0FDFA',
    icon: 'heart-outline',
  },
  Urgent: {
    color: '#DC2626',
    bgColor: '#FEF2F2',
    icon: 'flame-outline',
  },
  Other: {
    color: '#64748B',
    bgColor: '#F8FAFC',
    icon: 'bookmark-outline',
  },
};

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bgColor: string }> = {
  high: {
    label: 'High',
    color: '#DC2626',
    bgColor: '#FEE2E2',
  },
  medium: {
    label: 'Med',
    color: '#D97706',
    bgColor: '#FEF3C7',
  },
  low: {
    label: 'Low',
    color: '#475569',
    bgColor: '#F1F5F9',
  },
};
