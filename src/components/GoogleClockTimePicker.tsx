import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const DIAL_SIZE = 224;
const CENTER = DIAL_SIZE / 2;
const RADIUS = 78;

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES_5 = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

interface GoogleClockTimePickerProps {
  visible: boolean;
  initialTime?: string;
  onClose: () => void;
  onConfirm: (formattedTime: string) => void;
}

export function GoogleClockTimePicker({
  visible,
  initialTime,
  onClose,
  onConfirm,
}: GoogleClockTimePickerProps) {
  // Parse initial time e.g. "9:30 AM" or default to 9:00 AM
  const { initialHour, initialMinute, initialPeriod } = useMemo(() => {
    if (initialTime && initialTime.includes(':')) {
      try {
        const parts = initialTime.trim().split(' ');
        const timeParts = parts[0].split(':');
        let h = parseInt(timeParts[0], 10);
        let m = parseInt(timeParts[1], 10);
        let p = (parts[1] || 'AM').toUpperCase();
        if (isNaN(h) || h < 1 || h > 12) h = 9;
        if (isNaN(m) || m < 0 || m > 59) m = 0;
        if (p !== 'AM' && p !== 'PM') p = 'AM';
        return { initialHour: h, initialMinute: m, initialPeriod: p as 'AM' | 'PM' };
      } catch { }
    }
    return { initialHour: 9, initialMinute: 0, initialPeriod: 'AM' as 'AM' | 'PM' };
  }, [initialTime]);

  const [hour, setHour] = useState<number>(initialHour);
  const [minute, setMinute] = useState<number>(initialMinute);
  const [period, setPeriod] = useState<'AM' | 'PM'>(initialPeriod);
  const [mode, setMode] = useState<'hour' | 'minute'>('hour');

  const handleSelectHour = (h: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch { }
    setHour(h);
    // Google Tasks Material UX: automatically switch to minutes mode
    setMode('minute');
  };

  const handleSelectMinute = (m: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch { }
    setMinute(m);
  };

  const handleAdjustMinute = (delta: number) => {
    try {
      Haptics.selectionAsync();
    } catch { }
    setMinute((prev) => {
      let next = prev + delta;
      if (next < 0) next = 59;
      if (next > 59) next = 0;
      return next;
    });
  };

  const handleConfirm = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { }
    const formattedMinute = minute < 10 ? `0${minute}` : `${minute}`;
    const timeStr = `${hour}:${formattedMinute} ${period}`;
    onConfirm(timeStr);
  };

  // Clock hand vector calculations
  const { lineMidX, lineMidY, lineAngleDeg, targetX, targetY } = useMemo(() => {
    let angleDeg = 0;
    if (mode === 'hour') {
      const hIndex = (hour % 12);
      angleDeg = (hIndex * 30) - 90;
    } else {
      angleDeg = ((minute / 60) * 360) - 90;
    }

    const rad = (angleDeg * Math.PI) / 180;
    const tx = CENTER + RADIUS * Math.cos(rad);
    const ty = CENTER + RADIUS * Math.sin(rad);

    return {
      targetX: tx,
      targetY: ty,
      lineMidX: (CENTER + tx) / 2,
      lineMidY: (CENTER + ty) / 2,
      lineAngleDeg: angleDeg,
    };
  }, [mode, hour, minute]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          {/* Header Title */}
          <Text style={styles.headerTitle}>Set time</Text>

          {/* Digital Time & Period Display */}
          <View style={styles.timeDisplayRow}>
            {/* Hour Block */}
            <Pressable
              onPress={() => setMode('hour')}
              style={[
                styles.timeDigitBox,
                mode === 'hour' && styles.timeDigitBoxActive,
              ]}>
              <Text
                style={[
                  styles.timeDigitText,
                  mode === 'hour' && styles.timeDigitTextActive,
                ]}>
                {hour < 10 ? `0${hour}` : hour}
              </Text>
            </Pressable>

            {/* Separator Colon */}
            <Text style={styles.timeColon}>:</Text>

            {/* Minute Block */}
            <Pressable
              onPress={() => setMode('minute')}
              style={[
                styles.timeDigitBox,
                mode === 'minute' && styles.timeDigitBoxActive,
              ]}>
              <Text
                style={[
                  styles.timeDigitText,
                  mode === 'minute' && styles.timeDigitTextActive,
                ]}>
                {minute < 10 ? `0${minute}` : minute}
              </Text>
            </Pressable>

            {/* AM / PM Toggle Column */}
            <View style={styles.periodCol}>
              <Pressable
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch { }
                  setPeriod('AM');
                }}
                style={[
                  styles.periodBtn,
                  period === 'AM' && styles.periodBtnActive,
                ]}>
                <Text
                  style={[
                    styles.periodText,
                    period === 'AM' && styles.periodTextActive,
                  ]}>
                  AM
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch { }
                  setPeriod('PM');
                }}
                style={[
                  styles.periodBtn,
                  period === 'PM' && styles.periodBtnActive,
                ]}>
                <Text
                  style={[
                    styles.periodText,
                    period === 'PM' && styles.periodTextActive,
                  ]}>
                  PM
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Mode Guidance Label */}
          <Text style={styles.modeSubtext}>
            {mode === 'hour' ? 'Select hour on the clock' : 'Select minute on the clock'}
          </Text>

          {/* Circular Clock Dial */}
          <View style={styles.clockDial}>
            {/* Clock Hand Line */}
            <View
              style={{
                position: 'absolute',
                left: lineMidX - RADIUS / 2,
                top: lineMidY - 1,
                width: RADIUS,
                height: 2,
                backgroundColor: '#10B981',
                transform: [{ rotate: `${lineAngleDeg}deg` }],
              }}
            />

            {/* Center Pivot Point */}
            <View style={styles.centerPivot} />

            {/* Target Indicator Ring */}
            <View
              style={[
                styles.targetIndicator,
                {
                  left: targetX - 18,
                  top: targetY - 18,
                },
              ]}
            />

            {/* Dial Numbers */}
            {mode === 'hour'
              ? HOURS.map((h, index) => {
                const angleDeg = (index * 30) - 90;
                const rad = (angleDeg * Math.PI) / 180;
                const posX = CENTER + RADIUS * Math.cos(rad) - 18;
                const posY = CENTER + RADIUS * Math.sin(rad) - 18;
                const isSelected = hour === h;

                return (
                  <Pressable
                    key={`hour_${h}`}
                    onPress={() => handleSelectHour(h)}
                    style={[
                      styles.numberTouch,
                      { left: posX, top: posY },
                    ]}>
                    <Text
                      style={[
                        styles.numberText,
                        isSelected && styles.numberTextSelected,
                      ]}>
                      {h}
                    </Text>
                  </Pressable>
                );
              })
              : MINUTES_5.map((mStr, index) => {
                const mNum = index * 5;
                const angleDeg = (index * 30) - 90;
                const rad = (angleDeg * Math.PI) / 180;
                const posX = CENTER + RADIUS * Math.cos(rad) - 18;
                const posY = CENTER + RADIUS * Math.sin(rad) - 18;
                const isSelected = Math.round(minute / 5) * 5 === mNum;

                return (
                  <Pressable
                    key={`min_${mStr}`}
                    onPress={() => handleSelectMinute(mNum)}
                    style={[
                      styles.numberTouch,
                      { left: posX, top: posY },
                    ]}>
                    <Text
                      style={[
                        styles.numberText,
                        isSelected && styles.numberTextSelected,
                      ]}>
                      {mStr}
                    </Text>
                  </Pressable>
                );
              })}
          </View>

          {/* Quick Fine-Tune Minute Steppers */}
          {mode === 'minute' && (
            <View style={styles.stepperRow}>
              <Pressable
                onPress={() => handleAdjustMinute(-5)}
                style={styles.stepperChip}>
                <Text style={styles.stepperText}>-5m</Text>
              </Pressable>
              <Pressable
                onPress={() => handleAdjustMinute(-1)}
                style={styles.stepperChip}>
                <Text style={styles.stepperText}>-1m</Text>
              </Pressable>
              <Pressable
                onPress={() => handleAdjustMinute(1)}
                style={styles.stepperChip}>
                <Text style={styles.stepperText}>+1m</Text>
              </Pressable>
              <Pressable
                onPress={() => handleAdjustMinute(5)}
                style={styles.stepperChip}>
                <Text style={styles.stepperText}>+5m</Text>
              </Pressable>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <Pressable onPress={onClose} style={styles.cancelActionBtn}>
              <Text style={styles.cancelActionText}>Cancel</Text>
            </Pressable>

            <Pressable onPress={handleConfirm} style={styles.confirmActionBtn}>
              <Text style={styles.confirmActionText}>OK</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#282A2D',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#3C4043',
    padding: 22,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
      },
      default: {
        elevation: 10,
      },
    }),
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9AA0A6',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  timeDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  timeDigitBox: {
    backgroundColor: '#1E1F22',
    borderWidth: 2,
    borderColor: '#3C4043',
    borderRadius: 14,
    width: 72,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeDigitBoxActive: {
    backgroundColor: '#064E3B',
    borderColor: '#10B981',
  },
  timeDigitText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#E8EAED',
  },
  timeDigitTextActive: {
    color: '#34D399',
  },
  timeColon: {
    fontSize: 32,
    fontWeight: '700',
    color: '#9AA0A6',
    marginHorizontal: 2,
  },
  periodCol: {
    marginLeft: 6,
    gap: 4,
  },
  periodBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#1E1F22',
    borderWidth: 1,
    borderColor: '#3C4043',
  },
  periodBtnActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  periodText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9AA0A6',
  },
  periodTextActive: {
    color: '#FFFFFF',
  },
  modeSubtext: {
    fontSize: 12,
    color: '#9AA0A6',
    marginBottom: 14,
  },
  clockDial: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    borderRadius: DIAL_SIZE / 2,
    backgroundColor: '#1E1F22',
    borderWidth: 1,
    borderColor: '#3C4043',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  centerPivot: {
    position: 'absolute',
    left: CENTER - 4,
    top: CENTER - 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    zIndex: 10,
  },
  targetIndicator: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    zIndex: 5,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.5)',
      },
      default: {
        elevation: 3,
      },
    }),
  },
  numberTouch: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 12,
  },
  numberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8EAED',
  },
  numberTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  stepperChip: {
    backgroundColor: '#064E3B',
    borderWidth: 1,
    borderColor: '#047857',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stepperText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34D399',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    gap: 12,
    marginTop: 4,
  },
  cancelActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cancelActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9AA0A6',
  },
  confirmActionBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
  },
  confirmActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
