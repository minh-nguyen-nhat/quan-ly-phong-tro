import { AlertTriangle, X } from 'lucide-react'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Xác nhận', confirmVariant = 'danger', loading = false }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface-900 border border-surface-800 rounded-2xl w-full max-w-sm mx-4 animate-slide-up p-5">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            confirmVariant === 'danger' ? 'bg-danger-500/15' : 'bg-warning-500/15'
          }`}>
            <AlertTriangle size={20} className={confirmVariant === 'danger' ? 'text-danger-400' : 'text-warning-400'} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-surface-50 mb-1">{title}</h3>
            <p className="text-sm text-surface-400">{message}</p>
          </div>
          <button onClick={onClose} className="btn-ghost btn-sm p-1 flex-shrink-0">
            <X size={16} />
          </button>
        </div>
        <div className="flex gap-3 mt-5 justify-end">
          <button onClick={onClose} className="btn-secondary btn-sm" disabled={loading}>
            Hủy bỏ
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`btn btn-sm ${confirmVariant === 'danger' ? 'btn-danger' : 'btn-warning'}`}
          >
            {loading ? 'Đang xử lý...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
