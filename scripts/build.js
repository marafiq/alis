import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const typesSource = path.join(root, 'types', 'index.d.ts');

function ensureTypesSource() {
  if (!fs.existsSync(typesSource)) {
    throw new Error('types/index.d.ts is required before building dist output');
  }
}

function cleanDist() {
  fs.rmSync(distDir, { recursive: true, force: true });
}

function runRollup() {
  execSync('rollup -c', { stdio: 'inherit' });
}

function copyTypes() {
  fs.mkdirSync(distDir, { recursive: true });
  fs.copyFileSync(typesSource, path.join(distDir, 'alis.d.ts'));
}

function writeBuildInfo() {
  const metadata = {
    hash: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };
  fs.writeFileSync(
    path.join(distDir, 'BUILD_INFO.json'),
    JSON.stringify(metadata, null, 2)
  );
}

ensureTypesSource();
cleanDist();
runRollup();
copyTypes();
writeBuildInfo();

