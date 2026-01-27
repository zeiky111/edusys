// Game JavaScript
console.log('Game loaded');

// Import Firebase functions
import { saveGameScore, getLeaderboard, getStudentTotalPoints, saveBadge, getStudentBadges } from '../firebase/database.js';

// Game state
let currentGame = null;
let currentQuestionIndex = 0;
let score = 0;
let timer = null;
let timeLeft = 0;
let studentId = sessionStorage.getItem('studentId') || 'anonymous';
let mapPosition = 0; // For quest game

// Load questions dynamically from localStorage (set by teacher) or use defaults
function loadQuestQuestions() {
  const saved = localStorage.getItem('questQuestions');
  if (saved) {
    const parsed = JSON.parse(saved);
    return parsed.map(q => ({ ...q, answer: q.correct })); // Convert 'correct' to 'answer'
  }

  // Default questions if none saved
  return [
    { question: "Ano ang pangngalan?", options: ["Pang-uri", "Pangngalan", "Pandiwa", "Pang-abay"], answer: 1 },
    { question: "Ano ang pandiwa?", options: ["Salita na naglalarawan", "Salita na nagpapahayag ng aksyon", "Salita na nagpapahayag ng dami", "Salita na nagpapahayag ng lugar"], answer: 1 },
    { question: "Ano ang pang-uri?", options: ["Salita na naglalarawan", "Salita na nagpapahayag ng aksyon", "Salita na nagpapahayag ng dami", "Salita na nagpapahayag ng lugar"], answer: 0 },
    { question: "Ano ang pang-abay?", options: ["Salita na naglalarawan", "Salita na nagpapahayag ng aksyon", "Salita na nagpapahayag ng dami", "Salita na nagpapahayag ng lugar"], answer: 2 },
    { question: "Ano ang panghalip?", options: ["Salita na naglalarawan", "Salita na nagpapahayag ng aksyon", "Salita na nagpapahayag ng dami", "Salita na nagpapalit sa pangngalan"], answer: 3 },
    { question: "Ano ang pang-ukol?", options: ["Salita na naglalarawan", "Salita na nagpapahayag ng aksyon", "Salita na nag-uugnay ng salita", "Salita na nagpapahayag ng lugar"], answer: 2 },
    { question: "Ano ang pangatnig?", options: ["Salita na naglalarawan", "Salita na nagpapahayag ng aksyon", "Salita na nag-uugnay ng salita", "Salita na nagpapahayag ng lugar"], answer: 2 },
    { question: "Ano ang pandidiwang?", options: ["Salita na naglalarawan", "Salita na nagpapahayag ng aksyon", "Salita na nagpapahayag ng dami", "Salita na nagpapahayag ng damdamin"], answer: 3 }
  ];
}

// Sample questions for games
const questions = {
  quest: [],
  quiz: [
    { question: "Ano ang pangngalan?", options: ["Pang-uri", "Pangngalan", "Pandiwa", "Pang-abay"], answer: 1 },
    { question: "Ano ang pandiwa?", options: ["Salita na naglalarawan", "Salita na nagpapahayag ng aksyon", "Salita na nagpapahayag ng dami", "Salita na nagpapahayag ng lugar"], answer: 1 },
    { question: "Ano ang wastong bantas sa dulo ng tanong?", options: [".", ",", "!", "?"], answer: 3 },
    { question: "Ano ang tamang gamit ng 'nang'?", options: ["Sa harap ng salita", "Sa harap ng pandiwa", "Sa harap ng pangngalan", "Sa harap ng pang-uri"], answer: 1 },
    { question: "Ano ang pangungusap?", options: ["Isang salita", "Grupo ng salita na may buong diwa", "Isang letra", "Isang numero"], answer: 1 }
  ],
  matching: [
    { question: "Itugma ang salita sa kategorya: Bahay", options: ["Pangngalan", "Pandiwa", "Pang-uri", "Pang-abay"], answer: 0 },
    { question: "Itugma ang salita sa kategorya: Takbo", options: ["Pangngalan", "Pandiwa", "Pang-uri", "Pang-abay"], answer: 1 },
    { question: "Itugma ang salita sa kategorya: Maganda", options: ["Pangngalan", "Pandiwa", "Pang-uri", "Pang-abay"], answer: 2 },
    { question: "Itugma ang salita sa kategorya: Mabilis", options: ["Pangngalan", "Pandiwa", "Pang-uri", "Pang-abay"], answer: 2 },
    { question: "Itugma ang salita sa kategorya: Sa", options: ["Pangngalan", "Pandiwa", "Pang-uri", "Pang-abay"], answer: 3 }
  ]
};

