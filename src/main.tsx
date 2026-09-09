import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App.tsx';
import './index.css';

// Register PWA service worker with autoUpdate
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New StorySpark version available.');
  },
  onOfflineReady() {
    console.log('StorySpark is ready to work offline.');
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
