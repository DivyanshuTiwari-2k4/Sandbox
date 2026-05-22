# SandboxIDE 🚀

A browser-based developer assessment environment built with the MERN stack. Candidates can write, run, and preview code entirely from the browser — no local setup required.

---

## Live Demo

> Run locally following the setup instructions below.

---

## Features

- **Monaco Editor** — VS Code's editor in the browser with syntax highlighting, autocomplete, and bracket matching
- **Live Preview** — Instant HTML/CSS/JS preview in a sandboxed iframe with viewport switching (Desktop / Tablet / Mobile)
- **File System** — Create, rename, delete files and folders with a tree-based sidebar
- **Project Templates** — Blank, HTML+CSS, Vanilla JS, React, Node+Express starter templates
- **Real-time Sync** — Socket.io powered live updates across sessions
- **Package Manager** — Track and install npm packages per project
- **Terminal** — Simulated terminal with command history and tab completion
- **Session Persistence** — All projects and files stored in MongoDB
- **Keyboard Shortcuts** — `Ctrl+S` save, `Ctrl+Enter` run, `Ctrl+Shift+S` save all
- **Resizable Panels** — Drag to resize editor, preview, and terminal panels

---

## Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Project and file persistence |
| Socket.io | Real-time file sync and terminal |
| UUID | Unique file IDs |

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 19 + Vite | UI framework and build tool |
| Zustand | Global state management |
| Monaco Editor | VS Code-powered code editor |
| Socket.io Client | Real-time communication |
| React Resizable Panels | Draggable split-panel layout |
| Lucide React | Icon library |
| React Toastify | Toast notifications |
| React Hotkeys Hook | Keyboard shortcuts |
| Axios | HTTP client |

---

## Architecture

```
Sandbox/
├── server/                   # Express backend
│   ├── index.js              # Entry point, Socket.io setup
│   ├── models/
│   │   └── Project.js        # MongoDB schema
│   ├── routes/
│   │   ├── projects.js       # CRUD for projects
│   │   ├── files.js          # CRUD for files within projects
│   │   └── packages.js       # Package install/uninstall
│   └── utils/
│       ├── socketHandlers.js  # Real-time event handlers
│       ├── templates.js       # Starter project templates
│       └── languageDetector.js # File extension → language mapping
│
└── client/                   # React + Vite frontend
    └── src/
        ├── components/
        │   ├── Dashboard/     # Project listing and creation
        │   ├── IDE/           # Main IDE layout with resizable panels
        │   ├── Editor/        # Monaco editor + tab bar
        │   ├── Preview/       # Sandboxed iframe preview
        │   ├── Terminal/      # Simulated terminal
        │   ├── Sidebar/       # File tree, packages, settings
        │   └── Toolbar/       # Run, save, toggle buttons
        ├── store/
        │   └── useStore.js    # Zustand global state
        └── utils/
            ├── api.js         # Axios instance
            ├── socket.js      # Socket.io client
            └── languageUtils.js # Language colors and Monaco mapping
```

### Data Model

Files are embedded inside the Project document as a MongoDB Map — no separate collection needed:

```
Project {
  name, description, template, settings
  activeFileId
  installedPackages []
  files: Map {
    "uuid": { id, name, type, content, language, parentId, children[] }
  }
}
```

This means one DB read loads the entire project — no joins, no waterfalls.

### Preview Engine

The preview works by injecting all CSS and JS files inline into `index.html` and rendering it inside a sandboxed `<iframe>` using `srcDoc`. This approach:

- Works entirely in the browser — no server-side execution
- Supports HTML, CSS, JS, and React (via Babel CDN)
- Auto-refreshes on code changes when autoSave is enabled

---

## Setup Instructions

### Prerequisites
- Node.js v20.19+ 
- MongoDB (local or Atlas)

### 1. Clone and install

```bash
git clone <repo-url>
cd Sandbox
```

**Install server dependencies:**
```bash
cd server
npm install
```

**Install client dependencies:**
```bash
cd client
npm install
```

### 2. Configure environment

Create `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sandbox-ide
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Run the application

**Terminal 1 — Backend:**
```bash
cd server
node index.js
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## API Reference

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects |
| GET | `/api/projects/:id` | Get single project |
| POST | `/api/projects` | Create project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/projects/:id/duplicate` | Duplicate project |

### Files
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/files/:projectId` | Get all files |
| POST | `/api/files/:projectId` | Create file or folder |
| PUT | `/api/files/:projectId/:fileId` | Update file content or name |
| DELETE | `/api/files/:projectId/:fileId` | Delete file or folder |
| POST | `/api/files/:projectId/:fileId/move` | Move or rename file |

### Packages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/packages/:projectId` | Get installed packages |
| POST | `/api/packages/:projectId/install` | Install package |
| DELETE | `/api/packages/:projectId/:name` | Uninstall package |

### Socket Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `project:join` | Client → Server | Join project room |
| `file:change` | Client → Server | Broadcast file edit |
| `file:changed` | Server → Client | Receive file edit |
| `terminal:command` | Client → Server | Run terminal command |
| `terminal:output` | Server → Client | Receive command output |
| `package:installing` | Server → Client | Package install started |
| `package:installed` | Server → Client | Package install complete |

---

## AI Usage Strategy

AI (Claude) was used throughout this project as a **force multiplier**, not a replacement for engineering judgment. Here is specifically how:

