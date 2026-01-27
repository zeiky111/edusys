// Firebase Firestore Database - Modern v9+ SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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

// Add a document to a collection
export async function addDocument(collectionName, data) {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Document written with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding document: ', error);
    throw error;
  }
}

// Get all documents from a collection
export async function getDocuments(collectionName, options = {}) {
  try {
    let q = collection(db, collectionName);

    if (options.where) {
      q = query(q, where(options.where.field, options.where.operator, options.where.value));
    }

    if (options.orderBy) {
      q = query(q, orderBy(options.orderBy.field, options.orderBy.direction || 'asc'));
    }

    if (options.limit) {
      q = query(q, limit(options.limit));
    }

    const querySnapshot = await getDocs(q);
    const documents = [];

    querySnapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return documents;
  } catch (error) {
    console.error('Error getting documents: ', error);
    throw error;
  }
}

// Get a single document by ID
export async function getDocument(collectionName, documentId) {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      console.log('No such document!');
      return null;
    }
  } catch (error) {
    console.error('Error getting document: ', error);
    throw error;
  }
}

// Update a document
export async function updateDocument(collectionName, documentId, data) {
  try {
    const docRef = doc(db, collectionName, documentId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date()
    });
    console.log('Document updated successfully');
  } catch (error) {
    console.error('Error updating document: ', error);
    throw error;
  }
}

// Delete a document
export async function deleteDocument(collectionName, documentId) {
  try {
    await deleteDoc(doc(db, collectionName, documentId));
    console.log('Document deleted successfully');
  } catch (error) {
    console.error('Error deleting document: ', error);
    throw error;
  }
}

// Save lesson data
export async function saveLessonData(lessonId, data) {
  try {
    const lessonRef = doc(db, 'lessons', lessonId);
    await updateDoc(lessonRef, {
      content: data,
      updatedAt: new Date()
    });
    console.log('Lesson data saved successfully');
  } catch (error) {
    console.error('Error saving lesson data: ', error);
    throw error;
  }
}

// Get lesson data
export async function getLessonData(lessonId) {
  try {
    const lessonRef = doc(db, 'lessons', lessonId);
    const lessonSnap = await getDoc(lessonRef);

    if (lessonSnap.exists()) {
      return lessonSnap.data().content;
    } else {
      console.log('Lesson not found');
      return null;
    }
  } catch (error) {
    console.error('Error getting lesson data: ', error);
    throw error;
  }
}

// Save student progress
export async function saveStudentProgress(studentId, lessonId, progress) {
  try {
    const progressRef = doc(db, 'progress', `${studentId}_${lessonId}`);
    await updateDoc(progressRef, {
      studentId,
      lessonId,
      progress,
      updatedAt: new Date()
    });
    console.log('Student progress saved successfully');
  } catch (error) {
    console.error('Error saving student progress: ', error);
    throw error;
  }
}

// Get student progress
export async function getStudentProgress(studentId) {
  try {
    const q = query(
      collection(db, 'progress'),
      where('studentId', '==', studentId)
    );
    const querySnapshot = await getDocs(q);
    const progress = {};

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      progress[data.lessonId] = data.progress;
    });

    return progress;
  } catch (error) {
    console.error('Error getting student progress: ', error);
    throw error;
  }
}

// ===== LEADERBOARD FUNCTIONS =====

