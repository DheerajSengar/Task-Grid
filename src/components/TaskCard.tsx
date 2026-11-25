import { Task } from '@/types/task';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleStarred?: (id: string) => void;
  onEdit?: (task: Task) => void;
  onPress?: (task: Task) => void;
}

export function TaskCard({
  task,
  onToggle,
  onDelete,
  onToggleStarred,
  onEdit,
  onPress,
}: TaskCardProps) {
  const isCompleted = task.completed || false;
  const isStarred = !!task.isStarred;

  const subtasksCount = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;

  const handleToggle = () => {
    try {
      Haptics.notificationAsync(
        isCompleted
          ? Haptics.NotificationFeedbackType.Warning
          : Haptics.NotificationFeedbackType.Success
      );
    } catch {}
    onToggle(task.id);
  };

  const handleStar = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onToggleStarred?.(task.id);
  };

  const handlePress = () => {
    if (onEdit) {
      onEdit(task);
    } else if (onPress) {
      onPress(task);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.rowContainer,
        isCompleted && styles.rowCompleted,
        pressed && styles.rowPressed,
      ]}
      onPress={handlePress}>
      {/* 1. Left: Circular Checkbox (Google Tasks Style) */}
      <Pressable
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        onPress={handleToggle}
        style={[
          styles.checkbox,
          isCompleted && styles.checkboxCompleted,
        ]}>
        {isCompleted && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
      </Pressable>

      {/* 2. Middle: Title & Meta Info */}
      <View style={styles.textContainer}>
        <Text
          numberOfLines={2}
          style={[styles.title, isCompleted && styles.titleCompleted]}>
          {task.title}
        </Text>

        {/* Optional Subtitle / Meta row */}
        {(task.dueDate || task.description || subtasksCount > 0) && (
          <View style={styles.metaRow}>
            {task.dueDate ? (
              <View style={styles.dateChip}>
                <Ionicons
                  name="time-outline"
                  size={12}
                  color={isCompleted ? '#9CA3AF' : '#059669'}
                  style={{ marginRight: 3 }}
                />
                <Text
                  style={[
                    styles.dateChipText,
                    isCompleted && styles.dateChipTextCompleted,
                  ]}>
                  {task.dueDate}
                </Text>
              </View>
            ) : null}

            {subtasksCount > 0 ? (
              <View style={styles.subtaskChip}>
                <Ionicons
                  name="git-commit-outline"
                  size={12}
                  color={isCompleted ? '#9CA3AF' : '#6B7280'}
                  style={{ marginRight: 3 }}
                />
                <Text style={styles.subtaskChipText}>
                  {completedSubtasks}/{subtasksCount}
                </Text>
              </View>
            ) : null}

            {task.description && !task.dueDate ? (
              <Text numberOfLines={1} style={styles.descSnippet}>
                {task.description}
              </Text>
            ) : null}
          </View>
        )}
      </View>

      {/* 3. Right: Star / Favorite Toggle */}
      <Pressable
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        onPress={handleStar}
        style={styles.starBtn}>
        <Ionicons
          name={isStarred ? 'star' : 'star-outline'}
          size={20}
          color={isStarred ? '#10B981' : '#9CA3AF'}
        />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
      },
    }),
  },
  rowCompleted: {
    opacity: 0.6,
  },
  rowPressed: {
    backgroundColor: '#F9FAFB',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    backgroundColor: 'transparent',
  },
  checkboxCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    lineHeight: 21,
    letterSpacing: -0.1,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  dateChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
  },
  dateChipTextCompleted: {
    color: '#9CA3AF',
  },
  subtaskChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  subtaskChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#4B5563',
  },
  descSnippet: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  starBtn: {
    padding: 4,
    marginLeft: 6,
  },
});
