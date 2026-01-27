// Sample JS para sa Manage Topics & Edit Lesson

// Import Firebase modules directly
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, where, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

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
window.onAuthStateChanged = onAuthStateChanged;

console.log('Firebase initialized in teacher.js module');
console.log('Auth object available:', !!auth);
console.log('DB object available:', !!db);

// Monitor auth state
console.log('Setting up onAuthStateChanged listener...');
onAuthStateChanged(auth, (user) => {
  console.log('🔥 onAuthStateChanged fired with user:', user ? 'exists' : 'null');

  currentUser = user;
  isAuthenticated = !!user;

  // Update global variables
  window.isAuthenticated = isAuthenticated;
  window.currentUser = currentUser;

  console.log('Auth state changed:', { user: !!user, uid: user?.uid, email: user?.email });

  // Check if we're on a teacher page that requires authentication
  if (!user && window.location.pathname.includes('/teacher/')) {
    // Not authenticated, redirect to login
    console.log('Not authenticated, redirecting to login...');
    window.location.href = '../../public/index.html';
  } else if (user) {
    console.log('User authenticated, teacher functions available');
  }
});

// Also check current auth state immediately
console.log('Checking current auth state...');
const currentAuthUser = auth.currentUser;
console.log('Current auth user:', currentAuthUser ? 'exists' : 'null');
if (currentAuthUser) {
  currentUser = currentAuthUser;
  isAuthenticated = true;
  console.log('Using current auth user:', currentUser.uid);
}

// Fallback: check auth state after a delay
setTimeout(() => {
  console.log('Fallback auth check...');
  const fallbackUser = auth.currentUser;
  console.log('Fallback auth user:', fallbackUser ? 'exists' : 'null');
  if (fallbackUser && !currentUser) {
    currentUser = fallbackUser;
    isAuthenticated = true;
    console.log('Using fallback auth user:', currentUser.uid);
  } else if (!fallbackUser) {
    console.log('No user found in fallback check');
  }
}, 2000);


async function addTopic() {
  const title = prompt('Ilagay ang title ng bagong topic:');
  if (!title) return;

  const description = prompt('Ilagay ang description ng topic:');
  if (!description) return;

  const id = Date.now(); // unique id

  // Save to Firebase first
  await saveTopic(id, title, description);

  // Then reload all topics from database to show the new one
  await loadTopics();
}

async function editTopic(id) {
  const card = document.querySelector(`.card[data-id='${id}']`);
  const currentTitle = card.querySelector('h2').innerText;
  const currentDesc = card.querySelector('p').innerText;

  const newTitle = prompt('Baguhin ang title:', currentTitle);
  const newDesc = prompt('Baguhin ang description:', currentDesc);

  if (newTitle) card.querySelector('h2').innerText = newTitle;
  if (newDesc) card.querySelector('p').innerText = newDesc;

  // Save to Firebase
  if (newTitle || newDesc) {
    await saveTopic(id, newTitle || currentTitle, newDesc || currentDesc);
    // Reload topics to ensure consistency
    await loadTopics();
  }
}

async function deleteTopic(id) {
  const card = document.querySelector(`.card[data-id='${id}']`);
  if (confirm('Sigurado ka bang gusto mong i-delete ito?')) {
    card.remove();

    // Delete from Firebase
    await deleteTopicFromFirebase(id);

    // Reload topics to ensure consistency
    await loadTopics();
  }
}