// Save or update leaderboard score
export async function saveLeaderboardScore(userId, gameType, score, name) {
  try {
    const leaderboardRef = collection(db, 'leaderboard');
    const q = query(leaderboardRef,
      where('userId', '==', userId),
      where('gameType', '==', gameType)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Update existing score if new score is higher
      const docRef = querySnapshot.docs[0].ref;
      const currentData = querySnapshot.docs[0].data();
      if (score > currentData.score) {
        await updateDoc(docRef, {
          score: score,
          timestamp: new Date(),
          updatedAt: new Date()
        });
      }
    } else {
      // Add new score
      await addDoc(leaderboardRef, {
        userId: userId,
        gameType: gameType,
        name: name,
        score: score,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    console.log('Leaderboard score saved successfully');
  } catch (error) {
    console.error('Error saving leaderboard score: ', error);
    throw error;
  }
}

// Get leaderboard for a specific game type
export async function getLeaderboard(gameType, limitCount = 10) {
  try {
    let collectionName = 'leaderboard'; // default
    let orderField = 'score';
    if (gameType === 'ladder_quiz') {
      collectionName = 'leaderboard_ladder';
    } else if (gameType === 'speed_challenge') {
      collectionName = 'leaderboard_speed_challenge';
    } else if (gameType === 'matching') {
      collectionName = 'leaderboard_drag_drop';
    } else if (gameType === 'quest') {
      collectionName = 'leaderboard_quest';
    }

    const q = query(
      collection(db, collectionName),
      orderBy(orderField, 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    const leaderboard = [];

    querySnapshot.forEach((doc) => {
      leaderboard.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return leaderboard;
  } catch (error) {
    console.error('Error getting leaderboard: ', error);
    throw error;
  }
}

// ===== GAME QUESTIONS FUNCTIONS =====

// Save game questions for a specific game type
export async function saveGameQuestions(gameType, questions) {
  try {
    const questionsRef = collection(db, 'game_questions');
    const q = query(questionsRef, where('gameType', '==', gameType));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Update existing questions
      const docRef = querySnapshot.docs[0].ref;
      await updateDoc(docRef, {
        questions: questions,
        updatedAt: new Date()
      });
    } else {
      // Add new questions
      await addDoc(questionsRef, {
        gameType: gameType,
        questions: questions,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    console.log('Game questions saved successfully');
  } catch (error) {
    console.error('Error saving game questions: ', error);
    throw error;
  }
}

// Get game questions for a specific game type
export async function getGameQuestions(gameType) {
  try {
    const q = query(
      collection(db, 'game_questions'),
      where('gameType', '==', gameType)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data().questions;
    } else {
      console.log('No questions found for this game type');
      return [];
    }
  } catch (error) {
    console.error('Error getting game questions: ', error);
    throw error;
  }
}

// ===== LESSONS FUNCTIONS =====

// Save lesson content
export async function saveLesson(lessonId, title, content, subject, gradeLevel) {
  try {
    const lessonRef = doc(db, 'lessons', lessonId);
    await updateDoc(lessonRef, {
      title: title,
      content: content,
      subject: subject,
      gradeLevel: gradeLevel,
      updatedAt: new Date()
    });
    console.log('Lesson saved successfully');
  } catch (error) {
    // If document doesn't exist, create it
    try {
      await addDoc(collection(db, 'lessons'), {
        lessonId: lessonId,
        title: title,
        content: content,
        subject: subject,
        gradeLevel: gradeLevel,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Lesson created successfully');
    } catch (createError) {
      console.error('Error creating lesson: ', createError);
      throw createError;
    }
  }
}

// Get lesson by ID
export async function getLesson(lessonId) {
  try {
    const lessonRef = doc(db, 'lessons', lessonId);
    const lessonSnap = await getDoc(lessonRef);

    if (lessonSnap.exists()) {
      return {
        id: lessonSnap.id,
        ...lessonSnap.data()
      };
    } else {
      console.log('Lesson not found');
      return null;
    }
  } catch (error) {
    console.error('Error getting lesson: ', error);
    throw error;
  }
}

// Get all lessons for a subject and grade level
export async function getLessonsBySubject(subject, gradeLevel = null) {
  try {
    let q = query(
      collection(db, 'lessons'),
      where('subject', '==', subject),
      orderBy('createdAt', 'desc')
    );

    if (gradeLevel) {
      q = query(q, where('gradeLevel', '==', gradeLevel));
    }

    const querySnapshot = await getDocs(q);
    const lessons = [];

    querySnapshot.forEach((doc) => {
      lessons.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return lessons;
  } catch (error) {
    console.error('Error getting lessons: ', error);
    throw error;
  }
}

// ===== STUDENT PROGRESS FUNCTIONS =====

// Save detailed student progress for lessons
export async function saveLessonProgress(studentId, lessonId, progressData) {
  try {
    const progressId = `${studentId}_${lessonId}`;
    const progressRef = doc(db, 'student_progress', progressId);

    await updateDoc(progressRef, {
      studentId: studentId,
      lessonId: lessonId,
      ...progressData,
      updatedAt: new Date()
    });
    console.log('Lesson progress saved successfully');
  } catch (error) {
    // If document doesn't exist, create it
    try {
      await addDoc(collection(db, 'student_progress'), {
        studentId: studentId,
        lessonId: lessonId,
        ...progressData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Lesson progress created successfully');
    } catch (createError) {
      console.error('Error creating lesson progress: ', createError);
      throw createError;
    }
  }
}

// Get student progress for all lessons
export async function getStudentLessonProgress(studentId) {
  try {
    const q = query(
      collection(db, 'student_progress'),
      where('studentId', '==', studentId)
    );
    const querySnapshot = await getDocs(q);
    const progress = {};

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      progress[data.lessonId] = data;
    });

    return progress;
  } catch (error) {
    console.error('Error getting student lesson progress: ', error);
    throw error;
  }
}

// ===== GAME PROGRESS FUNCTIONS =====

// Save game progress for students
export async function saveGameProgress(studentId, gameType, progressData) {
  try {
    const progressId = `${studentId}_${gameType}`;
    const progressRef = doc(db, 'game_progress', progressId);

    await updateDoc(progressRef, {
      studentId: studentId,
      gameType: gameType,
      ...progressData,
      updatedAt: new Date()
    });
    console.log('Game progress saved successfully');
  } catch (error) {
    // If document doesn't exist, create it
    try {
      await addDoc(collection(db, 'game_progress'), {
        studentId: studentId,
        gameType: gameType,
        ...progressData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Game progress created successfully');
    } catch (createError) {
      console.error('Error creating game progress: ', createError);
      throw createError;
    }
  }
}

// Get game progress for a student
export async function getGameProgress(studentId, gameType = null) {
  try {
    let q;
    if (gameType) {
      q = query(
        collection(db, 'game_progress'),
        where('studentId', '==', studentId),
        where('gameType', '==', gameType)
      );
    } else {
      q = query(
        collection(db, 'game_progress'),
        where('studentId', '==', studentId)
      );
    }

    const querySnapshot = await getDocs(q);
    const progress = {};

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      progress[data.gameType] = data;
    });

    return progress;
  } catch (error) {
    console.error('Error getting game progress: ', error);
    throw error;
  }
}

// ===== POINTS SYSTEM FUNCTIONS =====

// Save or update game score and update leaderboard
export async function saveGameScore(userId, gameType, score, displayName = null, groupName = null) {
  try {
    console.log(`🔄 Updating leaderboard for ${gameType} with score: ${score}`);

    // Determine the correct collection based on game type
    let collectionName = 'leaderboard'; // default
    if (gameType === 'ladder_quiz') {
      collectionName = 'leaderboard_ladder';
    } else if (gameType === 'speed_challenge') {
      collectionName = 'leaderboard_speed_challenge';
    } else if (gameType === 'matching') {
      collectionName = 'leaderboard_drag_drop';
    } else if (gameType === 'quest') {
      collectionName = 'leaderboard_quest';
    }

    const leaderboardRef = collection(db, collectionName);
    const q = query(leaderboardRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    let existingData = null;
    let docRef = null;

    if (!querySnapshot.empty) {
      // Update existing player
      docRef = querySnapshot.docs[0].ref;
      existingData = querySnapshot.docs[0].data();
      console.log('📝 Updating existing player:', existingData.displayName);
    } else {
      // Create new player entry
      console.log('🆕 Creating new player entry');
    }

    // Calculate new scores based on game type
    const updateData = {
      userId: userId,
      displayName: displayName || existingData?.displayName || 'Anonymous',
      groupName: groupName || existingData?.groupName || 'No Group',
      updatedAt: new Date()
    };

    // Initialize points if not existing
    const currentLadderPoints = existingData?.ladderPoints || 0;
    const currentQuizPoints = existingData?.quizPoints || 0;
    const currentMatchingPoints = existingData?.matchingPoints || 0;
    const currentQuestPoints = existingData?.questPoints || 0;

    if (gameType === 'ladder_quiz') {
      updateData.ladderPoints = Math.max(currentLadderPoints, score);
      console.log(`🎯 Ladder quiz points: ${updateData.ladderPoints}`);
    } else if (gameType === 'speed_challenge') {
      updateData.quizPoints = Math.max(currentQuizPoints, score);
      console.log(`⚡ Speed challenge points: ${updateData.quizPoints}`);
    } else if (gameType === 'matching') {
      // Matching is cumulative across levels/sessions — add points instead of taking the max
      const accumulated = (currentMatchingPoints || 0) + (score || 0);
      updateData.matchingPoints = accumulated;
      console.log(`🔗 Matching points (accumulated): ${updateData.matchingPoints}`);
    } else if (gameType === 'quest') {
      updateData.questPoints = Math.max(currentQuestPoints, score);
      console.log(`🗺️ Quest points: ${updateData.questPoints}`);
    }

    // Calculate total points
    updateData.totalPoints = (updateData.ladderPoints || currentLadderPoints) +
                             (updateData.quizPoints || currentQuizPoints) +
                             (updateData.matchingPoints || currentMatchingPoints) +
                             (updateData.questPoints || currentQuestPoints);

    console.log(`📊 Total points: ${updateData.totalPoints}`);

    // Initialize badges array if not existing
    if (!existingData?.badges) {
      updateData.badges = [];
    }

    // Check for new badges based on total points
    const newBadges = checkForNewBadges(updateData.totalPoints, existingData?.badges || []);
    if (newBadges.length > 0) {
      updateData.badges = [...(existingData?.badges || []), ...newBadges];
      console.log('🏆 New badges earned:', newBadges);
    }

    if (docRef) {
      // Update existing document
      await updateDoc(docRef, updateData);
    } else {
      // Create new document
      updateData.createdAt = new Date();
      await addDoc(leaderboardRef, updateData);
    }

    // Also keep a per-user aggregated points document for other parts of the app
    try {
      const userPointsRef = doc(db, 'user_points', userId);
      const userPointsData = {
        userId: userId,
        displayName: updateData.displayName,
        groupName: updateData.groupName,
        totalPoints: updateData.totalPoints || 0,
        ladderPoints: updateData.ladderPoints || 0,
        quizPoints: updateData.quizPoints || 0,
        matchingPoints: updateData.matchingPoints || 0,
        questPoints: updateData.questPoints || 0,
        updatedAt: new Date()
      };

      // Use setDoc to create or overwrite the user's points document
      await setDoc(userPointsRef, userPointsData, { merge: true });
      console.log('✅ user_points document updated for', userId);
    } catch (err) {
      console.error('❌ Failed to update user_points doc:', err);
    }

    // Update specific game leaderboard
    try {
      let specificCollection = null;
      let gameScore = 0;

      if (gameType === 'ladder_quiz') {
        specificCollection = 'leaderboard_ladder';
        gameScore = updateData.ladderPoints || 0;
      } else if (gameType === 'speed_challenge') {
        specificCollection = 'leaderboard_speed_challenge';
        gameScore = updateData.quizPoints || 0;
      } else if (gameType === 'matching') {
        specificCollection = 'leaderboard_drag_drop';
        gameScore = updateData.matchingPoints || 0;
      }

      if (specificCollection && gameScore > 0) {
        const specificRef = doc(db, specificCollection, userId);
        const specificData = {
          userId: userId,
          displayName: updateData.displayName,
          groupName: updateData.groupName,
          score: gameScore,
          updatedAt: new Date()
        };
        await setDoc(specificRef, specificData, { merge: true });
        console.log(`✅ ${specificCollection} updated for ${userId} with score ${gameScore}`);
      }
    } catch (err) {
      console.error('❌ Failed to update specific leaderboard:', err);
    }

    console.log('✅ Leaderboard updated successfully');
    return updateData;
  } catch (error) {
    console.error('❌ Error saving game score:', error);
    throw error;
  }
}

// Get student's total points
export async function getStudentTotalPoints(userId) {
  try {
    const leaderboardRef = collection(db, 'leaderboard');
    const q = query(leaderboardRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const data = querySnapshot.docs[0].data();
      return {
        totalPoints: data.totalPoints || 0,
        ladderPoints: data.ladderPoints || 0,
        quizPoints: data.quizPoints || 0,
        matchingPoints: data.matchingPoints || 0,
        questPoints: data.questPoints || 0,
        badges: data.badges || []
      };
    }

    return {
      totalPoints: 0,
      ladderPoints: 0,
      quizPoints: 0,
      matchingPoints: 0,
      badges: []
    };
  } catch (error) {
    console.error('Error getting student total points:', error);
    throw error;
  }
}

// Check for new badges based on points
function checkForNewBadges(totalPoints, existingBadges) {
  const newBadges = [];

  const badgeThresholds = [
    { points: 100, badge: 'Bronze Scholar' },
    { points: 250, badge: 'Silver Scholar' },
    { points: 500, badge: 'Gold Scholar' },
    { points: 1000, badge: 'Platinum Scholar' },
    { points: 2000, badge: 'Diamond Scholar' },
    { points: 5000, badge: 'Master Scholar' }
  ];

  badgeThresholds.forEach(({ points, badge }) => {
    if (totalPoints >= points && !existingBadges.includes(badge)) {
      newBadges.push(badge);
    }
  });

  // Special badges for game types
  if (totalPoints >= 100 && !existingBadges.includes('First Steps')) {
    newBadges.push('First Steps');
  }

  if (totalPoints >= 500 && !existingBadges.includes('Knowledge Seeker')) {
    newBadges.push('Knowledge Seeker');
  }

  return newBadges;
}

// Save badge (for manual badge awarding)
export async function saveBadge(userId, badgeName) {
  try {
    const leaderboardRef = collection(db, 'leaderboard');
    const q = query(leaderboardRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref;
      const data = querySnapshot.docs[0].data();
      const currentBadges = data.badges || [];

      if (!currentBadges.includes(badgeName)) {
        await updateDoc(docRef, {
          badges: [...currentBadges, badgeName],
          updatedAt: new Date()
        });
        console.log(`Badge "${badgeName}" awarded to user ${userId}`);
        return true;
      }
    }

    return false; // Badge already exists or user not found
  } catch (error) {
    console.error('Error saving badge:', error);
    throw error;
  }
}

// Get student's badges
export async function getStudentBadges(userId) {
  try {
    const pointsData = await getStudentTotalPoints(userId);
    return pointsData.badges || [];
  } catch (error) {
    console.error('Error getting student badges:', error);
    throw error;
  }
}
