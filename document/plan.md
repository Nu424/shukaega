以下にアプリの設計書案をまとめます。実装のしやすさと「楽しく学ぶ」体験を両立する構成にしてあります。記述は抽象度を維持しつつ、どこに何を書くかがわかるレベルで具体化しています。

---

# 1. アプリ概要

英語の「瞬間英作文」トレーニングをブラウザで行う SPA。

1. お題（日本語）を表示
2. ユーザーが英語で回答
3. LLMがフィードバック（正答候補・改善点・簡単な解説・励まし）
4. 学習の進捗や「調子の良さ」をUIで可視化
   というループを高速で回せるようにする。

**技術スタック**

* フロント: React + Vite + TypeScript（`npm create vite@latest` ベース）
* スタイリング: TailwindCSS
* 状態管理: zustand
* LLM連携: OpenRouter API をブラウザから直接呼び出す（BYOK）
* APIキー保存: `localStorage`（ユーザー個別利用前提）
* SSR不要、CSRで完結

---

# 2. 主要ユースケース

1. **初回起動**

   * APIキー未設定 → キー入力モーダルを表示
   * 説明用の「チュートリアルお題」をローカルで1問出す（LLM不使用でも動くことを体感させる）
2. **お題を解く（ランダム）**

   * テーマ未指定 → アプリがプリセットテーマからランダム選択 → LLMに「お題生成」リクエスト（またはローカルプリセットを表示）
   * お題を表示 → 入力欄で回答 → LLMに「英作文評価＋改善指示」リクエスト → 結果を表示
3. **お題を解く（テーマ指定）**

   * テーマ選択パネルから「日常会話」「旅行」「ビジネス」「基礎構文」「時制トレーニング」などを選択
   * 選択テーマに応じてLLMへ「そのテーマで瞬間英作文用の日本語文を1つ生成して」と送る
4. **復習モード**

   * 以前間違えたお題を一覧表示し、再トライ
   * 一覧データはローカル（zustand + localStorage 永続化）で保持
5. **設定**

   * OpenRouter APIキーの登録・変更
   * モデル選択（例: `openai/gpt-4o-mini` 相当、`qwen` 系など）※モデル名はUIに直接書くだけ、実体取得はユーザーに任せる
   * フィードバックの粒度（短め／普通／詳細）
   * 英語レベル（中学〜ビジネス）→ プロンプトに反映

---

# 3. 画面設計（UI/UX）

## 3.1 画面構成（SPA）

* **App Layout**

  * 上部バー: アプリ名、現在のテーマ、学習ストリーク(🔥アイコン)、設定アイコン
  * 左サイド（幅狭／モバイル時はドロワー）: テーマ一覧、復習、履歴
  * メインペイン: 現在のお題＋入力欄＋フィードバック
  * 下部: 「次のお題へ」ボタン、ショートカット表示

## 3.2 メインペイン詳細

1. **お題カード**

   * 日本語文
   * 難易度タグ（LLM生成時に一緒に返してもらう、なければ推定）
   * テーマタグ（旅行 / 日常 / ビジネス など）
   * 小さな「もう一度似たやつ」ボタン

2. **回答エリア**

   * 大きめのテキストエリア（入力中は枠を光らせる）
   * Enterで送信 / Ctrl+Enterで送信もサポート
   * プレースホルダに「I ...」など例を出す
   * 送信中はボタンを「採点中...」に変更＋ローディングアニメ

3. **フィードバックパネル**

   * 成功／惜しい／もう一歩 を色で分ける（緑／黄／赤）
   * 表示内容（LLMからの返却をパースしやすくするため、構造化フォーマットをプロンプトで依頼）

     * 正解候補の英文
     * ユーザーの文との差分（重要箇所だけ）
     * 一言のモチベーションメッセージ（「Good!」「ほぼ完璧！」など）
     * 文法ポイントの短い説明（1〜2行）
     * 例文のバリエーション（あれば1〜2個）
   * 「聞いてみる（英語で読み上げ）」ボタン（※本設計では抽象化：Web Speech APIや後付けのTTSに任せる）

