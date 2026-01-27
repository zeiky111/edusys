// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// Firebase configuration
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

// Global variables for authentication state
let currentUser = null;
let isAuthenticated = false;

// Make auth available globally
window.auth = auth;
window.db = db;

console.log('Firebase initialized in student.js module');

// Monitor auth state
onAuthStateChanged(auth, (user) => {
  console.log('🔥 Student onAuthStateChanged fired with user:', user ? 'exists' : 'null');

  currentUser = user;
  isAuthenticated = !!user;

  if (!user && window.location.pathname.includes('/student/')) {
    // Not authenticated, redirect to login
    console.log('Student not authenticated, redirecting to login...');
    window.location.href = '../public/index.html';
  } else if (user) {
    console.log('Student authenticated, loading topics...');
    // Load topics when authenticated
    loadTopics();
  }
});

// Load topics from Firebase and display them
async function loadTopics() {
  const container = document.getElementById('topics-container');
  if (!container) {
    console.log('Topics container not found, skipping topic loading');
    return;
  }

  try {
    let hasTopics = false;

    if (isAuthenticated && currentUser) {
      console.log('Loading topics from Firebase...');

      // Load from topics collection first
      const querySnapshot = await getDocs(collection(db, 'topics'));

      if (!querySnapshot.empty) {
        container.innerHTML = '';
        hasTopics = true;

        querySnapshot.forEach((doc) => {
          const topic = doc.data();
          const card = document.createElement('div');
          card.className = 'card';
          card.innerHTML = `
            <h2>${topic.title}</h2>
            <p>${topic.description}</p>
            <button onclick="openLessonFromTopic('${topic.id}')">Buksan ang Aralin</button>
          `;
          container.appendChild(card);
        });

        console.log(`✅ Loaded ${querySnapshot.size} topics from topics collection`);
      } else {
        // If no topics in topics collection, try loading from game_content collection
        console.log('No topics found in topics collection, checking game_content...');
        const gameContentQuery = query(
          collection(db, 'game_content'),
          where('gameType', '==', 'topic')
        );
        const gameContentSnapshot = await getDocs(gameContentQuery);

        if (!gameContentSnapshot.empty) {
          container.innerHTML = '';
          hasTopics = true;

          gameContentSnapshot.forEach((doc) => {
            const content = doc.data();
            const topic = content.content.topicData || content.content;
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
              <h2>${topic.title}</h2>
              <p>${topic.description}</p>
              <button onclick="openLessonFromTopic('${topic.id}')">Buksan ang Aralin</button>
            `;
            container.appendChild(card);
          });

          console.log(`✅ Loaded ${gameContentSnapshot.size} topics from game_content collection`);
        }
      }
    }

    if (!hasTopics) {
      // Load from localStorage as fallback
      const topics = JSON.parse(localStorage.getItem('topics') || '[]');

      if (topics.length > 0) {
        container.innerHTML = '';
        topics.forEach(topic => {
          const card = document.createElement('div');
          card.className = 'card';
          card.innerHTML = `
            <h2>${topic.title}</h2>
            <p>${topic.description}</p>
            <button onclick="openLessonFromTopic('${topic.id}')">Buksan ang Aralin</button>
          `;
          container.appendChild(card);
        });
        console.log(`📱 Loaded ${topics.length} topics from localStorage`);
      } else {
        // No topics available - show message
        container.innerHTML = `
          <div class="no-topics-message" style="text-align: center; padding: 2rem; color: #666;">
            <h3>Walang available na aralin sa ngayon</h3>
            <p>Maghintay lamang habang ang mga guro ay naghahanda ng mga aralin.</p>
            <p>Maaari kang maglaro muna sa <a href="games/select.html" style="color: #007bff;">mga laro</a> habang naghihintay.</p>
          </div>
        `;
        console.log('No topics found - showing message');
      }
    }
  } catch (error) {
    console.error('❌ Error loading topics:', error);
    // On error, show message instead of default cards
    const container = document.getElementById('topics-container');
    if (container) {
      container.innerHTML = `
        <div class="error-message" style="text-align: center; padding: 2rem; color: #dc3545;">
          <h3>Error loading topics</h3>
          <p>May problema sa pag-load ng mga aralin. Subukang i-refresh ang page.</p>
        </div>
      `;
    }
  }
}

// Open lesson based on topic ID
function openLessonFromTopic(topicId) {
  // Use the dynamic lesson viewer for all topics
  console.log('Opening dynamic viewer for topic:', topicId);
  window.location.href = `lessons/viewer.html?lesson=${topicId}`;
}

function openLesson(url) {
  window.location.href = url;
}

// Personalize greeting for logged-in student
document.addEventListener('DOMContentLoaded', function() {
  const studentName = sessionStorage.getItem('studentName');
  if (studentName) {
    const greetingElement = document.getElementById('student-greeting');
    if (greetingElement) {
      greetingElement.textContent = `Maligayang pagdating, ${studentName}! "Halina't sumabak sa Wikahusayan Quest—larong wika kung saan bawat hakbang ay sa tagumpay at gantimpala!"`;
    }

    // Update user name in profile dropdown
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
      userNameElement.textContent = studentName;
    }
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('profile-dropdown');
    const profileBtn = document.querySelector('.profile-btn');
    if (dropdown && profileBtn && !profileBtn.contains(e.target)) {
      dropdown.classList.remove('show');
    }
  });
});

function toggleDropdown() {
  const dropdown = document.getElementById('profile-dropdown');
  if (dropdown) {
    dropdown.classList.toggle('show');
  }
}

function viewProfile() {
  window.location.href = 'profile.html';
  // Close dropdown
  const dropdown = document.getElementById('profile-dropdown');
  if (dropdown) {
    dropdown.classList.remove('show');
  }
}

function logout() {
  if (confirm('Sigurado ka bang mag-logout?')) {
    // Sign-out successful, clear local storage and redirect
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = '../public/index.html';
  }
}

// Function to load lesson content from database
async function loadContent(lesson) {
  console.log('loadContent called with:', lesson);
  console.log('Auth status:', { isAuthenticated, currentUser: !!currentUser, uid: currentUser?.uid });

  try {
    // Try to load from Firebase first (rules allow anyone to read)
    const docId = `lesson_${lesson}`;
    const docRef = doc(db, 'lesson_content', docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('✅ Lesson content loaded from Firebase:', data);
      return data.content; // Return the content field
    } else {
      console.log('❌ No lesson content found in Firebase');
      return null;
    }
  } catch (error) {
    console.error('❌ Error loading lesson content:', error);
    return null;
  }
}

// Make functions available globally
window.openLesson = openLesson;
window.openLessonFromTopic = openLessonFromTopic;
window.loadTopics = loadTopics;
window.loadContent = loadContent;
window.logout = logout;
window.toggleDropdown = toggleDropdown;
window.viewProfile = viewProfile;
window.doc = doc;
window.getDoc = getDoc;

console.log('Student functions loaded and available globally');