### Where AI accelerated development

**1. Boilerplate generation**
Generating repetitive but correct code: Express route patterns, Mongoose schema definitions, Socket.io event handler structure, and CSS variable systems. This saved hours of typing without sacrificing understanding.

**2. Template content**
The five starter project templates (React Todo, Vanilla Counter, HTML+CSS landing page, Node API, Blank) were generated with AI and then validated manually to ensure they work correctly inside the iframe preview sandbox.

**3. Preview engine logic**
The CSS/JS injection logic in `buildPreview()` — parsing HTML and replacing `<link>` and `<script src="">` tags with inline content — was designed collaboratively with AI, then debugged manually when edge cases appeared.

**4. Monaco editor configuration**
The custom `sandboxDark` theme token colors and editor options were generated with AI assistance and tweaked manually for readability.

### Where I reasoned through things myself

**1. Architecture decisions**
Choosing to embed files inside the Project document as a MongoDB Map (rather than a separate Files collection) was a deliberate tradeoff I evaluated: one read loads everything, atomic saves, simpler queries — at the cost of document size limits (16MB BSON max).

**2. Real-time sync strategy**
Deciding to use Socket.io rooms (`project:${id}`) so only users in the same project receive updates — not all connected clients. This required understanding Socket.io's room model.

**3. Preview sandboxing**
Choosing `srcDoc` + `sandbox` attribute on the iframe over a blob URL approach. The `sandbox="allow-scripts allow-same-origin"` attribute set was carefully chosen to allow JS execution while preventing navigation hijacking.

**4. State management structure**
Designing the Zustand store shape — what goes in global state vs local component state, how to handle the `unsavedFiles` Set, and how `buildPreview` reads from state without being passed files as a parameter.

**5. Debugging**
All runtime bugs (React 19 peer dependency conflicts, Vite Node version requirement, MongoDB Map serialization, iframe preview timing) were debugged manually by reading error messages and understanding root causes.

---

## Technical Tradeoffs

### 1. Files embedded in Project document vs separate collection

**Chosen:** Embed files as a MongoDB Map inside Project

| Pros | Cons |
|------|------|
| Single DB read loads entire project | 16MB BSON document size limit |
| Atomic saves | Large projects with many files could hit limit |
| No joins needed | Harder to query individual files globally |
| Simpler data model | |

### 2. Client-side preview (iframe srcDoc) vs server-side execution

**Chosen:** Client-side iframe with inline injection

| Pros | Cons |
|------|------|
| Zero server load for preview | Cannot run Node.js/backend code |
| Instant refresh | Limited to browser-compatible code |
| No sandboxing infrastructure needed | No real npm package execution |
| Works offline | |

### 3. Zustand vs Redux for state management

**Chosen:** Zustand

| Pros | Cons |
|------|------|
| Minimal boilerplate | Less ecosystem tooling |
| Built-in subscribeWithSelector | Smaller community vs Redux |
| Easy async actions | |
| Works perfectly with React 19 | |

### 4. Vite vs Create React App

**Chosen:** Vite

| Pros | Cons |
|------|------|
| Near-instant HMR | Requires Node v20.19+ |
| ES Module native | Newer, less Stack Overflow answers |
| Smaller bundle output | |
| Active development | |

---

## Known Limitations

### Preview
- **No real npm execution** — packages are tracked in the DB but the preview uses CDN links. True `npm install` requires a container runtime (e.g. WebContainers, Docker).
- **No Node.js preview** — Express/Node projects show a frontend UI demo, not the actual running server.
- **React JSX in separate files** — External `.jsx` files cannot be loaded by the iframe. All React code must be inline in `index.html` using Babel standalone.
- **No CSS preprocessors** — SCSS/LESS files are treated as plain CSS in the preview.

### Editor
- **No IntelliSense for npm packages** — Monaco only has built-in type definitions. Package-specific types are not loaded.
- **No multi-cursor collaboration** — Only one user edits at a time. Real-time cursors are broadcast but not rendered.

### Terminal
- **Simulated only** — The terminal is a UI simulation. Commands do not actually execute on a real shell. For real execution, integration with WebContainers or a Docker container would be needed.

### Storage
- **No authentication** — All projects are shared globally. A real assessment platform would need user accounts and project isolation.
- **16MB document limit** — Very large projects with many files could hit MongoDB's BSON document size limit.
- **No file upload** — Binary files (images, fonts) cannot be uploaded to the editor.

### Deployment
- **CORS configuration** — The `CLIENT_URL` env variable must be set correctly for production deployment.
- **Socket.io sticky sessions** — For multi-server deployment, sticky sessions or Redis adapter would be required.

---

## Future Improvements

- **WebContainers integration** — Run real Node.js in the browser using StackBlitz's WebContainers API
- **User authentication** — JWT-based auth with project ownership
- **AI code assistant** — Inline AI suggestions using the Anthropic API
- **File upload** — Support for binary assets (images, fonts)
- **Git integration** — Commit history and branch management
- **Collaborative cursors** — Show other users' cursor positions in real time
- **Custom domains** — Deploy previews to shareable URLs
- **Test runner** — Run Jest/Vitest tests in the browser

---

## Project Structure Summary

```
Total files created:     ~35
Backend files:           12
Frontend files:          23
Lines of code:           ~3500
Time to build:           Structured MERN development session
AI assistance:           Claude (Anthropic) — code generation + debugging
```
