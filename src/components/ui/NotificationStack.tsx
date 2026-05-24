import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import clsx from 'clsx'
import { useNotifications } from '@/store'

export function NotificationStack() {
  const { notifications, dismiss } = useNotifications()

  if (notifications.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map(n => (
        <div
          key={n.id}
          className={clsx(
            'flex items-start gap-3 px-4 py-3 rounded-card border shadow-lg',
            'pointer-events-auto animate-fade-up backdrop-blur-sm',
            n.type === 'success' && 'bg-surface-2/95 border-accent/30',
            n.type === 'error'   && 'bg-surface-2/95 border-danger/30',
            n.type === 'info'    && 'bg-surface-2/95 border-border-default',
          )}
        >
          <div className="shrink-0 mt-0.5">
            {n.type === 'success' && <CheckCircle2 size={15} className="text-accent" />}
            {n.type === 'error'   && <AlertCircle  size={15} className="text-danger" />}
            {n.type === 'info'    && <Info          size={15} className="text-text-secondary" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary">{n.title}</p>
            {n.body && <p className="text-xs text-text-muted mt-0.5">{n.body}</p>}
          </div>
          <button onClick={() => dismiss(n.id)} className="text-text-muted hover:text-text-primary shrink-0">
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  )
}
