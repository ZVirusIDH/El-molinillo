import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registrarServiceWorker } from './config/dynamic-firebase';

// Registrar Service Worker para PWA y notificaciones push
registrarServiceWorker();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
