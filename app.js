// ============================================================
//  ЛОГІКА — Смартлаб Тести 2026 v2
// ============================================================

// ── Стан ──
let activeTest      = null;   // об'єкт із TESTS
let activeQuestions = [];
let currentIndex    = 0;
let correctCount    = 0;
let wrongCount      = 0;
let answered        = false;
let totalInSession  = 20;

// ── DOM ──
const screens = {
  home:   document.getElementById('screen-home'),
  setup:  document.getElementById('screen-setup'),
  quiz:   document.getElementById('screen-quiz'),
  result: document.getElementById('screen-result'),
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
  window.scrollTo(0, 0);
}

// ── Утиліти ──
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildSession(test, countVal) {
  const pool = shuffle(test.questions);
  const count = countVal === 'all' ? pool.length : Math.min(parseInt(countVal), pool.length);
  return pool.slice(0, count).map(item => ({
    q:    item.q,
    a:    item.a,
    opts: shuffle([item.a, ...item.w]),
  }));
}

// ── Генерація головного меню ──
function buildHomeMenu() {
  const grid = document.getElementById('test-grid');
  grid.innerHTML = '';
  TESTS.forEach(test => {
    const card = document.createElement('div');
    card.className = 'test-card' + (test.id === 'all' ? ' special' : '');
    card.style.setProperty('--card-color', test.color);
    card.innerHTML = `
      <span class="card-emoji">${test.emoji}</span>
      <div class="card-title">${test.title}</div>
      <div class="card-desc">${test.description}</div>
      <div class="card-count">${test.questions.length} питань</div>
    `;
    card.addEventListener('click', () => openSetup(test));
    grid.appendChild(card);
  });
}

// ── Екран налаштувань ──
function openSetup(test) {
  activeTest = test;
  document.getElementById('setup-icon').textContent  = test.emoji;
  document.getElementById('setup-title').textContent = test.title;
  document.getElementById('setup-desc').textContent  = test.description;
  document.getElementById('setup-info').textContent  = `${test.questions.length} питань у базі`;

  // Доступні варіанти кількості
  const sel = document.getElementById('q-count');
  sel.innerHTML = '';
  const opts = [10, 20, 30, 'all'];
  opts.forEach(val => {
    const o = document.createElement('option');
    o.value = val;
    o.textContent = val === 'all' ? `Всі (${test.questions.length})` : val;
    if (parseInt(val) > test.questions.length && val !== 'all') o.disabled = true;
    if (val === 20 || (val === 'all' && test.questions.length <= 20)) o.selected = true;
    sel.appendChild(o);
  });

  // Обирати дефолт розумно
  if (test.questions.length < 20) {
    sel.value = 'all';
  }

  showScreen('setup');
}

// ── Запуск тесту ──
function startQuiz() {
  const countVal = document.getElementById('q-count').value;
  totalInSession  = countVal === 'all' ? activeTest.questions.length : parseInt(countVal);
  activeQuestions = buildSession(activeTest, countVal);
  currentIndex    = 0;
  correctCount    = 0;
  wrongCount      = 0;

  // Колір прогрес-бару відповідно до розділу
  document.getElementById('progress-fill').style.background = activeTest.color;

  showScreen('quiz');
  renderQuestion();
}

// ── Рендер питання ──
function renderQuestion() {
  const cur = activeQuestions[currentIndex];
  answered = false;

  const pct = (currentIndex / totalInSession) * 100;
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('q-current').textContent = currentIndex + 1;
  document.getElementById('q-total').textContent   = totalInSession;
  document.getElementById('live-correct').textContent = correctCount;
  document.getElementById('live-wrong').textContent   = wrongCount;

  document.getElementById('q-category').textContent = activeTest.title;
  document.getElementById('q-text').textContent     = cur.q;

  const fb = document.getElementById('feedback-row');
  fb.textContent = '';
  fb.className   = 'feedback-row';

  document.getElementById('btn-next').style.display = 'none';

  const list = document.getElementById('options-list');
  list.innerHTML = '';
  const labels = ['A', 'B', 'C'];
  cur.opts.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'opt-btn';
    btn.innerHTML = `<span class="opt-marker">${labels[i]}</span><span>${opt}</span>`;
    btn.addEventListener('click', () => handleAnswer(opt, btn, cur.a));
    list.appendChild(btn);
  });
}

// ── Відповідь ──
function handleAnswer(chosen, clickedBtn, correct) {
  if (answered) return;
  answered = true;

  const allBtns = document.querySelectorAll('.opt-btn');
  allBtns.forEach(b => b.disabled = true);

  const fb = document.getElementById('feedback-row');

  if (chosen === correct) {
    clickedBtn.classList.add('correct');
    fb.textContent = '✓ Правильно!';
    fb.className   = 'feedback-row ok';
    correctCount++;
  } else {
    clickedBtn.classList.add('wrong');
    allBtns.forEach(b => {
      if (b.querySelector('span:last-child').textContent === correct) b.classList.add('reveal');
    });
    fb.textContent = '✗ Неправильно. Правильна відповідь виділена зеленим.';
    fb.className   = 'feedback-row bad';
    wrongCount++;
  }

  document.getElementById('live-correct').textContent = correctCount;
  document.getElementById('live-wrong').textContent   = wrongCount;
  document.getElementById('btn-next').style.display   = 'inline-block';
}

// ── Наступне питання або результат ──
function nextQuestion() {
  currentIndex++;
  if (currentIndex >= totalInSession) showResult();
  else renderQuestion();
}

// ── Результат ──
function getMessage(pct) {
  if (pct >= 90) return 'Відмінний результат! Ти чудово знаєш матеріал 🏆';
  if (pct >= 75) return 'Добре! Ще трохи практики — буде ідеально 👍';
  if (pct >= 50) return 'Непогано, але є над чим попрацювати 📚';
  return 'Повтори матеріал і спробуй ще раз! 💪';
}

function getCircleClass(pct) {
  if (pct >= 90) return 'excellent';
  if (pct >= 75) return 'good';
  if (pct >= 50) return 'average';
  return 'poor';
}

function showResult() {
  const pct = Math.round((correctCount / totalInSession) * 100);
  document.getElementById('progress-fill').style.width = '100%';
  document.getElementById('result-pct').textContent   = pct + '%';
  document.getElementById('result-title').textContent = activeTest.title;
  document.getElementById('result-msg').textContent   = getMessage(pct);
  document.getElementById('r-correct').textContent    = correctCount;
  document.getElementById('r-wrong').textContent      = wrongCount;
  document.getElementById('r-total').textContent      = totalInSession;
  document.getElementById('result-circle').className  = 'result-circle ' + getCircleClass(pct);
  showScreen('result');
}

// ── Слухачі подій ──
document.getElementById('btn-back-setup').addEventListener('click',  () => showScreen('home'));
document.getElementById('btn-start-quiz').addEventListener('click',  startQuiz);
document.getElementById('btn-next').addEventListener('click',        nextQuestion);
document.getElementById('btn-restart').addEventListener('click',     startQuiz);
document.getElementById('btn-home').addEventListener('click',        () => showScreen('home'));
document.getElementById('btn-back-result').addEventListener('click', () => showScreen('home'));
document.getElementById('btn-exit-quiz').addEventListener('click', () => {
  if (confirm('Вийти з тесту? Прогрес буде втрачено.')) showScreen('home');
});

// Enter/Space → далі
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && answered) {
    e.preventDefault();
    nextQuestion();
  }
});

// ── Ініціалізація ──
buildHomeMenu();
showScreen('home');