async function saveTopic(id, title, description) {
  console.log('saveTopic called with:', { id, title, description });
  console.log('Auth status:', { isAuthenticated, currentUser: !!currentUser, uid: currentUser?.uid });

  try {
    if (isAuthenticated && currentUser) {
      console.log('Saving to Firebase...');

      // Save to topics collection
      const topicData = {
        id: id,
        title: title,
        description: description,
        teacherId: currentUser.uid,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      };

      const docRef = doc(db, 'topics', id.toString());
      await setDoc(docRef, topicData);
      console.log('✅ Saved to topics collection');

      // Also save to game_content collection like games are saved
      const contentData = {
        gameType: 'topic',
        topicId: id,
        teacherId: currentUser.uid,
        content: {
          title: title,
          description: description,
          topicData: topicData
        },
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      };

      const contentDocId = `topic_${id}`;
      const contentDocRef = doc(db, 'game_content', contentDocId);
      await setDoc(contentDocRef, contentData);
      console.log('✅ Saved to game_content collection');

      console.log('Topic saved to both topics and game_content collections');
      alert('Topic saved successfully to database!');
    } else {
      console.log('❌ Not authenticated, saving to localStorage');
      // Fallback to localStorage
      const topics = JSON.parse(localStorage.getItem('topics') || '[]');
      const existingIndex = topics.findIndex(t => t.id === id);
      const topicData = { id, title, description };

      if (existingIndex >= 0) {
        topics[existingIndex] = topicData;
      } else {
        topics.push(topicData);
      }

      localStorage.setItem('topics', JSON.stringify(topics));
      console.log('Topic saved to localStorage');
      alert('Saved to local storage (not logged in)');
    }
  } catch (error) {
    console.error('❌ Error saving topic:', error);
    // Fallback to localStorage
    const topics = JSON.parse(localStorage.getItem('topics') || '[]');
    const existingIndex = topics.findIndex(t => t.id === id);
    const topicData = { id, title, description };

    if (existingIndex >= 0) {
      topics[existingIndex] = topicData;
    } else {
      topics.push(topicData);
    }

    localStorage.setItem('topics', JSON.stringify(topics));
    alert('Error saving to database, saved to local storage instead!');
  }
}

async function deleteTopicFromFirebase(id) {
  try {
    if (isAuthenticated && currentUser) {
      // Delete from topics collection
      const docRef = doc(db, 'topics', id.toString());
      await deleteDoc(docRef);

      // Also delete from game_content collection
      const contentDocId = `topic_${id}`;
      const contentDocRef = doc(db, 'game_content', contentDocId);
      await deleteDoc(contentDocRef);

      console.log('Topic deleted from both topics and game_content collections');
    } else {
      // Fallback to localStorage
      const topics = JSON.parse(localStorage.getItem('topics') || '[]');
      const filteredTopics = topics.filter(t => t.id !== id);
      localStorage.setItem('topics', JSON.stringify(filteredTopics));
      console.log('Topic deleted from localStorage');
    }
  } catch (error) {
    console.error('Error deleting topic:', error);
    // Fallback to localStorage
    const topics = JSON.parse(localStorage.getItem('topics') || '[]');
    const filteredTopics = topics.filter(t => t.id !== id);
    localStorage.setItem('topics', JSON.stringify(filteredTopics));
  }
}

