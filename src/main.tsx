import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {ThemeProvider} from 'next-themes';
import {LanguageProvider} from './lib/LanguageContext';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark">
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Disable SW for now to avoid stale cache white-screen issues on Pages.
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    } catch (err) {
      console.log('ServiceWorker cleanup failed: ', err);
    }
  });
}
