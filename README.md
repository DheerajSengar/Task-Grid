# TaskManager (Task-Grid)

A cross-platform **Android & Web** task management application built with **React Native**, **Expo SDK 58 (Expo Router)**, and **Firebase (Auth, Cloud Firestore, FCM)**.

---

## 📱 Download Android App (Direct APK)

- **Direct APK Download**: [Download TaskManager v1.0.0 (.apk)](https://expo.dev/artifacts/eas/IS-QEZaXEWYgjF_tWa-nWe1Fli0cf9VdrNFa9TYlFYU.apk)
- **EAS Build Page**: [View Build Details](https://expo.dev/accounts/dheerajsengar/projects/TaskManager/builds/cd37209f-aef3-4d77-b352-1de4ed04e75d)

> Open the APK link on your Android device to download and install directly.

---

## ✨ Key Features

- **Cross-Platform (Android & Web)**: Responsive centered layout on Web and native mobile experience on Android.
- **Offline-First & Real-Time Cloud Sync**: Instant local persistence (`AsyncStorage`) paired with real-time Cloud Firestore synchronization (`/tasks` and `/users`).
- **Multi-Account Switcher & Per-User Avatars**: Switch between signed-in accounts with isolated tasks and profile photos per user ID.
- **Task Lists, Starred & Calendar Agenda**: Organize tasks across `My Tasks`, `Work`, `Personal`, custom lists, and calendar views.
- **Smart Reminders & Push Notifications**: Local scheduled reminders and Firebase Cloud Messaging (FCM) token registration synced to Firestore.

---

## 🚀 Run Locally

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start Metro Bundler (Android & Web)**
   ```bash
   npx expo start
   ```
   - Press `w` to open in Web browser (`http://localhost:8081`)
   - Press `a` to open in Android Emulator
   - Scan the QR code with **Expo Go** on Android

3. **Architecture Documentation**
   See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full directory tree, data flow diagrams, and feature-to-file lookup matrix.
