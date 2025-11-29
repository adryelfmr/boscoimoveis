import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initGA } from './utils/analytics'
import { SpeedInsights } from '@vercel/speed-insights/react' // ✅ NOVO IMPORT
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { AuthProvider } from './contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // ✅ NOVO: Sempre buscar dados frescos
      cacheTime: 0, // ✅ NOVO: Não manter cache
      refetchOnWindowFocus: true, // ✅ NOVO: Atualizar ao focar janela
      refetchOnMount: true, // ✅ NOVO: Atualizar ao montar componente
    },
  },
});

// Inicializar Google Analytics
initGA();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);

// ✅ NOVO: Desregistrar Service Workers antigos
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
    });
  });
}
