import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import Dashboard from './components/Dashboard/Dashboard'
import IDE from './components/IDE/IDE'
import useStore from './store/useStore'
import socket from './utils/socket'

function App() {
  const [view, setView] = useState('dashboard')
  const {
    loadProject,
    currentProject,
    handleSocketFileChanged,
    handleSocketFileCreated,
    handleSocketFileDeleted,
    buildPreview
  } = useStore()

  // Socket listeners
  useEffect(() => {
    socket.on('file:changed', handleSocketFileChanged)
    socket.on('file:created', handleSocketFileCreated)
    socket.on('file:deleted', handleSocketFileDeleted)

    socket.on('package:installing', ({ packageName }) => {
      toast.info(`Installing ${packageName}...`, { autoClose: 2000 })
    })

    socket.on('package:installed', ({ packageName, version }) => {
      toast.success(`✅ ${packageName}@${version} installed`)
    })

    socket.on('package:error', ({ packageName, error }) => {
      toast.error(`Failed to install ${packageName}: ${error}`)
    })

    return () => {
      socket.off('file:changed', handleSocketFileChanged)
      socket.off('file:created', handleSocketFileCreated)
      socket.off('file:deleted', handleSocketFileDeleted)
      socket.off('package:installing')
      socket.off('package:installed')
      socket.off('package:error')
    }
  }, [])

  const handleOpenProject = async (project) => {
    try {
      await loadProject(project._id)
      setView('ide')
    } catch (err) {
      toast.error('Failed to load project: ' + err.message)
    }
  }

  const handleBackToDashboard = () => {
    setView('dashboard')
  }

  if (view === 'ide' && currentProject) {
    return <IDE onBack={handleBackToDashboard} />
  }

  return <Dashboard onOpenProject={handleOpenProject} />
}

export default App