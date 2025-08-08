const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTask");
const taskList = document.getElementById("taskList");

// Local Storage 

// Load tasks from localStorage
function loadTasks() {
    const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
    tasks.forEach(task => addTaskToDOM(task));
}

// Save tasks to localStorage
function saveTasks() {
    const tasks = [];
    document.querySelectorAll("#taskList li").forEach(li => {
        tasks.push(li.firstChild.textContent);
    });
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Add task to DOM and localStorage
function addTaskToDOM(task) {
    const li = document.createElement("li");
    li.textContent = task;
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.className = "remove";
    removeBtn.addEventListener("click", () => {
        li.remove();
        saveTasks();
    });
    li.appendChild(removeBtn);
    taskList.appendChild(li);
}

// Add new task
addTaskBtn.addEventListener("click", () => {
    const task = taskInput.value.trim();
    if (task) {
        addTaskToDOM(task);
        saveTasks();
        taskInput.value = "";
    }
});

taskInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        addTaskBtn.click();
    }
});

// Load tasks on page load
loadTasks();