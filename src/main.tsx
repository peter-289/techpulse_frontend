import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryProvider } from './app/providers/query-provider';
import { AppRouter } from './app/router/app-router';
import './app/styles/tokens.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  React.createElement(
    React.StrictMode,
    null,
    React.createElement(QueryProvider, null, React.createElement(AppRouter)),
  ),
);

// debug log to help verify client-side mounting
// (visible in browser console)
console.log('TechPulse: main.tsx mounted');
