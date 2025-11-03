# 🎯 Shukaega — 瞬間英作文トレーナー

ようこそ Shukaega へ！React × TypeScript × Tailwind CSS でつくられた瞬間英作文トレーニング用 SPA です。サクサク学べる UI と OpenRouter 連携で、"聞く → 考える → 直す" のリズムを止めません。

---

## ✨ ハイライト
- 🧠 **テーマ別バッチ生成**: テーマとレベルに合わせてお題をまとめて生成。キュー残量や補充状況がリアルタイムにわかります。
- ⌨️ **ショートカット満載の回答エディタ**: Enter で送信、Shift+Enter で次のお題へ。迷ったときは「わからない」ボタンで即採点。
- 📝 **色分けフィードバックカード**: スコアに応じたカラー表示と、復習リストへの登録ボタンで弱点克服をサポート。
- 🔁 **復習モード搭載**: 苦手だったお題や手動で追加した問題をまとめて再挑戦。履歴からピックアップしてリスト管理もラクラク。
- 🔐 **OpenRouter 設定画面**: API キー・モデル・英語レベル・フィードバック粒度を保存し、ローカルストレージへ安全に永続化します。
- 📱 **レスポンシブレイアウト**: サイドバー付きのレイアウトで、デスクトップでもモバイルでも快適に操作できます。

---

## 🗺️ 画面ツアー
1. **ホーム / トレーニング**
   - お題カード、回答エリア、フィードバックを縦並びで配置。
   - テーマ切り替え＆カスタムテーマ入力、キュー残量表示を常時チェック。
   - スコアに応じて `success / warning / error` をマッピングし、UI の色味に反映。
2. **復習**
   - スコアが閾値未満の履歴や手動追加分をカード表示。
   - 「もう一度チャレンジ」でホームへジャンプし、即リトライ。
3. **設定**
   - OpenRouter API キーやモデル選択、英語レベル、フィードバック粒度を GUI で調整。
   - お気に入りテーマも保存され、次回の生成に反映されます。

---

## 🧩 アーキテクチャ
- ⚡️ **Vite + React 18**: `@vitejs/plugin-react-swc` で爆速な開発体験。
- 🎨 **Tailwind CSS**: コンポーネントごとに軽快なデザインを適用。
- 🗄️ **Zustand ストア x 3**:
  - `useLessonStore` — お題キュー、回答、評価フローを管理。
  - `useHistoryStore` — 履歴と復習リストをローカルストレージに永続化。
  - `useOpenRouterStore` — API キー・モデル・学習レベルなどの設定を保持。
- 🤖 **OpenRouter API 連携**:
  - お題生成 (`generatePromptsBatch`) と回答評価 (`evaluateAnswer`) を LLM に委譲。
  - JSON Schema を意識したレスポンスを `parser` サービスでバリデート。
- 🔄 **キューの自動補充**: 最大 10 件のバッチを保持し、半分を切ったらバックグラウンドで補充。

---

## 🛠️ セットアップ
```bash
npm install
npm run dev      # 開発サーバーを起動 (http://localhost:5173)
npm run build    # 本番ビルドを生成
npm run preview  # ビルド結果の確認
npm run lint     # コード品質チェック
```

### 🔑 OpenRouter API キーの設定
1. [OpenRouter](https://openrouter.ai/) で API キーを取得。
2. アプリの「⚙️ Settings」画面で API キーと利用モデルを入力し保存。
3. キーはブラウザのローカルストレージのみに保存されます。共有 PC での利用は避けましょう。
4. モデルはプリセットから選ぶか、自由入力欄で任意のモデルを指定可能です。

---

## 📂 ディレクトリ構成
```
.
├─ src/
│  ├─ components/        # UI コンポーネント（AnswerInput, FeedbackPanel など）
│  ├─ pages/             # 主要ページ（Home, Review, Settings）
│  ├─ services/          # OpenRouter 連携 & パーサ
│  ├─ stores/            # Zustand ストア群
│  └─ utils/             # 定数・ローカルお題など
├─ document/
│  ├─ how_to_use-LLMAPI.md
│  └─ plan.md
└─ vite.config.ts        # base が `/shukaega/` に設定済み
```

---

## 🚀 デプロイのヒント
- GitHub Pages などサブパス配信を想定し、`vite.config.ts` の `base` は既に `/shukaega/` になっています。
- 独自ドメイン等でルート配信する場合は、`base` 設定を必要に応じて書き換えてください。

---

## 🧪 テスト
⚠️ このリポジトリでは自動テストはまだ整備されていません。`npm run lint` で基本的な静的チェックを行えます。

---

## 📚 追加ドキュメント
- `document/plan.md` — 機能ごとの設計メモ。
- `document/how_to_use-LLMAPI.md` — OpenRouter API 利用の補足資料。

楽しくテンポ良く学んで、英作文スキルをブーストしましょう！🚀
