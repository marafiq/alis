import fs from 'node:fs';
import { execSync } from 'node:child_process';
import crypto from 'node:crypto';

// Clean dist
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}

// Run Rollup
console.log('Building...');
try {
  execSync('npx rollup -c', { stdio: 'inherit' });
} catch (e) {
  console.error('Build failed');
  process.exit(1);
}

// Emit BUILD_INFO.json
const files = fs.readdirSync('dist').filter(f => f.endsWith('.js'));
const fileSizes = {};
files.forEach(f => {
  const stats = fs.statSync(`dist/${f}`);
  fileSizes[f] = stats.size;
});

const buildInfo = {
  timestamp: new Date().toISOString(),
  files: fileSizes,
  git: 'unknown' // Could extract via git rev-parse if needed
};

fs.writeFileSync('dist/BUILD_INFO.json', JSON.stringify(buildInfo, null, 2));
console.log('Wrote dist/BUILD_INFO.json');
