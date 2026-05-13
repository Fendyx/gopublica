import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext'; // ← импорт
import router from './router';
import './index.css';
import './shared/i18n/config';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider> {/* ← оборачиваем */}
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
);