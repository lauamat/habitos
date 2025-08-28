import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import SessionRefresher from './components/shared/SessionRefresher'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SessionRefresher />
    <App />
  </React.StrictMode>,
)
