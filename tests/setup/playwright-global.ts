import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const distFile = path.resolve('dist/alis.js');

export default async function globalSetup() {
  if (!fs.existsSync(distFile)) {
    execSync('npm run build', { stdio: 'inherit' });
  }
  const buildInfoPath = path.resolve('dist/BUILD_INFO.json');
  if (!fs.existsSync(buildInfoPath)) {
    throw new Error('BUILD_INFO.json missing. Build is not trustworthy.');
  }
}

