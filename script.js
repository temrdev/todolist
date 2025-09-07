// ===================== DOM Elements =====================
const taskInput     = document.getElementById("taskInput");
const addTaskBtn    = document.getElementById("addTask");
const taskList      = document.getElementById("taskList");
const editTaskBtn   = document.getElementById("editTask");
const greetingEl    = document.getElementById("greeting");
const weatherEl     = document.getElementById("weather");
const factEl        = document.getElementById("fact");
const showFilterBtn = document.getElementById("showFilterBtn");
const filter        = document.getElementById("filter");
const filterBtns    = document.querySelectorAll(".filterBtn");
const hint          = document.getElementById("hint");
const progressBar   = document.getElementById("progressBar");
const progressText  = document.getElementById("progressText");
const taskWarning   = document.getElementById("taskWarning");
const noteInput = document.getElementById("noteInput");
const addNoteBtn = document.getElementById("addNote");
const noteGrid = document.getElementById("noteGrid");

// ===================== Helpers =====================
const getTasks = () => taskList.querySelectorAll("li");
const getDoneTasks = () => taskList.querySelectorAll("li.done");
function syncUI() { saveTasks(); checkOutstandingTasks(); updateProgress(); applyFilter();}

// ===================== Greeting =====================
function updateGreeting() {
  const hour = new Date().getHours();
  const greetings = [
    { range: [5, 12], text: "Good morning, Bro! 🌅" },
    { range: [12, 18], text: "Good afternoon, Bro! ☀️" },
    { range: [18, 22], text: "Good evening, Bro! 🌇" },
    { range: [22, 24], text: "Good night, Bro! 🌙" },
    { range: [0, 5], text: "Good night, Bro! 🌙" }
  ];
  const match = greetings.find(g => hour >= g.range[0] && hour < g.range[1]);
  greetingEl.textContent = match.text;
}
updateGreeting();
setInterval(updateGreeting, 60000);

// ===================== Weather =====================
async function updateWeather(city = "Almaty") {
  const apiKey = "7a43c0df93364041ab5151340252708";
  let weatherRetryDelay = 30 * 60 * 1000;
  try {
    const res = await fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}`);
    const data = await res.json();
    const temp = Math.round(data.current.temp_c);
    const cond = data.current.condition.text;
    const emoji = cond.includes("Sunny") || cond.includes("Clear") ? "☀️" :
                  cond.includes("Cloud") ? "☁️" :
                  cond.includes("Rain")  ? "🌧️" :
                  cond.includes("Snow")  ? "❄️" : "🌡️";
    weatherEl.textContent = `Today in ${city}: ${temp}°C ${emoji} (${cond})`;
    weatherRetryDelay = 30 * 60 * 1000;
  } catch {
    weatherEl.textContent = "Weather info unavailable 😕";
    weatherRetryDelay = Math.min(weatherRetryDelay * 2, 6 * 60 * 60 * 1000);
  } finally {
    setTimeout(() => updateWeather(city), weatherRetryDelay);
  }
}
updateWeather();
setInterval(updateWeather, 30 * 60 * 1000);

// ===================== Random Fact =====================
function sanitizeText(str) {
  const tmp = document.createElement("div");
  tmp.innerHTML = str;
  return tmp.textContent.trim();
}

async function updateFact() {
  try {
    const res = await fetch("https://uselessfacts.jsph.pl/random.json?language=en");
    if (!res.ok) throw new Error();
    const data = await res.json();
    factEl.textContent = `Interesting fact: "${sanitizeText(data.text || "No fact")}"`;
    
  } catch {
    factEl.textContent = `Interesting fact: "Unable to fetch a fact 😕"`;
  }
}
updateFact();
setInterval(updateFact, 24 * 60 * 60 * 1000);

// ===================== Filters =====================
let currentFilter = "all";

function applyFilter() {
  getTasks().forEach(task => {
    const isDone = task.classList.contains("done");
    const isOverdue = task.classList.contains("overdue"); // todo
    const visible =
      currentFilter === "all" ||
      (currentFilter === "pending" && !isDone && !isOverdue) ||
      (currentFilter === "completed" && isDone) ||
      (currentFilter === "overdue" && isOverdue);

    task.style.display = visible ? "flex" : "none";
  });
}

function setActiveFilter(name) {
  currentFilter = name;
  filterBtns.forEach(btn => btn.classList.toggle("active", btn.dataset.filter === name));
  applyFilter();
}

function initFilters() {
  currentFilter = "all";
  setActiveFilter(currentFilter);
}
initFilters();

showFilterBtn?.addEventListener("click", () => filter.classList.toggle("visible"));
filterBtns.forEach(btn => btn.addEventListener("click", () => setActiveFilter(btn.dataset.filter)));

// ===================== Hint =====================
if (localStorage.getItem("hintDismissed") === "true") hint.classList.add("hidden");
hint.addEventListener("click", () => {
  hint.classList.add("hidden");
  localStorage.setItem("hintDismissed", "true");
});

// ===================== Tasks =====================
let editMode = false, dragSrcEl = null;

function saveTasks() {
  const tasks = [...getTasks()].map(li => ({
    text: li.querySelector(".task-text").textContent,
    done: li.classList.contains("done")
  }));
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function loadTasks() {
  taskList.innerHTML = "";
  const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
  tasks.forEach(t => addTaskToDOM(t.text, t.done));
  applyFilter();
  updateProgress();
}

function addTaskToDOM(text, done = false) {
  const li = document.createElement("li");
  li.draggable = true;

  const span = Object.assign(document.createElement("span"), { className: "task-text", textContent: text });
  li.append(span);
  if (done) li.classList.add("done");

  li.addEventListener("click", e => {
    if (e.target.tagName !== "BUTTON") {
      li.classList.toggle("done");
      syncUI();
    }
  });

  const removeBtn = document.createElement("button");
  removeBtn.className = "remove";
  removeBtn.innerHTML = `❌`; 
  removeBtn.addEventListener("click", e => {
    e.stopPropagation();
    showDeleteModal(li);
  });

  const btnGroup = document.createElement("div");
  btnGroup.className = "btn-group";
  btnGroup.append(removeBtn);
  li.append(btnGroup);

  taskList.append(li);
  li.classList.add("fade-in-start");
  requestAnimationFrame(() => li.classList.add("fade-in-end"));

  addDnDHandlers(li);
  applyFilter();
  updateProgress();
}

// ===================== Delete Modal =====================
function showDeleteModal(li) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <p>Delete this task?</p>
      <button class="confirm">Yes</button>
      <button class="cancel">No</button>
    </div>`;
  document.body.append(modal);
  requestAnimationFrame(() => modal.classList.add("show"));

  modal.querySelector(".confirm").onclick = () => deleteTask(li, modal);
  modal.querySelector(".cancel").onclick = () => modal.remove();

  modal.tabIndex = 0;
  modal.focus();
  modal.onkeydown = e => {
    if (e.key === "Enter") modal.querySelector(".confirm").click();
    if (e.key === "Escape") modal.remove();
  };
}

