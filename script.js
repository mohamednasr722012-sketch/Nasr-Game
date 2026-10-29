
"use strict";

/* ==========================================
   NASR GAME — Imposter Party Game
   HTML: index.html
   CSS: style.css
========================================== */

const root = document.getElementById("root");
const toast = document.getElementById("toast");

const WORDS = {
  "🍔 أكلات": [
    "بيتزا", "كشري", "برجر", "ملوخية", "محشي",
    "شاورما", "كنافة", "مكرونة", "فول", "كريب",
    "بطاطس", "فطير", "سوشي", "كباب", "آيس كريم"
  ],
  "🐾 حيوانات": [
    "أسد", "فيل", "نمر", "زرافة", "دولفين",
    "تمساح", "بطريق", "ذئب", "قرد", "حصان",
    "نسر", "باندا", "ثعلب", "سلحفاة", "كنغر"
  ],
  "🌍 دول": [
    "مصر", "البرازيل", "اليابان", "فرنسا", "إيطاليا",
    "السعودية", "المغرب", "الأرجنتين", "ألمانيا", "تركيا",
    "إسبانيا", "الصين", "كندا", "تونس", "البرتغال"
  ],
  "🚗 مواصلات": [
    "طائرة", "قطار", "مترو", "غواصة", "دراجة",
    "سفينة", "أتوبيس", "تاكسي", "موتوسيكل", "هليكوبتر",
    "ترام", "يخت", "جرار", "شاحنة", "عربة جولف"
  ],
  "🎒 أشياء": [
    "موبايل", "ساعة", "مرآة", "كمبيوتر", "كاميرا",
    "نظارة", "مفتاح", "كتاب", "مروحة", "تلفزيون",
    "سماعة", "شنطة", "قلم", "كرسي", "مصباح"
  ],
  "📍 أماكن": [
    "مدرسة", "مستشفى", "مطار", "سينما", "ملعب",
    "مطعم", "متحف", "مكتبة", "شاطئ", "حديقة",
    "سجن", "فندق", "محطة", "سيرك", "قلعة"
  ],
  "⚽ رياضة": [
    "كرة القدم", "كرة السلة", "التنس", "الملاكمة",
    "السباحة", "الكاراتيه", "المصارعة", "الجمباز",
    "كرة اليد", "الكرة الطائرة", "الجري", "الفروسية"
  ],
  "🎮 ألعاب": [
    "ببجي", "ماينكرافت", "فيفا", "روبلوكس", "فورتنايت",
    "تتريس", "سونيك", "ماريو", "شطرنج", "دومينو",
    "فري فاير", "كول أوف ديوتي"
  ]
};

const AVATARS = [
  "🦊", "🐺", "🦁", "🐼", "🐸",
  "🦅", "🐯", "🐲", "🐵", "👽",
  "🤖", "🥷", "🦈", "🐻", "🦉"
];

const state = {
  players: [],
  imposters: [],
  word: "",
  category: "",
  phase: "setup",
  revealIndex: 0,
  votes: [],
  voteIndex: 0,
  candidates: [],
  round: 1,
  winner: "",
  sound: true,
  scores: {},
  lastWinner: ""
};

let toastTimer;
let audioContext = null;

function esc(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function shuffle(items) {
  const arr = [...items];

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function playerName(index) {
  return state.players[index]?.name || "لاعب";
}

function isImposter(index) {
  return state.imposters.includes(index);
}

function showToast(message) {
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function playSound(type = "click") {
  if (!state.sound) return;

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    audioContext ||= new AudioCtx();

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const notes = {
      click: [440],
      reveal: [440, 660, 880],
      vote: [380, 520],
      win: [523, 659, 784, 1047],
      lose: [390, 320, 220]
    };

    const sequence = notes[type] || notes.click;
    const start = audioContext.currentTime;

    sequence.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const time = start + index * 0.12;

      oscillator.type = type === "win" ? "triangle" : "sine";
      oscillator.frequency.value = frequency;

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.09, time + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);

      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      oscillator.start(time);
      oscillator.stop(time + 0.22);
    });
  } catch (error) {
    // اللعبة تعمل حتى لو الصوت غير متاح.
  }
}

