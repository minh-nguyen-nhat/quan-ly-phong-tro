import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, User, Phone, CreditCard, Calendar, Car, Edit2,
  DoorOpen, UserPlus, AlertCircle, FileText, Coins
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { formatCurrency, formatDate, getCurrentMonthYear } from '../lib/utils'

function TenantForm({ onSubmit, loading, onCancel }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    deposit: '',
    start_date: today,
    id_card_number: '',
    vehicle_plate: '',
    notes: '',
  })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.full_name.trim()) e.full_name = 'Vui lòng nhập họ tên'
    if (!form.phone.trim()) e.phone = 'Vui lòng nhập số điện thoại'
    if (!form.deposit && form.deposit !== 0) e.deposit = 'Vui lòng nhập tiền cọc'
    if (!form.start_date) e.start_date = 'Vui lòng chọn ngày bắt đầu'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (validate()) onSubmit(form) }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group col-span-2">
          <label className="label">Họ và tên <span className="text-danger-400">*</span></label>
          <input id="tenant-name" className={`input ${errors.full_name ? 'input-error' : ''}`} placeholder="Nguyễn Văn A" value={form.full_name} onChange={set('full_name')} />
          {errors.full_name && <p className="text-xs text-danger-400">{errors.full_name}</p>}
        </div>
        <div className="form-group">
          <label className="label">Số điện thoại <span className="text-danger-400">*</span></label>
          <input id="tenant-phone" className={`input ${errors.phone ? 'input-error' : ''}`} placeholder="0901234567" value={form.phone} onChange={set('phone')} type="tel" />
          {errors.phone && <p className="text-xs text-danger-400">{errors.phone}</p>}
        </div>
        <div className="form-group">
          <label className="label">Tiền cọc (VNĐ) <span className="text-danger-400">*</span></label>
          <input id="tenant-deposit" type="number" className={`input ${errors.deposit ? 'input-error' : ''}`} placeholder="2000000" value={form.deposit} onChange={set('deposit')} />
          {errors.deposit && <p className="text-xs text-danger-400">{errors.deposit}</p>}
        </div>
        <div className="form-group">
          <label className="label">Ngày bắt đầu ở <span className="text-danger-400">*</span></label>
          <input id="tenant-start-date" type="date" className={`input ${errors.start_date ? 'input-error' : ''}`} value={form.start_date} onChange={set('start_date')} />
          {errors.start_date && <p className="text-xs text-danger-400">{errors.start_date}</p>}
        </div>
        <div className="form-group">
          <label className="label">Số CCCD/CMND</label>
          <input id="tenant-id-card" className="input" placeholder="0xxxxxxxxxx" value={form.id_card_number} onChange={set('id_card_number')} />
        </div>
        <div className="form-group col-span-2">
          <label className="label">Biển số xe</label>
          <input id="tenant-vehicle" className="input" placeholder="51F-xxxxx" value={form.vehicle_plate} onChange={set('vehicle_plate')} />
        </div>
        <div className="form-group col-span-2">
          <label className="label">Ghi chú</label>
          <textarea className="input resize-none" rows={2} placeholder="Ghi chú thêm..." value={form.notes} onChange={set('notes')} />
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Hủy</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Đang lưu...' : 'Xác nhận nhận phòng'}
        </button>
      </div>
    </form>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-surface-800 last:border-0">
      <Icon size={15} className="text-surface-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-surface-500 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-surface-200">{value || '--'}</p>
      </div>
    </div>
  )
}

