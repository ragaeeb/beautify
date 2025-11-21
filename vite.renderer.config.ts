import { defineConfig } from 'vite';

export default defineConfig({
    build: { outDir: 'dist', target: 'esnext' },
    clearScreen: false,
    server: { host: '127.0.0.1', port: 5173, strictPort: true },
});
