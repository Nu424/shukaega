import { type KeyboardEvent, useEffect, useRef } from 'react'

type AnswerInputProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onNext: () => void
  isSubmitting?: boolean
  autoFocus?: boolean
}

export default function AnswerInput({
  value,
  onChange,
  onSubmit,
  onNext,
  isSubmitting = false,
  autoFocus = true,
}: AnswerInputProps) {
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (autoFocus && textAreaRef.current) {
      textAreaRef.current.focus()
      textAreaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [autoFocus])

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (isSubmitting) {
      event.preventDefault()
      return
    }

    if (event.key === 'Enter' && !event.shiftKey && !event.altKey) {
      event.preventDefault()
      onSubmit()
    }

    if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault()
      onNext()
    }

    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault()
      onSubmit()
    }
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-md">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-700">あなたの英作文</h2>
        <span className="text-xs text-slate-400">Enterで送信 / Shift+Enterで次へ</span>
      </div>
      <textarea
        ref={textAreaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={5}
        placeholder="I went to the movies with my friend yesterday."
        className="mt-4 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-lg shadow-inner outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
      />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onSubmit}
            className="rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-indigo-400/70"
            disabled={isSubmitting}
          >
            {isSubmitting ? '採点中...' : '回答を送信'}
          </button>
          <button
            type="button"
            onClick={() => {
              onChange('わかりません')
              onSubmit()
            }}
            className="rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            disabled={isSubmitting}
          >
            わからない
          </button>
        </div>
        <button
          type="button"
          onClick={onNext}
          className="rounded-full border border-indigo-100 px-5 py-2 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50"
        >
          次のお題へ (Shift + Enter)
        </button>
      </div>
    </section>
  )
}