// Load topics on page load
async function loadTopics() {
  const container = document.getElementById('topics-container');
  if (!container) return;

  console.log('loadTopics called, auth state:', { isAuthenticated, currentUser: !!currentUser, uid: currentUser?.uid });

  // Always start with empty container
  container.innerHTML = '';

  try {
    let topicsLoaded = false;

    // Try to load from topics collection (rules allow anyone to read)
    try {
      const querySnapshot = await getDocs(collection(db, 'topics'));
      console.log(`Found ${querySnapshot.size} documents in topics collection`);

      if (!querySnapshot.empty) {
        topicsLoaded = true;

        querySnapshot.forEach((doc) => {
          const topic = doc.data();
          console.log(`Loading topic from topics collection: ${topic.title} (ID: ${topic.id})`);
          const card = document.createElement('div');
          card.className = 'card';
          card.setAttribute('data-id', topic.id);
          card.innerHTML = `
            <h2>${topic.title}</h2>
            <p>${topic.description}</p>
            <button onclick="handleTopicAction(${topic.id}, 'edit')">Edit</button>
            <button onclick="handleTopicAction(${topic.id}, 'delete')">Delete</button>
          `;
          container.appendChild(card);
        });

        console.log(`Loaded ${querySnapshot.size} topics from topics collection`);
      } else {
        console.log('No topics found in topics collection, will check game_content or localStorage');
      }
    } catch (error) {
      console.error('Error loading from topics collection:', error);
    }

    // If still no topics loaded, try game_content collection
    if (!topicsLoaded) {
      try {
        const gameContentQuery = query(
          collection(db, 'game_content'),
          where('gameType', '==', 'topic')
        );
        const gameContentSnapshot = await getDocs(gameContentQuery);
        console.log(`Found ${gameContentSnapshot.size} documents in game_content collection`);

        if (!gameContentSnapshot.empty) {
          topicsLoaded = true;

          gameContentSnapshot.forEach((doc) => {
            const content = doc.data();
            const topic = content.content.topicData || content.content;
            console.log(`Loading topic from game_content collection: ${topic.title} (ID: ${topic.id})`);
            const card = document.createElement('div');
            card.className = 'card';
            card.setAttribute('data-id', topic.id);
            card.innerHTML = `
              <h2>${topic.title}</h2>
              <p>${topic.description}</p>
              <button onclick="handleTopicAction(${topic.id}, 'edit')">Edit</button>
              <button onclick="handleTopicAction(${topic.id}, 'delete')">Delete</button>
            `;
            container.appendChild(card);
          });

          console.log(`Loaded ${gameContentSnapshot.size} topics from game_content collection`);
        }
      } catch (error) {
        console.error('Error loading from game_content collection:', error);
      }
    }

    // If no topics loaded from database, try localStorage
    if (!topicsLoaded) {
      const topics = JSON.parse(localStorage.getItem('topics') || '[]');
      console.log(`Found ${topics.length} topics in localStorage`);

      if (topics.length > 0) {
        topicsLoaded = true;
        topics.forEach(topic => {
          console.log(`Loading topic from localStorage: ${topic.title} (ID: ${topic.id})`);
          const card = document.createElement('div');
          card.className = 'card';
          card.setAttribute('data-id', topic.id);
          card.innerHTML = `
            <h2>${topic.title}</h2>
            <p>${topic.description}</p>
            <button onclick="handleTopicAction(${topic.id}, 'edit')">Edit</button>
            <button onclick="handleTopicAction(${topic.id}, 'delete')">Delete</button>
          `;
          container.appendChild(card);
        });

        console.log(`Loaded ${topics.length} topics from localStorage`);
      }
    }

    // If still no topics loaded, show a message
    if (!topicsLoaded) {
      const noTopicsDiv = document.createElement('div');
      noTopicsDiv.className = 'no-topics-message';
      noTopicsDiv.innerHTML = `
        <p style="text-align: center; padding: 20px; color: #666;">
          Walang topics sa database. Magdagdag ng bagong topic sa ibaba.
        </p>
      `;
      container.appendChild(noTopicsDiv);
      console.log('No topics found anywhere, showing empty message');
    }
  } catch (error) {
    console.error('Error loading topics:', error);

    // On error, show error message
    container.innerHTML = `
      <p style="text-align: center; padding: 20px; color: #f44336;">
        Error loading topics: ${error.message}
      </p>
    `;
  }
}
  

