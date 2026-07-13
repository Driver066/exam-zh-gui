import React from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { DeleteConfirmationProvider } from './DeleteConfirmation';
import './styles.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Missing root element');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <DeleteConfirmationProvider>
      <App />
    </DeleteConfirmationProvider>
  </React.StrictMode>,
);
