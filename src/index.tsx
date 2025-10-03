// Optimized Entry Point with Performance Monitoring
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { NotificationProvider } from './components/ui/NotificationSystem';
import { PerformanceMonitor } from './utils/performanceMonitor';
import AppCore from './core/AppCore';

// Initialize performance monitoring
PerformanceMonitor.init();

// Preload critical components
const preloadCriticalComponents = async () => {
  try {
    await Promise.all([
      import('./core/AppLayout'),
      import('./core/AppRouter'),
      import('./components/Header'),
      import('./components/Sidebar')
    ]);
    console.log('[Performance] Critical components preloaded');
  } catch (error) {
    console.warn('[Performance] Failed to preload components:', error);
  }
};

// Initialize app with performance optimizations
const initializeApp = async () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  const root = ReactDOM.createRoot(rootElement);

  // Start performance timing
  const startTime = performance.now();

  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <NotificationProvider>
          <AppCore />
        </NotificationProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );

  // Log app initialization time
  const initTime = performance.now() - startTime;
  console.log(`[Performance] App initialized in ${initTime.toFixed(2)}ms`);

  // Preload components after initial render
  setTimeout(preloadCriticalComponents, 100);
};

// Start the application
initializeApp().catch((error) => {
  console.error('Failed to initialize app:', error);
});