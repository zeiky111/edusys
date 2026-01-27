// Script to update all users' badges to match the new system
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

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
const db = getFirestore(app);

// Function to get ranking badge based on points
function getRankingBadge(totalPoints) {
  const badgeThresholds = [
    { points: 10, badge: 'Silver Scholar' },
    { points: 50, badge: 'Gold Scholar' },
    { points: 150, badge: 'Platinum Scholar' },
    { points: 300, badge: 'Diamond Scholar' },
    { points: 600, badge: 'Master Scholar' }
  ];
  
  for (let i = badgeThresholds.length - 1; i >= 0; i--) {
    if (totalPoints >= badgeThresholds[i].points) {
      return badgeThresholds[i].badge;
    }
  }
  return null;
}

// Update all users' badges
async function updateAllBadges() {
  try {
    console.log('Starting badge update...');
    
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      // Get total points from game_progress
      const progressRef = collection(db, 'game_progress');
      const progressSnapshot = await getDocs(progressRef);
      
      let totalPoints = 0;
      progressSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.userId === userId) {
          totalPoints += data.score || 0;
        }
      });
      
      const rankingBadge = getRankingBadge(totalPoints);
      const existingBadges = userData.badges || [];
      
      // Filter out old ranking badges and Bronze Scholar
      const badgeHierarchy = ['Silver Scholar', 'Gold Scholar', 'Platinum Scholar', 'Diamond Scholar', 'Master Scholar'];
      const nonRankingBadges = existingBadges.filter(badge => !badgeHierarchy.includes(badge) && badge !== 'Bronze Scholar');
      
      const newBadges = rankingBadge ? [...nonRankingBadges, rankingBadge] : nonRankingBadges;
      
      if (JSON.stringify(newBadges.sort()) !== JSON.stringify(existingBadges.sort())) {
        await updateDoc(doc(db, 'users', userId), {
          badges: newBadges,
          updatedAt: new Date()
        });
        console.log(`Updated ${userData.displayName || userId}: ${totalPoints} pts -> ${rankingBadge || 'No badge'}`);
      }
    }
    
    console.log('Badge update completed!');
  } catch (error) {
    console.error('Error updating badges:', error);
  }
}

// Run the update
updateAllBadges();