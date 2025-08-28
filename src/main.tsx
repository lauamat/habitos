import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import HabitsGate from './components/shared/HabitsGate'  // ← esta ruta
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HabitsGate>
      <App />
    </HabitsGate>
  </React.StrictMode>,
)
