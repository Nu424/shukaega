import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { isLocalStorageAvailable } from '../utils/storage'
import { useOpenRouterStore } from '../stores/useOpenRouterStore'

const SettingsPage = () => {
  const { apiKey, model, setApiKey, setModel } = useOpenRouterStore((state) => ({
    apiKey: state.apiKey,
    model: state.model,
    setApiKey: state.setApiKey,
    setModel: state.setModel,
  }))
  const [localApiKey, setLocalApiKey] = useState(apiKey ?? '')
  const [localModel, setLocalModel] = useState(model)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  useEffect(() => {
    setLocalApiKey(apiKey ?? '')
  }, [apiKey])

  useEffect(() => {
    setLocalModel(model)
  }, [model])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setApiKey(localApiKey.trim() || null)
    setModel(localModel.trim() || 'openai/gpt-4o-mini')
    setSavedMessage('設定を保存しました。')
    setTimeout(() => setSavedMessage(null), 2500)
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-slate-900">OpenRouter 設定</h2>
        <p className="mt-1 text-sm text-slate-600">
          APIキーとモデル名を設定すると、LLMのフィードバックが有効になります。
        </p>
        {!isLocalStorageAvailable && (
          <p className="mt-2 text-sm text-amber-600">
            この環境では localStorage が利用できないため、設定はページを更新するとリセットされます。
          </p>
        )}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="block">
            <span className="block text-sm font-medium text-slate-700">APIキー</span>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 focus:border-indigo-400 focus:outline-none focus:ring"
              placeholder="sk-..."
              value={localApiKey}
              onChange={(event) => setLocalApiKey(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-slate-700">モデル名</span>
            <input
              type="text"
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 focus:border-indigo-400 focus:outline-none focus:ring"
              placeholder="openai/gpt-4o-mini"
              value={localModel}
              onChange={(event) => setLocalModel(event.target.value)}
            />
          </label>
          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-white shadow transition hover:bg-indigo-700"
          >
            保存する
          </button>
          {savedMessage && (
            <p className="text-sm text-emerald-600">{savedMessage}</p>
          )}
        </form>
      </section>
    </div>
  )
}

export default SettingsPage
