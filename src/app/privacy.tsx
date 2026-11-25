import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface PrivacySection {
  id: string;
  number: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  summary: string;
  items: { label: string; detail: string }[];
}

const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    id: 'collection',
    number: '01',
    title: 'Information We Collect',
    icon: 'server-outline',
    summary:
      'TaskManager operates with strict data minimization principles. We only collect information strictly required to manage your tasks and reminders.',
    items: [
      {
        label: 'Account Identifiers',
        detail:
          'When signing in with email or password, we store your email address, chosen display name, and avatar image URL to personalize your profile.',
      },
      {
        label: 'Task & Schedule Records',
        detail:
          'Task titles, category assignments (Work, Personal, Urgent, etc.), priority flags (High, Medium, Low), due dates, and completion status.',
      },
      {
        label: 'Task Attachments & Media',
        detail:
          'Images, photos, and document files you voluntarily attach to tasks. These are used solely for previewing in task activity and the photo lightbox.',
      },
      {
        label: 'Notification Scheduling Tokens',
        detail:
          'Local notification identifiers generated on your device to trigger task reminders and alarms.',
      },
    ],
  },
  {
    id: 'storage',
    number: '02',
    title: 'Local Storage & Cloud Database Sync',
    icon: 'cloud-done-outline',
    summary:
      'TaskManager implements a dual-layer storage model: high-speed local device storage combined with secure cloud synchronization.',
    items: [
      {
        label: 'Local Device Storage (AsyncStorage)',
        detail:
          'Your tasks, active sessions, and preferences are cached locally on your device for instant offline access without requiring an internet connection.',
      },
      {
        label: 'Google Firebase Cloud Firestore',
        detail:
          'When an internet connection is available, tasks are synchronized with Google Cloud Firestore over TLS 1.3 encrypted connections.',
      },
      {
        label: 'Security Rules Enforced',
        detail:
          'Firestore security rules ensure that each user can only read, write, or delete tasks belonging to their authenticated user UID.',
      },
    ],
  },
  {
    id: 'media_security',
    number: '03',
    title: 'File & Photo Attachment Security',
    icon: 'images-outline',
    summary:
      'Attachments uploaded to tasks are handled with strict privacy and never analyzed or shared for advertising.',
    items: [
      {
        label: 'Task Activity Previews',
        detail:
          'Photos attached to tasks generate thumbnail previews in the task detail and activity view, with full-screen zoomable lightbox inspection.',
      },
      {
        label: 'Document Protection',
        detail:
          'PDFs and work files attached to tasks open using your device-native sandboxed viewer or external application.',
      },
      {
        label: 'Zero AI Scanning',
        detail:
          'TaskManager does not scan, index, or train machine learning models on your uploaded attachments or personal task notes.',
      },
    ],
  },
  {
    id: 'permissions',
    number: '04',
    title: 'Device Hardware & OS Permissions',
    icon: 'key-outline',
    summary:
      'TaskManager only requests permissions when you actively engage with features that require them.',
    items: [
      {
        label: 'Camera & Photo Library',
        detail:
          'Requested only when you tap to attach a photo to a task or change your user profile avatar. No background access is ever requested.',
      },
      {
        label: 'Notifications Permission',
        detail:
          'Used exclusively to schedule alarms and reminders for your upcoming task deadlines. You can toggle this anytime in system settings.',
      },
      {
        label: 'File Storage Access',
        detail:
          'Requested solely on web and mobile to upload or save documents to tasks through system file pickers.',
      },
    ],
  },
  {
    id: 'multi_account',
    number: '05',
    title: 'Multi-Account Isolation',
    icon: 'people-outline',
    summary:
      'TaskManager allows multiple accounts on one device while guaranteeing full cryptographic and storage isolation between profiles.',
    items: [
      {
        label: 'Account Sandboxing',
        detail:
          'Each account saved in "Manage Accounts" maintains independent local storage partitions. One account cannot access another account’s tasks.',
      },
      {
        label: '1-Tap Switching',
        detail:
          'Switching accounts automatically swaps the active storage context and refreshes the dashboard without sharing residual state.',
      },
    ],
  },
  {
    id: 'user_rights',
    number: '06',
    title: 'Your Privacy Rights & Data Control',
    icon: 'options-outline',
    summary:
      'You maintain complete control over your personal data at all times within TaskManager.',
    items: [
      {
        label: 'Cache Management',
        detail:
          'Use "Manage Cache" in Profile to purge local cache or force a fresh synchronization from the cloud database.',
      },
      {
        label: 'Account & Task Deletion',
        detail:
          'You can delete individual tasks, remove saved accounts from your device, or delete your entire profile and cloud records upon request.',
      },
      {
        label: 'Data Portability',
        detail:
          'Your task records can be reviewed across connected devices anytime with cloud synchronization.',
      },
    ],
  },
  {
    id: 'contact_dpo',
    number: '07',
    title: 'Privacy Contact & Inquiries',
    icon: 'mail-unread-outline',
    summary:
      'If you have any questions or feedback regarding this Privacy Policy, our dedicated privacy team is available to help.',
    items: [
      {
        label: 'Direct Email',
        detail: 'Contact our Privacy Officer at privacy@taskmanager.app.',
      },
      {
        label: 'App Version',
        detail: 'TaskManager v2.4 • Light & Green Framework Edition.',
      },
    ],
  },
];

