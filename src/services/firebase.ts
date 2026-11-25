import { initializeApp, getApps, getApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import {
  Firestore,
  getFirestore,
  initializeFirestore,
  setLogLevel,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configuration extracted directly from your google-services.json
export const firebaseConfig = {
  apiKey: 'AIzaSyCTfd5GijX5ph7WNEG8sD1gr6sV1G-u8yU',
  authDomain: 'taskmanager-e2a0d.firebaseapp.com',
  databaseURL: 'https://taskmanager-e2a0d-default-rtdb.firebaseio.com',
  projectId: 'taskmanager-e2a0d',
  storageBucket: 'taskmanager-e2a0d.firebasestorage.app',
  messagingSenderId: '314373059530',
  appId: '1:314373059530:android:9ebb0920ac73e168919533',
};

// Initialize Firebase singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with cross-platform persistence
let auth: FirebaseAuth.Auth;

if (Platform.OS === 'web') {
  // Web uses browser localStorage automatically
  auth = FirebaseAuth.getAuth(app);
} else {
  try {
    const getRNPersistence = (FirebaseAuth as any).getReactNativePersistence;
    if (typeof getRNPersistence === 'function') {
      auth = FirebaseAuth.initializeAuth(app, {
        persistence: getRNPersistence(AsyncStorage),
      });
    } else {
      auth = FirebaseAuth.getAuth(app);
    }
  } catch {
    auth = FirebaseAuth.getAuth(app);
  }
}

// Prevent transient Firestore WebChannel backoff logs from triggering Expo Web Redbox overlays
setLogLevel('silent');

let db: Firestore;
try {
  db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  });
} catch {
  db = getFirestore(app);
}

const storage = getStorage(app);

export { app, auth, db, storage };
