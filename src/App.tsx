import { useEffect, useMemo, useState } from 'react'

import HomePage from './pages/Home'
import ReviewPage from './pages/Review'
import SettingsPage from './pages/Settings'
import { useHistoryStore } from './stores/useHistoryStore'
import { useLessonStore } from './stores/useLessonStore'
import { useOpenRouterStore } from './stores/useOpenRouterStore'

type PageKey = 'home' | 'review' | 'settings'

const navItems: Array<{ key: PageKey; label: string }> = [
  { key: 'home', label: 'ホーム' },
  { key: 'review', label: '復習・履歴' },
  { key: 'settings', label: '設定' },
]

const App = () => {
  const [activePage, setActivePage] = useState<PageKey>('home')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [localApiKey, setLocalApiKey] = useState('')
  const [localModel, setLocalModel] = useState('openai/gpt-4o-mini')

  const {
    apiKey,
    model,
    hydrated,
    loadFromLocalStorage: loadOpenRouter,
    setApiKey,
    setModel,
  } = useOpenRouterStore((state) => ({
    apiKey: state.apiKey,
    model: state.model,
    hydrated: state.hydrated,
    loadFromLocalStorage: state.loadFromLocalStorage,
    setApiKey: state.setApiKey,
    setModel: state.setModel,
  }))
  const loadHistory = useHistoryStore((state) => state.loadFromLocalStorage)
  const historyItems = useHistoryStore((state) => state.items)
  const initializeLesson = useLessonStore((state) => state.initialize)
  const lessonMode = useLessonStore((state) => state.mode)
  const lessonError = useLessonStore((state) => state.error)

  useEffect(() => {
    loadOpenRouter()
    loadHistory()
  }, [loadOpenRouter, loadHistory])

  useEffect(() => {
    if (hydrated) {
      initializeLesson()
    }
  }, [hydrated, initializeLesson])

  useEffect(() => {
    if (hydrated && !apiKey) {
      setIsModalOpen(true)
    }
  }, [hydrated, apiKey])

  useEffect(() => {
    setLocalApiKey(apiKey ?? '')
  }, [apiKey])

  useEffect(() => {
    setLocalModel(model)
  }, [model])

  useEffect(() => {
    if (lessonMode === 'review') {
      setActivePage('home')
    }
  }, [lessonMode])

  const totalSolved = useMemo(() => historyItems.length, [historyItems])

  const handleSaveKey = () => {
    setApiKey(localApiKey.trim() || null)
    setModel(localModel.trim() || 'openai/gpt-4o-mini')
    setIsModalOpen(false)
  }

  const handleStartReview = () => {
    setActivePage('home')
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">瞬間英作文ブートキャンプ</h1>
            <p className="text-sm text-slate-500">
              合計 {totalSolved} 問に挑戦しました。{lessonMode === 'review' ? '復習モード中です。' : ''}
            </p>
            {lessonError && (
              <p className="text-xs text-red-600">{lessonError}</p>
            )}
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActivePage(item.key)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  activePage === item.key
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {activePage === 'home' && <HomePage />}
        {activePage === 'review' && <ReviewPage onStartReview={handleStartReview} />}
        {activePage === 'settings' && <SettingsPage />}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">OpenRouter APIキーを設定</h2>
            <p className="mt-1 text-sm text-slate-600">
              フィードバックを有効にするには、OpenRouterのAPIキーが必要です。設定はローカルに保存されます。
            </p>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              APIキー
              <input
                type="password"
                className="mt-1 w-full rounded-xl border border-slate-200 p-3 focus:border-indigo-400 focus:outline-none focus:ring"
                placeholder="sk-..."
                value={localApiKey}
                onChange={(event) => setLocalApiKey(event.target.value)}
              />
            </label>
            <label className="mt-3 block text-sm font-medium text-slate-700">
              モデル名
              <input
                type="text"
                className="mt-1 w-full rounded-xl border border-slate-200 p-3 focus:border-indigo-400 focus:outline-none focus:ring"
                placeholder="openai/gpt-4o-mini"
                value={localModel}
                onChange={(event) => setLocalModel(event.target.value)}
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-full px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
                onClick={() => setIsModalOpen(false)}
              >
                後で
              </button>
              <button
                type="button"
                className="rounded-full bg-indigo-600 px-4 py-2 text-sm text-white shadow hover:bg-indigo-700"
                onClick={handleSaveKey}
              >
                保存する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
