import { useState, useEffect } from 'react'
import {
  ChevronLeft, Play, Save, Terminal,
  Eye, EyeOff, PanelLeft, RotateCcw,
  Wifi, WifiOff, Code
} from 'lucide-react'
import { toast } from 'react-toastify'
import useStore from '../../store/useStore'
import socket from '../../utils/socket'
import './Toolbar.css'

export default function Toolbar({ onBack }) {
  const {
    currentProject,
    runProject,
    saveAllFiles,
    unsavedFiles,
    showTerminal,
    showPreview,
    toggleTerminal,
    togglePreview,
    toggleSidebar,
    isSidebarCollapsed,
    buildPreview,
  } = useStore()

  const [isConnected, setIsConnected] = useState(socket.connected)
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    const onConnect = () => setIsConnected(true)
    const onDisconnect = () => setIsConnected(false)
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, [])

  const handleRun = () => {
    setRunning(true)
    runProject()
    toast.success('▶ Running project', { autoClose: 1000 })
    setTimeout(() => setRunning(false), 500)
  }

  const handleSave = async () => {
    if (unsavedFiles.size === 0) {
      return toast.info('All files already saved', { autoClose: 1500 })
    }
    setSaving(true)
    try {
      await saveAllFiles()
      toast.success('✓ All files saved', { autoClose: 1000 })
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="toolbar">
      {/* Left */}
      <div className="toolbar-left">
        <button
          className="toolbar-btn"
          onClick={onBack}
          title="Back to Dashboard"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="toolbar-divider" />

        <button
          className="toolbar-btn"
          onClick={toggleSidebar}
          title="Toggle Sidebar"
        >
          <PanelLeft size={16} />
        </button>

        <div className="project-name-area">
          <Code size={14} />
          <span className="project-title">
            {currentProject?.name || 'Untitled'}
          </span>
          {unsavedFiles.size > 0 && (
            <span
              className="unsaved-dot"
              title={`${unsavedFiles.size} unsaved file(s)`}
            >
              ●
            </span>
          )}
        </div>
      </div>

      {/* Center */}
      <div className="toolbar-center">
        <button
          className="toolbar-btn run-btn"
          onClick={handleRun}
          disabled={running}
          title="Run Project (Ctrl+Enter)"
        >
          <Play size={14} fill="currentColor" />
          {running ? 'Running...' : 'Run'}
        </button>

        <button
          className="toolbar-btn"
          onClick={handleSave}
          disabled={saving}
          title="Save All (Ctrl+Shift+S)"
        >
          <Save size={14} />
          {saving ? 'Saving...' : 'Save'}
        </button>

        <button
          className="toolbar-btn"
          onClick={buildPreview}
          title="Refresh Preview"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Right */}
      <div className="toolbar-right">
        <div
          className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}
          title={isConnected ? 'Connected' : 'Disconnected'}
        >
          {isConnected
            ? <Wifi size={13} />
            : <WifiOff size={13} />
          }
          <span>{isConnected ? 'Live' : 'Offline'}</span>
        </div>

        <div className="toolbar-divider" />

        <button
          className={`toolbar-btn ${showTerminal ? 'active' : ''}`}
          onClick={toggleTerminal}
          title="Toggle Terminal"
        >
          <Terminal size={14} />
          Terminal
        </button>

        <button
          className={`toolbar-btn ${showPreview ? 'active' : ''}`}
          onClick={togglePreview}
          title="Toggle Preview"
        >
          {showPreview ? <Eye size={14} /> : <EyeOff size={14} />}
          Preview
        </button>
      </div>
    </div>
  )
}