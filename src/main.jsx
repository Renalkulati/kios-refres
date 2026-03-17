import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/global.css'
import App from './App.jsx'
import AdminStandalone from './AdminStandalone.jsx'

// VITE_MODE=admin → tampilkan hanya dashboard admin
// VITE_MODE=store (atau kosong) → tampilkan toko customer
const mode = import.meta.env.VITE_MODE || "store";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {mode === "admin" ? <AdminStandalone /> : <App />}
  </React.StrictMode>,
)