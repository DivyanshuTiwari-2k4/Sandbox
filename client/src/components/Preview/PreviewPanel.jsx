import { useRef, useState } from 'react'
import {
  RefreshCw, ExternalLink, Monitor,
  Smartphone, Tablet, AlertCircle
} from 'lucide-react'
import useStore from '../../store/useStore'
import './PreviewPanel.css'

const VIEWPORTS = [
  { id: 'desktop', icon: <Monitor size={14} />, label: 'Desktop', width: '100%' },
  { id: 'tablet', icon: <Tablet size={14} />, label: 'Tablet', width: '768px' },
  { id: 'mobile', icon: <Smartphone size={14} />, label: 'Mobile', width: '375px' },
]

export default function PreviewPanel() {
  const { previewContent, buildPreview, isRunning, previewKey } = useStore()
  const iframeRef = useRef(null)
  const [viewport, setViewport] = useState('desktop')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const activeViewport = VIEWPORTS.find(v => v.id === viewport)

  const handleRefresh = () => {
    setIsRefreshing(true)
    buildPreview()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const handleOpenExternal = () => {
    if (!previewContent) return
    const blob = new Blob([previewContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  return (
    <div className="preview-panel">
      {/* Header */}
      <div className="preview-header">
        <div className="preview-header-left">
          <span className="preview-title">Preview</span>
          {isRunning && (
            <span className="preview-status running">
              <span className="status-dot" />
              Live
            </span>
          )}
        </div>

        {/* Viewport switcher */}
        <div className="viewport-switcher">
          {VIEWPORTS.map(v => (
            <button
              key={v.id}
              className={`viewport-btn ${viewport === v.id ? 'active' : ''}`}
              onClick={() => setViewport(v.id)}
              title={v.label}
            >
              {v.icon}
            </button>
          ))}
        </div>

        <div className="preview-header-right">
          <button
            className="preview-btn"
            onClick={handleRefresh}
            title="Refresh Preview"
          >
            <RefreshCw
              size={13}
              className={isRefreshing ? 'spinning' : ''}
            />
          </button>
          <button
            className="preview-btn"
            onClick={handleOpenExternal}
            title="Open in new tab"
            disabled={!previewContent}
          >
            <ExternalLink size={13} />
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="preview-body">
        {!previewContent ? (
          <div className="preview-empty">
            <div className="preview-empty-content">
              <AlertCircle size={36} />
              <h3>No Preview Available</h3>
              <p>Click Run to preview your project</p>
              <div className="preview-hint">
                <kbd>Ctrl</kbd>
                <span>+</span>
                <kbd>Enter</kbd>
                <span style={{ marginLeft: 8 }}>to run</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="preview-viewport-wrapper">
            <div
              className="preview-viewport"
              style={{ width: activeViewport.width }}
            >
              <iframe
                key={previewKey}
                ref={iframeRef}
                className="preview-iframe"
                srcDoc={previewContent}
                title="Project Preview"
                sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
                allow="camera; microphone"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}