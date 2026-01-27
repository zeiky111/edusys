# Wikahusayan - Firebase Setup Guide

## Firebase Configuration

Your Firebase project has been configured with the following settings:

- **Project ID**: wikahusayan-quest
- **Authentication**: Enabled
- **Firestore Database**: Enabled
- **Storage**: Enabled

## File Structure

```
firebase/
├── firebase-config.js    # Firebase initialization and configuration
├── auth.js              # Authentication functions (sign up, sign in, sign out)
└── database.js          # Firestore database operations
```

## How to Use Firebase in Your HTML Pages

### 1. Include Firebase SDK in HTML

Add these script tags to any HTML page that needs Firebase functionality:

```html
<!-- Firebase SDK -->
<script type="module">
    // Import Firebase modules
    import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
    import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
    import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

    // Your Firebase config
    const firebaseConfig = {
        apiKey: "AIzaSyD9khDPPquuztCUWLfzithwPmQFpI8t49g",
        authDomain: "wikahusayan-quest.firebaseapp.com",
        projectId: "wikahusayan-quest",
        storageBucket: "wikahusayan-quest.firebasestorage.app",
        messagingSenderId: "744849133114",
        appId: "1:744849133114:web:31c5f34bc1ace7e3a5ef03"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
</script>
```

### 2. Authentication Example

```javascript
// Sign up
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

async function signUp(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('User created:', userCredential.user);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Sign in
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

async function signIn(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('User signed in:', userCredential.user);
    } catch (error) {
        console.error('Error:', error.message);
    }
}
```

### 3. Firestore Database Example

```javascript
// Add document
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

async function addLesson(title, content) {
    try {
        const docRef = await addDoc(collection(db, 'lessons'), {
            title,
            content,
            createdAt: new Date()
        });
        console.log('Lesson added with ID:', docRef.id);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Get documents
import { getDocs } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

async function getLessons() {
    try {
        const querySnapshot = await getDocs(collection(db, 'lessons'));
        querySnapshot.forEach((doc) => {
            console.log(doc.id, '=>', doc.data());
        });
    } catch (error) {
        console.error('Error:', error.message);
    }
}
```

## Available Firebase Functions

### Authentication (`auth.js`)
- `signUp(email, password)` - Create new user account
- `signIn(email, password)` - Sign in existing user
- `signOut()` - Sign out current user
- `onAuthStateChange(callback)` - Listen for auth state changes
- `getCurrentUser()` - Get current authenticated user

### Database (`database.js`)
- `addDocument(collectionName, data)` - Add document to collection
- `getDocuments(collectionName, options)` - Get documents from collection
- `getDocument(collectionName, documentId)` - Get single document
- `updateDocument(collectionName, documentId, data)` - Update document
- `deleteDocument(collectionName, documentId)` - Delete document
- `saveLessonData(lessonId, data)` - Save lesson content
- `getLessonData(lessonId)` - Get lesson content
- `saveStudentProgress(studentId, lessonId, progress)` - Save progress
- `getStudentProgress(studentId)` - Get student progress

## Testing Firebase

Open `firebase-test.html` in your browser to test Firebase authentication and database functionality.

## Security Rules

Make sure to set up proper Firestore security rules in your Firebase console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Next Steps

1. Test the Firebase integration using `firebase-test.html`
2. Integrate Firebase authentication into your login system
3. Replace localStorage with Firestore for data persistence
4. Set up proper security rules in Firebase console
5. Add error handling and loading states to your UI

## Installation (Optional)

If you want to use npm for dependency management:

```bash
npm install
npm start
```

This will start a local server at http://localhost:8000