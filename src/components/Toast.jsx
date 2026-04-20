import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur || 5000),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onRemove }) {
  const icons = {
    success: <CheckCircle size={16} className="text-success-400 flex-shrink-0" />,
    error: <XCircle size={16} className="text-danger-400 flex-shrink-0" />,
    warning: <AlertCircle size={16} className="text-warning-400 flex-shrink-0" />,
    info: <Info size={16} className="text-primary-400 flex-shrink-0" />,
  }

  const colors = {
    success: 'border-success-500/30 bg-surface-900',
    error: 'border-danger-500/30 bg-surface-900',
    warning: 'border-warning-500/30 bg-surface-900',
    info: 'border-primary-500/30 bg-surface-900',
  }

  return (
    <div className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg animate-slide-down ${colors[toast.type]}`}>
      {icons[toast.type]}
      <p className="text-sm text-surface-200 flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 text-surface-500 hover:text-surface-300 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
