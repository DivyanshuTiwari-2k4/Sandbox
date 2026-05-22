export const LANGUAGE_COLORS = {
  javascript: '#f1e05a',
  typescript: '#3178c6',
  html: '#e34c26',
  css: '#563d7c',
  scss: '#c6538c',
  json: '#292929',
  markdown: '#083fa1',
  python: '#3572A5',
  rust: '#dea584',
  go: '#00ADD8',
  plaintext: '#8b949e',
  folder: '#58a6ff',
}

export const FILE_EXTENSIONS = {
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.html': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.json': 'json',
  '.md': 'markdown',
  '.py': 'python',
  '.rs': 'rust',
  '.go': 'go',
}

export function detectLanguage(filename) {
  if (!filename) return 'plaintext'
  const ext = '.' + filename.split('.').pop().toLowerCase()
  return FILE_EXTENSIONS[ext] || 'plaintext'
}

export function getLanguageColor(language) {
  return LANGUAGE_COLORS[language] || '#8b949e'
}

export function getMonacoLanguage(language) {
  const map = {
    javascript: 'javascript',
    typescript: 'typescript',
    html: 'html',
    css: 'css',
    scss: 'scss',
    json: 'json',
    markdown: 'markdown',
    python: 'python',
    rust: 'rust',
    go: 'go',
    plaintext: 'plaintext',
    shell: 'shell',
    graphql: 'graphql',
    sql: 'sql',
    yaml: 'yaml',
    xml: 'xml',
  }
  return map[language] || 'plaintext'
}