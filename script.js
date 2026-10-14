const DATES = [
  new Date(2026, 9, 26),
  new Date(2026, 9, 27),
  new Date(2026, 9, 28),
  new Date(2026, 9, 29),
  new Date(2026, 9, 30),
];

const CUISINES = [
  { name: "Sushi", emoji: "🍣" },
  { name: "Ramen", emoji: "🍜" },
  { name: "Burgers", emoji: "🍔" },
  { name: "Pizza", emoji: "🍕" },
  { name: "Tacos", emoji: "🌮" },
  { name: "Italian", emoji: "🍝" },
  { name: "Thai", emoji: "🍛" },
  { name: "Korean BBQ", emoji: "🥩" },
  { name: "Other", emoji: "✏️", isOther: true },
];

const NO_MESSAGES = [
  "No",
  "Are you sure?",
  "Really?",
  "Think again!",
  "Nope, try again",
  "Not an option 😤",
  "Wrong button!",
  "Pleaseee 🥺",
  "You can't catch me",
  "Just click yes!",
];

const state = {
  date: null,
  cuisine: null,
  noAttempts: 0,
};

const EMAIL_ENDPOINT = "https://formsubmit.co/ajax/47e0544d1e26c215cad5300948fd0d99";

const $ = (id) => document.getElementById(id);

function showStep(id) {
  document.querySelectorAll(".step").forEach((s) => s.classList.remove("active"));
  $(id).classList.add("active");
}

/* ---------- Step 1: runaway No button ---------- */

const yesBtn = $("yes-btn");
const noBtn = $("no-btn");
let noAttempts = 0;

function rectsOverlap(a, b, padding = 16) {
  return !(
    a.right + padding < b.left ||
    a.left - padding > b.right ||
    a.bottom + padding < b.top ||
    a.top - padding > b.bottom
  );
}

function moveNoButton() {
  noAttempts++;
  noBtn.textContent = NO_MESSAGES[Math.min(noAttempts, NO_MESSAGES.length - 1)];

  const yesScale = Math.min(1 + noAttempts * 0.08, 1.8);
  yesBtn.style.transform = `scale(${yesScale})`;

  if (!noBtn.classList.contains("runaway")) {
    const rect = noBtn.getBoundingClientRect();
    // The card's backdrop-filter would make it the containing block for position: fixed
    document.body.appendChild(noBtn);
    noBtn.style.left = `${rect.left}px`;
    noBtn.style.top = `${rect.top}px`;
    noBtn.classList.add("runaway");
  }

  const margin = 12;
  const btnW = noBtn.offsetWidth;
  const btnH = noBtn.offsetHeight;
  const maxX = window.innerWidth - btnW - margin;
  const maxY = window.innerHeight - btnH - margin;
  const current = noBtn.getBoundingClientRect();

  // Measure Yes at its final scale, not mid-transition
  const yesCard = yesBtn.getBoundingClientRect();
  const currentScale = yesCard.width / yesBtn.offsetWidth || 1;
  const cx = yesCard.left + yesCard.width / 2;
  const cy = yesCard.top + yesCard.height / 2;
  const halfW = (yesCard.width / currentScale) * yesScale / 2;
  const halfH = (yesCard.height / currentScale) * yesScale / 2;
  const yesRect = { left: cx - halfW, right: cx + halfW, top: cy - halfH, bottom: cy + halfH };

  let best = null;
  for (let i = 0; i < 200; i++) {
    const x = margin + Math.random() * Math.max(0, maxX - margin);
    const y = margin + Math.random() * Math.max(0, maxY - margin);
    const candidate = { left: x, top: y, right: x + btnW, bottom: y + btnH };
    if (rectsOverlap(candidate, yesRect)) continue;
    const distance = Math.hypot(x - current.left, y - current.top);
    if (distance > 120) {
      best = { x, y };
      break;
    }
    if (!best || distance > best.distance) best = { x, y, distance };
  }
  if (!best) best = { x: margin, y: margin };

  noBtn.style.left = `${best.x}px`;
  noBtn.style.top = `${best.y}px`;
}

noBtn.addEventListener("mouseenter", moveNoButton);
noBtn.addEventListener("touchstart", (e) => {
  e.preventDefault();
  moveNoButton();
}, { passive: false });
noBtn.addEventListener("click", (e) => {
  e.preventDefault();
  moveNoButton();
});

window.addEventListener("resize", () => {
  if (noBtn.classList.contains("runaway")) {
    const rect = noBtn.getBoundingClientRect();
    if (rect.right > window.innerWidth || rect.bottom > window.innerHeight) {
      moveNoButton();
    }
  }
});

