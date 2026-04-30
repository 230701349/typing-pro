const textContainer = document.getElementById("text");
const input = document.getElementById("input");
textContainer.addEventListener("click", () => {
  input.focus();
});
const cursor = document.getElementById("cursor");
let wpmHistory = [];
let peakWpm = 0;
let text = "";
let time = 60;
let initialTime = 60;
let timer = null;
let started = false;

let finalWpm = 0;
let finalAccuracy = 0;

// 🔥 LARGE WORD LIST (fix repetition)
const words = [
  "the","be","to","of","and","a","in","that","have","I",
  "it","for","not","on","with","he","as","you","do","at",
  "this","but","his","by","from","they","we","say","her",
  "she","or","an","will","my","one","all","would","there",
  "their","what","so","up","out","if","about","who","get",
  "which","go","me","when","make","can","like","time",
  "no","just","him","know","take","people","into","year",
  "your","good","some","could","them","see","other","than",
  "then","now","look","only","come","its","over","think",
  "also","back","after","use","two","how","our","work",
  "first","well","way","even","new","want","because",
  "any","these","give","day","most","us"
];

// 🔄 Generate text (MORE WORDS)
function generateText() {
  let arr = [];
  for (let i = 0; i < 100; i++) {
    arr.push(words[Math.floor(Math.random() * words.length)]);
  }
  text = arr.join(" ");
}

// 🧩 Load text
function loadText() {
  textContainer.innerHTML = "";

  text.split("").forEach(char => {
    const span = document.createElement("span");
    span.innerText = char;
    textContainer.appendChild(span);
  });

  console.log("Loaded chars:", text.length);
}

// 🟡 MOVE CURSOR (SMOOTH + FIXED)
function moveCursor(index) {
  const spans = textContainer.querySelectorAll("span");
  const containerRect = document.querySelector(".container").getBoundingClientRect();

  if (!spans.length) return;

  let target;

  if (index < spans.length) {
    target = spans[index];
  } else {
    target = spans[spans.length - 1];
  }

  const rect = target.getBoundingClientRect();

  cursor.style.left = (rect.left - containerRect.left) + "px";
  cursor.style.top = (rect.top - containerRect.top) + "px";
}

// 🚀 Init
function init() {
  generateText();
  loadText();
  setTimeout(() => moveCursor(0), 50);
}

init();

// 🎯 focus input
document.addEventListener("keydown", (e) => {
  // ❌ Don't focus typing if user is typing in username
  if (document.activeElement.id === "username") return;

  // ❌ Don't refocus if already typing in textarea
  if (document.activeElement === input) return;

  input.focus();
});

// 🧠 Typing logic
input.addEventListener("input", () => {

  const inputChars = input.value.split("");
  const spans = textContainer.querySelectorAll("span");

  // 🔥 disable username + start timer once
  if (!started) {
    document.getElementById("username").disabled = true;
    startTimer();
  }

  let correct = 0;

  // 🎯 correct / wrong logic
  spans.forEach((span, i) => {
    span.classList.remove("correct", "wrong", "active");

    if (inputChars[i] == null) return;

    if (inputChars[i] === span.innerText) {
      span.classList.add("correct");
      correct++;
    } else {
      span.classList.add("wrong");
    }
  });

  // 🧠 WORD HIGHLIGHT LOGIC
  let charIndex = input.value.length;
  let wordIndex = 0;
  let charCount = 0;

  const wordsArray = text.split(" ");

  for (let i = 0; i < wordsArray.length; i++) {
    const wordLength = wordsArray[i].length + 1; // include space

    if (charIndex < charCount + wordLength) {
      wordIndex = i;
      break;
    }

    charCount += wordLength;
  }

  // 🔥 highlight current word
  let currentChar = 0;

  wordsArray.forEach((word, i) => {
    for (let j = 0; j < word.length; j++) {
      if (i === wordIndex) {
        spans[currentChar].classList.add("active");
      }
      currentChar++;
    }

    // skip space
    if (spans[currentChar]) currentChar++;
  });

  // 🟡 move cursor
  moveCursor(inputChars.length);

  // 📊 stats
  const elapsed = (initialTime - time) / 60;

  const wpm = elapsed > 0
    ? Math.round((input.value.length / 5) / elapsed)
    : 0;

  const accuracy = input.value.length > 0
    ? Math.round((correct / input.value.length) * 100)
    : 100;

  document.getElementById("wpm").innerText = wpm;

  finalWpm = wpm;
  finalAccuracy = accuracy;
});
// ⏱ Timer
function startTimer() {
  started = true;

  timer = setInterval(() => {
    time--;

    document.getElementById("time").innerText = time;

    const currentWpm = parseInt(document.getElementById("wpm").innerText) || 0;

    // store WPM
    wpmHistory.push(currentWpm);

    // peak WPM
    if (currentWpm > peakWpm) {
      peakWpm = currentWpm;
    }

    if (time === 0) {
      clearInterval(timer);
      input.disabled = true;
      showResult();
    }
  }, 1000);
}

