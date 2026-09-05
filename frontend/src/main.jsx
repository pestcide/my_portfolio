import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/source-serif-4'
import '@fontsource-variable/noto-serif-sc'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './components/ui/toast'
import { ConfirmProvider } from './components/ui/confirm-dialog'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <ConfirmProvider>
        <App />
      </ConfirmProvider>
    </ToastProvider>
  </StrictMode>,
)