function renderHeader(title, subtitle, number = "🎭") {
  return `
    <div class="heading">
      <div class="step">${number}</div>
      <div>
        <h2>${esc(title)}</h2>
        <p>${esc(subtitle)}</p>
      </div>
    </div>
  `;
}

function renderSetup() {
  state.phase = "setup";

  root.innerHTML = `
    <section class="panel">
      ${renderHeader(
        "جهّزوا الجولة",
        "اكتب أسماء اللاعبين واضبطوا مستوى الخداع",
        "01"
      )}

      <label for="playerName">اسم اللاعب</label>

      <div class="row">
        <input id="playerName" maxlength="24"
          placeholder="مثلاً: محمد"
          autocomplete="off">

        <button class="btn primary" id="addPlayer">
          ➕ إضافة لاعب
        </button>
      </div>

      <div class="hint">
        أضف من 3 إلى 15 لاعبًا. كل لاعب هيكون له دوره السري.
      </div>

      <div class="players-list" id="playersList">
        ${
          state.players.length
            ? state.players.map((player, index) => `
              <div class="player-card">
                <div class="player-avatar">${AVATARS[index % AVATARS.length]}</div>
                <div class="player-info">
                  <strong>${esc(player.name)}</strong>
                  <small>اللاعب ${index + 1}</small>
                </div>
                <button class="remove-player"
                  data-remove="${index}" aria-label="حذف اللاعب">
                  ✕
                </button>
              </div>
            `).join("")
            : `<div class="notice center">
                👥 لسه مفيش لاعبين. أضف أسماء أصحابك هنا.
              </div>`
        }
      </div>

      <div class="row">
        <div>
          <label for="imposterCount">عدد الإمبوسترات</label>
          <select id="imposterCount">
            <option value="1">إمبوستر واحد</option>
            <option value="2">إمبوستران</option>
            <option value="3">3 إمبوسترات</option>
          </select>
        </div>

        <div>
          <label for="category">فئة الكلمة</label>
          <select id="category">
            ${Object.keys(WORDS).map(category => `
              <option value="${esc(category)}">${esc(category)}</option>
            `).join("")}
            <option value="random">🎲 فئة عشوائية</option>
          </select>
        </div>
      </div>

      <button class="btn secondary full" id="soundToggle">
        ${state.sound ? "🔊 الصوت مفعّل" : "🔇 الصوت مكتوم"}
      </button>

      <button class="btn primary full" id="startGame">
        🚀 ابدأ لعبة الخداع
      </button>

      <div class="notice">
        🔐 <strong>قواعد السرية:</strong>
        كل لاعب يمسك الموبايل لوحده، يشوف بطاقته، وبعدها يسلّم
        الموبايل للاعب اللي بعده من غير ما يكشف دوره.
      </div>
    </section>
  `;

  bindSetup();
}

function bindSetup() {
  const input = document.getElementById("playerName");
  const addButton = document.getElementById("addPlayer");

  function addPlayer() {
    const name = input.value.trim();

    if (!name) {
      showToast("اكتب اسم اللاعب الأول 👀");
      input.focus();
      return;
    }

    if (state.players.length >= 15) {
      showToast("الحد الأقصى 15 لاعبًا!");
      return;
    }

    if (state.players.some(
      player => player.name.toLocaleLowerCase() === name.toLocaleLowerCase()
    )) {
      showToast("الاسم ده موجود بالفعل!");
      return;
    }

    state.players.push({ name });
    input.value = "";
    playSound("click");
    renderSetup();
    document.getElementById("playerName")?.focus();
  }

  addButton.addEventListener("click", addPlayer);

  input.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      addPlayer();
    }
  });

  root.querySelectorAll("[data-remove]").forEach(button => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.remove);
      state.players.splice(index, 1);
      renderSetup();
      playSound("click");
    });
  });

  document.getElementById("soundToggle").addEventListener("click", () => {
    state.sound = !state.sound;
    renderSetup();

    if (state.sound) playSound("click");
  });

  document.getElementById("startGame").addEventListener("click", startGame);
}