// Generate map for quest game
function generateMap() {
  const mapContainer = document.getElementById('map-container');
  if (!mapContainer) return;

  mapContainer.innerHTML = '';
  for (let i = 0; i < 25; i++) { // 5x5 grid
    const cell = document.createElement('div');
    cell.className = 'map-cell';
    cell.textContent = i + 1;

    if (i < mapPosition) {
      cell.classList.add('completed');
    } else if (i === mapPosition) {
      cell.classList.add('current');
    } else {
      cell.classList.add('locked');
    }

    mapContainer.appendChild(cell);
  }
}

// Initialize game
function initGame(gameType) {
  currentGame = gameType;
  currentQuestionIndex = 0;
  score = 0;
  mapPosition = 0;
  document.getElementById('score').textContent = score;

  document.getElementById('game-over').style.display = 'none';
  document.getElementById('question-container').style.display = 'block';

  if (gameType === 'quest') {
    // Load dynamic questions for quest
    questions.quest = loadQuestQuestions();
    generateMap();
  }

  if (gameType === 'quiz') {
    timeLeft = 30; // 30 seconds for speed challenge
    startTimer();
  }

  loadQuestion();
}

// Load current question
function loadQuestion() {
  const questionData = questions[currentGame][currentQuestionIndex];
  document.getElementById('question').textContent = questionData.question;

  const optionsContainer = document.getElementById('options');
  optionsContainer.innerHTML = '';

  questionData.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.textContent = option;
    button.onclick = () => selectAnswer(index);
    optionsContainer.appendChild(button);
  });
}

// Select answer
function selectAnswer(selectedIndex) {
  const questionData = questions[currentGame][currentQuestionIndex];
  if (selectedIndex === questionData.answer) {
    score += currentGame === 'quiz' ? Math.max(10, timeLeft) : 10; // Speed bonus for quiz
    document.getElementById('score').textContent = score;
    showFeedback(true);

    if (currentGame === 'quest') {
      mapPosition++;
      generateMap();
    }
  } else {
    showFeedback(false);
  }

  setTimeout(() => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions[currentGame].length) {
      loadQuestion();
    } else {
      endGame();
    }
  }, 1000);
}

// Show feedback
function showFeedback(correct) {
  const feedback = document.getElementById('feedback');
  feedback.textContent = correct ? 'Tama! ✅' : 'Mali ❌';
  feedback.style.color = correct ? 'green' : 'red';
  feedback.style.display = 'block';
  setTimeout(() => feedback.style.display = 'none', 1000);
}

// Start timer for speed challenge
function startTimer() {
  document.getElementById('timer').style.display = 'block';
  timer = setInterval(() => {
    timeLeft--;
    document.getElementById('time-left').textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timer);
      endGame();
    }
  }, 1000);
}

// End game
async function endGame() {
  clearInterval(timer);
  document.getElementById('question-container').style.display = 'none';
  document.getElementById('game-over').style.display = 'block';
  document.getElementById('final-score').textContent = score;

  // Save score to Firebase
  try {
    await saveGameScore(studentId, currentGame, score, currentGame === 'quiz' ? (30 - timeLeft) : null);
    console.log('Score saved successfully');
  } catch (error) {
    console.error('Error saving score:', error);
  }

  // Check for badges
  await checkBadges();
}

// Check for badges
async function checkBadges() {
  try {
    const totalPoints = await getStudentTotalPoints(studentId);
    const badges = await getStudentBadges(studentId);

    // First game completion badge
    if (score > 0 && !badges.some(b => b.badgeType === 'first_game')) {
      await saveBadge(studentId, 'first_game', 'Unang Larong Natapos');
    }

    // High scorer badge
    if (score >= 40 && !badges.some(b => b.badgeType === 'high_scorer')) {
      await saveBadge(studentId, 'high_scorer', 'Mataas na Iskor');
    }

    // Speed demon badge for quiz
    if (currentGame === 'quiz' && score >= 30 && !badges.some(b => b.badgeType === 'speed_demon')) {
      await saveBadge(studentId, 'speed_demon', 'Mabilis na Sagot');
    }

    // Quest master badge
    if (currentGame === 'quest' && mapPosition >= 8 && !badges.some(b => b.badgeType === 'quest_master')) {
      await saveBadge(studentId, 'quest_master', 'Master ng Quest');
    }
  } catch (error) {
    console.error('Error checking badges:', error);
  }
}

// Initialize based on current page
document.addEventListener('DOMContentLoaded', function() {
  const path = window.location.pathname;
  if (path.includes('quest.html')) {
    initGame('quest');
  } else if (path.includes('quiz.html')) {
    initGame('quiz');
  } else if (path.includes('matching.html')) {
    initGame('matching');
  }
});
