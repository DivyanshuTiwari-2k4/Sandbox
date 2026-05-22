import { useEffect } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { useHotkeys } from 'react-hotkeys-hook'
import { toast } from 'react-toastify'
import Toolbar from '../Toolbar/Toolbar'
import Sidebar from '../Sidebar/Sidebar'
import EditorPanel from '../Editor/EditorPanel'
import PreviewPanel from '../Preview/PreviewPanel'
import TerminalPanel from '../Terminal/TerminalPanel'
import useStore from '../../store/useStore'
import './IDE.css'

export default function IDE({ onBack }) {
  const {
    showTerminal,
    showPreview,
    isSidebarCollapsed,
    saveAllFiles,
    saveFile,
    activeFileId,
    runProject,
  } = useStore()

  // Ctrl+S → save active file
  useHotkeys('ctrl+s, meta+s', (e) => {
    e.preventDefault()
    if (activeFileId) {
      saveFile(activeFileId)
        .then(() => toast.success('✓ Saved', { autoClose: 1000 }))
        .catch(() => toast.error('Save failed'))
    }
  }, { enableOnFormTags: true })

  // Ctrl+Shift+S → save all
  useHotkeys('ctrl+shift+s, meta+shift+s', (e) => {
    e.preventDefault()
    saveAllFiles()
      .then(() => toast.success('✓ All files saved', { autoClose: 1000 }))
      .catch(() => toast.error('Save failed'))
  }, { enableOnFormTags: true })

  // Ctrl+Enter → run project
  useHotkeys('ctrl+enter, meta+enter', (e) => {
    e.preventDefault()
    runProject()
    toast.info('▶ Running project', { autoClose: 1000 })
  }, { enableOnFormTags: true })

  return (
    <div className="ide-layout">
      <Toolbar onBack={onBack} />

      <div className="ide-body">
        {!isSidebarCollapsed && <Sidebar />}

        <div className="ide-main">
          <PanelGroup direction="horizontal">

            {/* Left: Editor + Terminal */}
            <Panel
              defaultSize={showPreview ? 55 : 100}
              minSize={30}
            >
              <PanelGroup direction="vertical">

                {/* Editor */}
                <Panel
                  defaultSize={showTerminal ? 70 : 100}
                  minSize={30}
                >
                  <EditorPanel />
                </Panel>

                {/* Terminal */}
                {showTerminal && (
                  <>
                    <PanelResizeHandle className="resize-handle-h" />
                    <Panel defaultSize={30} minSize={15} maxSize={60}>
                      <TerminalPanel />
                    </Panel>
                  </>
                )}

              </PanelGroup>
            </Panel>

            {/* Right: Preview */}
            {showPreview && (
              <>
                <PanelResizeHandle className="resize-handle-v" />
                <Panel defaultSize={45} minSize={25}>
                  <PreviewPanel />
                </Panel>
              </>
            )}

          </PanelGroup>
        </div>
      </div>
    </div>
  )
}