// Function to load topics for dropdown selection (used by edit-lesson.html)
async function loadTopicsForSelect(selectElementId) {
  const selectElement = document.getElementById(selectElementId);
  if (!selectElement) {
    console.error(`Select element with id '${selectElementId}' not found`);
    return;
  }

  try {
    // Clear existing options except the first one
    const firstOption = selectElement.querySelector('option[value=""]');
    selectElement.innerHTML = '';
    if (firstOption) {
      selectElement.appendChild(firstOption);
    } else {
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = '-- Pumili ng Topic --';
      selectElement.appendChild(defaultOption);
    }

    // Try to load from topics collection (rules allow anyone to read)
    try {
      const querySnapshot = await getDocs(collection(db, 'topics'));
      console.log(`Found ${querySnapshot.size} topics for dropdown selection`);

      if (!querySnapshot.empty) {
        querySnapshot.forEach((doc) => {
          const topic = doc.data();
          const option = document.createElement('option');
          option.value = topic.id;
          option.textContent = topic.title;
          selectElement.appendChild(option);
        });
        console.log(`Loaded ${querySnapshot.size} topics into dropdown`);
      } else {
        // No topics in database
        const noTopicsOption = document.createElement('option');
        noTopicsOption.value = '';
        noTopicsOption.textContent = 'Walang available na topics';
        noTopicsOption.disabled = true;
        selectElement.appendChild(noTopicsOption);
        console.log('No topics found in database for dropdown');
      }
    } catch (error) {
      console.error('Error loading topics for select:', error);
      const errorOption = document.createElement('option');
      errorOption.value = '';
      errorOption.textContent = 'Error loading topics';
      errorOption.disabled = true;
      selectElement.appendChild(errorOption);
    }
  } catch (error) {
    console.error('Error loading topics for select:', error);
    // Clear and add default topics as fallback
    selectElement.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Pumili ng Topic --';
    selectElement.appendChild(defaultOption);

    const defaultTopics = [
      { id: 'bahagi', title: 'Bahagi ng Pananalita' },
      { id: 'bantas', title: 'Bantas' },
      { id: 'pangungusap', title: 'Pangungusap' },
      { id: 'nangng', title: 'Nang/Ng' }
    ];

    defaultTopics.forEach((topic) => {
      const option = document.createElement('option');
      option.value = topic.id;
      option.textContent = topic.title;
      selectElement.appendChild(option);
    });
    console.log('Added default topics to dropdown as fallback');
  }
}

// Function to load lesson content from database
async function loadContent(lesson) {
  console.log('loadContent called with:', lesson, typeof lesson);
  console.log('Auth status:', { isAuthenticated, currentUser: !!currentUser, uid: currentUser?.uid });

  try {
    // Try to load from Firebase first (rules allow anyone to read)
    const docId = `lesson_${lesson}`;
    console.log('Looking for document ID:', docId);
    const docRef = doc(db, 'lesson_content', docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('✅ Lesson content loaded from Firebase:', data);
      console.log('Content field:', data.content, typeof data.content);
      return data.content; // Return the content field
    } else {
      console.log('❌ No lesson content found in Firebase for docId:', docId);
      return null;
    }
  } catch (error) {
    console.error('❌ Error loading lesson content:', error);
    return null;
  }
}

async function saveContent(lesson, contentString = null) {
  let content;

  // If contentString is provided, use it; otherwise get from textarea
  if (contentString !== null) {
    content = contentString;
  } else {
    const textarea = document.getElementById(`content-${lesson}`);
    content = textarea ? textarea.value : '';
  }

  console.log('saveContent called with:', { lesson, contentLength: content.length });
  console.log('Auth status:', { isAuthenticated, currentUser: !!currentUser, uid: currentUser?.uid });

  try {
    if (isAuthenticated && currentUser) {
      console.log('Saving lesson content to Firebase...');

      const contentData = {
        gameType: 'lesson',
        lessonType: lesson,
        teacherId: currentUser.uid,
        content: content,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      };

      const docId = `lesson_${lesson}`;
      console.log('Saving to document ID:', docId);
      const docRef = doc(db, 'lesson_content', docId);
      await setDoc(docRef, contentData);

      console.log('✅ Lesson content saved to lesson_content collection');
      alert('Content saved to database!');
    } else {
      console.log('❌ Not authenticated, saving lesson to localStorage');
      // Fallback to localStorage
      localStorage.setItem(`lesson-${lesson}`, content);
      alert('Content saved to local storage (offline mode)!');
    }
  } catch (error) {
    console.error('❌ Error saving lesson content:', error);
    // Fallback to localStorage
    localStorage.setItem(`lesson-${lesson}`, content);
    alert('Error saving to database, saved to local storage instead!');
  }
}

