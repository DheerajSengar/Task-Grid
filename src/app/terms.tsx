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

interface TermSection {
  id: string;
  number: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  summary: string;
  points: string[];
}

const TERMS_SECTIONS: TermSection[] = [
  {
    id: 'acceptance',
    number: '01',
    title: 'Acceptance of Terms',
    icon: 'checkbox-outline',
    summary:
      'By downloading, accessing, or using TaskManager on mobile or web, you acknowledge and agree to be bound by these Terms and Conditions.',
    points: [
      'If you do not agree with any provision of these terms, please discontinue using the application immediately.',
      'We may update these terms periodically. Continued use of TaskManager following notice of updates constitutes full acceptance of the revised terms.',
      'You confirm that you are at least 13 years of age or possess legal parental/guardian consent to use this service.',
    ],
  },
  {
    id: 'accounts',
    number: '02',
    title: 'User Accounts & Device Security',
    icon: 'person-circle-outline',
    summary:
      'You are responsible for maintaining the confidentiality of your credentials and account sessions across all authorized devices.',
    points: [
      'TaskManager supports Multi-Account management, enabling multiple profiles on a single device with isolated local storage.',
      'You agree to notify us immediately of any unauthorized access or security breach involving your account credentials.',
      'We reserve the right to suspend or terminate accounts that violate our security standards or exhibit fraudulent behavior.',
    ],
  },
  {
    id: 'content',
    number: '03',
    title: 'Task Content & Media Attachments',
    icon: 'folder-outline',
    summary:
      'All task titles, descriptions, due dates, checklists, and attached photos or documents remain your exclusive intellectual property.',
    points: [
      'You retain full ownership of any text, images, or documents you upload to TaskManager.',
      'By uploading content, you grant TaskManager a limited license solely to process, cache, sync, and display your data on your authorized devices.',
      'You agree not to upload content that infringes upon third-party copyrights, trademarks, or contains unlawful, harmful, or defamatory material.',
      'TaskManager does not claim ownership or sell any user-uploaded files or personal task data to third parties.',
    ],
  },
  {
    id: 'reminders',
    number: '04',
    title: 'Smart Reminders & Push Alarms',
    icon: 'alarm-outline',
    summary:
      'TaskManager provides scheduled reminder services based on your specified task deadlines and preferences.',
    points: [
      'Local notifications depend on your device operating system permissions, battery optimization settings, and notification channel privileges.',
      'While TaskManager strives for high-precision notification triggers, we cannot guarantee timely delivery if your device is powered off, in Do-Not-Disturb mode, or restricts background execution.',
      'You are advised not to rely solely on automated push reminders for mission-critical, life-safety, or time-sensitive emergency schedules.',
    ],
  },
  {
    id: 'sync',
    number: '05',
    title: 'Offline-First Storage & Cloud Sync',
    icon: 'cloud-done-outline',
    summary:
      'TaskManager utilizes an offline-first architecture powered by device local storage (AsyncStorage) and real-time cloud synchronization.',
    points: [
      'Tasks created without an active internet connection are stored safely on your device and will automatically sync once network connectivity resumes.',
      'TaskManager is not liable for data conflicts or loss resulting from manual device cache clearing, uninstalled applications before sync completion, or hardware damage.',
      'You can verify synchronization status at any time in Profile under "Storage & Database".',
    ],
  },
  {
    id: 'acceptable_use',
    number: '06',
    title: 'Acceptable Use Policy',
    icon: 'shield-outline',
    summary:
      'You agree to use TaskManager solely for lawful personal and organizational productivity purposes.',
    points: [
      'Do not reverse engineer, decompile, extract source code, or attempt to tamper with the underlying TaskManager codebase.',
      'Do not utilize automated scripts, bots, scrapers, or excessive API queries that burden cloud infrastructure or degrade experience for other users.',
      'Do not circumvent authentication safeguards, manipulate multi-account storage barriers, or forge user identity tokens.',
    ],
  },
  {
    id: 'third_party',
    number: '07',
    title: 'Third-Party Services & Dependencies',
    icon: 'cube-outline',
    summary:
      'TaskManager integrates with reputable cloud infrastructure providers to deliver authentication, database, and notification services.',
    points: [
      'Cloud authentication and database syncing are powered by Google Cloud Platform / Firebase.',
      'Push notifications leverage Expo Application Services (EAS) and Apple/Google push notification gateways.',
      'Your use of these complementary services is subject to their respective terms and privacy policies.',
    ],
  },
  {
    id: 'disclaimer',
    number: '08',
    title: 'Disclaimer of Warranties & Liability',
    icon: 'alert-circle-outline',
    summary:
      'TaskManager is provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied.',
    points: [
      'We do not warrant that service will be uninterrupted, error-free, completely bug-free, or compatible with every hardware configuration.',
      'In no event shall TaskManager, its developers, or affiliates be liable for any indirect, incidental, or consequential damages arising from app usage or inability to access stored task records.',
    ],
  },
  {
    id: 'contact',
    number: '09',
    title: 'Governing Law & Inquiries',
    icon: 'mail-outline',
    summary:
      'These terms are governed by standard software consumer regulations. If you have questions or dispute notices, our team is here to assist.',
    points: [
      'For legal, compliance, or support questions regarding these terms, contact us at legal@taskmanager.app.',
      'Official documentation and platform guidelines are accessible directly in the Documentation section of your Profile.',
    ],
  },
];

