import vite from 'vite';
const defineConfig = vite.defineConfig;
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  // Resolve JSON imports
  assetsInclude: ['**/*.json']
});