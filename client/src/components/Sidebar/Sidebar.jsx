import { useState, useRef, useEffect } from 'react'
import {
  Files, Package, Settings, ChevronRight, ChevronDown,
  FilePlus, FolderPlus, Trash2, Edit3, Download, X
} from 'lucide-react'
import { toast } from 'react-toastify'
import useStore from '../../store/useStore'
import { getLanguageColor } from '../../utils/languageUtils'
import './Sidebar.css'

// ─── File Tree Item ────────────────────────────────────────
function FileTreeItem({ file, files, depth = 0 }) {
  const {
    activeFileId, setActiveFile,
    createFile, deleteFile, renameFile
  } = useStore()

  const [isOpen, setIsOpen] = useState(true)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(file.name)
  const [showNewFile, setShowNewFile] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newName, setNewName] = useState('')
  const renameRef = useRef(null)

  const isActive = activeFileId === file.id
  const isFolder = file.type === 'folder'
  const children = isFolder
    ? (file.children || []).map(id => files[id]).filter(Boolean)
    : []

  useEffect(() => {
    if (isRenaming && renameRef.current) {
      renameRef.current.focus()
      renameRef.current.select()
    }
  }, [isRenaming])

  const handleClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen)
    } else {
      setActiveFile(file.id)
    }
  }

  const handleRename = async () => {
    if (!renameValue.trim() || renameValue === file.name) {
      setIsRenaming(false)
      return
    }
    try {
      await renameFile(file.id, renameValue)
      toast.success(`Renamed to "${renameValue}"`)
    } catch (err) {
      toast.error('Rename failed: ' + err.message)
    }
    setIsRenaming(false)
  }

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!window.confirm(`Delete "${file.name}"?`)) return
    try {
      await deleteFile(file.id)
      toast.success(`Deleted "${file.name}"`)
    } catch (err) {
      toast.error('Delete failed: ' + err.message)
    }
  }

  const handleCreateNew = async (type) => {
    if (!newName.trim()) return
    try {
      await createFile(newName, type, file.id)
      setNewName('')
      setShowNewFile(false)
      setShowNewFolder(false)
      if (!isOpen) setIsOpen(true)
    } catch (err) {
      toast.error('Failed: ' + err.message)
    }
  }

  const langColor = isFolder
    ? '#58a6ff'
    : getLanguageColor(file.language)

  return (
    <div className="file-tree-item-wrapper">
      {/* File / Folder Row */}
      <div
        className={`file-tree-item ${isActive && !isFolder ? 'active' : ''}`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
        {/* Folder arrow */}
        {isFolder && (
          <span className="folder-arrow">
            {isOpen
              ? <ChevronDown size={12} />
              : <ChevronRight size={12} />}
          </span>
        )}

        {/* Language color dot */}
        <span
          className="file-color-dot"
          style={{ background: langColor }}
        />

        {/* Name or rename input */}
        {isRenaming ? (
          <input
            ref={renameRef}
            className="inline-input"
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={e => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') setIsRenaming(false)
            }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className="file-name">{file.name}</span>
        )}

        {/* Action buttons */}
        <div
          className="file-item-actions"
          onClick={e => e.stopPropagation()}
        >
          {isFolder && (
            <>
              <button
                className="file-action-btn"
                title="New File"
                onClick={() => {
                  setShowNewFile(true)
                  setShowNewFolder(false)
                }}
              >
                <FilePlus size={12} />
              </button>
              <button
                className="file-action-btn"
                title="New Folder"
                onClick={() => {
                  setShowNewFolder(true)
                  setShowNewFile(false)
                }}
              >
                <FolderPlus size={12} />
              </button>
            </>
          )}
          <button
            className="file-action-btn"
            title="Rename"
            onClick={e => {
              e.stopPropagation()
              setIsRenaming(true)
              setRenameValue(file.name)
            }}
          >
            <Edit3 size={12} />
          </button>
          <button
            className="file-action-btn danger"
            title="Delete"
            onClick={handleDelete}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* New file/folder input inside folder */}
      {(showNewFile || showNewFolder) && (
        <div style={{ paddingLeft: `${(depth + 1) * 12 + 8}px`, padding: '4px 8px' }}>
          <input
            className="inline-input"
            placeholder={showNewFile ? 'filename.js' : 'folder-name'}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') {
                handleCreateNew(showNewFile ? 'file' : 'folder')
              }
              if (e.key === 'Escape') {
                setShowNewFile(false)
                setShowNewFolder(false)
                setNewName('')
              }
            }}
            onBlur={() => {
              setTimeout(() => {
                setShowNewFile(false)
                setShowNewFolder(false)
                setNewName('')
              }, 150)
            }}
          />
        </div>
      )}

      {/* Render children */}
      {isFolder && isOpen && children.map(child => (
        <FileTreeItem
          key={child.id}
          file={child}
          files={files}
          depth={depth + 1}
        />
      ))}
    </div>
  )
}

