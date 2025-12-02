import { defineConfig } from 'vite';

export default defineConfig({
  root: process.cwd(),
  appType: 'mpa',
  envDir: '.',
  envPrefix: 'ALIS_',
  server: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
    fs: {
      strict: false
    }
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true
  }
});