function deleteTask(li, modal) {
    li.classList.add("fade-out");
    let removed = false;

    function cleanup() {
      if (removed) return;
      removed = true;
      li.remove();
      syncUI();
      modal.remove();
    }
    li.addEventListener("transitionend", cleanup, { once: true });
    setTimeout(cleanup, 100);
}

// ===================== Progress =====================
function updateProgress() {
  if (!progressBar || !progressText) return;
  const tasks = getTasks();
  const done = getDoneTasks();

  if (tasks.length === 0) {
    progressBar.style.width = "0%";
    progressText.textContent = "No tasks yet";
    return;
  }

  const percent = Math.round((done.length / tasks.length) * 100);
  progressBar.style.width = percent + "%";
  progressText.textContent = `You completed ${percent}% of your tasks!`;
}

// ===================== Warnings =====================
function checkOutstandingTasks() {
  const all = getTasks();
  const pending = [...all].filter(t => !t.classList.contains("done"));
  const done = getDoneTasks();

  taskWarning.style.display = "block";

  if (all.length === 0) {
    taskWarning.textContent = "📝 Add a task";
    taskWarning.style.color = "gray";
    return;
  }
  if (done.length === all.length) {
    taskWarning.textContent = "🎉 Freedom! Go enjoy life!";
    taskWarning.style.color = "green";
    return;
  }

  const count = pending.length;
  const messages = [
    { min: 7, msg: c => `💀 Bro... ${c}?? That's a horror movie.`, color: "red" },
    { min: 4, msg: c => `😏 ${c} tasks pending! Better start...`, color: "orange" },
    { min: 2, msg: c => `👍 Only ${c} tasks left. Keep going!`, color: "gold" },
    { min: 1, msg: () => `🔥 Just one more to go!`, color: "lightgreen" }
  ];
  const match = messages.find(m => count >= m.min);
  if (match) {
    taskWarning.textContent = match.msg(count);
    taskWarning.style.color = match.color;
  }
}

// ===================== Notes =====================
let notes = JSON.parse(localStorage.getItem("notes")) || [];

const pastelColors = [
  "#FFEB99", "#FFD6D6", "#D6FFD6", "#D6E5FF", "#FFF0D6", "#E6D6FF"
];

function saveNotes() {
  localStorage.setItem("notes", JSON.stringify(notes));
}

function renderNotes() {
  noteGrid.innerHTML = "";
  notes.forEach((note, index) => {
    const div = document.createElement("div");
    div.className = "note";
    div.style.background = pastelColors[index % pastelColors.length];
    div.textContent = note;

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-note";
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", () => {
      notes.splice(index, 1);
      saveNotes();
      renderNotes();
    });

    div.appendChild(removeBtn);
    noteGrid.appendChild(div);
  });
}

addNoteBtn.addEventListener("click", () => {
  const text = noteInput.value.trim();
  if (!text) return;
  notes.push(text);
  saveNotes();
  renderNotes();
  noteInput.value = "";
});

renderNotes();

// ===================== Drag & Drop =====================
function addDnDHandlers(el) {
  el.addEventListener("dragstart", e => {
    if (!editMode) return;
    dragSrcEl = el;
    e.dataTransfer.setData("text/html", el.outerHTML);
    el.classList.add("dragging");
  });
  el.addEventListener("dragover", e => editMode && e.preventDefault());
  el.addEventListener("drop", e => {
    if (!editMode || dragSrcEl === el) return;
    e.stopPropagation();
    el.parentNode.insertBefore(dragSrcEl, el);
    saveTasks();
  });
  el.addEventListener("dragend", () => el.classList.remove("dragging"));
}

function toggleEditMode() {
  editMode = !editMode;
  getTasks().forEach(li => {
    li.draggable = editMode;
    li.style.cursor = editMode ? "grab" : "default";
  });
  editTaskBtn.classList.toggle("active", editMode);
}
editTaskBtn.addEventListener("click", () => {
  toggleEditMode();
  getTasks().forEach(addDnDHandlers);
});

// ===================== Init =====================
addTaskBtn.addEventListener("click", () => {
  const text = taskInput.value.trim();
  if (!text) return;
  taskInput.value = "";
  addTaskToDOM(text);
  saveTasks();
  checkOutstandingTasks();
});
taskInput.addEventListener("keydown", e => e.key === "Enter" && addTaskBtn.click());

loadTasks();
checkOutstandingTasks();
updateProgress();