// ─── Files Tab ─────────────────────────────────────────────
function FilesTab() {
  const { files, createFile } = useStore()
  const [showNewFile, setShowNewFile] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newName, setNewName] = useState('')

  const rootFiles = Object.values(files).filter(f => !f.parentId)

  const handleCreate = async (type) => {
    if (!newName.trim()) return
    try {
      await createFile(newName, type, null)
      setNewName('')
      setShowNewFile(false)
      setShowNewFolder(false)
    } catch (err) {
      toast.error('Failed: ' + err.message)
    }
  }

  return (
    <div className="files-tab">
      {/* Header */}
      <div className="panel-section-header">
        <span>FILES</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            className="file-action-btn"
            title="New File"
            onClick={() => {
              setShowNewFile(true)
              setShowNewFolder(false)
            }}
          >
            <FilePlus size={13} />
          </button>
          <button
            className="file-action-btn"
            title="New Folder"
            onClick={() => {
              setShowNewFolder(true)
              setShowNewFile(false)
            }}
          >
            <FolderPlus size={13} />
          </button>
        </div>
      </div>

      {/* New root file/folder input */}
      {(showNewFile || showNewFolder) && (
        <div style={{ padding: '4px 8px' }}>
          <input
            className="inline-input"
            placeholder={showNewFile ? 'filename.js' : 'folder-name'}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') {
                handleCreate(showNewFile ? 'file' : 'folder')
              }
              if (e.key === 'Escape') {
                setShowNewFile(false)
                setShowNewFolder(false)
                setNewName('')
              }
            }}
            onBlur={() => {
              setTimeout(() => {
                setShowNewFile(false)
                setShowNewFolder(false)
                setNewName('')
              }, 150)
            }}
          />
        </div>
      )}

      {/* File Tree */}
      <div className="file-tree">
        {rootFiles.length === 0 ? (
          <p className="empty-hint">
            No files yet. Click + to create.
          </p>
        ) : (
          rootFiles.map(file => (
            <FileTreeItem
              key={file.id}
              file={file}
              files={files}
              depth={0}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Packages Tab ──────────────────────────────────────────
function PackagesTab() {
  const {
    installedPackages,
    installPackage,
    uninstallPackage,
    currentProject,
    fetchPackages
  } = useStore()

  const [query, setQuery] = useState('')
  const [installing, setInstalling] = useState('')

  useEffect(() => {
    if (currentProject) fetchPackages(currentProject._id)
  }, [currentProject?._id])

  const handleInstall = async () => {
    if (!query.trim()) return
    setInstalling(query)
    try {
      await installPackage(query)
      toast.success(`✅ ${query} added to project`)
      setQuery('')
    } catch (err) {
      toast.error('Install failed: ' + err.message)
    } finally {
      setInstalling('')
    }
  }

  const handleUninstall = async (name) => {
    try {
      await uninstallPackage(name)
      toast.success(`Removed ${name}`)
    } catch (err) {
      toast.error('Failed: ' + err.message)
    }
  }

  return (
    <div className="packages-tab">
      <div className="panel-section-header">
        <span>NPM PACKAGES</span>
      </div>

      {/* Install input */}
      <div className="package-install-box">
        <input
          className="package-input"
          placeholder="lodash, axios, dayjs..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleInstall()}
        />
        <button
          className="btn btn-primary"
          style={{ padding: '5px 10px', fontSize: 12 }}
          onClick={handleInstall}
          disabled={!!installing || !query.trim()}
        >
          {installing
            ? <div className="spinner" style={{ width: 14, height: 14 }} />
            : <Download size={13} />
          }
        </button>
      </div>

      <p className="package-hint">
        💡 Packages are tracked and usable via CDN in your HTML files
      </p>

      {/* Installed list */}
      {installedPackages.length > 0 && (
        <>
          <div className="panel-section-header" style={{ marginTop: '0.75rem' }}>
            <span>INSTALLED ({installedPackages.length})</span>
          </div>
          <div className="package-list">
            {installedPackages.map(pkg => (
              <div key={pkg.name} className="package-item">
                <div className="package-info">
                  <span className="package-name">{pkg.name}</span>
                  <span className="package-version">{pkg.version}</span>
                </div>
                <button
                  className="file-action-btn danger"
                  title="Remove"
                  onClick={() => handleUninstall(pkg.name)}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Settings Tab ──────────────────────────────────────────
function SettingsTab() {
  const { currentProject, updateProject } = useStore()
  const settings = currentProject?.settings || {}

  const update = (key, value) => {
    updateProject({ settings: { ...settings, [key]: value } })
  }

  return (
    <div className="settings-tab">
      <div className="panel-section-header">
        <span>EDITOR SETTINGS</span>
      </div>

      <div className="setting-item">
        <label>Font Size</label>
        <select
          value={settings.fontSize || 14}
          onChange={e => update('fontSize', Number(e.target.value))}
        >
          {[11, 12, 13, 14, 15, 16, 18, 20].map(s => (
            <option key={s} value={s}>{s}px</option>
          ))}
        </select>
      </div>

      <div className="setting-item">
        <label>Tab Size</label>
        <select
          value={settings.tabSize || 2}
          onChange={e => update('tabSize', Number(e.target.value))}
        >
          <option value={2}>2 spaces</option>
          <option value={4}>4 spaces</option>
        </select>
      </div>

      <div className="setting-item">
        <label>Word Wrap</label>
        <input
          type="checkbox"
          checked={settings.wordWrap !== false}
          onChange={e => update('wordWrap', e.target.checked)}
        />
      </div>

      <div className="setting-item">
        <label>Auto Save</label>
        <input
          type="checkbox"
          checked={settings.autoSave !== false}
          onChange={e => update('autoSave', e.target.checked)}
        />
      </div>
    </div>
  )
}

// ─── Main Sidebar ──────────────────────────────────────────
export default function Sidebar() {
  const { sidebarTab, setSidebarTab } = useStore()

  const tabs = [
    { id: 'files', icon: <Files size={18} />, label: 'Files' },
    { id: 'packages', icon: <Package size={18} />, label: 'Packages' },
    { id: 'settings', icon: <Settings size={18} />, label: 'Settings' },
  ]

  return (
    <div className="sidebar">
      {/* Icon rail */}
      <div className="sidebar-icons">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`sidebar-icon-btn ${sidebarTab === tab.id ? 'active' : ''}`}
            onClick={() => setSidebarTab(tab.id)}
            title={tab.label}
          >
            {tab.icon}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="sidebar-panel">
        {sidebarTab === 'files' && <FilesTab />}
        {sidebarTab === 'packages' && <PackagesTab />}
        {sidebarTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  )
}