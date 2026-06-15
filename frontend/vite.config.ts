import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    // Escucha en todas las interfaces para poder abrir el frontend desde el móvil (LAN).
    host: true,
  },
});