function startGame() {
  const count = state.players.length;
  const requested = Number(
    document.getElementById("imposterCount").value
  );
  const selectedCategory = document.getElementById("category").value;

  if (count < 3) {
    showToast("لازم 3 لاعبين على الأقل!");
    return;
  }

  if (requested >= count) {
    showToast("لازم يكون فيه لاعبين عاديين على الأقل!");
    return;
  }

  let category = selectedCategory;

  if (category === "random") {
    category = randomItem(Object.keys(WORDS));
  }

  state.category = category;
  state.word = randomItem(WORDS[category]);
  state.imposters = shuffle(
    state.players.map((_, index) => index)
  ).slice(0, requested);

  state.revealIndex = 0;
  state.votes = [];
  state.voteIndex = 0;
  state.candidates = state.players.map((_, index) => index);
  state.round = 1;
  state.winner = "";
  state.lastWinner = "";

  playSound("reveal");
  renderPassScreen();
}

/* تمرير الموبايل قبل عرض كل بطاقة */
function renderPassScreen() {
  state.phase = "pass";

  if (state.revealIndex >= state.players.length) {
    state.phase = "questions";
    renderQuestions();
    return;
  }

  const name = playerName(state.revealIndex);

  root.innerHTML = `
    <section class="panel center">
      ${renderHeader("وقت السرية", "محدش يبص على الشاشة غير صاحب الدور", "🔐")}

      <div class="pass-screen">
        <div class="pass-icon">📱</div>
        <div class="badge">الدور ${state.revealIndex + 1} من ${state.players.length}</div>
        <h2>سلّم الموبايل إلى</h2>
        <div class="name">${esc(name)}</div>
        <p>لما تتأكد إن محدش بيبص، اضغط لعرض بطاقتك السرية.</p>

        <button class="btn primary full" id="revealCard">
          🔓 اكشف بطاقتي
        </button>
      </div>

      <p class="hint">ممنوع توري بطاقتك لأي لاعب تاني!</p>
    </section>
  `;

  document.getElementById("revealCard").addEventListener("click", () => {
    playSound("reveal");
    renderSecretCard();
  });
}

function renderSecretCard() {
  state.phase = "reveal";

  const index = state.revealIndex;
  const imposter = isImposter(index);

  root.innerHTML = `
    <section class="panel center">
      ${renderHeader("بطاقتك السرية", "اقرأ دورك كويس ومتخليش حد يشوف الشاشة", "🔒")}

      <div class="secret">
        <div class="big">${imposter ? "🕵️" : "🎯"}</div>

        <div class="badge">بطاقة ${esc(playerName(index))}</div>

        <h2 class="${imposter ? "imposter" : "normal"}">
          ${imposter ? "أنت الإمبوستر!" : "أنت لاعب عادي"}
        </h2>

        ${
          imposter
            ? `
              <p>أنت لا تعرف الكلمة السرية. حاول تكتشفها من أسئلة اللاعبين!</p>
              <div class="word">❓ كلمة مجهولة</div>
            `
            : `
              <p>الكلمة السرية هي:</p>
              <div class="word">${esc(state.word)}</div>
              <p>جاوب على الأسئلة بذكاء من غير ما تقول الكلمة صراحة.</p>
            `
        }
      </div>

      <button class="btn primary full" id="hideCard">
        🔐 أخفي البطاقة وسلّم الموبايل
      </button>

      <p class="hint">ما تقولش دورك لحد، حتى لو شكّيت في الإمبوستر.</p>
    </section>
  `;

  document.getElementById("hideCard").addEventListener("click", () => {
    state.revealIndex++;
    playSound("click");
    renderPassScreen();
  });
}

