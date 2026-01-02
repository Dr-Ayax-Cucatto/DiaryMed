import { useEffect, useState } from 'react'
import { blink } from './lib/blink'
import type { BlinkUser } from '@blinkdotnew/sdk'
import { Sidebar } from './components/layout/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { Patients } from './pages/Patients'
import { Reflections } from './pages/Reflections'
import { Goals } from './pages/Goals'
import { Spinner } from './components/ui/spinner'

function App() {
  const [user, setUser] = useState<BlinkUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'patients' | 'reflections' | 'goals'>('dashboard')

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Spinner size="lg" className="text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background p-4 text-center">
        <h1 className="text-4xl font-bold text-primary mb-4 font-serif">MediTrack Diario Pro</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Tu diario digital profesional, confidencial y organizado para la práctica médica moderna.
        </p>
        <button
          onClick={() => blink.auth.login()}
          className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium hover:scale-105 transition-transform shadow-lg"
        >
          Iniciar Sesión / Registrarse
        </button>
      </div>
    )
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard user={user} />
      case 'patients':
        return <Patients user={user} />
      case 'reflections':
        return <Reflections user={user} />
      case 'goals':
        return <Goals user={user} />
      default:
        return <Dashboard user={user} />
    }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} user={user} />
      <main className="flex-1 h-full overflow-y-auto animate-fade-in">
        {renderPage()}
      </main>
    </div>
  )
}

export default App 
