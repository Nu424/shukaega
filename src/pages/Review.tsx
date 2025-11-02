export default function Review() {
  return (
    <div className="space-y-4 rounded-3xl bg-white p-6 shadow-md">
      <h1 className="text-2xl font-semibold text-slate-800">復習モード</h1>
      <p className="text-sm text-slate-500">
        間違えたお題がここに一覧表示されます。zustand ストアと localStorage の永続化で記録を残し、いつでも再チャレンジできるようにする予定です。
      </p>
      <ul className="space-y-2 text-sm text-slate-600">
        <li className="rounded-2xl border border-dashed border-slate-200 px-4 py-3">まだ復習リストは空です。トレーニングを進めましょう！</li>
        <li className="rounded-2xl border border-dashed border-slate-200 px-4 py-3">進捗が溜まったらここにカード形式で表示されます。</li>
      </ul>
    </div>
  )
}
