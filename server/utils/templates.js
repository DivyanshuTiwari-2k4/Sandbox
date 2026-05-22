import { v4 as uuidv4 } from 'uuid';

function createFile(name, content, parentId = null) {
  const ext = name.split('.').pop().toLowerCase();
  const langMap = {
    'js': 'javascript', 'jsx': 'javascript',
    'ts': 'typescript', 'tsx': 'typescript',
    'html': 'html', 'css': 'css',
    'json': 'json', 'md': 'markdown'
  };
  return {
    id: uuidv4(),
    name,
    type: 'file',
    content,
    language: langMap[ext] || 'plaintext',
    parentId,
    children: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function createFolder(name, parentId = null) {
  return {
    id: uuidv4(),
    name,
    type: 'folder',
    content: '',
    language: 'folder',
    parentId,
    children: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

const TEMPLATES = {
  blank: () => {
    const indexFile = createFile('index.js', '// Start coding here!\nconsole.log("Hello, World!");\n');
    return {
      files: { [indexFile.id]: indexFile },
      activeFileId: indexFile.id
    };
  },

  'html-css': () => {
    const indexHtml = createFile('index.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Hello, World!</h1>
    <p>Edit me to get started.</p>
    <button onclick="greet()">Click Me</button>
  </div>
  <script src="app.js"></script>
</body>
</html>`);

    const stylesCss = createFile('styles.css', `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  text-align: center;
}

h1 { color: #333; margin-bottom: 1rem; }

button {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 1rem;
  transition: transform 0.2s;
}

button:hover { transform: scale(1.05); }`);

    const appJs = createFile('app.js', `function greet() {
  const name = prompt('What is your name?') || 'Developer';
  alert(\`Hello, \${name}! 👋\`);
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('App loaded!');
});`);

    return {
      files: {
        [indexHtml.id]: indexHtml,
        [stylesCss.id]: stylesCss,
        [appJs.id]: appJs
      },
      activeFileId: indexHtml.id
    };
  },

  'vanilla-js': () => {
    const indexHtml = createFile('index.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vanilla JS App</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="app">
    <h1>Counter App</h1>
    <p id="count">0</p>
    <div class="buttons">
      <button id="decrement">-</button>
      <button id="reset">Reset</button>
      <button id="increment">+</button>
    </div>
  </div>
  <script src="main.js"></script>
</body>
</html>`);

    const mainJs = createFile('main.js', `let count = 0;
const countEl = document.getElementById('count');

function updateDisplay() {
  countEl.textContent = count;
  countEl.style.color = count > 0 ? '#4ade80' : count < 0 ? '#f87171' : '#fff';
}

document.getElementById('increment').addEventListener('click', () => {
  count++;
  updateDisplay();
});

document.getElementById('decrement').addEventListener('click', () => {
  count--;
  updateDisplay();
});

document.getElementById('reset').addEventListener('click', () => {
  count = 0;
  updateDisplay();
});`);

    const styleCss = createFile('style.css', `body {
  background: #1a1a2e;
  color: white;
  font-family: 'Segoe UI', sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
}

#app {
  text-align: center;
  background: #16213e;
  padding: 3rem;
  border-radius: 20px;
  box-shadow: 0 25px 50px rgba(0,0,0,0.5);
}

h1 { font-size: 1.5rem; color: #e2e8f0; margin-bottom: 1rem; }

#count {
  font-size: 5rem;
  font-weight: bold;
  margin: 1.5rem 0;
  transition: color 0.3s;
}

.buttons { display: flex; gap: 1rem; justify-content: center; }

button {
  padding: 0.75rem 2rem;
  font-size: 1.5rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  background: #0f3460;
  color: white;
  transition: background 0.2s;
}

button:hover { background: #533483; }`);

    return {
      files: {
        [indexHtml.id]: indexHtml,
        [mainJs.id]: mainJs,
        [styleCss.id]: styleCss
      },
      activeFileId: indexHtml.id
    };
  },

react: () => {
    const indexHtml = createFile('index.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React App</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0f172a; font-family: 'Segoe UI', sans-serif; color: white; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState } = React;

    function App() {
      const [todos, setTodos] = useState([
        { id: 1, text: 'Learn React', done: true },
        { id: 2, text: 'Build something awesome', done: false },
      ]);
      const [input, setInput] = useState('');

      const addTodo = () => {
        if (!input.trim()) return;
        setTodos([...todos, { id: Date.now(), text: input, done: false }]);
        setInput('');
      };

      const toggleTodo = (id) => setTodos(todos.map(t => t.id === id ? {...t, done: !t.done} : t));
      const deleteTodo = (id) => setTodos(todos.filter(t => t.id !== id));

      return (
        <div style={{ maxWidth: '500px', margin: '3rem auto', padding: '0 1rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: '#38bdf8' }}>
            React Todo
          </h1>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTodo()}
              placeholder="Add a todo..."
              style={{
                flex: 1, padding: '0.75rem 1rem', background: '#1e293b',
                border: '1px solid #334155', borderRadius: '8px',
                color: 'white', fontSize: '1rem', outline: 'none'
              }}
            />
            <button onClick={addTodo} style={{
              background: '#38bdf8', border: 'none', color: '#0f172a',
              padding: '0.75rem 1.25rem', borderRadius: '8px',
              cursor: 'pointer', fontWeight: 'bold'
            }}>Add</button>
          </div>
          {todos.map(todo => (
            <div key={todo.id} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.75rem 1rem', background: '#1e293b',
              borderRadius: '8px', marginBottom: '0.5rem'
            }}>
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => toggleTodo(todo.id)}
                style={{ cursor: 'pointer', width: '18px', height: '18px' }}
              />
              <span style={{
                flex: 1,
                textDecoration: todo.done ? 'line-through' : 'none',
                color: todo.done ? '#64748b' : '#e2e8f0'
              }}>{todo.text}</span>
              <button onClick={() => deleteTodo(todo.id)} style={{
                background: '#ef4444', border: 'none', color: 'white',
                borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer'
              }}>×</button>
            </div>
          ))}
          <p style={{ color: '#64748b', marginTop: '1rem', textAlign: 'center' }}>
            {todos.filter(t => t.done).length}/{todos.length} completed
          </p>
        </div>
      );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  </script>
</body>
</html>`);

    return {
      files: {
        [indexHtml.id]: indexHtml,
      },
      activeFileId: indexHtml.id
    };
  },
'node-express': () => {
    const indexHtml = createFile('index.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Node + Express API</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0d1117;
      color: #e6edf3;
      font-family: 'Segoe UI', sans-serif;
      padding: 2rem;
    }
    h1 {
      font-size: 1.5rem;
      color: #58a6ff;
      margin-bottom: 0.5rem;
    }
    .subtitle {
      color: #8b949e;
      font-size: 0.9rem;
      margin-bottom: 2rem;
    }
    .card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 10px;
      padding: 1.5rem;
      margin-bottom: 1rem;
    }
    .card h2 {
      font-size: 1rem;
      color: #3fb950;
      margin-bottom: 1rem;
    }
    .input-row {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    input {
      flex: 1;
      background: #21262d;
      border: 1px solid #30363d;
      color: #e6edf3;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      font-size: 14px;
      outline: none;
    }
    input:focus { border-color: #58a6ff; }
    button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: opacity 0.15s;
    }
    button:hover { opacity: 0.85; }
    .btn-add { background: #238636; color: white; }
    .btn-delete { background: #da3633; color: white; padding: 0.3rem 0.6rem; }
    .btn-toggle { background: #1f6feb; color: white; padding: 0.3rem 0.6rem; }
    .item-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.6rem 0.75rem;
      background: #21262d;
      border-radius: 6px;
      border: 1px solid #30363d;
    }
    .item-name {
      font-size: 14px;
      flex: 1;
    }
    .item-name.done {
      text-decoration: line-through;
      color: #6e7681;
    }
    .item-actions { display: flex; gap: 0.4rem; }
    .endpoint-list { display: flex; flex-direction: column; gap: 0.4rem; }
    .endpoint {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 13px;
      font-family: monospace;
      padding: 0.4rem 0.6rem;
      background: #21262d;
      border-radius: 5px;
    }
    .method {
      font-weight: 700;
      width: 50px;
    }
    .method.get { color: #3fb950; }
    .method.post { color: #58a6ff; }
    .method.put { color: #d29922; }
    .method.delete { color: #f85149; }
    .empty {
      color: #6e7681;
      font-size: 13px;
      text-align: center;
      padding: 1rem;
    }
    .status {
      font-size: 12px;
      padding: 3px 8px;
      border-radius: 4px;
      margin-bottom: 1rem;
    }
    .status.note {
      background: rgba(210,153,34,0.15);
      color: #d29922;
    }
  </style>
</head>
<body>
  <h1>⚡ Node + Express API</h1>
  <p class="subtitle">
    REST API template — view server.js to see the backend code
  </p>

  <div class="card">
    <p class="status note">
      ℹ️ This is a frontend UI demo. 
      The actual Express server runs separately via Node.js.
    </p>
    <h2>📋 Items API — In-Browser Demo</h2>
    <div class="input-row">
      <input id="itemInput" placeholder="Enter item name..." />
      <button class="btn-add" onclick="addItem()">+ Add Item</button>
    </div>
    <div class="item-list" id="itemList">
      <p class="empty">No items yet. Add one above!</p>
    </div>
  </div>

  <div class="card">
    <h2>🔗 API Endpoints</h2>
    <div class="endpoint-list">
      <div class="endpoint">
        <span class="method get">GET</span>
        <span>/api/items</span>
        <span style="color:#6e7681">— Get all items</span>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <span>/api/items</span>
        <span style="color:#6e7681">— Create item</span>
      </div>
      <div class="endpoint">
        <span class="method put">PUT</span>
        <span>/api/items/:id</span>
        <span style="color:#6e7681">— Update item</span>
      </div>
      <div class="endpoint">
        <span class="method delete">DELETE</span>
        <span>/api/items/:id</span>
        <span style="color:#6e7681">— Delete item</span>
      </div>
    </div>
  </div>

  <script>
    let items = [
      { id: 1, name: 'Item One', done: false },
      { id: 2, name: 'Item Two', done: true }
    ]

    function renderItems() {
      const list = document.getElementById('itemList')
      if (items.length === 0) {
        list.innerHTML = '<p class="empty">No items yet. Add one above!</p>'
        return
      }
      list.innerHTML = items.map(item => \`
        <div class="item">
          <span class="item-name \${item.done ? 'done' : ''}">\${item.name}</span>
          <div class="item-actions">
            <button class="btn-toggle" onclick="toggleItem(\${item.id})">
              \${item.done ? 'Undo' : 'Done'}
            </button>
            <button class="btn-delete" onclick="deleteItem(\${item.id})">✕</button>
          </div>
        </div>
      \`).join('')
    }

    function addItem() {
      const input = document.getElementById('itemInput')
      const name = input.value.trim()
      if (!name) return
      items.push({ id: Date.now(), name, done: false })
      input.value = ''
      renderItems()
    }

    function toggleItem(id) {
      items = items.map(i => i.id === id ? { ...i, done: !i.done } : i)
      renderItems()
    }

    function deleteItem(id) {
      items = items.filter(i => i.id !== id)
      renderItems()
    }

    document.getElementById('itemInput').addEventListener('keydown', e => {
      if (e.key === 'Enter') addItem()
    })

    renderItems()
  </script>
</body>
</html>`);

    const serverJs = createFile('server.js', `import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

let items = [
  { id: 1, name: 'Item One', done: false },
  { id: 2, name: 'Item Two', done: true }
];

// GET all items
app.get('/api/items', (req, res) => {
  res.json({ success: true, data: items });
});

// GET single item
app.get('/api/items/:id', (req, res) => {
  const item = items.find(i => i.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true, data: item });
});

// POST create item
app.post('/api/items', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const item = { id: Date.now(), name, done: false };
  items.push(item);
  res.status(201).json({ success: true, data: item });
});

// PUT update item
app.put('/api/items/:id', (req, res) => {
  const idx = items.findIndex(i => i.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  items[idx] = { ...items[idx], ...req.body };
  res.json({ success: true, data: items[idx] });
});

// DELETE item
app.delete('/api/items/:id', (req, res) => {
  items = items.filter(i => i.id !== parseInt(req.params.id));
  res.json({ success: true, message: 'Deleted' });
});

app.listen(PORT, () => {
  console.log(\`Server running on http://localhost:\${PORT}\`);
});`);

    const readmeMd = createFile('README.md', `# Node + Express API

A simple REST API built with Express.js.

## Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | /api/items | Get all items |
| GET | /api/items/:id | Get single item |
| POST | /api/items | Create item |
| PUT | /api/items/:id | Update item |
| DELETE | /api/items/:id | Delete item |

## Run Locally
\`\`\`bash
npm install
npm start
\`\`\``);

    return {
      files: {
        [indexHtml.id]: indexHtml,
        [serverJs.id]: serverJs,
        [readmeMd.id]: readmeMd,
      },
      activeFileId: indexHtml.id
    };
  }
};

export function getTemplateFiles(templateName) {
  const template = TEMPLATES[templateName] || TEMPLATES['blank'];
  return template();
}