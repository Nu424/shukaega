import type { Granularity } from '../utils/constants'

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type BuildPromptGenerationParams = {
  theme?: string
  level?: string
  count?: number
}

type BuildEvaluationMessagesParams = {
  ja: string
  userAnswer: string
  level?: string
  granularity?: Granularity
}

export function buildPromptGenerationMessages({ theme, level, count = 1 }: BuildPromptGenerationParams = {}): ChatMessage[] {
  const themeText = theme ? `テーマ: ${theme}` : 'テーマ: ランダムでバラエティ豊かに'
  const levelText = level ? `難易度: ${level}` : '難易度: 初学者から中級者に適したレベル'
  const countText = count > 1 ? `${count}件の文を` : '1件の文を'

  const systemContent = `あなたは英語学習者向けの瞬間英作文トレーナーです。短く自然な日本語文を${count}件提示してください。
- 出題は日常会話やビジネスなど実用的なシーンを意識する
- 文の長さは80文字以内
- フィールドは ja, theme, level のみを使用する
- theme と level は英単語でも日本語でも良いが、判別しやすい値にする
- レスポンスは response_format で指定された JSON スキーマに厳密に従う`

  const userContent = `${themeText}
${levelText}
${countText}生成し、バリエーションを持たせてください。`

  return [
    {
      role: 'system',
      content: systemContent,
    },
    {
      role: 'user',
      content: userContent,
    },
  ]
}

export function buildEvaluationMessages({ ja, userAnswer, level, granularity = 'normal' }: BuildEvaluationMessagesParams): ChatMessage[] {
  const granularitySentence =
    granularity === 'short'
      ? '説明は最小限に、1〜2文で簡潔に'
      : granularity === 'detail'
        ? '丁寧に、必要であれば短い箇条書きを含めて'
        : '必要十分な情報量で'

  const systemContent = `あなたは英語学習者を励ますバイリンガル講師です。学習者の英作文の良いところを認めつつ、改善点を具体的に示してください。
- 出力は必ずJSON形式の1オブジェクトのみ
- JSONキー: score, correct_example, difference, grammar_point, encouragement, variations
- scoreは0〜100の整数
- variationsは配列（1〜2件でOK、なければ空配列）
- encouragementはポジティブに20文字以内、日本語で絵文字を1つ含める
- 文法説明は日本語で簡潔に（最大2文）
- ${granularitySentence}
- ユーザーの英文の良かった点にも触れる`

  const levelLine = level ? `学習者のレベル: ${level}` : '学習者のレベル: 一般的な英語学習者'

  const userContent = `${levelLine}
評価対象の日本語文: ${ja}
学習者の英文: ${userAnswer}
上記を踏まえて評価し、以下のフォーマットで返してください:
{
  "score": 0-100,
  "correct_example": "...",
  "difference": "...",
  "grammar_point": "...",
  "encouragement": "...",
  "variations": ["..."]
}`

  return [
    {
      role: 'system',
      content: systemContent,
    },
    {
      role: 'user',
      content: userContent,
    },
  ]
}