/* مرحلة الأسئلة */
function renderQuestions() {
  state.phase = "questions";

  root.innerHTML = `
    <section class="panel center">
      ${renderHeader("ابدأوا الأسئلة!", "اسألوا بعض أسئلة تكشف اللي مش عارف الكلمة", "02")}

      <div class="big">🧠</div>
      <div class="badge">${state.players.length} لاعبين في الجولة</div>

      <div class="notice">
        <strong>طريقة اللعب:</strong><br>
        كل لاعب يسأل لاعبًا آخر سؤالًا له علاقة بالكلمة.
        اللاعب العادي يجاوب من غير ما يكشف الكلمة،
        والإمبوستر يحاول يندمج وسطكم.
      </div>

      <div class="notice">
        ⚠️ ممنوع تقولوا الكلمة السرية بالحرف!
      </div>

      <button class="btn primary full" id="finishQuestions">
        🗳️ انتهينا — ابدأوا التصويت
      </button>
    </section>
  `;

  document.getElementById("finishQuestions").addEventListener("click", () => {
    state.candidates = state.players.map((_, index) => index);
    state.round = 1;
    state.votes = [];
    state.voteIndex = 0;
    playSound("vote");
    renderVotePass();
  });
}

/* التصويت السري: كل لاعب يصوّت لوحده */
function renderVotePass() {
  state.phase = "votePass";

  if (state.voteIndex >= state.players.length) {
    resolveVotes();
    return;
  }

  root.innerHTML = `
    <section class="panel center">
      ${renderHeader("التصويت السري", `الجولة ${state.round}`, "🗳️")}

      <div class="pass-screen">
        <div class="pass-icon">🤫</div>
        <h2>سلّم الموبايل إلى</h2>
        <div class="name">${esc(playerName(state.voteIndex))}</div>
        <p>اختار الشخص اللي تعتقد إنه الإمبوستر. اختيارك سري.</p>

        <button class="btn primary full" id="startVoting">
          👁️ صوّت بسرية
        </button>
      </div>
    </section>
  `;

  document.getElementById("startVoting").addEventListener("click", renderVote);
}

function renderVote() {
  state.phase = "vote";

  const voter = state.voteIndex;
  const available = state.candidates.filter(index => index !== voter);

  // إذا لم يتبق إلا اللاعب نفسه، نسمح له بالاختيار حتى لا تتوقف اللعبة.
  const options = available.length
    ? available
    : [...state.candidates];

  root.innerHTML = `
    <section class="panel">
      ${renderHeader("مين الإمبوستر؟", "اختار لاعبًا واحدًا. صوتك مش هيظهر لحد.", "🗳️")}

      <div class="notice">
        المصوّت الحالي: <strong>${esc(playerName(voter))}</strong>
      </div>

      <div class="progress-track">
        <div class="progress-fill"
          style="width:${(state.voteIndex / state.players.length) * 100}%">
        </div>
      </div>

      <div class="vote-list">
        ${options.map(index => `
          <button class="vote-option" data-vote="${index}">
            <span class="player-avatar">${AVATARS[index % AVATARS.length]}</span>
            <span>
              <strong>${esc(playerName(index))}</strong><br>
              <small class="muted">اضغط لاختيار هذا اللاعب</small>
            </span>
          </button>
        `).join("")}
      </div>

      <p class="hint">اختيارك سري. فكّر قبل ما تصوّت.</p>
    </section>
  `;

  root.querySelectorAll("[data-vote]").forEach(button => {
    button.addEventListener("click", () => {
      const target = Number(button.dataset.vote);

      state.votes.push({
        voter,
        target
      });

      playSound("vote");
      state.voteIndex++;
      renderVotePass();
    });
  });
}

