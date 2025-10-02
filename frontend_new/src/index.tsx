
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { NotificationProvider } from './components/ui/NotificationSystem';
import App from './App';
import StoreTest from './StoreTest';

// Simple test component
const TestApp: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontSize: '24px', color: 'blue' }}>
      <h1>Test App is Working!</h1>
      <p>If you can see this, React is rendering correctly.</p>
      <div style={{ background: 'lightgray', padding: '10px', marginTop: '10px' }}>
        Current time: {new Date().toLocaleString()}
      </div>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
