import * as fs from 'fs';
import * as path from 'path';

const IGNORED = new Set(['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', '.cache', 'vendor']);
const KEY_FILES = ['README.md', 'package.json', 'go.mod', 'Cargo.toml', 'pom.xml', '.env.example', 'docker-compose.yml'];
const MAX_KEY_FILE_CHARS = 2000;

export function getProjectContext(serviceDirectory: string): string {
  const lines: string[] = [`Project: ${serviceDirectory}\n\nFile structure:`];

  try {
    walkDir(serviceDirectory, lines, 0, 2);
  } catch {
    lines.push('(could not read directory)');
  }

  for (const file of KEY_FILES) {
    const filePath = path.join(serviceDirectory, file);
    if (!fs.existsSync(filePath)) continue;
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const content = raw.length > MAX_KEY_FILE_CHARS ? raw.slice(0, MAX_KEY_FILE_CHARS) + '\n...(truncated)' : raw;
      lines.push(`\n--- ${file} ---\n${content}`);
    } catch {
      // skip unreadable files
    }
  }

  return lines.join('\n');
}

function walkDir(dir: string, lines: string[], depth: number, maxDepth: number): void {
  if (depth > maxDepth) return;
  const indent = '  '.repeat(depth);
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (IGNORED.has(entry.name) || entry.name.startsWith('.')) continue;
    if (entry.isDirectory()) {
      lines.push(`${indent}${entry.name}/`);
      walkDir(path.join(dir, entry.name), lines, depth + 1, maxDepth);
    } else {
      lines.push(`${indent}${entry.name}`);
    }
  }
}
