import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  envPrefix: ['VITE_', 'TAURI_'],
  test: {
    globals: true,
    environment: 'node',
  },
});
