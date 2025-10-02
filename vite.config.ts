import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        chunkSizeWarningLimit: 1000, // Increased to reasonable threshold
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              // Core React libraries
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor';
              }

              // State management
              if (id.includes('zustand')) {
                return 'state';
              }

              // AI and external services
              if (id.includes('@google/genai')) {
                return 'external';
              }

              // Feature-based chunks
              if (id.includes('features/patients')) {
                return 'patients';
              }

              if (id.includes('features/search')) {
                return 'search';
              }

              // UI components
              if (id.includes('components/ui')) {
                return 'ui';
              }

              // Services
              if (id.includes('services/')) {
                return 'services';
              }

              // Utilities and hooks
              if (id.includes('utils/') || id.includes('hooks/')) {
                return 'utils';
              }

              // Stores
              if (id.includes('stores/')) {
                return 'stores';
              }

              // Components
              if (id.includes('components/')) {
                return 'components';
              }

              // Default chunk
              return 'misc';
            },

            // Optimize chunk naming
            chunkFileNames: (chunkInfo) => {
              const facadeModuleId = chunkInfo.facadeModuleId
                ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '')
                : 'chunk';
              return `assets/[name]-[hash].js`;
            },

            // Optimize entry point naming
            entryFileNames: 'assets/[name]-[hash].js',

            // Optimize asset naming
            assetFileNames: 'assets/[name]-[hash].[ext]'
          }
        },

        // Enable source maps for debugging
        sourcemap: process.env.NODE_ENV === 'development',

        // Minify CSS
        cssCodeSplit: true,

        // Optimize build target
        target: 'es2015'
      },

      // Optimize dependencies for faster builds
      optimizeDeps: {
        include: ['react', 'react-dom', 'zustand'],
        exclude: []
      }
    };
});