4. **ゲーミフィケーション要素**

   * 回答ごとに「XP +5」などをアニメで右上に飛ばす
   * 今日解いた数・連続日数を表示
   * フィードバックにスタンプ（👍 😎 🎉）を載せる

## 3.3 設定モーダル

* APIキー入力欄（`localStorage.openrouter_api_key` に保存）
* モデル名入力欄（デフォルト値を置く）
* 「キーを保存」ボタン
* 保存結果をトースト表示

---

# 4. 状態管理（zustand）

## 4.1 ストア分割の方針

1. **authStore（というより「openRouterStore」）**

   * `apiKey: string | null`
   * `model: string`（ユーザーがUIで指定）
   * `loadFromLocalStorage()`
   * `saveToLocalStorage()`

2. **lessonStore**

   * 現在のお題: `currentPrompt: Prompt`

     * `id`, `jaSentence`, `theme`, `level`, `source`（`"local" | "llm"`）
   * 現在の回答: `userAnswer: string`
   * フィードバック: `feedback: Feedback | null`
   * ローディング状態: `isGeneratingPrompt`, `isEvaluating`
   * アクション:

     * `generatePrompt(theme?)` → LLM or ローカルから取得
     * `evaluateAnswer()` → LLMへ送信
     * `next()` → フィードバックを履歴に保存して次のお題

3. **historyStore**

   * `items: Array<{prompt, userAnswer, feedback, timestamp}>`
   * `add(item)`
   * `getWrongOnes()`
   * `persist` (localStorage)

zustandの`persist`ミドルウェアで `localStorage` に自動永続化しておく。

---

# 5. LLM連携（OpenRouter）

## 5.1 呼び出し前提

* ブラウザから直接 `fetch("https://openrouter.ai/api/v1/chat/completions", ...)`
* ヘッダにユーザーのAPIキー（`Authorization: Bearer ${apiKey}`）
* デプロイ時は「個人利用前提」でキーをユーザーに入力してもらう方式なので、サーバ側にキーは持たない
* モデル名はユーザーが設定画面で指定する
* CORSはOpenRouter側の仕様に依存するため、実装時は事前に確認しておく（問題あれば簡易プロキシを別途用意）

## 5.2 プロンプト設計（抽象）

### ①お題生成プロンプト

* システムロールで「日本語で瞬間英作文に使える短い文を1つだけ出す」「英語レベルを指定できる」などを定義
* ユーザーロールで「テーマ: 旅行」のような要求を渡す
* 返却形式はJSON風のテキストにするよう依頼
  例（抽象）:

  ```text
  {
    "ja": "...",
    "theme": "...",
    "level": "..."
  }
  ```

### ②回答評価プロンプト

* システムロールで「ユーザーの英作文を採点する英語講師」ロール
* 必要パラメータ: 日本語文、ユーザー英文
* 出力は以下のような構造を要求（JSON”風”でOK、厳密パースは失敗時にフォールバックする）

  ```text
  {
    "score": 0-100,
    "correct_example": "...",
    "difference": "...",
    "grammar_point": "...",
    "encouragement": "..."
  }
  ```
* スコアに応じてUIで色を変える

## 5.3 エラーハンドリング

* キー未設定 → リクエスト前に弾いて設定モーダルを開く
* 429/500系 → トーストで「少し時間をおいてください」表示＋ローカルに用意したバックアップ英文を提示する
* JSONになっていない → 安全に文字列として表示し、最低限「正解候補」「コメント」だけ抜き出す

---

# 6. データモデル（フロント内）

```text
type Prompt = {
  id: string;
  ja: string;
  theme: "daily" | "travel" | "business" | "grammar" | string;
  level: "easy" | "normal" | "hard" | string;
  source: "local" | "llm";
};

type Feedback = {
  score: number;          // 0-100
  correctExample: string;
  difference: string;
  grammarPoint: string;
  encouragement: string;
  raw: string;            // LLM返答の原文（デバッグ用）
};

type HistoryItem = {
  id: string;
  prompt: Prompt;
  userAnswer: string;
  feedback: Feedback | null;
  createdAt: string;
};
```