function resolveVotes() {
  state.phase = "voteResult";

  const totals = new Map();

  state.votes.forEach(vote => {
    totals.set(vote.target, (totals.get(vote.target) || 0) + 1);
  });

  let highest = 0;

  for (const total of totals.values()) {
    highest = Math.max(highest, total);
  }

  const top = [...totals.entries()]
    .filter(([, total]) => total === highest)
    .map(([index]) => index);

  if (top.length > 1) {
    state.candidates = top;
    state.round++;
    state.votes = [];
    state.voteIndex = 0;

    root.innerHTML = `
      <section class="panel center">
        ${renderHeader("تعادل في الأصوات!", "لسه محدش حسم الجولة", "⚖️")}

        <div class="big">🤯</div>
        <p>اللاعبون المتعادلون:</p>

        <div class="scoreboard">
          ${top.map(index => `
            <div class="score-row">
              <strong>${esc(playerName(index))}</strong>
              <span class="badge">إعادة تصويت</span>
            </div>
          `).join("")}
        </div>

        <div class="notice">
          كل اللاعبين يصوّتوا مرة تانية، والاختيار يكون من بين
          اللاعبين المتعادلين فقط.
        </div>

        <button class="btn primary full" id="revote">
          🔄 إعادة التصويت
        </button>
      </section>
    `;

    document.getElementById("revote").addEventListener("click", () => {
      playSound("vote");
      renderVotePass();
    });

    return;
  }

  const accused = top[0];

  if (accused === undefined) {
    showToast("حصل خطأ في التصويت. ابدأ الجولة من جديد.");
    renderSetup();
    return;
  }

  if (isImposter(accused)) {
    renderImposterGuess(accused);
  } else {
    finishGame(
      "imposter",
      `تم اتهام ${playerName(accused)} ظلمًا!`,
      "الإمبوستر كسب الجولة لأنكم اخترتم لاعبًا بريئًا."
    );
  }
}

/* حتى لو اكتشفوا الإمبوستر، عنده فرصة أخيرة لتخمين الكلمة */
function renderImposterGuess(imposterIndex) {
  state.phase = "guess";

  root.innerHTML = `
    <section class="panel center">
      ${renderHeader("مسكنا الإمبوستر!", "بس لسه عنده فرصة يقلب النتيجة", "🚨")}

      <div class="secret">
        <div class="big">🕵️</div>
        <div class="badge">الإمبوستر المكتشف</div>
        <div class="name imposter">${esc(playerName(imposterIndex))}</div>

        <p>
          سلّموا الموبايل للإمبوستر وحده.
          لو عرف الكلمة السرية، يكسب حتى لو اتكشف!
        </p>
      </div>

      <button class="btn danger full" id="passToImposter">
        📱 تسليم الموبايل للإمبوستر
      </button>
    </section>
  `;

  document.getElementById("passToImposter").addEventListener("click", () => {
    renderGuessInput(imposterIndex);
  });
}

function renderGuessInput(imposterIndex) {
  state.phase = "guessInput";

  root.innerHTML = `
    <section class="panel">
      ${renderHeader("فرصتك الأخيرة!", "اكتب الكلمة السرية كما تعتقد أنها صحيحة", "🎯")}

      <div class="pass-screen">
        <div class="big">🤫</div>
        <h2>الإمبوستر فقط</h2>
        <p>ممنوع أي لاعب آخر يبص على الشاشة.</p>

        <label for="secretGuess">تخمينك للكلمة</label>
        <input id="secretGuess" maxlength="60"
          placeholder="اكتب الكلمة هنا..." autocomplete="off">

        <button class="btn danger full" id="submitGuess">
          ⚡ احسم مصير الجولة
        </button>
      </div>
    </section>
  `;

  const input = document.getElementById("secretGuess");

  input.focus();

  function submitGuess() {
    const guess = input.value.trim();

    if (!guess) {
      showToast("اكتب تخمينك الأول!");
      input.focus();
      return;
    }

    const normalize = value =>
      value.normalize("NFC").trim().replace(/\s+/g, " ");

    if (normalize(guess) === normalize(state.word)) {
      finishGame(
        "imposter",
        `${playerName(imposterIndex)} خدع الجميع!`,
        "الإمبوستر عرف الكلمة السرية وكسب الجولة، حتى بعد اكتشافه!"
      );
    } else {
      finishGame(
        "players",
        "اللاعبون العاديون انتصروا!",
        `الإمبوستر لم يعرف الكلمة السرية. الكلمة كانت: ${state.word}`
      );
    }
  }

  document.getElementById("submitGuess").addEventListener("click", submitGuess);

  input.addEventListener("keydown", event => {
    if (event.key === "Enter") submitGuess();
  });
}