export default function TermsAndConditionsScreen() {
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
          <Text style={styles.headerTitle}>Terms and Conditions</Text>
          <View style={styles.badgeRow}>
            <View style={styles.statusDot} />
            <Text style={styles.badgeText}>Version 2.4 • Effective Nov 2026</Text>
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
              <Ionicons name="document-text" size={26} color="#065F46" />
            </View>
            <View style={styles.heroTextCol}>
              <Text style={styles.heroBadge}>TaskManager Legal Agreement</Text>
              <Text style={styles.heroTitle}>Terms of Service</Text>
            </View>
          </View>

          <Text style={styles.heroDescription}>
            Welcome to TaskManager. Please read these terms carefully before creating tasks,
            setting up smart reminders, uploading attachments, or syncing with cloud storage.
          </Text>

          {/* 3 Pillars */}
          <View style={styles.pillarsContainer}>
            <View style={styles.pillarItem}>
              <Ionicons name="shield-checkmark" size={16} color="#10B981" />
              <Text style={styles.pillarText}>Data Privacy</Text>
            </View>
            <View style={styles.pillarDivider} />
            <View style={styles.pillarItem}>
              <Ionicons name="cloud-offline-outline" size={16} color="#10B981" />
              <Text style={styles.pillarText}>Offline First</Text>
            </View>
            <View style={styles.pillarDivider} />
            <View style={styles.pillarItem}>
              <Ionicons name="lock-closed-outline" size={16} color="#10B981" />
              <Text style={styles.pillarText}>User Owned</Text>
            </View>
          </View>
        </View>

        {/* Section List */}
        <View style={styles.sectionList}>
          {TERMS_SECTIONS.map((section) => (
            <View key={section.id} style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconBox}>
                  <Ionicons name={section.icon} size={18} color="#065F46" />
                </View>
                <View style={styles.sectionTitleCol}>
                  <Text style={styles.sectionNumber}>SECTION {section.number}</Text>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>
              </View>

              <Text style={styles.sectionSummary}>{section.summary}</Text>

              <View style={styles.pointsList}>
                {section.points.map((point, index) => (
                  <View key={index} style={styles.pointRow}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.pointText}>{point}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Bottom Acknowledgment Card */}
        <View style={styles.bottomCard}>
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          <Text style={styles.bottomCardTitle}>You are all set</Text>
          <Text style={styles.bottomCardSubtitle}>
            By continuing to manage your tasks on TaskManager, you acknowledge and agree to these
            terms of service.
          </Text>

          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.agreeBtn, pressed && styles.btnPressed]}>
            <Text style={styles.agreeBtnText}>Return to Profile</Text>
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
  pillarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E9E7',
  },
  pillarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  pillarDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#E5E9E7',
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
    marginBottom: 12,
  },
  pointsList: {
    gap: 8,
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginTop: 7,
  },
  pointText: {
    flex: 1,
    fontSize: 12.5,
    color: '#4B5563',
    lineHeight: 18,
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
  agreeBtn: {
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
  agreeBtnText: {
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
