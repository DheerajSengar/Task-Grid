import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskStats } from '@/types/task';

interface StatsCardsProps {
  stats: TaskStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <View style={styles.grid}>
      {/* Total Card */}
      <View style={[styles.card, styles.cardBlue]}>
        <View style={styles.headerRow}>
          <Text style={styles.label}>Total</Text>
          <View style={[styles.iconWrap, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="list" size={16} color="#2563EB" />
          </View>
        </View>
        <Text style={[styles.value, { color: '#1E40AF' }]}>{stats.total}</Text>
      </View>

      {/* Pending Card */}
      <View style={[styles.card, styles.cardAmber]}>
        <View style={styles.headerRow}>
          <Text style={styles.label}>Pending</Text>
          <View style={[styles.iconWrap, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="time" size={16} color="#D97706" />
          </View>
        </View>
        <Text style={[styles.value, { color: '#B45309' }]}>{stats.pending}</Text>
      </View>

      {/* Completed Card */}
      <View style={[styles.card, styles.cardGreen]}>
        <View style={styles.headerRow}>
          <Text style={styles.label}>Done</Text>
          <View style={[styles.iconWrap, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
          </View>
        </View>
        <Text style={[styles.value, { color: '#15803D' }]}>{stats.completed}</Text>
      </View>

      {/* Urgent Card */}
      <View style={[styles.card, styles.cardRed]}>
        <View style={styles.headerRow}>
          <Text style={styles.label}>Urgent</Text>
          <View style={[styles.iconWrap, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="flame" size={16} color="#DC2626" />
          </View>
        </View>
        <Text style={[styles.value, { color: '#B91C1C' }]}>{stats.highPriority}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
      },
      default: {
        elevation: 1,
      },
    }),
  },
  cardBlue: {
    borderColor: '#BFDBFE',
  },
  cardAmber: {
    borderColor: '#FDE68A',
  },
  cardGreen: {
    borderColor: '#BBF7D0',
  },
  cardRed: {
    borderColor: '#FECACA',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
  },
});
