export default function Settings() {
  return (
    <div className="space-y-4 rounded-3xl bg-white p-6 shadow-md">
      <h1 className="text-2xl font-semibold text-slate-800">設定</h1>
      <p className="text-sm text-slate-500">
        APIキーやモデル、フィードバックの粒度、英語レベルなどを管理するページです。現在はヘッダーの「Settings」ボタンから開くモーダルで API キーを保存できます。
      </p>
      <div className="space-y-3 text-sm text-slate-600">
        <p>・モード: 通常練習 / テーマ練習 / 復習モード</p>
        <p>・フィードバック詳細度: 短め / 普通 / 詳細</p>
        <p>・英語レベル: 中学 / 高校 / ビジネス</p>
        <p>これらの設定は zustand ストアで保持し、将来的に localStorage に永続化予定です。</p>
      </div>
    </div>
  )
}