function resetNoButton() {
  noAttempts = 0;
  noBtn.textContent = NO_MESSAGES[0];
  noBtn.classList.remove("runaway");
  noBtn.style.left = "";
  noBtn.style.top = "";
  yesBtn.style.transform = "";
  document.querySelector(".ask-buttons").appendChild(noBtn);
}

yesBtn.addEventListener("click", () => {
  state.noAttempts += noAttempts;
  resetNoButton();
  noBtn.hidden = true;
  burstHearts(30);
  showStep("step-date");
});

$("date-back").addEventListener("click", () => {
  noBtn.hidden = false;
  showStep("step-ask");
});

/* ---------- Step 2: date picker ---------- */

const dateGrid = $("date-grid");
const dateNext = $("date-next");

DATES.forEach((date, i) => {
  const btn = document.createElement("button");
  btn.className = "option";
  btn.innerHTML = `
    <span class="weekday">${date.toLocaleDateString("en-US", { weekday: "short" })}</span>
    <span class="day-num">${date.getDate()}</span>
    <span class="month">${date.toLocaleDateString("en-US", { month: "short" })}</span>
  `;
  btn.addEventListener("click", () => {
    dateGrid.querySelectorAll(".option").forEach((o) => o.classList.remove("selected"));
    btn.classList.add("selected");
    state.date = DATES[i];
    dateNext.disabled = false;
  });
  dateGrid.appendChild(btn);
});

dateNext.addEventListener("click", () => showStep("step-food"));

/* ---------- Step 3: cuisine picker ---------- */

const foodGrid = $("food-grid");
const foodNext = $("food-next");
const otherInput = $("other-input");

function updateFoodNext() {
  if (!state.cuisine) {
    foodNext.disabled = true;
  } else if (state.cuisine.isOther) {
    foodNext.disabled = otherInput.value.trim().length === 0;
  } else {
    foodNext.disabled = false;
  }
}

CUISINES.forEach((cuisine) => {
  const btn = document.createElement("button");
  btn.className = "option";
  btn.innerHTML = `
    <span class="food-emoji">${cuisine.emoji}</span>
    <span class="food-name">${cuisine.name}</span>
  `;
  btn.addEventListener("click", () => {
    foodGrid.querySelectorAll(".option").forEach((o) => o.classList.remove("selected"));
    btn.classList.add("selected");
    state.cuisine = cuisine;
    otherInput.classList.toggle("hidden", !cuisine.isOther);
    if (cuisine.isOther) otherInput.focus();
    updateFoodNext();
  });
  foodGrid.appendChild(btn);
});

otherInput.addEventListener("input", updateFoodNext);
otherInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !foodNext.disabled) foodNext.click();
});

$("food-back").addEventListener("click", () => showStep("step-date"));

foodNext.addEventListener("click", () => {
  const food = state.cuisine.isOther ? otherInput.value.trim() : state.cuisine.name;
  const dateText = state.date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  $("summary-date").textContent = dateText;
  $("summary-food").textContent = food;
  burstHearts(50);
  showStep("step-done");
  sendEmail(dateText, food);
});

async function sendEmail(dateText, food) {
  const status = $("send-status");
  status.textContent = "Sending your answers to Dion... 💌";

  try {
    const res = await fetch(EMAIL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        _subject: `Alessia said YES! 💖 ${dateText} - ${food}`,
        _template: "table",
        _captcha: "false",
        Answer: "Yes 💖",
        Date: dateText,
        Food: food,
        "Times she tried to click No": state.noAttempts,
        "Submitted at": new Date().toLocaleString("en-US"),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === "false" || data.success === false) {
      throw new Error(data.message || `HTTP ${res.status}`);
    }
    status.textContent = "Dion got your answers! See you soon 😘";
  } catch (err) {
    console.error("Email failed:", err);
    status.textContent = "Couldn't send automatically. Screenshot this and send it to Dion 😘";
  }
}

$("done-back").addEventListener("click", () => showStep("step-food"));

/* ---------- Floating hearts ---------- */

const heartsLayer = document.querySelector(".hearts");
const HEART_EMOJIS = ["💖", "💕", "💗", "💘", "❤️", "🌸"];

function spawnHeart() {
  const heart = document.createElement("span");
  heart.className = "heart";
  heart.textContent = HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)];
  heart.style.left = `${Math.random() * 100}vw`;
  heart.style.fontSize = `${14 + Math.random() * 22}px`;
  heart.style.animationDuration = `${6 + Math.random() * 6}s`;
  heartsLayer.appendChild(heart);
  heart.addEventListener("animationend", () => heart.remove());
}

function burstHearts(count) {
  for (let i = 0; i < count; i++) {
    setTimeout(spawnHeart, i * 40);
  }
}

setInterval(spawnHeart, 700);