/* مؤثرات الفوز */
function confettiBurst() {
  const colors = ["#a98bff", "#ffcf70", "#5af0ba", "#ff638c", "#6fcaff"];

  const container = document.createElement("div");

  Object.assign(container.style, {
    position: "fixed",
    inset: "0",
    overflow: "hidden",
    pointerEvents: "none",
    zIndex: "999",
  });

  document.body.appendChild(container);

  for (let i = 0; i < 100; i++) {
    const piece = document.createElement("i");
    const size = 5 + Math.random() * 8;
    const duration = 2 + Math.random() * 2.5;

    Object.assign(piece.style, {
      position: "absolute",
      top: "-20px",
      left: `${Math.random() * 100}%`,
      width: `${size}px`,
      height: `${size * (1 + Math.random())}px`,
      borderRadius: Math.random() > .5 ? "50%" : "2px",
      background: randomItem(colors),
      opacity: "0.95",
      transform: `rotate(${Math.random() * 360}deg)`,
      animation: `nasrConfetti ${duration}s ease-in forwards`,
    });

    container.appendChild(piece);
  }

  if (!document.getElementById("nasr-confetti-style")) {
    const style = document.createElement("style");
    style.id = "nasr-confetti-style";
    style.textContent = `
      @keyframes nasrConfetti {
        0% {
          transform: translate3d(0, -10px, 0) rotate(0deg);
          opacity: 1;
        }
        100% {
          transform: translate3d(40px, 110vh, 0) rotate(900deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  setTimeout(() => container.remove(), 5000);
}

function finishGame(winner, title, description) {
  state.phase = "result";
  state.winner = winner;

  if (state.lastWinner !== state.round + ":" + title) {
    state.scores[title] = (state.scores[title] || 0) + 1;
    state.lastWinner = state.round + ":" + title;
  }

  if (winner === "players") {
    playSound("win");
  } else {
    playSound("win");
  }

  root.innerHTML = `
    <section class="panel center">
      ${renderHeader("انتهت الجولة!", "النتيجة النهائية", "🏆")}

      <div class="result-card ${winner === "imposter" ? "imposter-win" : "winner"}">
        <div class="trophy">${winner === "imposter" ? "😈" : "🏆"}</div>

        <div class="badge">
          ${winner === "imposter" ? "انتصار الإمبوستر" : "انتصار اللاعبين"}
        </div>

        <h2 class="winner-name">${esc(title)}</h2>
        <p>${esc(description)}</p>
      </div>

      <div class="notice">
        <strong>الكلمة السرية كانت:</strong>
        <div class="word">${esc(state.word)}</div>
      </div>

      <h3>🎭 الإمبوستر${state.imposters.length > 1 ? "ات" : ""} الحقيقي${state.imposters.length > 1 ? "ون" : ""}</h3>

      <div class="scoreboard">
        ${state.imposters.map(index => `
          <div class="score-row">
            <strong>${AVATARS[index % AVATARS.length]} ${esc(playerName(index))}</strong>
            <span class="badge">إمبوستر</span>
          </div>
        `).join("")}
      </div>

      <button class="btn primary full" id="newRound">
        🔥 العبوا جولة جديدة
      </button>

      <button class="btn secondary full" id="changePlayers">
        👥 تغيير اللاعبين
      </button>
    </section>
  `;

  confettiBurst();

  document.getElementById("newRound").addEventListener("click", () => {
    // نفس اللاعبين والإعدادات، مع اختيار كلمة وأدوار جديدة.
    const count = state.players.length;
    const imposterCount = state.imposters.length;

    state.imposters = shuffle(
      state.players.map((_, index) => index)
    ).slice(0, imposterCount);

    state.word = randomItem(WORDS[state.category]);
    state.revealIndex = 0;
    state.votes = [];
    state.voteIndex = 0;
    state.candidates = state.players.map((_, index) => index);
    state.round++;

    playSound("reveal");
    renderPassScreen();
  });

  document.getElementById("changePlayers").addEventListener("click", () => {
    state.players = [];
    state.imposters = [];
    state.votes = [];
    state.revealIndex = 0;
    state.voteIndex = 0;
    renderSetup();
  });
}

/* تشغيل اللعبة */
renderSetup();
