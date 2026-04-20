import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, Building2, FileText, CheckCircle, Clock, ArrowRight,
  DoorOpen, Users, AlertCircle
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency, getCurrentMonthYear, getMonthOptions, getYearOptions } from '../lib/utils'

function StatCard({ icon: Icon, iconColor, iconBg, label, value, valueColor, subtitle }) {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon size={16} className={iconColor} />
        </div>
        <span className="stat-label">{label}</span>
      </div>
      <p className={`text-xl font-bold ${valueColor || 'text-surface-50'}`}>{value}</p>
      {subtitle && <p className="text-xs text-surface-600 mt-0.5">{subtitle}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { month: curMonth, year: curYear } = getCurrentMonthYear()
  const [month, setMonth] = useState(curMonth)
  const [year, setYear] = useState(curYear)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasSettings, setHasSettings] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true)
      try {
        // Rooms
        const { data: rooms } = await supabase
          .from('rooms').select('id, status').eq('user_id', user.id)

        const totalRooms = rooms?.length || 0
        const occupiedRooms = rooms?.filter(r => r.status === 'occupied').length || 0
        const vacantRooms = totalRooms - occupiedRooms

        // Invoices for selected month
        const { data: invoices } = await supabase
          .from('invoices')
          .select('total_amount, status')
          .eq('user_id', user.id)
          .eq('billing_month', month)
          .eq('billing_year', year)

        const totalRevenue = invoices?.reduce((s, i) => s + (i.total_amount || 0), 0) || 0
        const paidRevenue = invoices?.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total_amount || 0), 0) || 0
        const unpaidRevenue = totalRevenue - paidRevenue
        const totalInvoices = invoices?.length || 0
        const paidInvoices = invoices?.filter(i => i.status === 'paid').length || 0

        // Recent unpaid invoices
        const { data: unpaidInvs } = await supabase
          .from('invoices')
          .select('*, rooms(name)')
          .eq('user_id', user.id)
          .eq('status', 'unpaid')
          .order('billing_year', { ascending: false })
          .order('billing_month', { ascending: false })
          .limit(5)

        // Check settings
        const { data: settings } = await supabase
          .from('settings').select('id').eq('user_id', user.id).maybeSingle()
        setHasSettings(!!settings)

        setData({
          totalRooms, occupiedRooms, vacantRooms,
          totalRevenue, paidRevenue, unpaidRevenue,
          totalInvoices, paidInvoices,
          recentUnpaid: unpaidInvs || [],
        })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [user.id, month, year])

  const monthOptions = getMonthOptions()
  const yearOptions = getYearOptions()

  return (
    <div className="animate-fade-in">
      <div className="page-header flex-wrap gap-3">
        <div>
          <h1 className="page-title">Tổng quan</h1>
          <p className="text-sm text-surface-400">Chào mừng trở lại! 👋</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            id="dashboard-month"
            className="input w-auto"
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
          >
            {monthOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            id="dashboard-year"
            className="input w-auto"
            value={year}
            onChange={e => setYear(Number(e.target.value))}
          >
            {yearOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Settings warning */}
      {!loading && !hasSettings && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-warning-500/10 border border-warning-500/30 mb-5">
          <AlertCircle size={18} className="text-warning-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-warning-300">Chưa thiết lập đơn giá dịch vụ</p>
            <p className="text-xs text-warning-400/70">Hóa đơn sẽ không tính đúng tiền điện/nước nếu chưa cài đặt.</p>
          </div>
          <Link to="/settings" className="btn-secondary btn-sm flex-shrink-0">Cài ngay</Link>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24" />)}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-24" />)}
          </div>
        </div>
      ) : data ? (
        <>
          {/* Rooms stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <StatCard
              icon={Building2}
              iconColor="text-primary-400"
              iconBg="bg-primary-500/15"
              label="Tổng phòng"
              value={data.totalRooms}
            />
            <StatCard
              icon={Users}
              iconColor="text-warning-400"
              iconBg="bg-warning-500/15"
              label="Đang thuê"
              value={data.occupiedRooms}
              valueColor="text-warning-400"
              subtitle={`${data.totalRooms > 0 ? Math.round((data.occupiedRooms / data.totalRooms) * 100) : 0}% lấp đầy`}
            />
            <StatCard
              icon={DoorOpen}
              iconColor="text-success-400"
              iconBg="bg-success-500/15"
              label="Phòng trống"
              value={data.vacantRooms}
              valueColor="text-success-400"
            />
          </div>

          {/* Revenue stats */}
          <h2 className="font-semibold text-surface-300 text-sm uppercase tracking-wide mb-3">
            Doanh thu Tháng {month}/{year}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <div className="stat-card border-primary-500/20">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={16} className="text-primary-400" />
                <span className="stat-label">Tổng dự kiến</span>
              </div>
              <p className="text-xl font-bold text-surface-50">{formatCurrency(data.totalRevenue)}</p>
              <p className="text-xs text-surface-600">{data.totalInvoices} hóa đơn</p>
            </div>
            <div className="stat-card border-success-500/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={16} className="text-success-400" />
                <span className="stat-label">Đã thu</span>
              </div>
              <p className="text-xl font-bold text-success-400">{formatCurrency(data.paidRevenue)}</p>
              <p className="text-xs text-surface-600">{data.paidInvoices} hóa đơn</p>
            </div>
            <div className="stat-card border-danger-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-danger-400" />
                <span className="stat-label">Còn nợ</span>
              </div>
              <p className="text-xl font-bold text-danger-400">{formatCurrency(data.unpaidRevenue)}</p>
              <p className="text-xs text-surface-600">{data.totalInvoices - data.paidInvoices} hóa đơn</p>
            </div>
          </div>

          {/* Revenue bar */}
          {data.totalRevenue > 0 && (
            <div className="card p-4 mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-surface-400">Tiến độ thu tiền</span>
                <span className="text-xs font-semibold text-surface-300">
                  {Math.round((data.paidRevenue / data.totalRevenue) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-surface-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-600 to-success-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((data.paidRevenue / data.totalRevenue) * 100))}%` }}
                />
              </div>
            </div>
          )}

          {/* Recent unpaid */}
          {data.recentUnpaid.length > 0 && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-surface-100 text-sm flex items-center gap-2">
                  <Clock size={15} className="text-danger-400" />
                  Hóa đơn chưa thu
                </h3>
                <Link to="/invoices?status=unpaid" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                  Xem tất cả →
                </Link>
              </div>
              <div className="space-y-2">
                {data.recentUnpaid.map(inv => (
                  <Link
                    key={inv.id}
                    to={`/invoices/${inv.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-800 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-surface-200">{inv.rooms?.name}</p>
                      <p className="text-xs text-surface-500">Tháng {inv.billing_month}/{inv.billing_year}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-danger-400">{formatCurrency(inv.total_amount)}</span>
                      <ArrowRight size={14} className="text-surface-600" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
