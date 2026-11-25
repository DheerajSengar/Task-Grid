import { DesignTheme } from '@/constants/designTheme';
import { useTasks } from '@/context/TaskContext';
import { Task } from '@/types/task';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DAYS_OF_WEEK = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface CalendarDay {
  dayNumber: number;
  dateStr: string; // YYYY-MM-DD
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  taskCount: number;
}

export default function CalendarScreen() {
  const { taskId, returnTo, currentDate } = useLocalSearchParams<{
    taskId?: string;
    returnTo?: string;
    currentDate?: string;
  }>();

  const { tasks, toggleTask } = useTasks();
  const [todayTimestamp] = useState(() => Date.now());

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (currentDate && /^\d{4}-\d{2}-\d{2}$/.test(currentDate)) {
      const parts = currentDate.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m, d);
      }
    }
    return new Date();
  });

  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => {
    if (currentDate && /^\d{4}-\d{2}-\d{2}$/.test(currentDate)) {
      const parts = currentDate.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      if (!isNaN(y) && !isNaN(m)) {
        return new Date(y, m, 1);
      }
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });

  const selectedDateStr = useMemo(() => {
    return selectedDate.toISOString().split('T')[0];
  }, [selectedDate]);

  const todayStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  const isSelectedDateToday = selectedDateStr === todayStr;

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentMonthDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch { }
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch { }
  };

  // Build month calendar grid (Monday - Sunday)
  const calendarDays = useMemo<CalendarDay[]>(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();

    // Map tasks to dates for quick count lookup
    const taskCountMap: Record<string, number> = {};
    tasks.forEach((t) => {
      if (t.dueDate) {
        taskCountMap[t.dueDate] = (taskCountMap[t.dueDate] || 0) + 1;
      }
    });

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    // Convert Sunday=0 to Monday=0 (Monday=0, Tuesday=1 ... Sunday=6)
    const startingDay = (firstDayIndex + 6) % 7;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: CalendarDay[] = [];

    // 1. Previous month trailing days
    for (let i = startingDay - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const dStr = prevDate.toISOString().split('T')[0];
      days.push({
        dayNumber: dayNum,
        dateStr: dStr,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isSelected: dStr === selectedDateStr,
        taskCount: taskCountMap[dStr] || 0,
      });
    }

    // 2. Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const curDate = new Date(year, month, i);
      const dStr = curDate.toISOString().split('T')[0];
      days.push({
        dayNumber: i,
        dateStr: dStr,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        isSelected: dStr === selectedDateStr,
        taskCount: taskCountMap[dStr] || 0,
      });
    }

    // 3. Next month leading days to complete full grid
    const remainingDays = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      const dStr = nextDate.toISOString().split('T')[0];
      days.push({
        dayNumber: i,
        dateStr: dStr,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isSelected: dStr === selectedDateStr,
        taskCount: taskCountMap[dStr] || 0,
      });
    }

    return days;
  }, [currentMonthDate, tasks, todayStr, selectedDateStr]);

  // Tasks scheduled on selected date
  const selectedDayTasks = useMemo(() => {
    return tasks.filter((t) => t.dueDate === selectedDateStr);
  }, [tasks, selectedDateStr]);

  // Other upcoming tasks if no task on selected date
  const otherUpcomingTasks = useMemo(() => {
    return tasks
      .filter((t) => !t.completed && t.dueDate && t.dueDate !== selectedDateStr)
      .slice(0, 3);
  }, [tasks, selectedDateStr]);

  const handleSelectDay = (day: CalendarDay) => {
    const parts = day.dateStr.split('-');
    const newDate = new Date(
      parseInt(parts[0], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[2], 10)
    );
    setSelectedDate(newDate);

    // If day is from another month, adjust current month view
    if (!day.isCurrentMonth) {
      setCurrentMonthDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    }

    try {
      Haptics.selectionAsync();
    } catch { }
  };

  const handleApplyDateToTask = (dateToApply: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { }

    if (returnTo === 'edit-task') {
      router.replace(`/edit-task?id=${taskId || ''}&dueDate=${dateToApply}` as any);
    } else if (returnTo === 'new-task') {
      router.replace(`/tabs/new-task?date=${dateToApply}` as any);
    } else {
      router.replace('/tabs');
    }
  };

  const handleBack = () => {
    if (returnTo === 'edit-task') {
      router.replace(`/edit-task?id=${taskId || ''}` as any);
    } else if (returnTo === 'new-task') {
      router.replace('/tabs/new-task' as any);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/tabs');
    }
  };

  const formattedHeaderDate = selectedDate.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}>
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </Pressable>
          <Text style={styles.headerTitle}>
            {returnTo ? 'Select Due Date' : 'Calendar'}
          </Text>
          <Pressable
            onPress={() => router.push(`/tabs/new-task?date=${selectedDateStr}` as any)}
            style={({ pressed }) => [styles.addBtn, pressed && styles.btnPressed]}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Quick Date Selection Banner for Task */}
        {returnTo ? (
          <View style={styles.returnBanner}>
            <View style={styles.returnBannerTextCol}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="calendar" size={16} color="#10B981" />
                <Text style={styles.returnBannerTitle}>
                  {returnTo === 'edit-task' ? 'Select Date for Task' : 'Set Due Date'}
                </Text>
              </View>
              <Text style={styles.returnBannerSub}>
                Selected: <Text style={{ fontWeight: '700', color: '#065F46' }}>{selectedDateStr}</Text>
              </Text>
            </View>
            <Pressable
              onPress={() => handleApplyDateToTask(selectedDateStr)}
              style={({ pressed }) => [styles.applyDateBtn, pressed && styles.btnPressed]}>
              <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
              <Text style={styles.applyDateBtnText}>Apply</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Selected Date Header */}
        <View style={styles.dateBanner}>
          <Text style={styles.dateBannerSub}>{formattedHeaderDate}</Text>
          <Text style={styles.dateBannerMain}>
            {isSelectedDateToday ? 'Today' : selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
          </Text>
        </View>

        {/* Calendar Card */}
        <View style={styles.calendarCard}>
          {/* Month Selector Bar */}
          <View style={styles.monthSelectorRow}>
            <Text style={styles.calendarTitle}>Task Calendar</Text>
            <View style={styles.monthControls}>
              <Pressable
                onPress={handlePrevMonth}
                style={({ pressed }) => [styles.monthNavBtn, pressed && styles.btnPressed]}>
                <Ionicons name="chevron-back" size={16} color="#065F46" />
              </Pressable>
              <Text style={styles.monthLabel}>
                {MONTH_NAMES[currentMonthDate.getMonth()]}
              </Text>
              <Pressable
                onPress={handleNextMonth}
                style={({ pressed }) => [styles.monthNavBtn, pressed && styles.btnPressed]}>
                <Ionicons name="chevron-forward" size={16} color="#065F46" />
              </Pressable>
            </View>
          </View>

          {/* Days of Week Header: Mo Tu We Th Fr Sa Su */}
          <View style={styles.daysOfWeekRow}>
            {DAYS_OF_WEEK.map((dayName, idx) => (
              <Text
                key={dayName}
                style={[
                  styles.dayOfWeekText,
                  idx >= 5 && styles.weekendText,
                ]}>
                {dayName}
              </Text>
            ))}
          </View>

          {/* Monthly Date Grid */}
          <View style={styles.daysGrid}>
            {calendarDays.map((day) => {
              const isSelected = day.isSelected;
              const hasTasks = day.taskCount > 0;

              return (
                <Pressable
                  key={day.dateStr}
                  onPress={() => handleSelectDay(day)}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    !day.isCurrentMonth && styles.dayCellOtherMonth,
                  ]}>
                  <Text
                    style={[
                      styles.dayNumberText,
                      !day.isCurrentMonth && styles.dayNumberOtherMonth,
                      day.isToday && !isSelected && styles.dayNumberToday,
                      isSelected && styles.dayNumberSelected,
                    ]}>
                    {day.dayNumber}
                  </Text>

                  {/* Task Indicator Dot */}
                  {hasTasks ? (
                    <View
                      style={[
                        styles.taskDot,
                        isSelected && styles.taskDotSelected,
                      ]}
                    />
                  ) : (
                    <View style={styles.taskDotPlaceholder} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Section: Your recent task (filtered by selected date) */}
        <View style={styles.recentTasksSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Your recent task</Text>
            <Text style={styles.taskCountBadge}>
              {selectedDayTasks.length} {selectedDayTasks.length === 1 ? 'task' : 'tasks'}
            </Text>
          </View>

          {selectedDayTasks.length > 0 ? (
            selectedDayTasks.map((task) => (
              <TaskCalendarCard
                key={task.id}
                task={task}
                todayTimestamp={todayTimestamp}
                onToggle={() => toggleTask(task.id)}
                onPress={() => router.push(`/edit-task?id=${task.id}` as any)}
              />
            ))
          ) : (
            <View style={styles.emptyDayBox}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="calendar-outline" size={28} color="#10B981" />
              </View>
              <Text style={styles.emptyDayTitle}>No tasks on {formattedHeaderDate}</Text>
              <Text style={styles.emptyDaySubtitle}>
                Schedule a task for this date to track deadlines and progress.
              </Text>
              <Pressable
                onPress={() => router.push(`/tabs/new-task?date=${selectedDateStr}` as any)}
                style={styles.scheduleTaskBtn}>
                <Ionicons name="add-circle" size={16} color="#FFFFFF" />
                <Text style={styles.scheduleTaskBtnText}>Add Task for this Day</Text>
              </Pressable>
            </View>
          )}

          {/* Upcoming Other Tasks if current date has no tasks */}
          {selectedDayTasks.length === 0 && otherUpcomingTasks.length > 0 && (
            <View style={styles.upcomingBox}>
              <Text style={styles.upcomingTitle}>Upcoming Tasks</Text>
              {otherUpcomingTasks.map((task) => (
                <TaskCalendarCard
                  key={task.id}
                  task={task}
                  todayTimestamp={todayTimestamp}
                  onToggle={() => toggleTask(task.id)}
                  onPress={() => router.push(`/edit-task?id=${task.id}` as any)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface TaskCalendarCardProps {
  task: Task;
  onToggle: () => void;
  onPress: () => void;
  todayTimestamp: number;
}

function TaskCalendarCard({ task, onToggle, onPress, todayTimestamp }: TaskCalendarCardProps) {
  const isCompleted = task.completed;
  const isStarred = !!task.isStarred;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.cleanCalendarCard,
        isCompleted && styles.cardCompleted,
        pressed && styles.cardPressed,
      ]}>
      <Pressable
        hitSlop={8}
        onPress={onToggle}
        style={[
          styles.calendarCheckbox,
          isCompleted && styles.calendarCheckboxCompleted,
        ]}>
        {isCompleted && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
      </Pressable>

      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text
          style={[styles.taskTitle, isCompleted && styles.taskTitleCompleted]}
          numberOfLines={1}>
          {task.title}
        </Text>
        {task.dueDate ? (
          <View style={styles.calendarTimeRow}>
            <Ionicons name="time-outline" size={12} color={isCompleted ? '#9CA3AF' : '#059669'} />
            <Text
              style={[
                styles.calendarTimeText,
                isCompleted && { color: '#9CA3AF' },
              ]}>
              {task.dueDate}
            </Text>
          </View>
        ) : null}
      </View>

      {isStarred && (
        <Ionicons name="star" size={16} color="#10B981" />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DesignTheme.colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 80,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    maxWidth: 600,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E9E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  btnPressed: {
    opacity: 0.7,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  returnBanner: {
    width: '100%',
    maxWidth: 600,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  returnBannerTextCol: {
    flex: 1,
  },
  returnBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  returnBannerSub: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
  },
  applyDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  applyDateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dateBanner: {
    width: '100%',
    maxWidth: 600,
    marginBottom: 16,
  },
  dateBannerSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateBannerMain: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  calendarCard: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E9E7',
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  monthSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  monthControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F9EE',
    borderRadius: 18,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 6,
  },
  monthNavBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
    paddingHorizontal: 2,
  },
  daysOfWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F2',
  },
  dayOfWeekText: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  weekendText: {
    color: '#10B981',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    rowGap: 8,
  },
  dayCell: {
    width: 38,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    backgroundColor: '#10B981',
  },
  dayCellOtherMonth: {
    opacity: 0.35,
  },
  dayNumberText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  dayNumberOtherMonth: {
    color: '#9CA3AF',
  },
  dayNumberToday: {
    color: '#10B981',
    fontWeight: '800',
  },
  dayNumberSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  taskDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10B981',
    marginTop: 3,
  },
  taskDotSelected: {
    backgroundColor: '#FFFFFF',
  },
  taskDotPlaceholder: {
    width: 4,
    height: 4,
    marginTop: 3,
  },
  recentTasksSection: {
    width: '100%',
    maxWidth: 600,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  taskCountBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
    backgroundColor: '#E8F9EE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E9E7',
    marginBottom: 12,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  taskCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  priorityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priorityPillHigh: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  priorityPillMedium: {
    backgroundColor: '#E8F9EE',
    borderWidth: 1,
    borderColor: '#D1FADF',
  },
  priorityPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#F1F5F2',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  taskCardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  personWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  personText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  toggleMiniBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#10B981',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  toggleMiniBtnDone: {
    backgroundColor: '#10B981',
  },
  emptyDayBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E9E7',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F9EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyDayTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  emptyDaySubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: 260,
    lineHeight: 18,
  },
  scheduleTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  scheduleTaskBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  upcomingBox: {
    marginTop: 8,
  },
  upcomingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 10,
  },
  cleanCalendarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardCompleted: {
    opacity: 0.6,
  },
  calendarCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  calendarCheckboxCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  calendarTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  calendarTimeText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
});
