// Header design
function updateGreeting() {
    const greeting = document.getElementById("greeting");
    const now = new Date();
    const hour = now.getHours();
    let greetingText;

    if (hour >= 5 && hour < 12) {
        greetingText = "Good morning, Bro! 🌅";
    } else if (hour >= 12 && hour < 18) {
        greetingText = "Good afternoon, Bro! ☀️";
    } else if (hour >= 18 && hour < 22) {
        greetingText = "Good evening, Bro! 🌇";
    } else {
        greetingText = "Good night, Bro! 🌙";
    }
    greeting.textContent = greetingText;
}
updateGreeting(); setInterval(updateGreeting, 60000);

// Weather 
async function updateWeather(city = "Almaty") {
    const weather = document.getElementById("weather");
    const apiKey = "7a43c0df93364041ab5151340252708";

    try {
        const response = await fetch(
            `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}`
        );
        const data = await response.json();

        const temp = Math.round(data.current.temp_c);
        const conditions = data.current.condition.text;

        let emoji = "";
        if (conditions.includes("Sunny") || conditions.includes("Clear")) emoji = "☀️";
        else if (conditions.includes("Cloud")) emoji = "☁️";
        else if (conditions.includes("Rain")) emoji = "🌧️";
        else if (conditions.includes("Snow")) emoji = "❄️";
        else emoji = "🌡️";

        weather.textContent = `Today in ${city}: ${temp}°C ${emoji} (${conditions})`;

    } catch (error) {
        weather.textContent = `Weather info unavailable 😕`;
        console.error(error);
    }
}
updateWeather(); setInterval(updateWeather, 30 * 30 * 1000);

// Random fact
async function updateFact() {
    const factElem = document.getElementById("fact");

    try {
        const response = await fetch("https://uselessfacts.jsph.pl/random.json?language=en");
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        const fact = data.text;

        factElem.textContent = `Interesting fact: "${fact}"`;

    } catch (error) {
        console.error("Error fetching fact:", error);
        factElem.textContent = `Interesting fact: "Unable to fetch a fact 😕`;
    }
}
updateFact(); setInterval(updateFact, 24 * 60 * 60 * 1000);


//Filter
const showFilter = document.getElementById("showFilterBtn");
const filter = document.getElementById("filter");

showFilter.addEventListener("click", () => {
    filter.classList.toggle("visible");
}); 

//Hint
const hint = document.getElementById("hint");
if (localStorage.getItem("hintDismissed") === "true") {
    hint.classList.add("hidden");
}
hint.addEventListener("click", () => {
    hint.classList.add("hidden");
    localStorage.setItem("hintDismissed", "true");
});


//  My To-Do List
const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTask");
const taskList = document.getElementById("taskList");
const editTaskBtn = document.getElementById("editTask");

let editMode = false; let dragSrcEl = null;

// Load tasks from localStorage
function loadTasks() {
    taskList.innerHTML = "";
    const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
    tasks.forEach(task => addTaskToDOM(task.text, task.done));
}