// 🏁 Result
function showResult() {
  document.getElementById("app").style.display = "none";
  document.getElementById("result").classList.add("show");

  document.getElementById("finalWpm").innerText = finalWpm;
  document.getElementById("finalAccuracy").innerText = finalAccuracy;

  drawGraph();

  const avgWpm = Math.round(
    wpmHistory.reduce((a, b) => a + b, 0) / (wpmHistory.length || 1)
  );

  document.getElementById("avgWpm").innerText = avgWpm;
  document.getElementById("peakWpm").innerText = peakWpm;

  generateHeatmap();

  const name = document.getElementById("username").value || "Guest";

  // 🔥 SAFE async handling (no crash)
  saveResult(name, finalWpm, finalAccuracy)
    .then(() => {
      loadHistory();
      loadLeaderboard();
    })
    .catch(err => console.error(err));
}
// 🔁 Restart
f// 🔁 Restart
function restart() {
  clearInterval(timer);

  // ⏱ Reset time & state
  time = initialTime;
  started = false;

  // 📊 Reset UI values
  document.getElementById("time").innerText = time;
  document.getElementById("wpm").innerText = 0;

  // ⌨️ Reset input
  input.value = "";
  input.disabled = false;

  // 👤 ENABLE username again (🔥 important fix)
  const nameInput = document.getElementById("username");
  nameInput.disabled = false;

  // 🔄 Reset history data (optional but clean)
  wpmHistory = [];
  peakWpm = 0;

  // 🎯 Show typing screen again
  document.getElementById("app").style.display = "block";
  document.getElementById("result").classList.remove("show");

  // 🔁 Regenerate text
  init();

  // 🎯 Focus input again
  setTimeout(() => input.focus(), 50);
}
// ⏱ FIXED TIME DROPDOWN
function changeTime(val) {
  initialTime = parseInt(val);
  time = initialTime;   // 🔥 KEY FIX

  document.getElementById("time").innerText = time;

  restart();
}

// 🎯 difficulty (future use)
function changeDifficulty(val) {
  restart();
}

function drawGraph() {
  const ctx = document.getElementById("wpmChart").getContext("2d");

  // 🔥 destroy old chart (important on restart)
  if (window.chart) {
    window.chart.destroy();
  }

  // 🧠 SAFETY (avoid empty data crash)
  if (!wpmHistory.length) return;

  // 🎨 AVERAGE PERFORMANCE COLOR
  const avg = wpmHistory.reduce((a, b) => a + b, 0) / wpmHistory.length;

  let baseColor = "#ef4444";
  if (avg > 40) baseColor = "#facc15";
  if (avg > 70) baseColor = "#22c55e";

  // 🌈 GRADIENT FILL
  const gradient = ctx.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, baseColor);
  gradient.addColorStop(1, "rgba(0,0,0,0)");

  window.chart = new Chart(ctx, {
    type: "line",

    // ✅ CORRECT STRUCTURE
    data: {
      labels: wpmHistory.map((_, i) => i + 1),

      datasets: [{
        data: wpmHistory,

        borderWidth: 3,
        tension: 0.4,
        pointRadius: 0,

        // 🔥 gradient fill
        backgroundColor: gradient,
        fill: true,

        // 🔥 dynamic segment coloring
        segment: {
          borderColor: ctx => {
            const value = ctx.p0.parsed.y;

            if (value < 30) return "#ef4444";   // red
            if (value < 60) return "#facc15";   // yellow
            return "#22c55e";                  // green
          }
        }
      }]
    },

    options: {
      responsive: true,

      animation: {
        duration: 1200,
        easing: "easeOutQuart"
      },

      plugins: {
        legend: { display: false }
      },

      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#888" }
        },

        y: {
          beginAtZero: true,

          // 🔥 FIX SCALE (IMPORTANT)
          suggestedMax: Math.max(...wpmHistory) + 10,

          ticks: {
            color: "#888",
            stepSize: 10
          },

          grid: {
            color: "rgba(255,255,255,0.05)"
          }
        }
      }
    }
  });
}

function generateHeatmap() {
  const container = document.getElementById("heatmap");
  container.innerHTML = "";

  wpmHistory.forEach((wpm, index) => {
    const box = document.createElement("div");

    let color;
    if (wpm < 30) color = "#ef4444";
    else if (wpm < 60) color = "#facc15";
    else color = "#22c55e";

    box.style.background = color;

    // animation delay
    box.style.animationDelay = `${index * 0.03}s`;

    box.setAttribute("data-wpm", wpm);

    container.appendChild(box);
  });
}

const nameInput = document.getElementById("username");

// load saved name
nameInput.value = localStorage.getItem("username") || "";

// save when typing
nameInput.addEventListener("input", () => {
  localStorage.setItem("username", nameInput.value);
});