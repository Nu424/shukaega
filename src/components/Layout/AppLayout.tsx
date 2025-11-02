import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../Sidebar'

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [settingsNotice, setSettingsNotice] = useState<string | null>(null)
  const noticeTimeoutRef = useRef<number | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const clearNotice = () => {
      if (noticeTimeoutRef.current != null) {
        window.clearTimeout(noticeTimeoutRef.current)
        noticeTimeoutRef.current = null
      }
    }

    const redirectToSettings = (message?: string) => {
      clearNotice()
      setSettingsNotice(message ?? 'OpenRouter APIキーを設定してください。')
      if (location.pathname !== '/settings') {
        navigate('/settings')
      }
      noticeTimeoutRef.current = window.setTimeout(() => setSettingsNotice(null), 4000)
    }

    const handleNavSettings = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail
      redirectToSettings(detail?.message)
    }

    const handleLegacyModal = () => {
      redirectToSettings()
    }

    window.addEventListener('nav-settings', handleNavSettings as EventListener)
    window.addEventListener('open-apikey-modal', handleLegacyModal)
    return () => {
      window.removeEventListener('nav-settings', handleNavSettings as EventListener)
      window.removeEventListener('open-apikey-modal', handleLegacyModal)
      clearNotice()
    }
  }, [location.pathname, navigate])

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="inline-flex items-center rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 lg:hidden"
            aria-label="Open navigation"
          >
            <span className="text-2xl">☰</span>
          </button>
          <div>
            <Link to="/" className="text-xl font-semibold text-indigo-600">
              Shukaega
            </Link>
            <p className="text-sm text-slate-500">Theme: Travel Conversations</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/settings"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
          >
            <span aria-hidden>⚙️</span>
            Settings
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
          <div className="flex flex-col gap-6">
            {settingsNotice && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {settingsNotice}
              </div>
            )}
            <Outlet />
          </div>
        </main>
      </div>

      <footer className="border-t border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700">Shortcuts:</span>
            <span className="rounded-md bg-slate-100 px-2 py-1">Enter</span>
            <span>Submit</span>
            <span className="rounded-md bg-slate-100 px-2 py-1">Shift + Enter</span>
            <span>Next prompt</span>
          </div>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} Shukaega. Keep practicing daily!</p>
        </div>
      </footer>

    </div>
  )
}
