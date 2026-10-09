import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryProvider } from './app/providers/query-provider';
import { AppRouter } from './app/router/app-router';
import './app/styles/tokens.css';
import './app/styles/content.css';
import { Toasts } from './shared/ui/toast/Toasts';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  React.createElement(
    React.StrictMode,
    null,
    React.createElement(
      QueryProvider,
      null,
      React.createElement(
        React.Fragment,
        null,
        React.createElement(AppRouter),
        React.createElement(Toasts)
      )
    ),
  ),
);


