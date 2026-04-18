let currentFilter = 'all';
let todos = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadTodos();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    const form = document.getElementById('todoForm');
    form.addEventListener('submit', handleAddTodo);

    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderTodos();
        });
    });
}

// Load todos from server
async function loadTodos() {
    try {
        const response = await fetch('/api/todos');
        todos = await response.json();
        renderTodos();
        updateStats();
    } catch (error) {
        console.error('Error loading todos:', error);
    }
}

// Handle adding new todo
async function handleAddTodo(e) {
    e.preventDefault();

    const title = document.getElementById('todoTitle').value.trim();
    const description = document.getElementById('todoDescription').value.trim();
    const dueDate = document.getElementById('todoDueDate').value;

    if (!title) {
        alert('Please enter a task title');
        return;
    }

    try {
        const response = await fetch('/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title,
                description,
                due_date: dueDate
            })
        });

        if (response.ok) {
            const data = await response.json();
            todos.push(data.todo);
            renderTodos();
            updateStats();

            // Clear form
            document.getElementById('todoForm').reset();
        }
    } catch (error) {
        console.error('Error adding todo:', error);
        alert('Error adding task');
    }
}

// Toggle todo completion
async function toggleTodo(id) {
    try {
        const response = await fetch(`/toggle/${id}`, {
            method: 'PUT'
        });

        if (response.ok) {
            const data = await response.json();
            todos = todos.map(todo => todo.id === id ? data.todo : todo);
            renderTodos();
            updateStats();
        }
    } catch (error) {
        console.error('Error toggling todo:', error);
    }
}

// Delete todo
async function deleteTodo(id) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }

    try {
        const response = await fetch(`/delete/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            todos = todos.filter(todo => todo.id !== id);
            renderTodos();
            updateStats();
        }
    } catch (error) {
        console.error('Error deleting todo:', error);
        alert('Error deleting task');
    }
}

// Edit todo
async function editTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const newTitle = prompt('Edit title:', todo.title);
    if (newTitle === null) return;

    const newDescription = prompt('Edit description:', todo.description);
    const newDueDate = prompt('Edit due date (YYYY-MM-DD):', todo.due_date);

    try {
        const response = await fetch(`/update/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: newTitle,
                description: newDescription,
                due_date: newDueDate
            })
        });

        if (response.ok) {
            const data = await response.json();
            todos = todos.map(t => t.id === id ? data.todo : t);
            renderTodos();
            updateStats();
        }
    } catch (error) {
        console.error('Error updating todo:', error);
        alert('Error updating task');
    }
}

// Render todos to DOM
function renderTodos() {
    const todoList = document.getElementById('todoList');
    const emptyMessage = document.getElementById('emptyMessage');

    let filteredTodos = todos;

    if (currentFilter === 'completed') {
        filteredTodos = todos.filter(todo => todo.completed);
    } else if (currentFilter === 'pending') {
        filteredTodos = todos.filter(todo => !todo.completed);
    }

    if (filteredTodos.length === 0) {
        todoList.innerHTML = '';
        emptyMessage.style.display = 'block';
        return;
    }

    emptyMessage.style.display = 'none';
    todoList.innerHTML = filteredTodos.map(todo => `
        <div class="todo-item ${todo.completed ? 'completed' : ''}">
            <input 
                type="checkbox" 
                class="checkbox" 
                ${todo.completed ? 'checked' : ''}
                onchange="toggleTodo(${todo.id})"
            >
            <div class="todo-content">
                <div class="todo-title">${escapeHtml(todo.title)}</div>
                ${todo.description ? `<div class="todo-description">${escapeHtml(todo.description)}</div>` : ''}
                <div class="todo-meta">
                    ${todo.due_date ? `<div class="todo-date">📅 ${formatDate(todo.due_date)}</div>` : ''}
                    <div class="todo-date">🕐 ${formatDate(todo.created_at)}</div>
                </div>
            </div>
            <div class="todo-actions">
                <button class="btn btn-edit" onclick="editTodo(${todo.id})">Edit</button>
                <button class="btn btn-danger" onclick="deleteTodo(${todo.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// Update statistics
function updateStats() {
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    const pending = total - completed;

    document.getElementById('totalTodos').textContent = total;
    document.getElementById('completedTodos').textContent = completed;
    document.getElementById('pendingTodos').textContent = pending;
}

// Utility functions
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}