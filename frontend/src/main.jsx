import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '../styles/accessibility.css'
import App from './App.jsx'
import { AccessibilityProvider } from '../context/AccessibilityContext'
import AccessibilityPanel from '../components/AccessibilityPanel'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AccessibilityProvider>
      <App />
      <AccessibilityPanel />
    </AccessibilityProvider>
  </StrictMode>,
)
