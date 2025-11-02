import { NavLink } from 'react-router-dom'

type SidebarProps = {
  isOpen: boolean
  onClose: () => void
}

const links = [
  { to: '/', label: 'Home', description: 'メイントレーニング' },
  { to: '/review', label: 'Review', description: '間違えた問題を復習' },
  { to: '/settings', label: 'Settings', description: 'キーとモデルの設定' },
]

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const backdropClasses = [
    'fixed inset-0 z-40 bg-slate-900/40 transition-opacity lg:hidden',
    isOpen ? 'opacity-100 pointer-events-auto' : 'pointer-events-none opacity-0',
  ].join(' ')

  const containerClasses = [
    'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white p-6 shadow-lg transition-transform duration-200 lg:static lg:translate-x-0 lg:shadow-none',
    isOpen ? 'translate-x-0' : '-translate-x-full lg:-translate-x-0',
  ].join(' ')

  return (
    <>
      <div className={backdropClasses} onClick={onClose} aria-hidden="true" />
      <aside className={containerClasses}>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-slate-800">学習メニュー</p>
            <p className="text-xs text-slate-400">トレーニングや復習、設定を行えます</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 lg:hidden"
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  'rounded-2xl border border-transparent p-4 text-left transition hover:border-indigo-100 hover:bg-indigo-50/70',
                  isActive ? 'border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm' : '',
                ].join(' ')
              }
            >
              <p className="text-base font-semibold">{link.label}</p>
              <p className="text-xs text-slate-500">{link.description}</p>
            </NavLink>
          ))}
        </nav>
        <div className="mt-8 space-y-2 text-xs text-slate-400">
          <p>Tip: モバイルでは左上のメニューからナビゲーションできます。</p>
          <p>
            Shortcuts: <span className="rounded bg-slate-100 px-2 py-0.5">?</span> キーでヘルプを開く予定。
          </p>
        </div>
      </aside>
    </>
  )
}
