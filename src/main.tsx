import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App/>
  </StrictMode>,
)
if (localStorage.getItem('carcare-app-storage')?.includes('dark')) { document.documentElement.classList.add('dark'); }
