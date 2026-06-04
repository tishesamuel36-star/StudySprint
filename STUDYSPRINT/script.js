const STORAGE_KEYS = {
  TASKS: 'studysprint_tasks',
  GOALS: 'studysprint_goals',
  STATS: 'studysprint_stats',
  TIMER: 'studysprint_timer'
};

const defaultTimer = {
  mode: 'focus',
  focus: 25,
  break: 5,
  remaining: 25 * 60,
  running: false,
  intervalId: null
};

let tasks = [];
let goals = [];
let stats = { sessionsCompleted: 0 };
let timer = { ...defaultTimer };

const elements = {
  todayOverview: document.getElementById('todayOverview'),
  taskForm: document.getElementById('taskForm'),
  taskTitle: document.getElementById('taskTitle'),
  taskDetails: document.getElementById('taskDetails'),
  taskList: document.getElementById('taskList'),
  taskFilter: document.getElementById('taskFilter'),
  clearCompleted: document.getElementById('clearCompleted'),
  timerDisplay: document.getElementById('timerDisplay'),
  startBtn: document.getElementById('startBtn'),
  pauseBtn: document.getElementById('pauseBtn'),
  resetBtn: document.getElementById('resetBtn'),
  focusBtn: document.getElementById('focusBtn'),
  breakBtn: document.getElementById('breakBtn'),
  goalForm: document.getElementById('goalForm'),
  goalTitle: document.getElementById('goalTitle'),
  goalList: document.getElementById('goalList'),
  statTotal: document.getElementById('statTotal'),
  statCompleted: document.getElementById('statCompleted'),
  statRemaining: document.getElementById('statRemaining'),
  statSessions: document.getElementById('statSessions'),
  statPercent: document.getElementById('statPercent')
};

const taskTemplate = document.getElementById('taskTpl');
const goalTemplate = document.getElementById('goalTpl');

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function load(key, fallback) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}

function init() {
  tasks = load(STORAGE_KEYS.TASKS, []);
  goals = load(STORAGE_KEYS.GOALS, []);
  stats = load(STORAGE_KEYS.STATS, { sessionsCompleted: 0 });
  timer = load(STORAGE_KEYS.TIMER, defaultTimer);
  if (!timer.remaining) {
    timer.remaining = timer.mode === 'break' ? timer.break * 60 : timer.focus * 60;
  }

  elements.taskForm.addEventListener('submit', handleAddTask);
  elements.taskFilter.addEventListener('change', renderTasks);
  elements.clearCompleted.addEventListener('click', clearCompletedTasks);
  elements.startBtn.addEventListener('click', startTimer);
  elements.pauseBtn.addEventListener('click', pauseTimer);
  elements.resetBtn.addEventListener('click', resetTimer);
  elements.focusBtn.addEventListener('click', () => switchTimerMode('focus'));
  elements.breakBtn.addEventListener('click', () => switchTimerMode('break'));
  elements.goalForm.addEventListener('submit', handleAddGoal);

  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  renderTasks();
  renderGoals();
  updateStatistics();
  updateTimerDisplay();
  updateOverview();
}

function handleAddTask(event) {
  event.preventDefault();
  const title = elements.taskTitle.value.trim();
  const details = elements.taskDetails.value.trim();
  if (!title) return;
  tasks.unshift({ id: Date.now(), title, details, completed: false });
  save(STORAGE_KEYS.TASKS, tasks);
  elements.taskForm.reset();
  renderTasks();
  updateStatistics();
}

function handleAddGoal(event) {
  event.preventDefault();
  const title = elements.goalTitle.value.trim();
  if (!title) return;
  goals.unshift({ id: Date.now(), title, completed: false });
  save(STORAGE_KEYS.GOALS, goals);
  elements.goalForm.reset();
  renderGoals();
  updateStatistics();
}

function renderTasks() {
  elements.taskList.innerHTML = '';
  const filter = elements.taskFilter.value;
  const visible = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });
  visible.forEach(task => {
    const item = taskTemplate.content.firstElementChild.cloneNode(true);
    item.dataset.id = task.id;
    item.querySelector('.task-title').textContent = task.title;
    item.querySelector('.task-details').textContent = task.details;
    const checkbox = item.querySelector('.task-check');
    checkbox.checked = task.completed;
    if (task.completed) item.classList.add('completed');
    checkbox.addEventListener('change', () => toggleTask(task.id));

    item.querySelector('.edit').addEventListener('click', () => editTask(task.id));
    item.querySelector('.delete').addEventListener('click', () => deleteTask(task.id));
    elements.taskList.appendChild(item);
  });
}