// Personalize greeting for logged-in teacher
document.addEventListener('DOMContentLoaded', function() {
  const teacherName = sessionStorage.getItem('teacherName');
  if (teacherName) {
    const greetingElement = document.getElementById('teacher-greeting');
    if (greetingElement) {
      greetingElement.textContent = `Maligayang pagdating, Guro ${teacherName}! "Pamahalaan ang mga topics at subaybayan ang progreso ng mga estudyante."`;
    }
  }
});

function logout() {
  console.log('Logout function called - clearing storage and redirecting');

  // Clear all storage
  sessionStorage.clear();
  localStorage.clear();

  // Force redirect to login page
  window.location.href = '../public/index.html';

  // Optional: Try Firebase signOut in background (don't wait for it)
  if (typeof auth !== 'undefined' && auth && typeof signOut !== 'undefined') {
    signOut(auth).then(() => {
      console.log('Firebase signOut completed');
    }).catch((error) => {
      console.error('Firebase signOut error (but redirecting anyway):', error);
    });
  }
}

// Make functions available globally
window.addTopic = addTopic;
window.editTopic = editTopic;
window.deleteTopic = deleteTopic;
window.saveTopic = saveTopic;
window.deleteTopicFromFirebase = deleteTopicFromFirebase;
window.loadTopics = loadTopics;
window.loadTopicsForSelect = loadTopicsForSelect;
window.loadContent = loadContent;
window.saveContent = saveContent;
// window.clearLeaderboardData = clearLeaderboardData; // Removed - defined later
// window.showClearLeaderboardModal = showClearLeaderboardModal; // Removed - defined later
// window.hideClearLeaderboardModal = hideClearLeaderboardModal; // Removed - defined later
window.logout = logout;

console.log('All teacher functions assigned to window object');
console.log('Available functions check:', {
  editTopic: typeof window.editTopic,
  deleteTopic: typeof window.deleteTopic,
  addTopic: typeof window.addTopic,
  loadTopics: typeof window.loadTopics,
  loadTopicsForSelect: typeof window.loadTopicsForSelect,
  loadContent: typeof window.loadContent,
  saveContent: typeof window.saveContent,
  logout: typeof window.logout
});

// ===== LEADERBOARD MANAGEMENT FUNCTIONS =====

// Show clear leaderboard modal
window.showClearLeaderboardModal = function() {
  console.log('showClearLeaderboardModal called');
  const modal = document.getElementById('clear-leaderboard-modal');
  console.log('Modal element:', modal);
  if (modal) {
    modal.style.display = 'flex';
    console.log('Modal displayed');
  } else {
    console.error('Modal not found');
  }
}

// Hide clear leaderboard modal
window.hideClearLeaderboardModal = function() {
  const modal = document.getElementById('clear-leaderboard-modal');
  modal.style.display = 'none';
  
  // Reset modal content to original form
  const modalContent = modal.querySelector('.modal-content');
  modalContent.innerHTML = `
    <h2>🗑️ Clear Leaderboard Data</h2>
    <p>Are you sure you want to clear all leaderboard data? This action cannot be undone. Use the game progress option to reset all student scores.</p>
    
    <div class="leaderboard-options">
      <label><input type="checkbox" id="clear-ladder" checked> Ladder Quiz Leaderboard</label><br>
      <label><input type="checkbox" id="clear-speed" checked> Speed Challenge Leaderboard</label><br>
      <label><input type="checkbox" id="clear-drag-drop" checked> Drag & Drop Puzzle Leaderboard</label><br>
      <label><input type="checkbox" id="clear-quest" checked> Quest Game Leaderboard</label><br>
      <label><input type="checkbox" id="clear-general" checked> General Leaderboard</label><br>
      <label><input type="checkbox" id="clear-game-progress"> ⚠️ Clear ALL Game Progress Data (Resets all student scores)</label><br>
    </div>
    
    <div class="modal-buttons">
      <button class="cancel-btn" onclick="if(window.hideClearLeaderboardModal) window.hideClearLeaderboardModal(); else alert('Loading...')">Cancel</button>
      <button class="confirm-btn" onclick="if(window.clearLeaderboardData) window.clearLeaderboardData(); else alert('Loading...')">Clear Data</button>
    </div>
  `;
}

