import { useMemo, useState } from 'react'
import AnswerInput from '../components/AnswerInput'
import FeedbackPanel from '../components/FeedbackPanel'
import PromptCard from '../components/PromptCard'

type Prompt = {
  id: string
  japanese: string
  theme: string
  level: string
  source: 'local' | 'llm'
}

type Feedback = {
  status: 'success' | 'warning' | 'error'
  correctExample: string
  difference: string
  grammarPoint: string
  encouragement: string
  variations: string[]
}

const localPrompts: Prompt[] = [
  {
    id: '1',
    japanese: '私は昨日、友だちと映画を見に行きました。',
    theme: '日常会話',
    level: 'Beginner',
    source: 'local',
  },
  {
    id: '2',
    japanese: 'もっとゆっくり話していただけますか？',
    theme: '旅行',
    level: 'Intermediate',
    source: 'local',
  },
]

const sampleFeedback: Feedback = {
  status: 'warning',
  correctExample: 'I went to see a movie with my friend yesterday.',
  difference: 'went movie → went to see a movie',
  grammarPoint: '過去形 + 不定詞の使い方を意識しましょう。',
  encouragement: 'Almost there! 🎉 ほんの少しで完璧です。',
  variations: ['Yesterday, I went to a movie with my friend.', 'My friend and I watched a film yesterday.'],
}

export default function Home() {
  const [promptIndex, setPromptIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [status, setStatus] = useState<'idle' | 'success' | 'warning' | 'error'>('idle')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentPrompt = useMemo(() => localPrompts[promptIndex % localPrompts.length], [promptIndex])

  const handleSubmit = () => {
    if (!answer.trim()) {
      setStatus('error')
      setFeedback({
        ...sampleFeedback,
        status: 'error',
        encouragement: 'まずは文章を入力してみましょう！💪',
      })
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      setFeedback(sampleFeedback)
      setStatus(sampleFeedback.status)
      setIsSubmitting(false)
    }, 600)
  }

  const handleNextPrompt = () => {
    setPromptIndex((prev) => prev + 1)
    setAnswer('')
    setFeedback(null)
    setStatus('idle')
    setIsSubmitting(false)
  }

  const handleRetrySimilar = () => {
    setFeedback(sampleFeedback)
    setStatus(sampleFeedback.status)
  }

  return (
    <div className="flex flex-col gap-6">
      <PromptCard
        japanese={currentPrompt.japanese}
        theme={currentPrompt.theme}
        level={currentPrompt.level}
        source={currentPrompt.source}
        onRetrySimilar={handleRetrySimilar}
      />
      <AnswerInput
        value={answer}
        onChange={setAnswer}
        onSubmit={handleSubmit}
        onNext={handleNextPrompt}
        isSubmitting={isSubmitting}
      />
      <FeedbackPanel
        status={status}
        correctExample={feedback?.correctExample}
        difference={feedback?.difference}
        grammarPoint={feedback?.grammarPoint}
        encouragement={feedback?.encouragement}
        variations={feedback?.variations}
      />
    </div>
  )
}