function renderGoals() {
  elements.goalList.innerHTML = '';
  goals.forEach(goal => {
    const item = goalTemplate.content.firstElementChild.cloneNode(true);
    item.dataset.id = goal.id;
    item.querySelector('.goal-title').textContent = goal.title;
    const checkbox = item.querySelector('.goal-check');
    checkbox.checked = goal.completed;
    item.querySelector('.delete').addEventListener('click', () => deleteGoal(goal.id));
    checkbox.addEventListener('change', () => toggleGoal(goal.id));
    elements.goalList.appendChild(item);
  });
}

function toggleTask(id) {
  tasks = tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
  save(STORAGE_KEYS.TASKS, tasks);
  renderTasks();
  updateStatistics();
}

function editTask(id) {
  const task = tasks.find(task => task.id === id);
  if (!task) return;
  const newTitle = prompt('Edit task title', task.title);
  if (newTitle === null) return;
  task.title = newTitle.trim() || task.title;
  save(STORAGE_KEYS.TASKS, tasks);
  renderTasks();
}

function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  tasks = tasks.filter(task => task.id !== id);
  save(STORAGE_KEYS.TASKS, tasks);
  renderTasks();
  updateStatistics();
}

function clearCompletedTasks() {
  tasks = tasks.filter(task => !task.completed);
  save(STORAGE_KEYS.TASKS, tasks);
  renderTasks();
  updateStatistics();
}

function toggleGoal(id) {
  goals = goals.map(goal => goal.id === id ? { ...goal, completed: !goal.completed } : goal);
  save(STORAGE_KEYS.GOALS, goals);
  renderGoals();
  updateStatistics();
}

function deleteGoal(id) {
  if (!confirm('Delete this goal?')) return;
  goals = goals.filter(goal => goal.id !== id);
  save(STORAGE_KEYS.GOALS, goals);
  renderGoals();
  updateStatistics();
}

function updateStatistics() {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const remaining = total - completed;
  elements.statTotal.textContent = total;
  elements.statCompleted.textContent = completed;
  elements.statRemaining.textContent = remaining;
  elements.statSessions.textContent = stats.sessionsCompleted;
  const productivity = total ? Math.round((completed / total) * 100) : Math.min(100, stats.sessionsCompleted * 12);
  elements.statPercent.textContent = `${productivity}%`;
  updateOverview();
  save(STORAGE_KEYS.STATS, stats);
}

function updateOverview() {
  const completed = tasks.filter(task => task.completed).length;
  elements.todayOverview.textContent = `Tasks ${completed}/${tasks.length} • Sessions ${stats.sessionsCompleted}`;
}

function updateTimerDisplay() {
  const minutes = Math.floor(timer.remaining / 60).toString().padStart(2, '0');
  const seconds = (timer.remaining % 60).toString().padStart(2, '0');
  elements.timerDisplay.textContent = `${minutes}:${seconds}`;
  elements.focusBtn.classList.toggle('active', timer.mode === 'focus');
  elements.breakBtn.classList.toggle('active', timer.mode === 'break');
}

function startTimer() {
  if (timer.running) return;
  timer.running = true;
  timer.intervalId = setInterval(() => {
    timer.remaining -= 1;
    if (timer.remaining <= 0) {
      completeSession();
    }
    updateTimerDisplay();
    save(STORAGE_KEYS.TIMER, timer);
  }, 1000);
  save(STORAGE_KEYS.TIMER, timer);
}

function pauseTimer() {
  if (!timer.running) return;
  timer.running = false;
  clearInterval(timer.intervalId);
  timer.intervalId = null;
  save(STORAGE_KEYS.TIMER, timer);
}

function resetTimer() {
  pauseTimer();
  timer.mode = 'focus';
  timer.remaining = timer.focus * 60;
  updateTimerDisplay();
  save(STORAGE_KEYS.TIMER, timer);
}

function switchTimerMode(mode) {
  timer.mode = mode;
  timer.remaining = mode === 'focus' ? timer.focus * 60 : timer.break * 60;
  updateTimerDisplay();
  save(STORAGE_KEYS.TIMER, timer);
}

function completeSession() {
  pauseTimer();
  if (timer.mode === 'focus') {
    stats.sessionsCompleted += 1;
    notify('Focus complete! Take a break.');
    timer.mode = 'break';
    timer.remaining = timer.break * 60;
  } else {
    notify('Break finished! Back to studying.');
    timer.mode = 'focus';
    timer.remaining = timer.focus * 60;
  }
  save(STORAGE_KEYS.STATS, stats);
  save(STORAGE_KEYS.TIMER, timer);
  updateStatistics();
  updateTimerDisplay();
}

function notify(message) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('StudySprint', { body: message });
  } else {
    window.alert(message);
  }
  playSound();
}

function playSound() {
  const audio = document.createElement('audio');
  audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAABCxAgAEABAAZGF0YQAAAAA=';
  audio.play().catch(() => {});
}

init();
