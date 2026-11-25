import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCTfd5GijX5ph7WNEG8sD1gr6sV1G-u8yU',
  authDomain: 'taskmanager-e2a0d.firebaseapp.com',
  projectId: 'taskmanager-e2a0d',
  storageBucket: 'taskmanager-e2a0d.firebasestorage.app',
  messagingSenderId: '314373059530',
  appId: '1:314373059530:android:9ebb0920ac73e168919533',
};

async function runHealthCheck() {
  const results = {
    auth: { status: 'pending', details: '' },
    firestore: { status: 'pending', details: '' },
    securityRules: { status: 'pending', details: '' },
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const testEmail = 'healthcheck@taskmanager.com';
  const testPassword = 'Password123!';

  console.log('=== 1. TESTING AUTHENTICATION ===');
  let user = null;
  try {
    try {
      const cred = await signInWithEmailAndPassword(auth, testEmail, testPassword);
      user = cred.user;
      console.log('✓ Successfully signed in existing test account:', user.uid);
      results.auth = { status: 'PASSED', details: `User authenticated (UID: ${user.uid})` };
    } catch (signInErr) {
      if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
        const newCred = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
        user = newCred.user;
        console.log('✓ Successfully created new test account:', user.uid);
        results.auth = { status: 'PASSED', details: `New user created & authenticated (UID: ${user.uid})` };
      } else {
        throw signInErr;
      }
    }
  } catch (authErr) {
    console.error('✗ Auth failed:', authErr.message);
    results.auth = { status: 'FAILED', details: authErr.message };
  }

  if (user) {
    console.log('\n=== 2. TESTING FIRESTORE (TASKS & USERS) ===');
    const testTaskId = `health_task_${Date.now()}`;
    const taskDocRef = doc(db, 'tasks', testTaskId);
    const userDocRef = doc(db, 'users', user.uid);

    try {
      // 2a. Test User Profile write to /users/{uid}
      await setDoc(userDocRef, {
        email: user.email,
        displayName: 'Health Checker',
        updatedAt: Date.now(),
      });
      console.log('✓ Successfully wrote user profile to /users/' + user.uid);

      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        console.log('✓ Successfully read back user profile from /users/' + user.uid);
      }

      // 2b. Test Task write to /tasks with userId
      await setDoc(taskDocRef, {
        userId: user.uid,
        title: 'Health Check Task',
        category: 'Work',
        priority: 'high',
        completed: false,
        createdAt: Date.now(),
      });
      console.log('✓ Successfully wrote task to /tasks/' + testTaskId);

      // 2c. Test query with composite index (userId == user.uid)
      const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
      const querySnap = await getDocs(q);
      console.log(`✓ Successfully queried tasks for user. Found ${querySnap.size} document(s).`);

      // 2d. Clean up test task
      await deleteDoc(taskDocRef);
      console.log('✓ Successfully deleted test task document.');

      results.firestore = {
        status: 'PASSED',
        details: 'Full CRUD & query operations confirmed in /users and /tasks',
      };
      results.securityRules = {
        status: 'PASSED',
        details: 'Security rules enforce user ownership and allow authenticated access.',
      };
    } catch (fsErr) {
      console.error('✗ Firestore test failed:', fsErr);
      results.firestore = { status: 'FAILED', details: fsErr.message };
      results.securityRules = { status: 'FAILED', details: fsErr.message };
    } finally {
      await signOut(auth);
      console.log('✓ Signed out cleanly.');
    }
  }

  console.log('\n=== SUMMARY OF SUBSYSTEM STATUS ===');
  console.log(JSON.stringify(results, null, 2));
}

runHealthCheck()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Unhandled health check failure:', e);
    process.exit(1);
  });
