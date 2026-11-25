import { GoogleClockTimePicker } from '@/components/GoogleClockTimePicker';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const DAYS_HEADER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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

const REPEAT_OPTIONS = [
  'Does not repeat',
  'Every day',
  'Every week',
  'Every month',
];

interface DateTimePickerModalProps {
  visible: boolean;
  initialDate?: string;
  onClose: () => void;
  onSelect: (formattedDate: string) => void;
}

export function DateTimePickerModal({
  visible,
  initialDate,
  onClose,
  onSelect,
}: DateTimePickerModalProps) {
  // Calendar month navigation state
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    return new Date().getDate();
  });
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    return new Date().getFullYear();
  });
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(() => {
    return new Date().getMonth();
  });

  // Time & Repeat state
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [showClockModal, setShowClockModal] = useState<boolean>(false);
  const [selectedRepeat, setSelectedRepeat] = useState<string>('Does not repeat');
  const [showRepeatPicker, setShowRepeatPicker] = useState<boolean>(false);

  // Month navigation
  const handlePrevMonth = () => {
    try {
      Haptics.selectionAsync().catch(() => { });
    } catch { }
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    try {
      Haptics.selectionAsync().catch(() => { });
    } catch { }
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  // Calendar matrix calculation
  const { monthLabel, daysMatrix } = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const monthLabelStr = `${MONTH_NAMES[month]} ${year}`;

    // First day of month (0 = Sunday, 1 = Monday, ...)
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const matrix: (number | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      matrix.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      matrix.push(d);
    }

    return {
      monthLabel: monthLabelStr,
      daysMatrix: matrix,
    };
  }, [currentMonth]);

  const handleDaySelect = (dayNum: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    } catch { }
    setSelectedDay(dayNum);
    setSelectedMonthIdx(currentMonth.getMonth());
    setSelectedYear(currentMonth.getFullYear());
  };

  const handleDone = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
    } catch { }

    const dateObj = new Date(selectedYear, selectedMonthIdx, selectedDay);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const monthShort = dateObj.toLocaleDateString('en-US', { month: 'short' });

    let result = `${dayName}, ${selectedDay} ${monthShort}`;
    if (selectedTime) {
      result += ` at ${selectedTime}`;
    }
    if (selectedRepeat && selectedRepeat !== 'Does not repeat') {
      result += ` (${selectedRepeat.toLowerCase()})`;
    }

    onSelect(result);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={styles.modalContainer}
          onPress={(e) => e.stopPropagation()}>
          {/* 1. Header: Month Navigation */}
          <View style={styles.headerRow}>
            <Pressable
              hitSlop={10}
              onPress={handlePrevMonth}
              style={styles.navChevronBtn}>
              <Ionicons name="chevron-back" size={20} color="#E5E7EB" />
            </Pressable>

            <Text style={styles.monthTitleText}>{monthLabel}</Text>

            <Pressable
              hitSlop={10}
              onPress={handleNextMonth}
              style={styles.navChevronBtn}>
              <Ionicons name="chevron-forward" size={20} color="#E5E7EB" />
            </Pressable>
          </View>

          {/* 2. Days of Week Header (S M T W T F S) */}
          <View style={styles.weekHeaderRow}>
            {DAYS_HEADER.map((d, index) => (
              <View key={index} style={styles.dayColHeader}>
                <Text style={styles.weekHeaderText}>{d}</Text>
              </View>
            ))}
          </View>

          {/* 3. Days Grid */}
          <View style={styles.gridContainer}>
            {daysMatrix.map((dayNum, index) => {
              if (dayNum === null) {
                return <View key={`empty_${index}`} style={styles.dayCell} />;
              }

              const isSelected =
                dayNum === selectedDay &&
                currentMonth.getMonth() === selectedMonthIdx &&
                currentMonth.getFullYear() === selectedYear;

              return (
                <Pressable
                  key={`day_${dayNum}`}
                  onPress={() => handleDaySelect(dayNum)}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                  ]}>
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && styles.dayTextSelected,
                    ]}>
                    {dayNum}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* 4. Action Option 1: Set time (Google Tasks Clock Time Picker) */}
          <Pressable
            onPress={() => {
              setShowClockModal(true);
              setShowRepeatPicker(false);
            }}
            style={styles.actionRow}>
            <Ionicons name="time-outline" size={22} color="#D1D5DB" />
            <Text style={styles.actionRowText}>
              {selectedTime ? `Time: ${selectedTime}` : 'Set time'}
            </Text>
            {selectedTime ? (
              <Pressable
                hitSlop={8}
                onPress={() => setSelectedTime('')}
                style={styles.clearOptionBtn}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </Pressable>
            ) : (
              <Ionicons name="chevron-forward" size={16} color="#6B7280" />
            )}
          </Pressable>

          {/* 5. Action Option 2: Repeat */}
          <Pressable
            onPress={() => {
              setShowRepeatPicker(!showRepeatPicker);
              setShowClockModal(false);
            }}
            style={styles.actionRow}>
            <Ionicons name="repeat-outline" size={22} color="#D1D5DB" />
            <Text style={styles.actionRowText}>
              {selectedRepeat !== 'Does not repeat' ? `Repeat: ${selectedRepeat}` : 'Repeat'}
            </Text>
            {selectedRepeat !== 'Does not repeat' ? (
              <Pressable
                hitSlop={8}
                onPress={() => setSelectedRepeat('Does not repeat')}
                style={styles.clearOptionBtn}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </Pressable>
            ) : null}
          </Pressable>

          {/* Sub-menu: Repeat presets */}
          {showRepeatPicker && (
            <View style={styles.timePresetsContainer}>
              {REPEAT_OPTIONS.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => {
                    setSelectedRepeat(item);
                    setShowRepeatPicker(false);
                  }}
                  style={[
                    styles.presetChip,
                    selectedRepeat === item && styles.presetChipActive,
                  ]}>
                  <Text
                    style={[
                      styles.presetChipText,
                      selectedRepeat === item && styles.presetChipTextActive,
                    ]}>
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* 6. Footer Buttons (Cancel, Done) */}
          <View style={styles.footerRow}>
            <Pressable onPress={onClose} style={styles.footerBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>

            <Pressable onPress={handleDone} style={styles.footerBtn}>
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
          </View>
        </Pressable>

        {/* Google Tasks Material Clock Time Picker Modal */}
        <GoogleClockTimePicker
          visible={showClockModal}
          initialTime={selectedTime}
          onClose={() => setShowClockModal(false)}
          onConfirm={(timeStr) => {
            setSelectedTime(timeStr);
            setShowClockModal(false);
          }}
        />
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#202124', // Google Tasks Dark Card
    borderRadius: 28,
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  navChevronBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E5E7EB',
  },
  weekHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  dayColHeader: {
    width: 36,
    alignItems: 'center',
  },
  weekHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    rowGap: 4,
    marginBottom: 14,
  },
  dayCell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    backgroundColor: '#10B981', // Emerald green theme
  },
  dayText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#E5E7EB',
  },
  dayTextSelected: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#374151',
    marginVertical: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 14,
  },
  actionRowText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E5E7EB',
    flex: 1,
  },
  clearOptionBtn: {
    padding: 4,
  },
  timePresetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingLeft: 44,
    paddingBottom: 10,
  },
  presetChip: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  presetChipActive: {
    backgroundColor: '#10B981',
  },
  presetChipText: {
    fontSize: 12,
    color: '#D1D5DB',
    fontWeight: '600',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 12,
    paddingRight: 8,
  },
  footerBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981', // Emerald green
  },
});

