import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register PWA Service Worker for offline capability
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered with scope:', registration.scope);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New version available! Refresh to update.');
              }
            });
          }
        });
      })
      .catch((error) => {
        console.warn('[PWA] Service Worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
