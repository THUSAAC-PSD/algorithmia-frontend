import './index.css';
import './i18n'; // Import this line

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { Provider } from '@/components/ui/provider';

import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider>
      <App />
    </Provider>
  </StrictMode>,
);
