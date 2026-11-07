import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// The site reads catalyst-config.json, models/*.json, client/src/App.jsx and functions/ocr/main.py
// at build time, so every number on the page is derived from the repo, never typed.
export default defineConfig({
  base: '/SecureStep/',
  plugins: [react()],
  server: { fs: { allow: ['..'] } },
});
