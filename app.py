from flask import Flask, render_template, request, jsonify, redirect, url_for
import json
import os
from datetime import datetime

app = Flask(__name__)

# File to store todos
TODOS_FILE = 'todos.json'

def load_todos():
    """Load todos from JSON file"""
    if os.path.exists(TODOS_FILE):
        with open(TODOS_FILE, 'r') as f:
            return json.load(f)
    return []

def save_todos(todos):
    """Save todos to JSON file"""
    with open(TODOS_FILE, 'w') as f:
        json.dump(todos, f, indent=4)

@app.route('/')
def index():
    """Display all todos"""
    todos = load_todos()
    return render_template('index.html', todos=todos)

@app.route('/add', methods=['POST'])
def add_todo():
    """Add a new todo"""
    data = request.get_json()
    todos = load_todos()
    
    new_todo = {
        'id': len(todos) + 1,
        'title': data.get('title'),
        'description': data.get('description', ''),
        'completed': False,
        'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'due_date': data.get('due_date', '')
    }
    
    todos.append(new_todo)
    save_todos(todos)
    
    return jsonify({'success': True, 'todo': new_todo}), 201

@app.route('/update/<int:todo_id>', methods=['PUT'])
def update_todo(todo_id):
    """Update a todo"""
    data = request.get_json()
    todos = load_todos()
    
    for todo in todos:
        if todo['id'] == todo_id:
            todo['title'] = data.get('title', todo['title'])
            todo['description'] = data.get('description', todo['description'])
            todo['due_date'] = data.get('due_date', todo['due_date'])
            save_todos(todos)
            return jsonify({'success': True, 'todo': todo}), 200
    
    return jsonify({'success': False, 'message': 'Todo not found'}), 404

@app.route('/toggle/<int:todo_id>', methods=['PUT'])
def toggle_todo(todo_id):
    """Toggle todo completion status"""
    todos = load_todos()
    
    for todo in todos:
        if todo['id'] == todo_id:
            todo['completed'] = not todo['completed']
            save_todos(todos)
            return jsonify({'success': True, 'todo': todo}), 200
    
    return jsonify({'success': False, 'message': 'Todo not found'}), 404

@app.route('/delete/<int:todo_id>', methods=['DELETE'])
def delete_todo(todo_id):
    """Delete a todo"""
    todos = load_todos()
    todos = [todo for todo in todos if todo['id'] != todo_id]
    save_todos(todos)
    
    return jsonify({'success': True}), 200

@app.route('/api/todos', methods=['GET'])
def get_todos():
    """Get all todos as JSON"""
    todos = load_todos()
    return jsonify(todos), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)