// Save tasks to localStorage
function saveTasks() {
    const tasks = [];
    document.querySelectorAll("#taskList li").forEach(li => {
        tasks.push({
            text: li.querySelector(".task-text").textContent,
            done: li.classList.contains("done")
        });
    });
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Add task to DOM
function addTaskToDOM(task, done = false) {
    const li = document.createElement("li");
    li.draggable = true;

    const span = document.createElement("span");
    span.className = "task-text";
    span.textContent = task;
    li.appendChild(span);

    if (done) li.classList.add("done");

    li.addEventListener("click", (e) => {  // DONE, UNDO
        if (e.target.tagName !== "BUTTON") {
            li.classList.toggle("done");
            saveTasks();
            checkOutstandingTasks();
        }
    });
    const btnGroup = document.createElement("div");
    btnGroup.className = "btn-group";

    // Remove button with modal
    const removeBtn = document.createElement("button");
    removeBtn.className = "remove";
    removeBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="hsl(0, 100%, 70%)" viewBox="0 0 24 24">
            <path d="M3 6h18v2H3V6zm2 3h14l-1 12H6L5 9zm3 2v8h2v-8H8zm4 0v8h2v-8h-2z"/>
        </svg>
    `;
    removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        showDeleteModal(li);
    });
    btnGroup.appendChild(removeBtn);

    li.appendChild(btnGroup);

    // Fade-in animation
    li.classList.add("fade-in-start");
    taskList.appendChild(li);
    requestAnimationFrame(() => li.classList.add("fade-in-end"));

    addDnDHandlers(li);
}

// Show delete confirmation modal
function showDeleteModal(li) {
    const modal = document.createElement("div");
    modal.classList.add("modal");
    modal.innerHTML = `
        <div class="modal-content">
            <p>Are you sure you want to delete this task?</p>
            <button class="confirm">Yes</button>
            <button class="cancel">No</button>
        </div>
    `;
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add("show"));

    const confirmBtn = modal.querySelector(".confirm");
    const cancelBtn = modal.querySelector(".cancel");

    // Click handlers
    confirmBtn.addEventListener("click", () => deleteTask(li, modal));
    cancelBtn.addEventListener("click", () => modal.remove());

    // Keyboard support
    function handleKey(e) {
        if (e.key === "Enter") {
            confirmBtn.click();
        }
        else if (e.key === "Escape") {
            cancelBtn.click();
        }
    }
    
    modal.addEventListener("keydown", handleKey);
    modal.tabIndex = 0; // Make modal focusable
    modal.focus();

    modal.addEventListener("remove", () => {
        modal.removeEventListener("keydown", handleKey);
    });
}

// Delete task with fade-out
function deleteTask(li, modal) {
    li.classList.add("fade-out");
    li.addEventListener("transitionend", () => {
        li.remove();
        saveTasks();
        checkOutstandingTasks();
    }, { once: true });
    modal.remove();
}

// Add new task
addTaskBtn.addEventListener("click", () => {
    const task = taskInput.value.trim();
    if (!task) return;
    addTaskToDOM(task);
    saveTasks();
    taskInput.value = "";
    checkOutstandingTasks();
});

taskInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addTaskBtn.click();
});


// Check tasks and show warning
function checkOutstandingTasks() {
    const allTasks = document.querySelectorAll("#taskList li");
    const pendingTasks = document.querySelectorAll("#taskList li:not(.done)");
    const doneTasks = document.querySelectorAll("#taskList li.done");
    const taskWarning = document.getElementById("taskWarning");

    taskWarning.style.display = "block";

    if (allTasks.length === 0) {
        taskWarning.textContent = "📝 Add a task";
        taskWarning.style.color = "gray";
        return;
    }

    if (doneTasks.length === allTasks.length) {
        taskWarning.textContent = "🎉 Freedom! Go enjoy life!";
        taskWarning.style.color = "green";
        return;
    }

    const count = pendingTasks.length;
    const messages = [
        { min: 7, text: c => `💀 Bro... ${c}?? That is not a to-do list, that is a horror movie.`, color: "hsl(0, 100%, 50%)" },
        { min: 4, text: c => `😏 You have ${c} tasks pending! Better start now...`, color: "orange" },
        { min: 2, text: c => `👍 You are doing great! Only ${c} tasks left. Keep going!`, color: "yellow" },
        { min: 1, text: () => `🔥 Just one more to go!`, color: "lightgreen" }
    ];
    const match = messages.find(msg => count >= msg.min);
    taskWarning.textContent = match ? match.text(count) : "";
    taskWarning.style.color = match ? match.color : "";
}

// Drag & Drop logic
function handleDragStart(e) {
    if (!editMode) return;
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", this.outerHTML);
    this.classList.add("dragging");
}

function handleDragOver(e) {
    if (!editMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
}

function handleDrop(e) {
    if (!editMode) return;
    e.stopPropagation();

    if (dragSrcEl !== this) {
        this.parentNode.insertBefore(dragSrcEl, this); 
        saveTasks();
    }
}


function handleDragEnd() {
    this.classList.remove("dragging");
}

function addDnDHandlers(el) {
    el.addEventListener("dragstart", handleDragStart, false);
    el.addEventListener("dragover", handleDragOver, false);
    el.addEventListener("drop", handleDrop, false);
    el.addEventListener("dragend", handleDragEnd, false);
}

// Enable drag & drop for all tasks
function enableDnDOnTasks() {
    const tasks = document.querySelectorAll("#taskList li");
    tasks.forEach(addDnDHandlers);
}

// Toggle edit mode
function toggleEditMode() {
    editMode = !editMode;
    const tasks = document.querySelectorAll("#taskList li");
    tasks.forEach(li => {
        li.draggable = editMode;
        li.style.cursor = editMode ? "grab" : "default";
    });
    editTaskBtn.classList.toggle("active", editMode);
}

editTaskBtn.addEventListener("click", () => {
    toggleEditMode();
    enableDnDOnTasks();
});

// Initial load
loadTasks();
enableDnDOnTasks();
checkOutstandingTasks();
