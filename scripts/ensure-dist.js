import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const distFile = path.resolve('dist/alis.js');

if (!fs.existsSync(distFile)) {
  console.log('dist/alis.js missing. Running `npm run build`...');
}

console.log('Building dist bundle via `npm run build`...');
execSync('npm run build', { stdio: 'inherit' });

