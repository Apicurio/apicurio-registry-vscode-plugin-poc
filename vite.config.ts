import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, 'src/webview'),
  build: {
    outDir: resolve(__dirname, 'out/webview'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/webview/index.html')
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    },
    // Target modern browsers (VSCode webview uses Chromium)
    target: 'es2020',
    minify: true,
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/webview')
    }
  },
  define: {
    // Ensure process.env is available for libraries that need it
    'process.env': {}
  }
});
