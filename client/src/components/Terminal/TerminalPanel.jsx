import { useState, useEffect, useRef } from 'react'
import { X, Minus, Terminal, Trash2 } from 'lucide-react'
import useStore from '../../store/useStore'
import socket from '../../utils/socket'
import './TerminalPanel.css'

export default function TerminalPanel() {
  const {
    terminalLines,
    addTerminalLine,
    clearTerminal,
    currentProject,
    toggleTerminal
  } = useStore()

  const [input, setInput] = useState('')
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [terminalLines])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Socket terminal output listener
  useEffect(() => {
    const handleOutput = ({ command, output, type }) => {
      addTerminalLine({ type, text: output })
    }

    const handleClear = () => {
      clearTerminal()
    }

    socket.on('terminal:output', handleOutput)
    socket.on('terminal:clear', handleClear)

    return () => {
      socket.off('terminal:output', handleOutput)
      socket.off('terminal:clear', handleClear)
    }
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const cmd = input.trim()

    // Add command to display
    addTerminalLine({ type: 'command', text: cmd })

    // Save to history
    setHistory(prev => [cmd, ...prev.slice(0, 49)])
    setHistoryIndex(-1)

    // Handle client-side clear
    if (cmd === 'clear' || cmd === 'cls') {
      clearTerminal()
      setInput('')
      return
    }

    // Send to server via socket
    socket.emit('terminal:command', {
      projectId: currentProject?._id,
      command: cmd
    })

    setInput('')
  }

  const handleKeyDown = (e) => {
    // History navigation
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const newIndex = Math.min(historyIndex + 1, history.length - 1)
      setHistoryIndex(newIndex)
      setInput(history[newIndex] || '')
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const newIndex = Math.max(historyIndex - 1, -1)
      setHistoryIndex(newIndex)
      setInput(newIndex === -1 ? '' : history[newIndex])
    }
    // Tab completion (basic)
    if (e.key === 'Tab') {
      e.preventDefault()
      const commands = [
        'help', 'clear', 'cls', 'ls', 'dir',
        'pwd', 'echo ', 'node --version',
        'npm --version', 'npm install '
      ]
      const match = commands.find(c => c.startsWith(input))
      if (match) setInput(match)
    }
  }

  const getLineClass = (type) => {
    switch (type) {
      case 'command': return 'terminal-line command'
      case 'error':   return 'terminal-line error'
      case 'warn':    return 'terminal-line warn'
      case 'info':    return 'terminal-line info'
      case 'success': return 'terminal-line success'
      default:        return 'terminal-line'
    }
  }

  const getLinePrefix = (type) => {
    if (type === 'command') return '$ '
    if (type === 'error')   return '✖ '
    if (type === 'info')    return 'ℹ '
    if (type === 'success') return '✔ '
    return '  '
  }

  return (
    <div className="terminal-panel">
      {/* Header */}
      <div className="terminal-header">
        <div className="terminal-header-left">
          <Terminal size={13} />
          <span className="terminal-title">Terminal</span>
          {currentProject && (
            <span className="terminal-project">
              {currentProject.name}
            </span>
          )}
        </div>
        <div className="terminal-header-right">
          <button
            className="terminal-btn"
            onClick={clearTerminal}
            title="Clear terminal"
          >
            <Trash2 size={13} />
          </button>
          <button
            className="terminal-btn"
            onClick={toggleTerminal}
            title="Close terminal"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Output */}
      <div
        className="terminal-output"
        onClick={() => inputRef.current?.focus()}
      >
        {terminalLines.map((line, i) => (
          <div key={i} className={getLineClass(line.type)}>
            <span className="line-prefix">
              {getLinePrefix(line.type)}
            </span>
            <span className="line-text">
              {line.text.split('\n').map((text, j) => (
                <span key={j}>
                  {text}
                  {j < line.text.split('\n').length - 1 && <br />}
                </span>
              ))}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        className="terminal-input-row"
        onSubmit={handleSubmit}
      >
        <span className="terminal-prompt">
          <span className="prompt-user">sandbox</span>
          <span className="prompt-separator">:</span>
          <span className="prompt-path">
            ~/{currentProject?.name || 'workspace'}
          </span>
          <span className="prompt-dollar">$</span>
        </span>
        <input
          ref={inputRef}
          className="terminal-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a command... (help for list)"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </form>
    </div>
  )
}