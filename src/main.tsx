import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { registerOffline } from './offline';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Practice still works online if the offline copy cannot be installed; Profile says which.
registerOffline();
