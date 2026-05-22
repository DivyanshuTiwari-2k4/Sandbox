import { useRef, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import { X, Circle } from 'lucide-react'
import useStore from '../../store/useStore'
import { getMonacoLanguage } from '../../utils/languageUtils'
import './EditorPanel.css'

// ─── Tab Bar ───────────────────────────────────────────────
function TabBar() {
  const {
    openTabs, activeFileId,
    files, setActiveFile,
    closeTab, unsavedFiles
  } = useStore()

  if (openTabs.length === 0) return null

  return (
    <div className="tab-bar">
      {openTabs.map(tabId => {
        const file = files[tabId]
        if (!file) return null

        const isActive = tabId === activeFileId
        const isUnsaved = unsavedFiles.has(tabId)

        return (
          <div
            key={tabId}
            className={`tab ${isActive ? 'active' : ''}`}
            onClick={() => setActiveFile(tabId)}
          >
            <span className="tab-name">{file.name}</span>

            <button
              className="tab-close"
              onClick={e => {
                e.stopPropagation()
                closeTab(tabId)
              }}
              title="Close tab"
            >
              {isUnsaved
                ? <Circle size={10} fill="currentColor" />
                : <X size={12} />
              }
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ─── Empty State ───────────────────────────────────────────
function EmptyState() {
  return (
    <div className="editor-empty">
      <div className="editor-empty-content">
        <div className="editor-empty-icon">{'</>'}</div>
        <h3>No file open</h3>
        <p>Select a file from the sidebar or create a new one</p>
        <div className="shortcuts-hint">
          <div className="shortcut-row">
            <kbd>Ctrl</kbd><span>+</span><kbd>S</kbd>
            <span className="shortcut-desc">Save file</span>
          </div>
          <div className="shortcut-row">
            <kbd>Ctrl</kbd><span>+</span><kbd>Enter</kbd>
            <span className="shortcut-desc">Run project</span>
          </div>
          <div className="shortcut-row">
            <kbd>Ctrl</kbd><span>+</span><kbd>Shift</kbd><span>+</span><kbd>S</kbd>
            <span className="shortcut-desc">Save all</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Editor Panel ──────────────────────────────────────────
export default function EditorPanel() {
  const {
    files, activeFileId,
    updateFileContent, saveFile,
    currentProject, buildPreview,
    unsavedFiles
  } = useStore()

  const editorRef = useRef(null)
  const activeFile = activeFileId ? files[activeFileId] : null
  const settings = currentProject?.settings || {}

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor

    // Monaco editor theme
    monaco.editor.defineTheme('sandboxDark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6e7681', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff7b72' },
        { token: 'string', foreground: 'a5d6ff' },
        { token: 'number', foreground: '79c0ff' },
        { token: 'type', foreground: 'ffa657' },
        { token: 'function', foreground: 'd2a8ff' },
        { token: 'variable', foreground: 'e6edf3' },
        { token: 'operator', foreground: 'ff7b72' },
      ],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#e6edf3',
        'editor.lineHighlightBackground': '#161b22',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#1f3451',
        'editorLineNumber.foreground': '#6e7681',
        'editorLineNumber.activeForeground': '#e6edf3',
        'editorCursor.foreground': '#58a6ff',
        'editorWhitespace.foreground': '#21262d',
        'editorIndentGuide.background': '#21262d',
        'editorIndentGuide.activeBackground': '#30363d',
        'editor.findMatchBackground': '#9e6a03',
        'editor.findMatchHighlightBackground': '#9e6a0388',
        'editorBracketMatch.background': '#17e5e633',
        'editorBracketMatch.border': '#17e5e6',
        'scrollbarSlider.background': '#30363d88',
        'scrollbarSlider.hoverBackground': '#484f58aa',
        'scrollbarSlider.activeBackground': '#6e7681aa',
        'editorGutter.background': '#0d1117',
        'minimap.background': '#0d1117',
      }
    })

    monaco.editor.setTheme('sandboxDark')

    // Emmet-like shortcuts
    editor.addAction({
      id: 'save-file',
      label: 'Save File',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: async () => {
        if (activeFileId) {
          await saveFile(activeFileId)
        }
      }
    })
  }

  const handleChange = useCallback((value) => {
    if (!activeFileId || value === undefined) return
    updateFileContent(activeFileId, value)

    // Auto-refresh preview if autoSave is on
    if (settings.autoSave !== false) {
      buildPreview()
    }
  }, [activeFileId, settings.autoSave])

  if (!activeFile) {
    return (
      <div className="editor-panel">
        <TabBar />
        <EmptyState />
      </div>
    )
  }

  return (
    <div className="editor-panel">
      <TabBar />

      {/* File info bar */}
      <div className="editor-info-bar">
        <span className="editor-filename">{activeFile.name}</span>
        <span className="editor-language">{activeFile.language}</span>
        {unsavedFiles.has(activeFileId) && (
          <span className="editor-unsaved">● unsaved</span>
        )}
      </div>

      {/* Monaco Editor */}
      <div className="editor-wrapper">
        <Editor
          key={activeFileId}
          value={activeFile.content || ''}
          language={getMonacoLanguage(activeFile.language)}
          onChange={handleChange}
          onMount={handleEditorDidMount}
          options={{
            fontSize: settings.fontSize || 14,
            tabSize: settings.tabSize || 2,
            wordWrap: settings.wordWrap !== false ? 'on' : 'off',
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            formatOnPaste: true,
            formatOnType: true,
            autoIndent: 'full',
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true,
            },
            suggest: {
              showKeywords: true,
              showSnippets: true,
            },
            quickSuggestions: {
              other: true,
              comments: false,
              strings: false,
            },
            padding: { top: 12, bottom: 12 },
            lineNumbers: 'on',
            glyphMargin: false,
            folding: true,
            links: true,
            contextmenu: true,
            multiCursorModifier: 'alt',
            renderWhitespace: 'selection',
            renderLineHighlight: 'line',
            scrollbar: {
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6,
            }
          }}
          loading={
            <div className="editor-loading">
              <div className="spinner" />
              <span>Loading editor...</span>
            </div>
          }
        />
      </div>
    </div>
  )
}