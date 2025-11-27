import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initGA } from './utils/analytics'
import { SpeedInsights } from '@vercel/speed-insights/react' // ✅ NOVO IMPORT

// Inicializar Google Analytics
initGA();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <SpeedInsights /> {/* ✅ NOVO COMPONENTE */}
  </StrictMode>,
)
