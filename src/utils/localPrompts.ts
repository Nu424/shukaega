import type { Prompt } from '../types/lesson'

const LOCAL_PROMPTS: Prompt[] = [
  {
    id: 'local-1',
    ja: '私は昨日、友だちと映画を見に行きました。',
    theme: 'daily',
    level: 'normal',
    source: 'local',
  },
  {
    id: 'local-2',
    ja: 'この席は空いていますか？',
    theme: 'travel',
    level: 'easy',
    source: 'local',
  },
  {
    id: 'local-3',
    ja: 'もっとゆっくり話していただけますか？',
    theme: 'communication',
    level: 'normal',
    source: 'local',
  },
  {
    id: 'local-4',
    ja: 'コーヒーを一杯いただけますか？',
    theme: 'daily',
    level: 'easy',
    source: 'local',
  },
  {
    id: 'local-5',
    ja: '彼にメールを送っておいてくれますか？',
    theme: 'business',
    level: 'normal',
    source: 'local',
  },
]

export const getRandomPrompt = (theme?: string): Prompt => {
  const candidates = theme
    ? LOCAL_PROMPTS.filter((prompt) => prompt.theme === theme)
    : LOCAL_PROMPTS

  if (candidates.length === 0) {
    return LOCAL_PROMPTS[Math.floor(Math.random() * LOCAL_PROMPTS.length)]
  }

  return candidates[Math.floor(Math.random() * candidates.length)]
}

export const getLocalPrompts = (): Prompt[] => [...LOCAL_PROMPTS]