export default function PrivacyPolicyScreen() {
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/profile' as any);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}
          hitSlop={8}
          accessibilityLabel="Back to Profile">
          <Ionicons name="arrow-back" size={20} color="#065F46" />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={styles.badgeRow}>
            <View style={styles.statusDot} />
            <Text style={styles.badgeText}>Rules Enforced • TLS 1.3 Encrypted</Text>
          </View>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="shield-checkmark" size={26} color="#065F46" />
            </View>
            <View style={styles.heroTextCol}>
              <Text style={styles.heroBadge}>Privacy & Protection</Text>
              <Text style={styles.heroTitle}>Your Privacy Matters</Text>
            </View>
          </View>

          <Text style={styles.heroDescription}>
            We believe your productivity data belongs strictly to you. TaskManager is designed
            from the ground up with local-first privacy, end-to-end security rules, and zero
            commercial data resale.
          </Text>

          {/* 4 Feature Badges */}
          <View style={styles.featureGrid}>
            <View style={styles.featurePill}>
              <Ionicons name="eye-off-outline" size={14} color="#065F46" />
              <Text style={styles.featurePillText}>No Data Resale</Text>
            </View>
            <View style={styles.featurePill}>
              <Ionicons name="lock-closed" size={14} color="#065F46" />
              <Text style={styles.featurePillText}>Encrypted Sync</Text>
            </View>
            <View style={styles.featurePill}>
              <Ionicons name="phone-portrait-outline" size={14} color="#065F46" />
              <Text style={styles.featurePillText}>Local First</Text>
            </View>
            <View style={styles.featurePill}>
              <Ionicons name="finger-print-outline" size={14} color="#065F46" />
              <Text style={styles.featurePillText}>Isolated Profiles</Text>
            </View>
          </View>
        </View>

        {/* Sections List */}
        <View style={styles.sectionList}>
          {PRIVACY_SECTIONS.map((sec) => (
            <View key={sec.id} style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconBox}>
                  <Ionicons name={sec.icon} size={18} color="#065F46" />
                </View>
                <View style={styles.sectionTitleCol}>
                  <Text style={styles.sectionNumber}>SECTION {sec.number}</Text>
                  <Text style={styles.sectionTitle}>{sec.title}</Text>
                </View>
              </View>

              <Text style={styles.sectionSummary}>{sec.summary}</Text>

              <View style={styles.itemsList}>
                {sec.items.map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <View style={styles.itemTag}>
                      <Text style={styles.itemTagText}>{item.label}</Text>
                    </View>
                    <Text style={styles.itemDetailText}>{item.detail}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Bottom Acknowledgment Card */}
        <View style={styles.bottomCard}>
          <Ionicons name="shield-checkmark" size={24} color="#10B981" />
          <Text style={styles.bottomCardTitle}>Protected by Design</Text>
          <Text style={styles.bottomCardSubtitle}>
            Your tasks and attachments are protected by Firebase Firestore security rules and
            device-level storage isolation.
          </Text>

          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.returnBtn, pressed && styles.btnPressed]}>
            <Text style={styles.returnBtnText}>Return to Profile</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </Pressable>
        </View>

        <Text style={styles.copyrightText}>
          © 2026 TaskManager • Light & Green Edition • All Rights Reserved
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E9E7',
    ...Platform.select({
      web: {
        position: 'sticky' as any,
        top: 0,
        zIndex: 10,
      },
    }),
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAF9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E9E7',
  },
  btnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
  },
  headerSpacer: {
    width: 38,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E9E7',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1FADF',
  },
  heroTextCol: {
    flex: 1,
  },
  heroBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },
  heroDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 21,
    marginBottom: 16,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAF9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E9E7',
  },
  featurePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  sectionList: {
    gap: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E9E7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  sectionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1FADF',
  },
  sectionTitleCol: {
    flex: 1,
  },
  sectionNumber: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginTop: 1,
  },
  sectionSummary: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#374151',
    lineHeight: 20,
    marginBottom: 14,
  },
  itemsList: {
    gap: 10,
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  itemRow: {
    gap: 4,
  },
  itemTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1FADF',
  },
  itemTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  itemDetailText: {
    fontSize: 12.5,
    color: '#4B5563',
    lineHeight: 18,
    marginTop: 2,
  },
  bottomCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: '#D1FADF',
    alignItems: 'center',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  bottomCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#065F46',
    marginTop: 8,
    marginBottom: 4,
  },
  bottomCardSubtitle: {
    fontSize: 13,
    color: '#047857',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
    maxWidth: 420,
  },
  returnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  returnBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  copyrightText: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
});
