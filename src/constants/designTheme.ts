import { TaskCategory } from '@/types/task';

export interface PastelPalette {
  bg: string;
  text: string;
  accent: string;
  darkText: string;
  tagBg: string;
  tagText: string;
}

export const DesignTheme = {
  colors: {
    // 1. LIGHT BASE (Pure light, clean surfaces)
    background: '#F8FAF9',
    surface: '#FFFFFF',
    surfaceSecondary: '#F1F5F2',
    surfaceHighlight: '#E8F9EE',
    border: '#E5E9E7',
    borderLight: '#EFF2F0',

    // Text colors (Dark text on light surfaces)
    textPrimary: '#111827',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',

    // 2. GREEN ACCENT (The only color in the palette)
    primary: '#10B981',
    primaryDark: '#065F46',
    primaryLight: '#E8F9EE',
    primaryTint: '#D1FADF',

    // Green colorway for tasks & cards
    mint: {
      bg: '#D1FADF',
      text: '#065F46',
      accent: '#10B981',
      darkText: '#064E3B',
      tagBg: '#10B981',
      tagText: '#FFFFFF',
    },
    // Consistent green palettes for all categories (light and green only)
    lavender: {
      bg: '#E8F9EE',
      text: '#065F46',
      accent: '#10B981',
      darkText: '#064E3B',
      tagBg: '#059669',
      tagText: '#FFFFFF',
    },
    butter: {
      bg: '#E8F9EE',
      text: '#065F46',
      accent: '#10B981',
      darkText: '#064E3B',
      tagBg: '#10B981',
      tagText: '#FFFFFF',
    },
    coral: {
      bg: '#E8F9EE',
      text: '#065F46',
      accent: '#10B981',
      darkText: '#064E3B',
      tagBg: '#059669',
      tagText: '#FFFFFF',
    },
    sky: {
      bg: '#E8F9EE',
      text: '#065F46',
      accent: '#10B981',
      darkText: '#064E3B',
      tagBg: '#10B981',
      tagText: '#FFFFFF',
    },
  },
  borderRadius: {
    sm: 8,
    md: 14,
    lg: 20,
    xl: 26,
    full: 9999,
  },
};

export const CATEGORY_PASTELS: Record<TaskCategory, PastelPalette> = {
  Work: DesignTheme.colors.lavender,
  Personal: DesignTheme.colors.mint,
  Study: DesignTheme.colors.butter,
  Health: DesignTheme.colors.sky,
  Urgent: DesignTheme.colors.coral,
  Other: DesignTheme.colors.lavender,
};
