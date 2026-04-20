import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Filter, CheckCircle, Clock } from 'lucide-react'
import { useInvoices } from '../hooks/useSupabase'
import { formatCurrency, getCurrentMonthYear, getMonthOptions, getYearOptions } from '../lib/utils'

function InvoiceRow({ invoice }) {
  const isPaid = invoice.status === 'paid'
  return (
    <tr>
      <td>
        <Link
          to={`/invoices/${invoice.id}`}
          className="font-medium text-primary-400 hover:text-primary-300 transition-colors"
        >
          {invoice.rooms?.name || '—'}
        </Link>
      </td>
      <td className="text-surface-300">Tháng {invoice.billing_month}/{invoice.billing_year}</td>
      <td className="text-surface-400 hidden sm:table-cell">{invoice.tenants?.full_name || '—'}</td>
      <td className="font-semibold text-surface-100">{formatCurrency(invoice.total_amount)}</td>
      <td>
        <span className={isPaid ? 'badge-paid' : 'badge-unpaid'}>
          {isPaid ? '✓ Đã thu' : '• Chưa thu'}
        </span>
      </td>
      <td>
        <Link to={`/invoices/${invoice.id}`} className="btn-secondary btn-sm">
          Chi tiết
        </Link>
      </td>
    </tr>
  )
}

export default function InvoicesPage() {
  const { month: curMonth, year: curYear } = getCurrentMonthYear()
  const [filterMonth, setFilterMonth] = useState(curMonth)
  const [filterYear, setFilterYear] = useState(curYear)
  const [filterStatus, setFilterStatus] = useState('all')

  const { data: invoices = [], loading } = useInvoices(filterMonth, filterYear)

  const safeInvoices = invoices || []
  const filtered = safeInvoices.filter(inv => {
    if (filterStatus === 'paid') return inv.status === 'paid'
    if (filterStatus === 'unpaid') return inv.status === 'unpaid'
    return true
  })

  const totalAmount = safeInvoices.reduce((s, inv) => s + (inv.total_amount || 0), 0)
  const paidAmount = safeInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total_amount || 0), 0)
  const unpaidAmount = totalAmount - paidAmount

  const monthOptions = getMonthOptions()
  const yearOptions = getYearOptions()

  return (
    <div className="animate-fade-in">
      <div className="page-header flex-wrap gap-3">
        <div>
          <h1 className="page-title">Hóa đơn</h1>
          <p className="text-sm text-surface-400">{safeInvoices.length} hóa đơn tháng {filterMonth}/{filterYear}</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="stat-card">
          <div className="flex items-center gap-1.5">
            <FileText size={14} className="text-primary-400" />
            <span className="stat-label">Tổng dự kiến</span>
          </div>
          <p className="stat-value text-sm sm:text-2xl">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-1.5">
            <CheckCircle size={14} className="text-success-400" />
            <span className="stat-label">Đã thu</span>
          </div>
          <p className="stat-value text-success-400 text-sm sm:text-2xl">{formatCurrency(paidAmount)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-danger-400" />
            <span className="stat-label">Còn nợ</span>
          </div>
          <p className="stat-value text-danger-400 text-sm sm:text-2xl">{formatCurrency(unpaidAmount)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-3 mb-4 flex items-center gap-3 flex-wrap">
        <Filter size={16} className="text-surface-500 flex-shrink-0" />
        <select
          id="invoice-filter-month"
          className="input w-auto"
          value={filterMonth}
          onChange={e => setFilterMonth(Number(e.target.value))}
        >
          {monthOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          id="invoice-filter-year"
          className="input w-auto"
          value={filterYear}
          onChange={e => setFilterYear(Number(e.target.value))}
        >
          {yearOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <div className="flex rounded-lg overflow-hidden border border-surface-700">
          {['all', 'unpaid', 'paid'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                filterStatus === s
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-800 text-surface-400 hover:text-surface-200'
              }`}
            >
              {s === 'all' ? 'Tất cả' : s === 'paid' ? 'Đã thu' : 'Chưa thu'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-14" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} className="text-surface-700 mb-4" />
          <h3 className="text-surface-300 font-semibold mb-1">Chưa có hóa đơn</h3>
          <p className="text-surface-500 text-sm">Vào trang "Chốt điện nước" để tạo hóa đơn</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Phòng</th>
                <th>Kỳ</th>
                <th className="hidden sm:table-cell">Khách thuê</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => <InvoiceRow key={inv.id} invoice={inv} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