// Clear leaderboard data
window.clearLeaderboardData = async function() {
  console.log('clearLeaderboardData called');
  console.log('currentUser:', currentUser);
  console.log('isAuthenticated:', isAuthenticated);
  
  // Check if user is authenticated
  if (!currentUser) {
    console.log('No current user');
    alert('❌ You must be logged in as a teacher to perform this action.');
    return;
  }

  console.log('User authenticated:', currentUser.uid);

  if (!confirm('Are you sure you want to clear the selected leaderboard data? This action cannot be undone and will permanently delete the selected data!')) {
    console.log('User cancelled');
    return;
  }

  console.log('User confirmed');

  const collectionsToClear = [];
  
  if (document.getElementById('clear-ladder').checked) {
    collectionsToClear.push('leaderboard_ladder');
  }
  if (document.getElementById('clear-speed').checked) {
    collectionsToClear.push('leaderboard_speed_challenge');
  }
  if (document.getElementById('clear-drag-drop').checked) {
    collectionsToClear.push('leaderboard_drag_drop');
  }
  if (document.getElementById('clear-quest').checked) {
    collectionsToClear.push('leaderboard_quest');
  }
  if (document.getElementById('clear-general').checked) {
    collectionsToClear.push('leaderboard');
  }
  if (document.getElementById('clear-game-progress').checked) {
    collectionsToClear.push('game_progress');
  }

  console.log('Collections to clear:', collectionsToClear);

  if (collectionsToClear.length === 0) {
    alert('Please select at least one leaderboard to clear.');
    return;
  }

  try {
    let totalDeleted = 0;
    let results = [];
    
    for (const collectionName of collectionsToClear) {
      console.log('Clearing collection:', collectionName);
      const collectionRef = collection(db, collectionName);
      const querySnapshot = await getDocs(collectionRef);
      
      console.log('Found', querySnapshot.size, 'documents in', collectionName);
      
      const deletePromises = [];
      querySnapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });
      
      await Promise.all(deletePromises);
      totalDeleted += querySnapshot.size;
      
      results.push(`✅ ${collectionName}: ${querySnapshot.size} entries cleared`);
      console.log(`✅ Cleared ${querySnapshot.size} documents from ${collectionName}`);
    }
    
    // Show results in modal instead of alert
    const modalContent = document.querySelector('#clear-leaderboard-modal .modal-content');
    modalContent.innerHTML = `
      <h2>🗑️ Clear Complete</h2>
      <div style="text-align: left; background: #f8f9fa; padding: 15px; border-radius: 10px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #28a745;">✅ Success!</h3>
        <p><strong>Total entries cleared: ${totalDeleted}</strong></p>
        <div style="margin-top: 10px;">
          ${results.map(result => `<div>${result}</div>`).join('')}
        </div>
      </div>
      <div class="modal-buttons">
        <button class="confirm-btn" onclick="hideClearLeaderboardModal()" style="width: 100%;">Close</button>
      </div>
    `;
    
  } catch (error) {
    console.error('❌ Error clearing leaderboard data:', error);
    
    // Show error in modal instead of alert
    const modalContent = document.querySelector('#clear-leaderboard-modal .modal-content');
    modalContent.innerHTML = `
      <h2>🗑️ Clear Failed</h2>
      <div style="text-align: left; background: #f8d7da; padding: 15px; border-radius: 10px; margin: 20px 0; border: 1px solid #f5c6cb;">
        <h3 style="margin-top: 0; color: #721c24;">❌ Error</h3>
        <p>${error.message}</p>
      </div>
      <div class="modal-buttons">
        <button class="cancel-btn" onclick="hideClearLeaderboardModal()" style="width: 100%;">Close</button>
      </div>
    `;
  }
}
