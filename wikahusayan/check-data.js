const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyD9khDPPquuztCUWLfzithwPmQFpI8t49g",
  authDomain: "wikahusayan-quest.firebaseapp.com",
  projectId: "wikahusayan-quest",
  storageBucket: "wikahusayan-quest.firebasestorage.app",
  messagingSenderId: "744849133114",
  appId: "1:744849133114:web:31c5f34bc1ace7e3a5ef03"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkData() {
  console.log('Checking leaderboard data...');

  const collections = ['leaderboard_ladder', 'leaderboard_speed_challenge', 'leaderboard_drag_drop'];

  for (const col of collections) {
    console.log(`\n=== ${col} ===`);
    const snapshot = await getDocs(collection(db, col));
    console.log(`Documents: ${snapshot.docs.length}`);

    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ID: ${doc.id}, User: ${data.userId}, Points: ${data.points}, Name: ${data.displayName}`);
    });
  }
}

checkData().catch(console.error);