export default function RoomDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [room, setRoom] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [recentInvoices, setRecentInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCheckinModal, setShowCheckinModal] = useState(false)
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: roomData, error: roomErr } = await supabase
        .from('rooms').select('*').eq('id', id).eq('user_id', user.id).single()
      if (roomErr) throw roomErr
      setRoom(roomData)

      const { data: tenantData } = await supabase
        .from('tenants').select('*').eq('room_id', id).is('end_date', null).maybeSingle()
      setTenant(tenantData)

      const { data: invoicesData } = await supabase
        .from('invoices').select('*').eq('room_id', id)
        .order('billing_year', { ascending: false })
        .order('billing_month', { ascending: false })
        .limit(5)
      setRecentInvoices(invoicesData || [])
    } catch (err) {
      toast.error('Không thể tải thông tin phòng')
      navigate('/rooms')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  const handleCheckin = async (form) => {
    setSubmitting(true)
    try {
      const { error: tenantErr } = await supabase.from('tenants').insert({
        room_id: id,
        user_id: user.id,
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        deposit: Number(form.deposit),
        start_date: form.start_date,
        id_card_number: form.id_card_number || null,
        vehicle_plate: form.vehicle_plate || null,
        notes: form.notes || null,
      })
      if (tenantErr) throw tenantErr

      const { error: roomErr } = await supabase
        .from('rooms').update({ status: 'occupied' }).eq('id', id)
      if (roomErr) throw roomErr

      toast.success(`Đã nhận phòng cho ${form.full_name}!`)
      setShowCheckinModal(false)
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Không thể nhận phòng')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCheckout = async () => {
    setSubmitting(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const { error: tenantErr } = await supabase
        .from('tenants').update({ end_date: today }).eq('id', tenant.id)
      if (tenantErr) throw tenantErr

      const { error: roomErr } = await supabase
        .from('rooms').update({ status: 'vacant' }).eq('id', id)
      if (roomErr) throw roomErr

      toast.success('Đã xử lý trả phòng thành công!')
      setShowCheckoutConfirm(false)
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Không thể xử lý trả phòng')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-48 w-full" />
        <div className="skeleton h-64 w-full" />
      </div>
    )
  }

  if (!room) return null

  const isOccupied = room.status === 'occupied'

  return (
    <div className="animate-fade-in max-w-2xl">
      {/* Back */}
      <Link to="/rooms" className="inline-flex items-center gap-2 text-sm text-surface-400 hover:text-surface-200 mb-5 transition-colors">
        <ArrowLeft size={16} />
        Danh sách phòng
      </Link>

      {/* Room header */}
      <div className="card p-5 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-surface-50">{room.name}</h1>
              <span className={isOccupied ? 'badge-occupied' : 'badge-vacant'}>
                {isOccupied ? 'Đang thuê' : 'Trống'}
              </span>
            </div>
            <p className="text-surface-400">{formatCurrency(room.default_price)}/tháng</p>
          </div>
        </div>

        {/* Actions */}
        {!isOccupied ? (
          <button
            id="checkin-btn"
            onClick={() => setShowCheckinModal(true)}
            className="btn-primary w-full sm:w-auto"
          >
            <UserPlus size={16} />
            Nhận khách mới
          </button>
        ) : (
          <div className="flex gap-3 flex-wrap">
            <button
              id="checkout-btn"
              onClick={() => setShowCheckoutConfirm(true)}
              className="btn-danger"
            >
              <DoorOpen size={16} />
              Trả phòng
            </button>
          </div>
        )}
      </div>

      {/* Tenant info */}
      {isOccupied && tenant && (
        <div className="card p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-surface-50 flex items-center gap-2">
              <User size={16} className="text-primary-400" />
              Thông tin khách thuê
            </h2>
          </div>
          <InfoRow icon={User} label="Họ và tên" value={tenant.full_name} />
          <InfoRow icon={Phone} label="Số điện thoại" value={tenant.phone} />
          <InfoRow icon={CreditCard} label="CCCD/CMND" value={tenant.id_card_number} />
          <InfoRow icon={Car} label="Biển số xe" value={tenant.vehicle_plate} />
          <InfoRow icon={Calendar} label="Ngày vào ở" value={formatDate(tenant.start_date)} />
          <InfoRow icon={Coins} label="Tiền cọc" value={formatCurrency(tenant.deposit)} />
        </div>
      )}

      {/* Recent invoices */}
      {recentInvoices.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-surface-50 flex items-center gap-2 mb-4">
            <FileText size={16} className="text-primary-400" />
            Hóa đơn gần đây
          </h2>
          <div className="space-y-2">
            {recentInvoices.map(inv => (
              <Link
                key={inv.id}
                to={`/invoices/${inv.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-800 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-surface-200">
                    Tháng {inv.billing_month}/{inv.billing_year}
                  </p>
                  <p className="text-xs text-surface-500">{formatCurrency(inv.total_amount)}</p>
                </div>
                <span className={inv.status === 'paid' ? 'badge-paid' : 'badge-unpaid'}>
                  {inv.status === 'paid' ? 'Đã thu' : 'Chưa thu'}
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-surface-800">
            <Link to={`/invoices?room=${id}`} className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
              Xem tất cả hóa đơn →
            </Link>
          </div>
        </div>
      )}

      {/* Check-in modal */}
      <Modal
        isOpen={showCheckinModal}
        onClose={() => setShowCheckinModal(false)}
        title={`Nhận khách — ${room.name}`}
        size="lg"
      >
        <TenantForm
          onSubmit={handleCheckin}
          loading={submitting}
          onCancel={() => setShowCheckinModal(false)}
        />
      </Modal>

      {/* Checkout confirm */}
      <ConfirmDialog
        isOpen={showCheckoutConfirm}
        onClose={() => setShowCheckoutConfirm(false)}
        onConfirm={handleCheckout}
        title={`Xác nhận trả phòng ${room.name}?`}
        message={`Khách ${tenant?.full_name} sẽ được đánh dấu là đã rời khỏi phòng. Phòng sẽ chuyển sang trạng thái "Trống".`}
        confirmLabel="Xác nhận trả phòng"
        loading={submitting}
      />
    </div>
  )
}
