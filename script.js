const quoteDisplay = document.getElementById("quoteDisplay");
const quoteInput = document.getElementById("quoteInput");
const timeEl = document.getElementById("time");
const wpmEl = document.getElementById("wpm");
const accuracyEl = document.getElementById("accuracy");
const mistakesEl = document.getElementById("mistakes");
const restartBtn = document.getElementById("restart");
const leaderboardList = document.getElementById("leaderboardList");
const themeToggle = document.getElementById("themeToggle");
const modeSelect = document.getElementById("mode");

let timer;
let startTime;
let time = 0;
let mistakeCount = 0;
let countdown = false;
let countdownDuration = 60;
let isFinished = false;

async function getRandomQuote() {
  try {
    // Fallback is ready when API is not responding
    const res1 = await fetch("https://api.quotable.io/random?minLength=80");
    const res2 = await fetch("https://api.quotable.io/random?minLength=80");
    const data1 = await res1.json();
    const data2 = await res2.json();
    return `${data1.content} ${data2.content}`;
  } catch (error) {
    console.warn("API fetch failed, using offline quote.");
    const localParagraphs = [
      "Typing tests measure your speed and accuracy. They help improve your productivity and keyboard skills. Practicing daily makes a big difference.",
      "Building projects like TypeRush is a great way to learn JavaScript. It challenges your logic and lets you apply real-world thinking into practice.",
      "The best way to improve typing speed is to practice regularly. Even just a few minutes a day can lead to big improvements over time."
    ];
    return localParagraphs[Math.floor(Math.random() * localParagraphs.length)];
  }
}

async function renderNewQuote() {
  const quote = await getRandomQuote();
  quoteDisplay.innerHTML = '';
  quote.split('').forEach(char => {
    const span = document.createElement('span');
    span.innerText = char;
    quoteDisplay.appendChild(span);
  });
  quoteInput.value = null;
  resetStats();
}

function resetStats() {
  clearInterval(timer);
  time = 0;
  mistakeCount = 0;
  timerStarted = false;
  isFinished = false;
  timeEl.innerText = 0;
  wpmEl.innerText = 0;
  accuracyEl.innerText = "0%";
  mistakesEl.innerText = 0;
}

quoteInput.addEventListener("input", () => {
    if (!timerStarted && !isFinished) {
  startTimer();
}
  const arrayQuote = quoteDisplay.querySelectorAll("span");
  const arrayValue = quoteInput.value.split("");

  let correct = true;
  let correctCount = 0;

  arrayQuote.forEach((charSpan, index) => {
    const char = arrayValue[index];

    if (char == null) {
      charSpan.classList.remove("correct", "incorrect");
      correct = false;
    } else if (char === charSpan.innerText) {
      charSpan.classList.add("correct");
      charSpan.classList.remove("incorrect");
      correctCount++;
    } else {
      charSpan.classList.add("incorrect");
      charSpan.classList.remove("correct");
      correct = false;
    }
  });

  mistakeCount = arrayValue.filter((char, i) => char !== quoteDisplay.children[i]?.innerText).length;
  mistakesEl.innerText = mistakeCount;

  const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
  const words = arrayValue.join("").trim().split(/\s+/).length;
  const wpm = elapsedSeconds > 0 ? Math.round((words / elapsedSeconds) * 60) : 0;
  wpmEl.innerText = wpm;

  const accuracy = Math.max(0, Math.round(((correctCount - mistakeCount) / correctCount) * 100));
  accuracyEl.innerText = isNaN(accuracy) ? "0%" : `${accuracy}%`;

  if (correct && arrayValue.length === arrayQuote.length && !countdown) {
    clearInterval(timer);
    isFinished = true;
    saveScore(wpm, accuracy);
  }
});

function startTimer() {
    if(timerStarted) return;
    timerStarted = true;

  startTime = Date.now(); 
  timer = setInterval(() => {
    time++;
    timeEl.innerText = time;

    if (countdown && time >= countdownDuration) {
      clearInterval(timer);
      timerStarted = false;
      quoteInput.disabled = true;
      isFinished = true;
      calculateFinalScore();
    }
  }, 1000);
}

function calculateFinalScore() {
  const typed = quoteInput.value.trim();
  const words = typed.split(/\s+/).length;
  const wpm = Math.round((words / time) * 60);
  const correctChars = quoteDisplay.querySelectorAll("span.correct").length;
  const totalChars = quoteDisplay.querySelectorAll("span").length;
  const accuracy = Math.round((correctChars / totalChars) * 100);
  wpmEl.innerText = wpm;
  accuracyEl.innerText = `${accuracy}%`;
  saveScore(wpm, accuracy);
}

function saveScore(wpm, accuracy) {
  const name = prompt("Enter your name:");
  if (!name) return;

  const score = { name, wpm, accuracy };
  const existing = JSON.parse(localStorage.getItem("leaderboard")) || [];
  existing.push(score);
  const sorted = existing.sort((a, b) => b.wpm - a.wpm).slice(0, 5);
  localStorage.setItem("leaderboard", JSON.stringify(sorted));
  renderLeaderboard();
}

function renderLeaderboard() {
  const scores = JSON.parse(localStorage.getItem("leaderboard")) || [];
  leaderboardList.innerHTML = '';
  scores.forEach(score => {
    const li = document.createElement("li");
    li.textContent = `${score.name} — ${score.wpm} WPM, ${score.accuracy}%`;
    leaderboardList.appendChild(li);
  });
}

restartBtn.addEventListener("click", () => {
  renderNewQuote();
  quoteInput.disabled = false;
  quoteInput.focus();
  startTime = Date.now();
  time = 0;
  mistakeCount = 0;
  if (modeSelect.value === "paragraph") {
    countdown = false;
  } else {
    countdown = true;
    countdownDuration = parseInt(modeSelect.value);
  }
  startTimer();
});

modeSelect.addEventListener("change", () => {
  restartBtn.click();
});

renderNewQuote();
renderLeaderboard();

