import { DateTimePickerModal } from '@/components/DateTimePickerModal';
import { useTasks } from '@/context/TaskContext';
import { Subtask } from '@/types/task';
import { showCrossPlatformAlert } from '@/utils/platformAlert';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewTaskScreen() {
  const { date, list } = useLocalSearchParams<{ date?: string; list?: string }>();
  const { addTask, taskLists } = useTasks();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(
    list && taskLists.includes(list) ? list : (taskLists[0] || 'My Tasks')
  );
  const [dueDate, setDueDate] = useState(date || '');
  const [isStarred, setIsStarred] = useState(false);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [prevListParam, setPrevListParam] = useState(list);
  const [prevDateParam, setPrevDateParam] = useState(date);

  if (list !== prevListParam) {
    setPrevListParam(list);
    if (list && taskLists.includes(list)) {
      setCategory(list);
    }
  }

  if (date !== prevDateParam) {
    setPrevDateParam(date);
    if (date) {
      setDueDate(date);
    }
  }

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch { }
      showCrossPlatformAlert('Required', 'Please enter a task title.');
      return;
    }

    try {
      setIsSubmitting(true);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch { }

      await addTask({
        title: trimmedTitle,
        description: description.trim() || undefined,
        category: category as any,
        listName: category,
        dueDate: dueDate || undefined,
        isStarred,
        priority: isStarred ? 'high' : 'medium',
        subtasks,
      });

      const savedCategory = category;

      // Reset form state for next visit
      setTitle('');
      setDescription('');
      setDueDate('');
      setIsStarred(false);
      setSubtasks([]);

      router.replace({ pathname: '/tabs', params: { list: savedCategory } });
    } catch (err) {
      console.error('Error creating task:', err);
      showCrossPlatformAlert('Error', 'Failed to create task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/tabs');
    }
  };

  const handleAddSubtask = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch { }
    const newSubtask: Subtask = {
      id: 'sub_' + Date.now().toString(36),
      title: '',
      completed: false,
    };
    setSubtasks((prev) => [...prev, newSubtask]);
  };

  const handleToggleSubtask = (subId: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === subId ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleUpdateSubtaskTitle = (subId: string, text: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === subId ? { ...s, title: text } : s))
    );
  };

  const handleRemoveSubtask = (subId: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== subId));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Top Action Bar */}
        <View style={styles.headerBar}>
          <Pressable onPress={handleClose} style={styles.iconBtn}>
            <Ionicons name="close" size={24} color="#1F2937" />
          </Pressable>

          {/* List Selector Dropdown (e.g. My Tasks ▾) */}
          <Pressable
            onPress={() => setIsCategoryModalOpen(true)}
            style={styles.listDropdownBtn}>
            <Text style={styles.listDropdownText}>{category}</Text>
            <Ionicons name="caret-down" size={12} color="#10B981" />
          </Pressable>

          <View style={styles.headerRightActions}>
            {/* Star toggle */}
            <Pressable
              hitSlop={8}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch { }
                setIsStarred(!isStarred);
              }}
              style={styles.iconBtn}>
              <Ionicons
                name={isStarred ? 'star' : 'star-outline'}
                size={22}
                color={isStarred ? '#10B981' : '#6B7280'}
              />
            </Pressable>

            {/* Google Tasks style Header Save Button */}
            <Pressable
              onPress={handleSave}
              disabled={isSubmitting || !title.trim()}
              style={({ pressed }) => [
                styles.headerSaveBtn,
                (!title.trim() || isSubmitting) && styles.headerSaveBtnDisabled,
                pressed && { opacity: 0.8 },
              ]}>
              <Text
                style={[
                  styles.headerSaveText,
                  (!title.trim() || isSubmitting) && styles.headerSaveTextDisabled,
                ]}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* 1. Large Task Title Input */}
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="New task"
            placeholderTextColor="#9CA3AF"
            style={styles.titleInput}
            autoFocus
            multiline
          />

          {/* 2. Details Row */}
          <View style={styles.detailRow}>
            <Ionicons name="menu-outline" size={22} color="#6B7280" style={styles.rowIcon} />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add details"
              placeholderTextColor="#9CA3AF"
              style={styles.detailInput}
              multiline
            />
          </View>

          {/* 3. Due Date & Time Chip */}
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={22} color="#6B7280" style={styles.rowIcon} />
            <Pressable
              onPress={() => setIsDatePickerOpen(true)}
              style={styles.dateChip}>
              <Text style={[styles.dateChipText, !dueDate && { color: '#9CA3AF' }]}>
                {dueDate || 'Add date/time'}
              </Text>
              {dueDate ? (
                <Pressable
                  hitSlop={8}
                  onPress={(e) => {
                    e.stopPropagation();
                    setDueDate('');
                  }}>
                  <Ionicons name="close-circle" size={16} color="#6B7280" style={{ marginLeft: 6 }} />
                </Pressable>
              ) : null}
            </Pressable>
          </View>

          {/* 4. Subtasks Section */}
          <View style={styles.subtasksContainer}>
            <View style={styles.subtaskHeaderRow}>
              <Ionicons name="return-down-forward" size={20} color="#6B7280" style={styles.rowIcon} />
              <View style={{ flex: 1 }}>
                {subtasks.map((item) => (
                  <View key={item.id} style={styles.subtaskItemRow}>
                    <Pressable
                      hitSlop={8}
                      onPress={() => handleToggleSubtask(item.id)}
                      style={[
                        styles.subtaskCheckbox,
                        item.completed && styles.subtaskCheckboxCompleted,
                      ]}>
                      {item.completed && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                    </Pressable>

                    <TextInput
                      value={item.title}
                      onChangeText={(val) => handleUpdateSubtaskTitle(item.id, val)}
                      placeholder="Subtask title"
                      placeholderTextColor="#9CA3AF"
                      style={[
                        styles.subtaskInput,
                        item.completed && styles.subtaskInputCompleted,
                      ]}
                    />

                    <Pressable
                      hitSlop={8}
                      onPress={() => handleRemoveSubtask(item.id)}
                      style={styles.removeSubtaskBtn}>
                      <Ionicons name="close" size={16} color="#9CA3AF" />
                    </Pressable>
                  </View>
                ))}

                {/* Add Subtasks Button */}
                <Pressable onPress={handleAddSubtask} style={styles.addSubtaskBtn}>
                  <Text style={styles.addSubtaskText}>Add subtasks</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Save Button */}
        <View style={styles.bottomBar}>
          <Pressable
            onPress={handleSave}
            disabled={isSubmitting || !title.trim()}
            style={({ pressed }) => [
              styles.saveBtn,
              (!title.trim() || isSubmitting) && styles.saveBtnDisabled,
              pressed && { opacity: 0.8 },
            ]}>
            <Text
              style={[
                styles.saveBtnText,
                (!title.trim() || isSubmitting) && styles.saveBtnTextDisabled,
              ]}>
              {isSubmitting ? 'Saving...' : 'Save Task'}
            </Text>
          </Pressable>
        </View>

        {/* Google Calendar Style Interactive Date & Time Picker */}
        <DateTimePickerModal
          visible={isDatePickerOpen}
          initialDate={dueDate}
          onClose={() => setIsDatePickerOpen(false)}
          onSelect={(formattedDate) => {
            setDueDate(formattedDate);
            setIsDatePickerOpen(false);
          }}
        />

        {/* Category / List Selection Modal */}
        <Modal
          visible={isCategoryModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsCategoryModalOpen(false)}>
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setIsCategoryModalOpen(false)}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Select List</Text>
              {taskLists.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => {
                    setCategory(cat);
                    setIsCategoryModalOpen(false);
                  }}
                  style={styles.categoryOptionRow}>
                  <Ionicons
                    name={category === cat ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color="#10B981"
                  />
                  <Text style={styles.categoryOptionText}>{cat}</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconBtn: {
    padding: 6,
  },
  listDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
  },
  listDropdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerSaveBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSaveBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  headerSaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  headerSaveTextDisabled: {
    color: '#9CA3AF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 80,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    paddingVertical: 10,
    marginBottom: 20,
    minHeight: 48,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  rowIcon: {
    width: 32,
    paddingTop: 6,
  },
  detailInput: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    paddingVertical: 6,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  dateChipText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  subtasksContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  subtaskHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  subtaskItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subtaskCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  subtaskCheckboxCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  subtaskInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    paddingVertical: 4,
  },
  subtaskInputCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  removeSubtaskBtn: {
    padding: 6,
  },
  addSubtaskBtn: {
    paddingVertical: 8,
  },
  addSubtaskText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  saveBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  saveBtnTextDisabled: {
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  datePresetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  datePresetText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  categoryOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
});
