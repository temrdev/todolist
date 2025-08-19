const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTask");
const taskList = document.getElementById("taskList");


// Load tasks from localStorage
function loadTasks() {
    const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
    tasks.forEach(task => addTaskToDOM(task.text,task.done));
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

// Add task to DOM and localStorage
function addTaskToDOM(task, done = false) {
    const li = document.createElement("li");
    li.draggable = true; // allow dragging

    const span = document.createElement("span");
    span.textContent = task;
    span.className = "task-text";
    li.appendChild(span);

    if (done) li.classList.add("done");

    const btnGroup = document.createElement("div");
    btnGroup.className = "btn-group";

    const doneBtn = document.createElement("button");
    doneBtn.className = "done-btn";
    doneBtn.textContent = li.classList.contains("done") ? "Undo" : "Done";
    doneBtn.addEventListener("click", () => {
        li.classList.toggle("done");
        doneBtn.textContent = li.classList.contains("done") ? "Undo" : "Done";
        saveTasks();
        checkOutstandingTasks();

    });
    btnGroup.appendChild(doneBtn);

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.className = "remove";
    removeBtn.addEventListener("click", () => {
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

        modal.querySelector(".confirm").addEventListener("click", () => {
            li.remove();
            saveTasks();
            checkOutstandingTasks();
            modal.remove();
        });

        modal.querySelector(".cancel").addEventListener("click", () => {
            modal.remove();
        });
        
        requestAnimationFrame(() => li.classList.add("fade-out"));
        li.addEventListener("transitionend", () => {
            li.remove();
            saveTasks();
            checkOutstandingTasks();

        }, { once: true });
    });
    btnGroup.appendChild(removeBtn);

    li.appendChild(btnGroup);

    li.classList.add("fade-in-start");
    taskList.appendChild(li);
    requestAnimationFrame(() => li.classList.add("fade-in-end"));
}



// Add new task
addTaskBtn.addEventListener("click", () => {
    const task = taskInput.value.trim();
    if (task) {
        addTaskToDOM(task);
        saveTasks();
        taskInput.value = "";
        checkOutstandingTasks();

    }
});

taskInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        addTaskBtn.click();
    }
});

// Load tasks on page load
loadTasks();



// summer timer, countdown

function updateCountdown() {
    const now = new Date();
    const endOfSummer = new Date(now.getFullYear(), 7, 31, 23, 59, 59); // August 31
    let diff = Math.floor((endOfSummer - now) / 1000);

    const countdownElem = document.getElementById("countdown");

    if (diff <= 0) {
        countdownElem.innerText = "Summer is ended!";
        return;
    }

    const pad = num => String(num).padStart(2, "0");

    const days = Math.floor(diff / (60 * 60 * 24));
    const hours = Math.floor((diff / 3600) % 24);
    const minutes = Math.floor((diff / 60) % 60);
    const seconds = diff % 60;
    document.getElementById("timeLeft").innerText = 
    `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)} left to the end of summer!`;
}
setInterval(updateCountdown, 1000);
updateCountdown();


function checkOutstandingTasks() {
    const allTasks = document.querySelectorAll("#taskList li");
    const pendingTasks = document.querySelectorAll("#taskList li:not(.done)");
    const doneTasks = document.querySelectorAll("#taskList li.done");
    const taskWarning = document.getElementById("taskWarning");

    taskWarning.style.display = "block";

    // CASE 1: No tasks at all
    if (allTasks.length === 0) {
        taskWarning.textContent = "📝 Add a task";
        taskWarning.style.color = "gray";
        return;
    }

    // CASE 2: All tasks done
    if (doneTasks.length === allTasks.length) {
        taskWarning.textContent = "🎉 Freedom! Go enjoy life!";
        taskWarning.style.color = "green";
        return;
    }

    // CASE 3: Some tasks pending — use messages array
    const count = pendingTasks.length;
    const messages = [
        { min: 7, text: c => `💀 Bro... ${c}?? That is not a to-do list, that is a horror movie.`, color: "hsl(0, 100%, 50%)" },
        { min: 4, text: c => `😏 You have ${c} tasks pending! Better start now...`, color: "orange" },
        { min: 2, text: c => `👍 You are doing great! Only ${c} tasks left. Keep going!`, color: "yellow" },
        { min: 1, text: () => `🔥 Just one more to go!`, color: "lightgreen" }
    ];

    const match = messages.find(msg => count >= msg.min);
    taskWarning.textContent = match.text(count);
    taskWarning.style.color = match.color;
}

checkOutstandingTasks();

// Editing arrangement of tasks list (dragging)

const editTaskBtn = document.getElementById("editTask");
let editMode = false; 
let dragSrcEl = null;

function toggleEditMode() {
    editMode = !editMode;
    const tasks = document.querySelectorAll("#taskList li");

    tasks.forEach(li => {
        li.draggable = editMode; 
        li.style.cursor = editMode ? "grab" : "default";
    });

    // Visual feedback for button
    editTaskBtn.classList.toggle("active", editMode);
}

// Drag logic
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
    return false;
}

function handleDrop(e) {
    if (!editMode) return;
    e.stopPropagation();

    if (dragSrcEl !== this) {
        dragSrcEl.parentNode.removeChild(dragSrcEl);
        this.insertAdjacentHTML("beforebegin", e.dataTransfer.getData("text/html"));
        const newEl = this.previousSibling;

        addDnDHandlers(newEl); // rebind events
        saveTasks(); 
    }
    return false;
}

function handleDragEnd() {
    this.classList.remove("dragging");
}

// Attach drag events
function addDnDHandlers(el) {
    el.addEventListener("dragstart", handleDragStart, false);
    el.addEventListener("dragover", handleDragOver, false);
    el.addEventListener("drop", handleDrop, false);
    el.addEventListener("dragend", handleDragEnd, false);
}

// Initial setup for future tasks
function enableDnDOnTasks() {
    const tasks = document.querySelectorAll("#taskList li");
    tasks.forEach(addDnDHandlers);
}

// Toggle edit mode on button click
editTaskBtn.addEventListener("click", () => {
    toggleEditMode();
    enableDnDOnTasks();
});
