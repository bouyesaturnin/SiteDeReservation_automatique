import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // <-- IMPORTANT
import App from './App.jsx'
import './index.css'
import { SiteSettingsProvider } from './context/SiteSettingsContext'
import { ToastProvider } from './context/ToastContext'
import { ThemeProvider } from './context/ThemeContext'
import { FavoriteProvider } from './context/FavoriteContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <SiteSettingsProvider>
          <ToastProvider>
            <FavoriteProvider>
              <App />
            </FavoriteProvider>
          </ToastProvider>
        </SiteSettingsProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
