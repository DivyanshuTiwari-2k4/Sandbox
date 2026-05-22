import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import api from '../utils/api'
import socket from '../utils/socket'

const useStore = create(
  subscribeWithSelector((set, get) => ({

    // ─── Projects ─────────────────────────────────────────
    projects: [],
    currentProject: null,
    projectsLoading: false,
    projectError: null,

    fetchProjects: async () => {
      set({ projectsLoading: true, projectError: null })
      try {
        const res = await api.get('/projects')
        set({ projects: res.data.data, projectsLoading: false })
      } catch (err) {
        set({ projectError: err.message, projectsLoading: false })
      }
    },

loadProject: async (projectId) => {
  set({ projectsLoading: true })
  try {
    const res = await api.get(`/projects/${projectId}`)
    const project = res.data.data
    const filesList = Object.values(project.files || {})
    const firstFile = filesList.find(f => f.type === 'file')

    // Set everything first
    set({
      currentProject: project,
      files: project.files || {},
      activeFileId: project.activeFileId || firstFile?.id || null,
      openTabs: project.activeFileId
        ? [project.activeFileId]
        : firstFile ? [firstFile.id] : [],
      projectsLoading: false
    })

    socket.emit('project:join', { projectId })

    // Wait for state to settle then build preview
    setTimeout(() => {
      const { files } = get()
      console.log('Files loaded:', Object.keys(files).length)
      get().buildPreview()
    }, 800)

  } catch (err) {
    set({ projectError: err.message, projectsLoading: false })
  }
},

    createProject: async (name, template, description = '') => {
      try {
        const res = await api.post('/projects', { name, template, description })
        const project = res.data.data
        set(state => ({ projects: [project, ...state.projects] }))
        return project
      } catch (err) {
        throw err
      }
    },

    updateProject: async (updates) => {
      const { currentProject } = get()
      if (!currentProject) return
      try {
        await api.put(`/projects/${currentProject._id}`, updates)
        set(state => ({
          currentProject: { ...state.currentProject, ...updates }
        }))
      } catch (err) {
        console.error('Failed to update project:', err)
      }
    },

    deleteProject: async (projectId) => {
      try {
        await api.delete(`/projects/${projectId}`)
        set(state => ({
          projects: state.projects.filter(p => p._id !== projectId),
          ...(state.currentProject?._id === projectId ? {
            currentProject: null,
            files: {},
            activeFileId: null,
            openTabs: []
          } : {})
        }))
      } catch (err) {
        throw err
      }
    },

    // ─── Files ────────────────────────────────────────────
    files: {},
    activeFileId: null,
    openTabs: [],
    unsavedFiles: new Set(),

    setActiveFile: async (fileId) => {
      const { openTabs, currentProject } = get()
      set({
        activeFileId: fileId,
        openTabs: openTabs.includes(fileId)
          ? openTabs
          : [...openTabs, fileId]
      })
      if (currentProject) {
        await api.put(`/projects/${currentProject._id}`, {
          activeFileId: fileId
        }).catch(() => {})
      }
    },

    closeTab: (fileId) => {
      const { openTabs, activeFileId } = get()
      const newTabs = openTabs.filter(id => id !== fileId)
      let newActive = activeFileId
      if (activeFileId === fileId) {
        const idx = openTabs.indexOf(fileId)
        newActive = newTabs[Math.max(0, idx - 1)] || newTabs[0] || null
      }
      set({ openTabs: newTabs, activeFileId: newActive })
    },

    createFile: async (name, type = 'file', parentId = null) => {
      const { currentProject } = get()
      if (!currentProject) return
      try {
        const res = await api.post(`/files/${currentProject._id}`, {
          name, type, parentId
        })
        const newFile = res.data.data
        set(state => ({
          files: { ...state.files, [newFile.id]: newFile },
          ...(type === 'file' ? {
            activeFileId: newFile.id,
            openTabs: [...state.openTabs, newFile.id]
          } : {})
        }))
        return newFile
      } catch (err) {
        throw err
      }
    },

    updateFileContent: (fileId, content) => {
      const { currentProject } = get()
      if (!currentProject) return

      set(state => ({
        files: {
          ...state.files,
          [fileId]: { ...state.files[fileId], content }
        },
        unsavedFiles: new Set([...state.unsavedFiles, fileId])
      }))

      // Emit real-time change via socket
      socket.emit('file:change', {
        projectId: currentProject._id,
        fileId,
        content
      })
    },

    saveFile: async (fileId) => {
      const { currentProject, files } = get()
      if (!currentProject || !files[fileId]) return
      try {
        await api.put(`/files/${currentProject._id}/${fileId}`, {
          content: files[fileId].content
        })
        set(state => {
          const newUnsaved = new Set(state.unsavedFiles)
          newUnsaved.delete(fileId)
          return { unsavedFiles: newUnsaved }
        })
      } catch (err) {
        throw err
      }
    },

    saveAllFiles: async () => {
      const { unsavedFiles, saveFile } = get()
      await Promise.all([...unsavedFiles].map(id => saveFile(id)))
    },

    renameFile: async (fileId, newName) => {
      const { currentProject } = get()
      if (!currentProject) return
      try {
        const res = await api.put(
          `/files/${currentProject._id}/${fileId}`,
          { name: newName }
        )
        set(state => ({
          files: { ...state.files, [fileId]: res.data.data }
        }))
      } catch (err) {
        throw err
      }
    },

    deleteFile: async (fileId) => {
      const { currentProject } = get()
      if (!currentProject) return
      try {
        const res = await api.delete(
          `/files/${currentProject._id}/${fileId}`
        )
        const { deletedIds } = res.data.data
        set(state => {
          const newFiles = { ...state.files }
          deletedIds.forEach(id => delete newFiles[id])
          const newTabs = state.openTabs.filter(
            id => !deletedIds.includes(id)
          )
          return {
            files: newFiles,
            openTabs: newTabs,
            activeFileId: deletedIds.includes(state.activeFileId)
              ? newTabs[0] || null
              : state.activeFileId
          }
        })
      } catch (err) {
        throw err
      }
    },

    // ─── Preview ──────────────────────────────────────────
    previewContent: '',
    isRunning: false,
    previewKey: 0,

    buildPreview: () => {
        const { files } = get()
  const allFiles = Object.values(files)

  console.log('Building preview, total files:', allFiles.length)
  console.log('File names:', allFiles.map(f => f.name))

  const indexHtml = allFiles.find(
    f => f.name === 'index.html' && f.type === 'file'
  )

  console.log('Found index.html:', !!indexHtml)
      if (!indexHtml) {
        const jsFiles = allFiles.filter(
          f => f.type === 'file' &&
          (f.language === 'javascript' || f.name.endsWith('.js'))
        )
        if (jsFiles.length === 0) {
          set({ previewContent: '', isRunning: false })
          return
        }
        const jsContent = jsFiles.map(f => f.content).join('\n\n')
        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { 
      background: #1a1a2e; 
      color: #e2e8f0; 
      font-family: monospace; 
      padding: 1rem; 
    }
    .console-output { 
      background: #0d1117; 
      border-radius: 8px; 
      padding: 0.5rem 1rem; 
      margin: 0.35rem 0;
      border-left: 3px solid #30363d;
    }
    .log { color: #e2e8f0; }
    .error { color: #f85149; }
    .warn { color: #d29922; }
    .info { color: #58a6ff; }
  </style>
</head>
<body>
  <div id="output"></div>
  <script>
    const outputEl = document.getElementById('output');
    
    function addOutput(args, cls) {
      const div = document.createElement('div');
      div.className = 'console-output';
      div.innerHTML = '<span class="' + cls + '">' + 
        args.map(a => {
          try { 
            return typeof a === 'object' 
              ? JSON.stringify(a, null, 2) 
              : String(a); 
          } catch(e) { return String(a); }
        }).join(' ') + '</span>';
      outputEl.appendChild(div);
    }

    console.log = (...args) => addOutput(args, 'log');
    console.error = (...args) => addOutput(args, 'error');
    console.warn = (...args) => addOutput(args, 'warn');
    console.info = (...args) => addOutput(args, 'info');

    window.onerror = (msg, src, line, col, err) => {
      addOutput([err ? err.message : msg], 'error');
      return false;
    };

    try {
      ${jsContent}
    } catch(e) {
      addOutput([e.message], 'error');
    }
  </script>
</body>
</html>`
        set({ 
          previewContent: html, 
          isRunning: true, 
          previewKey: get().previewKey + 1 
        })
        return
      }

      // Inject CSS and JS into HTML
      let html = indexHtml.content

      // Inject CSS
      const cssFiles = allFiles.filter(
        f => f.type === 'file' && 
        (f.language === 'css' || f.name.endsWith('.css'))
      )
      cssFiles.forEach(cssFile => {
        const linkRegex = new RegExp(
          `<link[^>]*href=["']${cssFile.name}["'][^>]*>`, 'gi'
        )
        html = html.replace(
          linkRegex,
          `<style>/* ${cssFile.name} */\n${cssFile.content}</style>`
        )
      })

      // Inject JS
      const jsFiles = allFiles.filter(
        f => f.type === 'file' &&
        (f.language === 'javascript' || 
          f.name.endsWith('.js') || 
          f.name.endsWith('.jsx')) &&
        f.name !== 'server.js'
      )
      jsFiles.forEach(jsFile => {
        const scriptRegex = new RegExp(
          `<script[^>]*src=["']${jsFile.name}["'][^>]*><\/script>`, 'gi'
        )
        html = html.replace(
          scriptRegex,
          `<script>/* ${jsFile.name} */\n${jsFile.content}</script>`
        )
      })

      set({ 
        previewContent: html, 
        isRunning: true, 
        previewKey: get().previewKey + 1 
      })
    },

    runProject: () => {
      get().buildPreview()
    },

    // ─── Terminal ─────────────────────────────────────────
    terminalLines: [
      { type: 'info', text: '🚀 SandboxIDE Terminal v1.0.0' },
      { type: 'info', text: 'Type "help" for available commands.' },
    ],

    addTerminalLine: (line) => {
      set(state => ({
        terminalLines: [...state.terminalLines, line]
      }))
    },

    clearTerminal: () => {
      set({ terminalLines: [] })
    },

    // ─── Packages ─────────────────────────────────────────
    installedPackages: [],

    fetchPackages: async (projectId) => {
      try {
        const res = await api.get(`/packages/${projectId}`)
        set({ installedPackages: res.data.data })
      } catch (err) {
        console.error('Failed to fetch packages:', err)
      }
    },

    installPackage: async (packageName) => {
      const { currentProject } = get()
      if (!currentProject) return
      try {
        const res = await api.post(
          `/packages/${currentProject._id}/install`,
          { packageName }
        )
        set(state => ({
          installedPackages: [
            ...state.installedPackages.filter(p => p.name !== packageName),
            res.data.data
          ]
        }))
        return res.data
      } catch (err) {
        throw err
      }
    },

    uninstallPackage: async (packageName) => {
      const { currentProject } = get()
      if (!currentProject) return
      try {
        await api.delete(
          `/packages/${currentProject._id}/${packageName}`
        )
        set(state => ({
          installedPackages: state.installedPackages.filter(
            p => p.name !== packageName
          )
        }))
      } catch (err) {
        throw err
      }
    },

    // ─── UI State ─────────────────────────────────────────
    sidebarTab: 'files',
    showTerminal: true,
    showPreview: true,
    isSidebarCollapsed: false,

    setSidebarTab: (tab) => set({ sidebarTab: tab }),
    toggleTerminal: () => set(state => ({ 
      showTerminal: !state.showTerminal 
    })),
    togglePreview: () => set(state => ({ 
      showPreview: !state.showPreview 
    })),
    toggleSidebar: () => set(state => ({ 
      isSidebarCollapsed: !state.isSidebarCollapsed 
    })),

    // ─── Socket Handlers ──────────────────────────────────
    handleSocketFileChanged: (data) => {
      const { fileId, content } = data
      set(state => ({
        files: {
          ...state.files,
          [fileId]: { ...state.files[fileId], content }
        }
      }))
    },

    handleSocketFileCreated: (data) => {
      const { file } = data
      set(state => ({ 
        files: { ...state.files, [file.id]: file } 
      }))
    },

    handleSocketFileDeleted: (data) => {
      const { deletedIds } = data
      set(state => {
        const newFiles = { ...state.files }
        deletedIds.forEach(id => delete newFiles[id])
        return { files: newFiles }
      })
    }
  }))
)

export default useStore