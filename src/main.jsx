import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { RoleProvider } from './RoleContext.jsx'

createRoot(document.getElementById('root')).render(
    <RoleProvider >
    <App />
    </RoleProvider>  
)
