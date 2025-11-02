type PromptCardProps = {
  japanese: string
  theme: string
  level: string
  source: 'local' | 'llm'
  onRetrySimilar?: () => void
}

export default function PromptCard({ japanese, theme, level, source, onRetrySimilar }: PromptCardProps) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-md transition hover:shadow-lg">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-600">{theme}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">{level}</span>
        <span className="text-slate-400">{source === 'local' ? 'ローカルお題' : 'LLM生成'}</span>
      </div>
      <p className="mt-4 text-2xl font-semibold leading-relaxed text-slate-800">{japanese}</p>
      <div className="mt-6 flex items-center justify-between text-sm text-indigo-600">
        <button
          type="button"
          onClick={onRetrySimilar}
          className="rounded-full border border-indigo-100 px-4 py-2 font-medium transition hover:bg-indigo-50"
        >
          似たお題をもう1問
        </button>
        <span className="text-xs text-slate-400">1/20</span>
      </div>
    </section>
  )
}
