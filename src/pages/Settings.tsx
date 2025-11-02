import { type ChangeEvent, useEffect, useState } from 'react'

import {
  LEVELS,
  MODEL_PRESETS,
  THEMES,
  type DifficultyLevel,
  type Granularity,
} from '../utils/constants'
import { useOpenRouterStore } from '../stores/useOpenRouterStore'

const GRANULARITY_OPTIONS: { value: Granularity; label: string; description: string }[] = [
  { value: 'short', label: '短め', description: '要点だけ素早く確認します。' },
  { value: 'normal', label: '普通', description: 'バランス良くフィードバックします。' },
  { value: 'detail', label: '詳細', description: '細かな改善点まで丁寧に指摘します。' },
]

export default function Settings() {
  const { apiKey, model, level, granularity, setApiKey, setModel, setLevel, setGranularity } = useOpenRouterStore()
  const [apiKeyInput, setApiKeyInput] = useState(apiKey ?? '')
  const [selectedPreset, setSelectedPreset] = useState<(typeof MODEL_PRESETS)[number]>(MODEL_PRESETS[0])
  const [customModel, setCustomModel] = useState('')
  const [customTheme, setCustomTheme] = useState('')
  const [savedMessage, setSavedMessage] = useState('')

  useEffect(() => {
    setApiKeyInput(apiKey ?? '')
  }, [apiKey])

  useEffect(() => {
    if (!model) {
      setSelectedPreset(MODEL_PRESETS[0])
      setCustomModel('')
      return
    }

    const isPreset = MODEL_PRESETS.includes(model as (typeof MODEL_PRESETS)[number])
    if (isPreset) {
      setSelectedPreset(model as (typeof MODEL_PRESETS)[number])
      setCustomModel('')
    } else {
      setSelectedPreset(MODEL_PRESETS[0])
      setCustomModel(model)
    }
  }, [model])

  const handlePresetChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as (typeof MODEL_PRESETS)[number]
    setSelectedPreset(value)

    if (!customModel.trim()) {
      setModel(value)
    }
  }

  const handleCustomModelChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setCustomModel(value)

    const trimmed = value.trim()
    if (trimmed) {
      setModel(trimmed)
    } else {
      setModel(selectedPreset)
    }
  }

  const handleApiKeyChange = (event: ChangeEvent<HTMLInputElement>) => {
    setApiKeyInput(event.target.value)
  }

  const handleLevelChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setLevel(event.target.value as DifficultyLevel)
  }

  const handleGranularityChange = (event: ChangeEvent<HTMLInputElement>) => {
    setGranularity(event.target.value as Granularity)
  }

  const handleSaveCredentials = () => {
    const trimmedApiKey = apiKeyInput.trim()
    const trimmedCustomModel = customModel.trim()

    setApiKey(trimmedApiKey ? trimmedApiKey : null)
    setModel(trimmedCustomModel ? trimmedCustomModel : selectedPreset)

    setSavedMessage('保存しました！共有PCでは利用しないでください。')
    window.setTimeout(() => setSavedMessage(''), 2500)
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-md">
        <h1 className="text-2xl font-semibold text-slate-800">設定</h1>
        <p className="mt-2 text-sm text-slate-500">
          OpenRouter の APIキーや利用モデル、英語レベル、フィードバックの粒度をここで調整できます。キーはブラウザのストレージに保存されるので共有PCでは使用しないでください。
        </p>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-md space-y-5">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-700">OpenRouter 設定</h2>
          <p className="text-sm text-slate-500">APIキーと利用モデルを設定します。モデルはプリセットから選ぶか、自由入力で指定できます。</p>
        </header>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-600">
            API Key
            <input
              value={apiKeyInput}
              onChange={handleApiKeyChange}
              type="password"
              autoComplete="off"
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              placeholder="sk-or-v1-..."
            />
          </label>
          <p className="text-xs text-slate-400">ブラウザのローカルストレージに保存されます。取り扱いには十分ご注意ください。</p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-600">
            プリセットモデル
            <select
              value={selectedPreset}
              onChange={handlePresetChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            >
              {MODEL_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-slate-400">自由入力が空の場合はこのプリセットが利用されます。</p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-600">
            自由入力
            <input
              value={customModel}
              onChange={handleCustomModelChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              placeholder="例: openai/gpt-4o-mini"
            />
          </label>
          <p className="text-xs text-slate-400">値が入力されている場合はこちらが優先されます。</p>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleSaveCredentials}
            className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            設定を保存
          </button>
          {savedMessage && <span className="text-xs text-emerald-600">{savedMessage}</span>}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-md space-y-5">
        <header>
          <h2 className="text-lg font-semibold text-slate-700">英語レベル</h2>
          <p className="text-sm text-slate-500">現在の学習レベルに近いものを選ぶと、出題やフィードバックの表現が調整されます。</p>
        </header>
        <select
          value={level}
          onChange={handleLevelChange}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
        >
          {LEVELS.map((levelOption) => (
            <option key={levelOption} value={levelOption}>
              {levelOption}
            </option>
          ))}
        </select>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-md space-y-5">
        <header>
          <h2 className="text-lg font-semibold text-slate-700">フィードバックの粒度</h2>
          <p className="text-sm text-slate-500">学習のスタイルに合わせて、どの程度詳しくフィードバックを受け取るかを選べます。</p>
        </header>
        <div className="grid gap-3 md:grid-cols-3">
          {GRANULARITY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer flex-col gap-1 rounded-2xl border px-4 py-3 text-sm transition ${granularity === option.value ? 'border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-200 bg-slate-50 hover:border-indigo-200 hover:bg-white'}`}
            >
              <span className="flex items-center justify-between">
                <span className="font-semibold">{option.label}</span>
                <input
                  type="radio"
                  name="granularity"
                  value={option.value}
                  checked={granularity === option.value}
                  onChange={handleGranularityChange}
                  className="accent-indigo-500"
                />
              </span>
              <span className="text-xs text-slate-500">{option.description}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-md space-y-5">
        <header>
          <h2 className="text-lg font-semibold text-slate-700">よく使うテーマ</h2>
          <p className="text-sm text-slate-500">お気に入りのテーマをメモしておくと、瞬時に切り替えやすくなります。</p>
        </header>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((theme) => (
            <span key={theme} className="rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-600">
              {theme}
            </span>
          ))}
        </div>
        <input
          value={customTheme}
          onChange={(event) => setCustomTheme(event.target.value)}
          placeholder="例: 留学 / プレゼン / 電話対応"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
        />
        {customTheme.trim() && (
          <p className="text-xs text-slate-400">テーマ名はお題生成時にそのまま指定できます。ホーム画面のテーマ選択UIと連携予定です。</p>
        )}
      </section>
    </div>
  )
}
