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

    // Тext
    const span = document.createElement("span");
    span.textContent = task;
    span.className = "task-text";
    li.appendChild(span);

    if (done) li.classList.add("done");

    // Container of buttons on the right
    const btnGroup = document.createElement("div");
    btnGroup.className = "btn-group";

    // Done / Undo
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

    // Remove
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.className = "remove";
    removeBtn.addEventListener("click", () => {
        requestAnimationFrame(() => li.classList.add("fade-out"));
        li.addEventListener("transitionend", () => {
            li.remove();
            saveTasks();
            checkOutstandingTasks();

        }, { once: true });
    });
    btnGroup.appendChild(removeBtn);

    li.appendChild(btnGroup);

    // Starting animation
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
    const endOfSummer = new Date(now.getFullYear(), 7,31,23,59,59); // 7 = august
    const diff = endOfSummer - now;

    if (diff <= 0) {
        document.getElementById("countdown").innerText = "Summer is ended!";
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    document.getElementById("countdown").innerText = 
        `${days}d ${hours}:${minutes}:${seconds}`;
}

function checkOutstandingTasks() {
    const tasks = document.querySelectorAll(`li:not(.done)`);
    const taskWarning = document.getElementById("taskWarning");

    if (tasks.length >= 5) {
        taskWarning.textContent = `😏 You have ${tasks.length} tasks pending! Better start now...`;
        taskWarning.style.display = 'block';
    }
    else {
        taskWarning.style.display = 'none';
    }
}
setInterval(updateCountdown, 1000);
updateCountdown();
checkOutstandingTasks();