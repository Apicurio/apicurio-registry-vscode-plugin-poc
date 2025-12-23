import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Plugin to convert modulepreload to actual script tags and fix load order
function convertModulePreloadToScript(): Plugin {
  return {
    name: 'convert-modulepreload-to-script',
    transformIndexHtml(html) {
      // Extract all modulepreload and script tags
      const scriptMatches = [...html.matchAll(/<script type="module"[^>]+src="([^"]+)"[^>]*><\/script>/g)];
      const preloadMatches = [...html.matchAll(/<link rel="modulepreload"[^>]+href="([^"]+)"[^>]*>/g)];

      // Remove all existing script and modulepreload tags
      let newHtml = html.replace(/<script type="module"[^>]+><\/script>/g, '');
      newHtml = newHtml.replace(/<link rel="modulepreload"[^>]*>/g, '');

      // Build new script tags in correct order: chunks first, then entries
      const chunkScripts = preloadMatches.map(m =>
        `<script type="module" crossorigin src="${m[1]}"></script>`
      ).join('\n      ');

      const entryScripts = scriptMatches.map(m =>
        `<script type="module" crossorigin src="${m[1]}"></script>`
      ).join('\n      ');

      // Inject in correct order before </head>
      const allScripts = chunkScripts + '\n      ' + entryScripts;
      return newHtml.replace('</style>', `</style>\n      ${allScripts}`);
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), convertModulePreloadToScript()],
  root: resolve(__dirname, 'src/webview'),
  base: './', // Use relative paths for all assets
  build: {
    outDir: resolve(__dirname, 'out/webview'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/webview/index.html'),
        visualEditor: resolve(__dirname, 'src/webview/visual-editor/index.html')
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name].[ext]',
        // Ensure proper module format
        format: 'es',
        // Inline dynamic imports to prevent chunk splitting issues
        inlineDynamicImports: false,
        // Force shared modules to be inlined rather than split
        manualChunks: undefined
      }
    },
    // Ensure all dependencies are bundled (don't treat anything as external for webview)
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    },
    // Target modern browsers (VSCode webview uses Chromium)
    target: 'es2020',
    minify: true,
    sourcemap: true,
    // Disable chunk size warnings and increase limits to prevent splitting
    chunkSizeWarningLimit: 10000, // 10MB
    // Inline all dynamic imports to avoid module resolution issues
    modulePreload: {
      polyfill: false
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/webview')
    },
    // Ensure React is properly deduplicated
    dedupe: ['react', 'react-dom']
  },
  define: {
    // Ensure process.env is available for libraries that need it
    'process.env': {}
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      '@apicurio/openapi-editor'
    ],
    force: true
  }
});
