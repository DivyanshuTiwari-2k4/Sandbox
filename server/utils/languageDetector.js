const EXTENSION_MAP = {
  // JavaScript
  'js': 'javascript',
  'jsx': 'javascript',
  'mjs': 'javascript',
  'cjs': 'javascript',
  // TypeScript
  'ts': 'typescript',
  'tsx': 'typescript',
  // Web
  'html': 'html',
  'htm': 'html',
  'css': 'css',
  'scss': 'scss',
  'sass': 'sass',
  'less': 'less',
  // Data
  'json': 'json',
  'yaml': 'yaml',
  'yml': 'yaml',
  'xml': 'xml',
  'toml': 'toml',
  // Docs
  'md': 'markdown',
  'mdx': 'markdown',
  'txt': 'plaintext',
  // Backend
  'py': 'python',
  'rb': 'ruby',
  'php': 'php',
  'java': 'java',
  'go': 'go',
  'rs': 'rust',
  'cs': 'csharp',
  'cpp': 'cpp',
  'c': 'c',
  // Shell
  'sh': 'shell',
  'bash': 'shell',
  'zsh': 'shell',
  // Other
  'sql': 'sql',
  'graphql': 'graphql',
  'gql': 'graphql',
  'env': 'plaintext',
  'gitignore': 'plaintext',
};

const FULL_NAME_MAP = {
  'dockerfile': 'dockerfile',
  'makefile': 'makefile',
  '.gitignore': 'plaintext',
  '.env': 'plaintext',
  '.babelrc': 'json',
  '.eslintrc': 'json',
  'package.json': 'json',
  'tsconfig.json': 'json',
};

export function detectLanguage(filename) {
  if (!filename) return 'plaintext';
  
  const lower = filename.toLowerCase();

  // Check full name map first
  if (FULL_NAME_MAP[lower]) return FULL_NAME_MAP[lower];

  // Extract extension
  const parts = filename.split('.');
  if (parts.length < 2) return 'plaintext';

  const ext = parts[parts.length - 1].toLowerCase();
  return EXTENSION_MAP[ext] || 'plaintext';
}

export function getLanguageDisplayName(language) {
  const displayNames = {
    'javascript': 'JavaScript',
    'typescript': 'TypeScript',
    'html': 'HTML',
    'css': 'CSS',
    'scss': 'SCSS',
    'json': 'JSON',
    'markdown': 'Markdown',
    'python': 'Python',
    'rust': 'Rust',
    'go': 'Go',
    'sql': 'SQL',
    'graphql': 'GraphQL',
    'shell': 'Shell',
    'plaintext': 'Plain Text',
  };
  return displayNames[language] || language;
}