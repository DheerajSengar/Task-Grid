import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type DocCategory = 'all' | 'getting-started' | 'tasks' | 'reminders' | 'accounts' | 'sync';

interface DocArticle {
  id: string;
  category: DocCategory;
  title: string;
  badge: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  steps: { title: string; desc: string }[];
  proTip?: string;
}

const DOC_ARTICLES: DocArticle[] = [
  {
    id: 'quick-start',
    category: 'getting-started',
    title: 'Getting Started with TaskManager',
    badge: 'Basics',
    icon: 'rocket-outline',
    description:
      'Learn the essentials of navigating TaskManager, setting up your workspace, and managing your daily schedule across mobile and web.',
    steps: [
      {
        title: '3-Tab Main Navigation',
        desc: 'Use the bottom bar to switch instantly between Home (Dashboard & Tasks), New Task (Creation), and Summary (Productivity Analytics).',
      },
      {
        title: 'Accessing Your Profile',
        desc: 'Tap your user avatar or welcome text at the top of the Home screen to jump directly into your Profile, account settings, and reminders.',
      },
      {
        title: 'Active Network Status',
        desc: 'Check the real-time cloud connection badge in Profile > Storage & Database. When online, tasks sync automatically.',
      },
    ],
    proTip: 'On web browsers, you can use Tab and Enter keys to navigate between tasks quickly.',
  },
  {
    id: 'creating-tasks',
    category: 'tasks',
    title: 'Creating & Organizing Tasks',
    badge: 'Core Feature',
    icon: 'create-outline',
    description:
      'Set clear objectives by configuring task titles, pastel category tags, priority levels, and target deadlines.',
    steps: [
      {
        title: 'Title & Notes',
        desc: 'Give your task a concise title and add detailed notes or instructions for reference.',
      },
      {
        title: 'Pastel Categories',
        desc: 'Assign tags like Work, Personal, Study, Urgent, or Fitness. Each tag has a distinct soothing pastel color for easy visual identification.',
      },
      {
        title: 'Priority Flags',
        desc: 'Assign High, Medium, or Low priority. High priority tasks appear with prominent indicators in your Task Reminders hub.',
      },
      {
        title: 'Due Date Selection',
        desc: 'Select Today, Tomorrow, or pick an exact calendar date using the interactive date selector.',
      },
    ],
    proTip: 'Mark tasks complete by tapping the circular checkbox right from the Home dashboard.',
  },
  {
    id: 'attachments-lightbox',
    category: 'tasks',
    title: 'File Attachments & Photo Lightbox',
    badge: 'Media',
    icon: 'images-outline',
    description:
      'Attach receipts, work mockups, and documents to tasks, then inspect them with a high-resolution full-screen viewer.',
    steps: [
      {
        title: 'Attaching Files',
        desc: 'When creating or editing a task, tap "Add Attachment" to pick photos from your camera roll or documents from your storage.',
      },
      {
        title: 'Task Activity Gallery',
        desc: 'All uploaded files are displayed sequentially under the Task Activity section with live visual thumbnails.',
      },
      {
        title: 'Full-Screen Photo Lightbox',
        desc: 'Tap any photo to open the interactive full-screen Lightbox. Pinch to zoom, double tap to scale, or tap the close button to return.',
      },
      {
        title: 'Document Opening',
        desc: 'Tapping PDF or text documents launches your device native sandboxed file viewer or external application.',
      },
    ],
    proTip: 'Both photos and PDFs are safely cached on-device for instant offline previewing.',
  },
  {
    id: 'smart-reminders',
    category: 'reminders',
    title: 'Smart Reminders & Task Alarms',
    badge: 'Notifications',
    icon: 'notifications-outline',
    description:
      'Never miss a deadline with automated push notifications, customized reminder offsets, and a dedicated Task Reminders hub.',
    steps: [
      {
        title: 'Opening Task Reminders',
        desc: 'Tap the Bell icon on the top right of the Home screen or tap "Task Reminders & Alerts" in your Profile.',
      },
      {
        title: 'Instant 5-Second Test',
        desc: 'Tap the "+ Test (5s)" button in the Reminders screen to instantly trigger a sample alarm and verify device push permissions.',
      },
      {
        title: 'Quick Scheduling Pills',
        desc: 'Add reminders with one tap using preset offsets: +10 Minutes, +1 Hour, or +1 Day before due dates.',
      },
      {
        title: 'Dismissing & Managing',
        desc: 'View all pending alarms under the "Scheduled Alerts" tab. Cancel any individual reminder with the trash button.',
      },
    ],
    proTip: 'Ensure notifications are allowed in system settings so alarms can sound even when the app is minimized.',
  },
  {
    id: 'multi-account',
    category: 'accounts',
    title: 'Multi-Account Management',
    badge: 'Accounts',
    icon: 'people-outline',
    description:
      'Manage multiple personal and work accounts on a single phone or computer with complete data separation.',
    steps: [
      {
        title: 'View Saved Accounts',
        desc: 'In Profile, tap "Manage Account" to expand the list of all accounts saved on your device.',
      },
      {
        title: '1-Tap Fast Switching',
        desc: 'Tap "Switch" next to any saved account to immediately swap workspaces without re-authenticating.',
      },
      {
        title: 'Add New Account',
        desc: 'Tap "+ Sign in with another account" to log into a secondary email address without erasing your current session.',
      },
      {
        title: 'Safe Account Removal',
        desc: 'Tap the trash icon next to any account to securely delete its credentials and local cache from this device.',
      },
    ],
    proTip: 'Each profile maintains its own separate task database and reminder queue.',
  },
  {
    id: 'cloud-sync',
    category: 'sync',
    title: 'Cloud Sync & Offline-First Mode',
    badge: 'Infrastructure',
    icon: 'cloud-done-outline',
    description:
      'Enjoy seamless productivity anywhere. Work offline without connectivity and let TaskManager sync in the background.',
    steps: [
      {
        title: 'Offline-First Storage',
        desc: 'All edits and new tasks are saved instantly into high-performance local storage (AsyncStorage).',
      },
      {
        title: 'Automatic Cloud Replication',
        desc: 'As soon as an internet connection is detected, tasks synchronize with Google Cloud Firestore in the background.',
      },
      {
        title: 'Manual Cache Refresh',
        desc: 'Tap "Manage Cache" in Profile anytime to force a full re-sync and clear temporary network buffers.',
      },
    ],
    proTip: 'You can create, edit, or complete dozens of tasks on an airplane, and they will sync smoothly when you land.',
  },
];

