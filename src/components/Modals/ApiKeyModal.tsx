import { useEffect, useState } from 'react'

type ApiKeyModalProps = {
  open: boolean
  onClose: () => void
}

export default function ApiKeyModal({ open, onClose }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('openrouter/auto')
  const [savedMessage, setSavedMessage] = useState('')

  useEffect(() => {
    if (open && typeof window !== 'undefined') {
      const storedKey = window.localStorage.getItem('openrouter_api_key') ?? ''
      const storedModel = window.localStorage.getItem('openrouter_model') ?? 'openrouter/auto'
      setApiKey(storedKey)
      setModel(storedModel)
      setSavedMessage('')
    }
  }, [open])

  const handleSave = () => {
    if (typeof window === 'undefined') return

    window.localStorage.setItem('openrouter_api_key', apiKey)
    window.localStorage.setItem('openrouter_model', model)
    setSavedMessage('保存しました！共有PCでは利用しないでください。')
    setTimeout(() => setSavedMessage(''), 2500)
  }

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">OpenRouter APIキー</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          キーはブラウザの localStorage に保存されます。共有PCでは使用しないでください。
        </p>
        <div className="mt-4 space-y-4">
          <label className="block text-sm font-medium text-slate-600">
            API Key
            <input
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              placeholder="sk-or-v1-..."
            />
          </label>
          <label className="block text-sm font-medium text-slate-600">
            Model
            <input
              value={model}
              onChange={(event) => setModel(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              placeholder="openai/gpt-4o-mini"
            />
          </label>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            キーを保存
          </button>
          {savedMessage && <p className="text-xs text-emerald-600">{savedMessage}</p>}
        </div>
      </div>
    </div>
  )
}
