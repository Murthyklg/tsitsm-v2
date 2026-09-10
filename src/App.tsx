import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { Login } from './components/Login'
import { Dashboard } from './pages/Dashboard'
import { IncidentPortal } from './pages/IncidentPortal'
import './App.css'

const PORTAL_STORAGE_KEY = 'asset-management-selected-portal'

const getStoredPortal = (): 'assets' | 'incidents' => {
  if (typeof window === 'undefined') {
    return 'incidents'
  }

  const storedPortal = window.localStorage.getItem(PORTAL_STORAGE_KEY)
  return storedPortal === 'incidents' ? 'incidents' : storedPortal === 'assets' ? 'assets' : 'incidents'
}

function App() {
  const { user, loading } = useAuth()
  const [selectedPortal, setSelectedPortal] = useState<'assets' | 'incidents'>(getStoredPortal)
  if (typeof window !== 'undefined') window.localStorage.setItem(PORTAL_STORAGE_KEY, selectedPortal)

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <>
      {user ? (
        selectedPortal === 'incidents' ? <IncidentPortal onPortalSwitch={setSelectedPortal} selectedPortal={selectedPortal} /> : <Dashboard onPortalSwitch={setSelectedPortal} selectedPortal={selectedPortal} />
      ) : (
        <Login onLoginSuccess={() => {
          window.location.reload()
        }} />
      )}
    </>
  )
}




export default App