const CATEGORY_TABS: { key: DocCategory; label: string }[] = [
  { key: 'all', label: 'All Docs' },
  { key: 'getting-started', label: 'Getting Started' },
  { key: 'tasks', label: 'Tasks & Media' },
  { key: 'reminders', label: 'Reminders' },
  { key: 'accounts', label: 'Accounts' },
  { key: 'sync', label: 'Cloud Sync' },
];

export default function DocumentationScreen() {
  const [selectedCategory, setSelectedCategory] = useState<DocCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('quick-start');

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/profile' as any);
    }
  };

  const filteredArticles = useMemo(() => {
    return DOC_ARTICLES.filter((article) => {
      const matchesCategory =
        selectedCategory === 'all' || article.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.badge.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

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
          <Text style={styles.headerTitle}>Documentation</Text>
          <View style={styles.badgeRow}>
            <View style={styles.statusDot} />
            <Text style={styles.badgeText}>Interactive User Guide & Demo</Text>
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
              <Ionicons name="book" size={26} color="#065F46" />
            </View>
            <View style={styles.heroTextCol}>
              <Text style={styles.heroBadge}>TaskManager Knowledge Base</Text>
              <Text style={styles.heroTitle}>Documentation & Guides</Text>
            </View>
          </View>

          <Text style={styles.heroDescription}>
            Explore step-by-step guides for task management, photo & document attachments,
            smart push notifications, multi-account switching, and offline cloud sync.
          </Text>

          {/* Search Input */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search guides (e.g. reminders, attachments, sync)..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}>
          {CATEGORY_TABS.map((tab) => {
            const isSelected = selectedCategory === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setSelectedCategory(tab.key)}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}>
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && styles.categoryChipTextActive,
                  ]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Article Cards */}
        <View style={styles.articlesList}>
          {filteredArticles.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="search" size={32} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No matching documentation found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search terms or selecting &quot;All Docs&quot;.
              </Text>
            </View>
          ) : (
            filteredArticles.map((article) => {
              const isExpanded = expandedId === article.id;
              return (
                <View key={article.id} style={styles.articleCard}>
                  {/* Article Accordion Header */}
                  <Pressable
                    onPress={() => setExpandedId(isExpanded ? null : article.id)}
                    style={styles.articleHeader}>
                    <View style={styles.articleIconBox}>
                      <Ionicons name={article.icon} size={20} color="#065F46" />
                    </View>

                    <View style={styles.articleTitleCol}>
                      <View style={styles.articleBadgeRow}>
                        <View style={styles.articleBadge}>
                          <Text style={styles.articleBadgeText}>{article.badge}</Text>
                        </View>
                      </View>
                      <Text style={styles.articleTitle}>{article.title}</Text>
                    </View>

                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color="#9CA3AF"
                    />
                  </Pressable>

                  {/* Description */}
                  <Text style={styles.articleDescription}>{article.description}</Text>

                  {/* Expanded Steps & Pro Tips */}
                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      <View style={styles.stepsContainer}>
                        <Text style={styles.stepsHeader}>Step-by-Step Instructions</Text>
                        {article.steps.map((st, idx) => (
                          <View key={idx} style={styles.stepItem}>
                            <View style={styles.stepNumberBadge}>
                              <Text style={styles.stepNumberText}>{idx + 1}</Text>
                            </View>
                            <View style={styles.stepTextCol}>
                              <Text style={styles.stepTitle}>{st.title}</Text>
                              <Text style={styles.stepDesc}>{st.desc}</Text>
                            </View>
                          </View>
                        ))}
                      </View>

                      {article.proTip && (
                        <View style={styles.proTipCard}>
                          <Ionicons name="bulb-outline" size={18} color="#065F46" />
                          <View style={styles.proTipTextCol}>
                            <Text style={styles.proTipHeader}>Pro Tip</Text>
                            <Text style={styles.proTipBody}>{article.proTip}</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Bottom Contact Card */}
        <View style={styles.bottomCard}>
          <Ionicons name="help-buoy-outline" size={24} color="#10B981" />
          <Text style={styles.bottomCardTitle}>Need additional guidance?</Text>
          <Text style={styles.bottomCardSubtitle}>
            Our developer and product support team is always available to assist with any
            questions or feedback.
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
    marginBottom: 16,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E9E7',
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#111827',
    padding: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
    }),
  },
  categoriesScroll: {
    paddingVertical: 4,
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E9E7',
  },
  categoryChipActive: {
    backgroundColor: '#065F46',
    borderColor: '#065F46',
  },
  categoryChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#4B5563',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  articlesList: {
    gap: 14,
  },
  articleCard: {
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
  articleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  articleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1FADF',
  },
  articleTitleCol: {
    flex: 1,
  },
  articleBadgeRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  articleBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#D1FADF',
  },
  articleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
    textTransform: 'uppercase',
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  articleDescription: {
    fontSize: 13.5,
    color: '#4B5563',
    lineHeight: 20,
  },
  expandedContent: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 14,
  },
  stepsContainer: {
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E9E7',
    gap: 12,
  },
  stepsHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNumberBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepTextCol: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 12.5,
    color: '#4B5563',
    lineHeight: 18,
  },
  proTipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1FADF',
  },
  proTipTextCol: {
    flex: 1,
  },
  proTipHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
    textTransform: 'uppercase',
  },
  proTipBody: {
    fontSize: 12.5,
    color: '#047857',
    lineHeight: 18,
    marginTop: 1,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E9E7',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
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
