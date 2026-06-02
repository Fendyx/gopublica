import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import router from './router';
import './index.css';
import './shared/i18n/config';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY); // ← добавь в .env

// Принудительно очищаем тему, чтобы всегда применялась светлая (по дефолту)
document.documentElement.removeAttribute('data-theme');
localStorage.removeItem('theme'); // на всякий случай сносим из памяти

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* <ThemeProvider> */}
      <Elements stripe={stripePromise}>
        <RouterProvider router={router} />
      </Elements>
    {/* </ThemeProvider> */}
  </React.StrictMode>
);