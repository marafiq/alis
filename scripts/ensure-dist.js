import fs from 'node:fs';
import { execSync } from 'node:child_process';

if (!fs.existsSync('dist/alis.js')) {
  console.log('dist/alis.js not found. Building...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (e) {
    process.exit(1);
  }
}
