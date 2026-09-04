import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { AppProviders } from '@/theme/AppProviders';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { setupTenantInterceptor } from '@/lib/setupTenantInterceptor';
import { ensureInitialData } from '@/lib/seedData';
import App from './App';
import './index.css';

setupTenantInterceptor();
void ensureInitialData();

// Detect whether running in Electron desktop app or standard web browser
const isElectron =
  typeof window !== 'undefined' &&
  (Boolean((window as any).posApi?.isElectron) ||
    window.location.protocol === 'file:' ||
    navigator.userAgent.includes('Electron'));

// If in Web browser and URL has legacy hash route (e.g. /#/pos/fastfood), cleanly rewrite to /pos/fastfood
if (!isElectron && typeof window !== 'undefined' && window.location.hash.startsWith('#/')) {
  const cleanPath = window.location.hash.slice(1);
  window.history.replaceState(null, '', cleanPath);
}

const Router = isElectron ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Router>
        <AppProviders>
          <App />
        </AppProviders>
      </Router>
    </ErrorBoundary>
  </React.StrictMode>,
);