※ コードではなく、あくまで構造のイメージ。

---

# 7. ローカルデータ（プリセット）

LLMが使えない・遅いときのために、最初からいくつかお題を持っておく：

* 「私は昨日、友だちと映画を見に行きました。」
* 「この席は空いていますか？」
* 「もっとゆっくり話していただけますか？」
* 「コーヒーを一杯いただけますか？」
* 「彼にメールを送っておいてくれますか？」

これらをテーマ・難易度付きで持たせ、`generatePrompt()` が失敗したらここからランダムに出す。

---

# 8. UXを楽しくする仕掛け

1. **フィードバックの感情表現**

   * LLMに「結果を20文字以内の日本語で、ポジティブに、絵文字1つ含めて返す」よう頼む
   * 成功時は背景をパッと色替え（Tailwindでトランジション）

2. **スピード重視の操作**

   * 回答後すぐに次のお題へ行けるショートカット（`Shift+Enter`で次へ）
   * 入力欄に自動フォーカス

3. **日次トラッカー**

   * 今日解いた問題数・連続日数をヘッダに常に表示
   * 1日5問で円が埋まるプログレスリング

4. **軽い音・アニメーション**

   * Viteで簡単に読み込めるSEを用意（設計レベルでは「正解時・不正解時に再生する」ことだけ記載）

---

# 9. Tailwind設計方針

* ベースレイアウトは `flex` + `min-h-screen`
* 色は「勉強アプリ」らしい明るいトーン（`bg-slate-50`, `bg-indigo-50`, `text-slate-900`）を基調に
* カードは `rounded-2xl`, `shadow-md`, `p-6`, `gap-4`
* スコアに応じて `bg-green-50`, `bg-yellow-50`, `bg-red-50` を出し分け
* モバイル優先（入力エリアを最上段に持ってくる）

---

# 10. セキュリティと注意点

* APIキーをlocalStorageに平文保存するため、**共有PCでは使わないよう注意書きを入れる**
* ブラウザから外部APIを叩くため、**ユーザーのキーがネットワークに出る**ことを明示
* 将来チーム利用を想定する場合は、**最小限のリバースプロキシを挟む構成に変更できるよう抽象化**しておく（現行設計では`fetchOpenRouter()`を1か所に集約）

---

# 11. ディレクトリ構成（案）

```text
src/
  main.tsx
  App.tsx
  components/
    Layout/
    PromptCard/
    AnswerInput/
    FeedbackPanel/
    Sidebar/
    Modals/ApiKeyModal.tsx
    ui/(ボタン・トーストなど)
  stores/
    useOpenRouterStore.ts
    useLessonStore.ts
    useHistoryStore.ts
  services/
    openrouter.ts     // fetch実装と型定義（抽象）
    promptBuilder.ts  // LLMに渡すプロンプト文字列生成
    parser.ts         // LLMの返答をFeedback型に近づける
  utils/
    localPrompts.ts
    constants.ts
  pages/
    Home.tsx
    Review.tsx
    Settings.tsx
```

---

# 12. 今後の拡張を見据えたポイント

* 音声入力（英語を話しても回答できる）
* 「この日本語を瞬間英作文化して」とユーザーが日本語文を入れるカスタムお題
* モデルのレスポンス時間を短くするための「2段階LLM」（お題生成は軽いモデル、評価は高性能モデル）
* 学習ログをCSVとしてエクスポート

---

以上が設計書の初版です。この構成であれば、まずは

1. APIキー入力
2. ローカルお題を1問出す
3. 回答→LLMで評価
   の3ステップを最小プロダクトとしてすぐに立てられます。次に欲しいのは「LLMお題生成」と「履歴表示」です。
