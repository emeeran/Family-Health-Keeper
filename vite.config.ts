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
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              utils: ['@google/genai'],
              components: [
                './components/Header.tsx',
                './components/Sidebar.tsx',
                './components/PatientDetails.tsx',
                './components/PatientEditModal.tsx',
                './components/DoctorEditModal.tsx',
                './components/AIAssistant.tsx',
                './components/CurrentMedications.tsx',
                './components/ReminderList.tsx'
              ],
              services: [
                './services/geminiService.ts',
                './services/pdfService.ts'
              ]
            }
          }
        }
      }
    };
});
