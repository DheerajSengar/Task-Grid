import { TaskCard } from '@/components/TaskCard';
import { useAuth } from '@/context/AuthContext';
import { useTasks } from '@/context/TaskContext';
import { formatEmailToDisplayName } from '@/services/authService';
import { showCrossPlatformAlert } from '@/utils/platformAlert';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
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

type TabType = 'starred' | 'My Tasks' | 'Work' | 'Personal' | 'Shopping list' | string;

export default function HomeScreen() {
  const {
    tasks,
    toggleTask,
    toggleStarred,
    deleteTask,
    isCloudConnected,
    taskLists,
    createList,
    renameList,
    deleteList,
  } = useTasks();
  const { user, avatarUrl } = useAuth();
  const { list: targetListParam } = useLocalSearchParams<{ list?: string }>();

  const [activeTab, setActiveTab] = useState<TabType>('My Tasks');
  const [prevListParam, setPrevListParam] = useState<string | undefined>(targetListParam);

  if (targetListParam !== prevListParam) {
    setPrevListParam(targetListParam);
    if (targetListParam && (targetListParam === 'starred' || taskLists.includes(targetListParam))) {
      setActiveTab(targetListParam);
    }
  }
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);
  const [sortMode, setSortMode] = useState<'default' | 'dueDate' | 'starred'>('default');
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);
  const [isMenuModalVisible, setIsMenuModalVisible] = useState(false);
  const [isNewListModalVisible, setIsNewListModalVisible] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [renameListName, setRenameListName] = useState('');

  const userName =
    user?.displayName ||
    (user?.email ? formatEmailToDisplayName(user.email) : (user?.isAnonymous ? 'Guest User' : 'User'));
  const userInitial = (userName[0] || 'U').toUpperCase();

  // All available tabs from TaskContext
  const allTabs = useMemo(() => {
    return ['starred', ...taskLists];
  }, [taskLists]);

  // Filter tasks based on activeTab
  const { activeTasks, completedTasks } = useMemo(() => {
    let list = [...tasks];

    if (activeTab === 'starred') {
      // Starred list only shows tasks that are currently starred
      list = list.filter((t) => !!t.isStarred);
    } else if (activeTab === 'My Tasks') {
      // My Tasks shows all created tasks
      list = [...tasks];
    } else {
      list = list.filter(
        (t) => t.category === activeTab || t.listName === activeTab
      );
    }

    // Sort active tasks
    if (sortMode === 'dueDate') {
      list.sort((a, b) => (a.dueDate || 'ZZZ').localeCompare(b.dueDate || 'ZZZ'));
    } else if (sortMode === 'starred') {
      list.sort((a, b) => (b.isStarred ? 1 : 0) - (a.isStarred ? 1 : 0));
    } else {
      list.sort((a, b) => b.createdAt - a.createdAt);
    }

    return {
      activeTasks: list.filter((t) => !t.completed),
      completedTasks: list.filter((t) => t.completed),
    };
  }, [tasks, activeTab, sortMode]);

  const handleCreateNewList = async () => {
    const trimmed = newListName.trim();
    if (!trimmed) return;
    await createList(trimmed);
    setActiveTab(trimmed);
    setNewListName('');
    setIsNewListModalVisible(false);
  };

  const handleOpenRenameModal = () => {
    setIsMenuModalVisible(false);
    if (activeTab === 'starred') {
      showCrossPlatformAlert('Notice', 'The Starred list is a system filter and cannot be renamed.');
      return;
    }
    setRenameListName(activeTab);
    setIsRenameModalVisible(true);
  };

  const handleRenameList = async () => {
    const trimmed = renameListName.trim();
    if (!trimmed || trimmed === activeTab) {
      setIsRenameModalVisible(false);
      return;
    }
    await renameList(activeTab, trimmed);
    setActiveTab(trimmed);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { }
    setIsRenameModalVisible(false);
  };

  const handleDeleteListConfirm = () => {
    setIsMenuModalVisible(false);

    if (activeTab === 'starred') {
      showCrossPlatformAlert(
        'Delete Starred Tasks',
        'Are you sure you want to delete all starred tasks?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              const starredTasks = tasks.filter((t) => !!t.isStarred);
              for (const task of starredTasks) {
                await deleteTask(task.id);
              }
              try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch { }
            },
          },
        ]
      );
      return;
    }

    showCrossPlatformAlert(
      'Delete list',
      `Delete "${activeTab}" and all tasks in this list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteList(activeTab);
            const remaining = taskLists.filter((t) => t !== activeTab);
            setActiveTab(remaining[0] || 'My Tasks');

            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch { }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* 1. Header (Google Tasks Style: Title + Avatar) */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tasks</Text>

          <Link href="/profile" asChild>
            <Pressable
              style={({ pressed }) => [styles.avatarButton, pressed && { opacity: 0.8 }]}
              accessibilityRole="button"
              accessibilityLabel="User profile">
              <View style={styles.avatarCircle}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarInitial}>{userInitial}</Text>
                )}
                <View
                  style={[
                    styles.onlineDot,
                    { backgroundColor: isCloudConnected ? '#10B981' : '#F59E0B' },
                  ]}
                />
              </View>
            </Pressable>
          </Link>
        </View>

        {/* 2. Horizontal List Tabs (Starred, My Tasks, Lists, + New list) */}
        <View style={styles.tabBarWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}>
            {allTabs.map((tab) => {
              const isActive = activeTab === tab;
              const isStarTab = tab === 'starred';

              return (
                <Pressable
                  key={tab}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch { }
                    setActiveTab(tab);
                  }}
                  style={styles.tabItem}>
                  <View style={styles.tabInner}>
                    {isStarTab ? (
                      <Ionicons
                        name={isActive ? 'star' : 'star-outline'}
                        size={18}
                        color={isActive ? '#10B981' : '#6B7280'}
                      />
                    ) : (
                      <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                        {tab}
                      </Text>
                    )}
                  </View>
                  {isActive && <View style={styles.activeIndicator} />}
                </Pressable>
              );
            })}

            {/* + New list button */}
            <Pressable
              onPress={() => setIsNewListModalVisible(true)}
              style={styles.newListTab}>
              <Ionicons name="add" size={16} color="#10B981" />
              <Text style={styles.newListLabel}>New list</Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* 3. Main Card & Task List */}
        <View style={styles.cardContainer}>
          {/* Card Sub-header: Current List Title, Sort & Menu */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardListTitle}>
              {activeTab === 'starred' ? 'Starred' : activeTab}
            </Text>

            <View style={styles.cardHeaderActions}>
              <Pressable
                hitSlop={8}
                onPress={() => router.push('/calendar')}
                style={styles.iconActionBtn}
                accessibilityLabel="Calendar view">
                <Ionicons name="calendar-outline" size={19} color="#4B5563" />
              </Pressable>

              <Pressable
                hitSlop={8}
                onPress={() => setIsSortModalVisible(true)}
                style={styles.iconActionBtn}
                accessibilityLabel="Sort tasks">
                <Ionicons name="swap-vertical" size={19} color="#4B5563" />
              </Pressable>

              <Pressable
                hitSlop={8}
                onPress={() => setIsMenuModalVisible(true)}
                style={styles.iconActionBtn}
                accessibilityLabel="More options">
                <Ionicons name="ellipsis-vertical" size={19} color="#4B5563" />
              </Pressable>
            </View>
          </View>

          {/* Tasks FlatList */}
          <FlatList
            style={{ flex: 1 }}
            data={activeTasks}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-done-circle-outline" size={54} color="#D1FAE5" />
                <Text style={styles.emptyTitle}>All tasks completed</Text>
                <Text style={styles.emptySubtext}>
                  {activeTab === 'starred'
                    ? 'Star tasks to keep important ones here.'
                    : 'Tap the + button below to add a new task.'}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TaskCard
                task={item}
                onToggle={toggleTask}
                onToggleStarred={toggleStarred}
                onDelete={deleteTask}
                onEdit={(task) => {
                  router.push({
                    pathname: '/edit-task',
                    params: { id: task.id },
                  });
                }}
              />
            )}
            ListFooterComponent={
              completedTasks.length > 0 ? (
                <View style={styles.completedSection}>
                  <Pressable
                    onPress={() => {
                      try {
                        Haptics.selectionAsync();
                      } catch { }
                      setIsCompletedExpanded(!isCompletedExpanded);
                    }}
                    style={styles.completedHeader}>
                    <Text style={styles.completedHeaderText}>
                      Completed ({completedTasks.length})
                    </Text>
                    <Ionicons
                      name={isCompletedExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color="#6B7280"
                    />
                  </Pressable>

                  {isCompletedExpanded && (
                    <View style={styles.completedList}>
                      {completedTasks.map((t) => (
                        <TaskCard
                          key={t.id}
                          task={t}
                          onToggle={toggleTask}
                          onToggleStarred={toggleStarred}
                          onDelete={deleteTask}
                          onEdit={(task) => {
                            router.push({
                              pathname: '/edit-task',
                              params: { id: task.id },
                            });
                          }}
                        />
                      ))}
                    </View>
                  )}
                </View>
              ) : undefined
            }
          />
        </View>

        {/* Floating Action Button (FAB) for adding new tasks */}
        <Pressable
          style={({ pressed }) => [
            styles.fabButton,
            pressed && styles.fabButtonPressed,
          ]}
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch { }
            router.push({
              pathname: '/tabs/new-task',
              params: { list: activeTab !== 'starred' ? activeTab : 'My Tasks' },
            });
          }}
          accessibilityRole="button"
          accessibilityLabel="Add new task">
          <Ionicons name="add" size={32} color="#FFFFFF" />
        </Pressable>

        {/* Sort Modal */}
        <Modal
          visible={isSortModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsSortModalVisible(false)}>
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setIsSortModalVisible(false)}>
            <View style={styles.sortModalCard}>
              <Text style={styles.sortModalTitle}>Sort by</Text>
              {[
                { label: 'My order (Newest first)', mode: 'default' },
                { label: 'Date', mode: 'dueDate' },
                { label: 'Starred first', mode: 'starred' },
              ].map((opt) => (
                <Pressable
                  key={opt.mode}
                  onPress={() => {
                    setSortMode(opt.mode as any);
                    setIsSortModalVisible(false);
                  }}
                  style={styles.sortOptionRow}>
                  <Ionicons
                    name={sortMode === opt.mode ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color="#10B981"
                  />
                  <Text style={styles.sortOptionLabel}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>

        {/* New List Modal */}
        <Modal
          visible={isNewListModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsNewListModalVisible(false)}>
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setIsNewListModalVisible(false)}>
            <View style={styles.newListModalCard}>
              <Text style={styles.sortModalTitle}>Create new list</Text>
              <TextInput
                value={newListName}
                onChangeText={setNewListName}
                placeholder="Enter list title"
                placeholderTextColor="#9CA3AF"
                style={styles.newListInput}
                autoFocus
                onSubmitEditing={handleCreateNewList}
              />
              <View style={styles.newListModalActions}>
                <Pressable
                  onPress={() => setIsNewListModalVisible(false)}
                  style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleCreateNewList} style={styles.confirmBtn}>
                  <Text style={styles.confirmBtnText}>Done</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Modal>
        {/* Rename List Modal */}
        <Modal
          visible={isRenameModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsRenameModalVisible(false)}>
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setIsRenameModalVisible(false)}>
            <View style={styles.newListModalCard}>
              <Text style={styles.sortModalTitle}>Rename list</Text>
              <TextInput
                value={renameListName}
                onChangeText={setRenameListName}
                placeholder="Enter list title"
                placeholderTextColor="#9CA3AF"
                style={styles.newListInput}
                autoFocus
                onSubmitEditing={handleRenameList}
              />
              <View style={styles.newListModalActions}>
                <Pressable
                  onPress={() => setIsRenameModalVisible(false)}
                  style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleRenameList} style={styles.confirmBtn}>
                  <Text style={styles.confirmBtnText}>Save</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Modal>

        {/* Options Menu Modal: Only Rename and Delete */}
        <Modal
          visible={isMenuModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsMenuModalVisible(false)}>
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setIsMenuModalVisible(false)}>
            <View style={styles.sortModalCard}>
              <Text style={styles.sortModalTitle}>List options</Text>

              <Pressable
                onPress={handleOpenRenameModal}
                style={styles.sortOptionRow}>
                <Ionicons name="pencil-outline" size={20} color="#10B981" />
                <Text style={styles.sortOptionLabel}>Rename list</Text>
              </Pressable>

              <Pressable
                onPress={handleDeleteListConfirm}
                style={styles.sortOptionRow}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                <Text style={[styles.sortOptionLabel, { color: '#EF4444' }]}>
                  Delete list
                </Text>
              </Pressable>
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
    backgroundColor: '#F3F4F6', // Google Tasks soft gray background
  },
  keyboardContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  avatarButton: {
    padding: 2,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  tabBarWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabsContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tabItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    position: 'relative',
    alignItems: 'center',
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  tabLabelActive: {
    color: '#10B981',
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 3,
    backgroundColor: '#10B981',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  newListTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    marginLeft: 8,
    gap: 4,
  },
  newListLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  cardContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    marginHorizontal: Platform.OS === 'web' ? 16 : 0,
    marginBottom: Platform.OS === 'web' ? 16 : 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: Platform.OS === 'web' ? 24 : 0,
    borderBottomRightRadius: Platform.OS === 'web' ? 24 : 0,
    borderWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  cardListTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  cardHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconActionBtn: {
    padding: 4,
  },
  listContent: {
    paddingBottom: 96,
  },
  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 999,
  },
  fabButtonPressed: {
    backgroundColor: '#059669',
    transform: [{ scale: 0.94 }],
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 14,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  completedSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  completedHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  completedList: {
    paddingBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sortModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    maxWidth: 320,
  },
  sortModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  sortOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  sortOptionLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  newListModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    maxWidth: 320,
  },
  newListInput: {
    borderBottomWidth: 2,
    borderBottomColor: '#10B981',
    fontSize: 15,
    paddingVertical: 8,
    color: '#1F2937',
    marginBottom: 20,
  },
  newListModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelBtnText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  confirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#10B981',
    borderRadius: 8,
  },
  confirmBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
