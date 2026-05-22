import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import {
  Plus, Folder, Code, Trash2, Copy, Clock,
  Package, Search, ExternalLink, Zap, Globe,
  Terminal, Layers
} from 'lucide-react'
import useStore from '../../store/useStore'
import './Dashboard.css'

const TEMPLATES = [
  { id: 'blank', label: 'Blank', icon: <Code size={20} />, desc: 'Start from scratch', color: '#58a6ff' },
  { id: 'html-css', label: 'HTML + CSS', icon: <Globe size={20} />, desc: 'Web page with styles', color: '#e34c26' },
  { id: 'vanilla-js', label: 'JavaScript', icon: <Zap size={20} />, desc: 'Vanilla JS counter app', color: '#f1e05a' },
  { id: 'react', label: 'React', icon: <Layers size={20} />, desc: 'React todo with hooks', color: '#61dafb' },
  { id: 'node-express', label: 'Node + Express', icon: <Terminal size={20} />, desc: 'REST API server', color: '#3fb950' },
]

// ─── New Project Modal ─────────────────────────────────────
function NewProjectModal({ onClose, onCreate }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [template, setTemplate] = useState('blank')
  const [creating, setCreating] = useState(false)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) return toast.warn('Project name is required')
    setCreating(true)
    try {
      await onCreate(name, template, description)
      onClose()
    } catch (err) {
      toast.error('Failed to create: ' + err.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box" style={{ width: '520px' }}>
        <h2 className="modal-title">New Project</h2>
        <form onSubmit={handleCreate}>
          <label className="field-label">Project Name</label>
          <input
            className="modal-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="my-awesome-project"
            autoFocus
          />

          <label className="field-label">Description (optional)</label>
          <input
            className="modal-input"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What does this project do?"
          />

          <label className="field-label">Template</label>
          <div className="template-grid">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                type="button"
                className={`template-card ${template === t.id ? 'selected' : ''}`}
                onClick={() => setTemplate(t.id)}
                style={{ '--accent': t.color }}
              >
                <span className="template-icon" style={{ color: t.color }}>
                  {t.icon}
                </span>
                <span className="template-name">{t.label}</span>
                <span className="template-desc">{t.desc}</span>
              </button>
            ))}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Project Card ──────────────────────────────────────────
function ProjectCard({ project, onOpen, onDelete, onDuplicate }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const formatDate = (date) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now - d
    if (diff < 60000) return 'just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return d.toLocaleDateString()
  }

  const template = TEMPLATES.find(t => t.id === project.template) || TEMPLATES[0]

  return (
    <div className="project-card" onClick={() => onOpen(project)}>
      <div className="project-card-header">
        <span
          className="project-template-icon"
          style={{ color: template.color }}
        >
          {template.icon}
        </span>
        <div
          className="project-actions"
          onClick={e => e.stopPropagation()}
        >
          <button
            className="icon-btn"
            title="Duplicate"
            onClick={() => onDuplicate(project)}
          >
            <Copy size={14} />
          </button>
          <button
            className={`icon-btn ${confirmDelete ? 'danger' : ''}`}
            title="Delete"
            onClick={() => {
              if (confirmDelete) {
                onDelete(project._id)
              } else {
                setConfirmDelete(true)
                setTimeout(() => setConfirmDelete(false), 3000)
              }
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <h3 className="project-name">{project.name}</h3>

      {project.description && (
        <p className="project-desc">{project.description}</p>
      )}

      <div className="project-meta">
        <span className="meta-item">
          <Clock size={12} />
          {formatDate(project.updatedAt)}
        </span>
        <span className="meta-item">
          <Package size={12} />
          {project.installedPackages?.length || 0} pkgs
        </span>
        <span
          className="template-badge"
          style={{ color: template.color }}
        >
          {template.label}
        </span>
      </div>

      <div className="project-open-btn">
        <ExternalLink size={14} />
        Open IDE
      </div>
    </div>
  )
}

// ─── Dashboard ─────────────────────────────────────────────
export default function Dashboard({ onOpenProject }) {
  const {
    projects, fetchProjects, createProject,
    deleteProject, projectsLoading
  } = useStore()

  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleCreate = async (name, template, description) => {
    const project = await createProject(name, template, description)
    await onOpenProject(project)
  }

  const handleDelete = async (projectId) => {
    try {
      await deleteProject(projectId)
      toast.success('Project deleted')
    } catch (err) {
      toast.error('Failed to delete: ' + err.message)
    }
  }

  const handleDuplicate = async (project) => {
    try {
      const { default: api } = await import('../../utils/api')
      await api.post(`/projects/${project._id}/duplicate`)
      toast.success(`Duplicated "${project.name}"`)
      fetchProjects()
    } catch (err) {
      toast.error('Failed to duplicate: ' + err.message)
    }
  }

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-brand">
          <div className="brand-logo">
            <Code size={22} />
          </div>
          <div>
            <h1 className="brand-title">SandboxIDE</h1>
            <p className="brand-sub">Browser-based developer environment</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <Search size={14} />
            <input
              placeholder="Search projects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <Plus size={16} /> New Project
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="dashboard-main">
        {projectsLoading && projects.length === 0 ? (
          <div className="loading-state">
            <div className="spinner" style={{ width: 32, height: 32 }} />
            <p>Loading projects...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Folder size={48} /></div>
            <h2>{search ? 'No projects found' : 'No projects yet'}</h2>
            <p>
              {search
                ? 'Try a different search term'
                : 'Create your first project to get started'}
            </p>
            {!search && (
              <button
                className="btn btn-primary"
                onClick={() => setShowModal(true)}
              >
                <Plus size={16} /> Create Project
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="section-header">
              <h2>Projects <span className="count">({filtered.length})</span></h2>
            </div>
            <div className="projects-grid">
              {filtered.map(project => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  onOpen={onOpenProject}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {showModal && (
        <NewProjectModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}