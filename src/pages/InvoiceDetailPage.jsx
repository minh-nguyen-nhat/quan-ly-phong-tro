import { useState, useRef, useEffect, forwardRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Download, CheckCircle, Clock, Plus, Minus, Edit2, Save, X
} from 'lucide-react'
import html2canvas from 'html2canvas'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { useInvoice } from '../hooks/useSupabase'
import { formatCurrency, formatDate } from '../lib/utils'

const InvoicePrintArea = forwardRef(function InvoicePrintArea({ invoice, settings }, printRef) {
  const room = invoice.rooms
  const tenant = invoice.tenants
  const isPaid = invoice.status === 'paid'

  return (
    <div
      ref={printRef}
      style={{ fontFamily: 'Inter, sans-serif', background: '#1e293b', color: '#f1f5f9', padding: '28px', borderRadius: '16px', width: '400px', minWidth: '400px' }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '16px' }}>
        <div style={{ fontSize: '22px', fontWeight: '800', color: '#60a5fa', marginBottom: '4px' }}>
          🏠 Phòng Trọ
        </div>
        <div style={{ fontSize: '13px', color: '#94a3b8' }}>Hóa đơn tiền phòng</div>
        {isPaid && (
          <div style={{ display: 'inline-block', background: '#166534', color: '#4ade80', padding: '2px 12px', borderRadius: '99px', fontSize: '11px', fontWeight: '600', marginTop: '6px' }}>
            ✓ ĐÃ THANH TOÁN
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px', fontSize: '13px' }}>
        <div style={{ background: '#0f172a', borderRadius: '8px', padding: '10px' }}>
          <div style={{ color: '#64748b', marginBottom: '2px', fontSize: '11px' }}>PHÒNG</div>
          <div style={{ fontWeight: '700', fontSize: '18px', color: '#f8fafc' }}>{room?.name}</div>
        </div>
        <div style={{ background: '#0f172a', borderRadius: '8px', padding: '10px' }}>
          <div style={{ color: '#64748b', marginBottom: '2px', fontSize: '11px' }}>KỲ THU TIỀN</div>
          <div style={{ fontWeight: '700', color: '#f8fafc' }}>Tháng {invoice.billing_month}/{invoice.billing_year}</div>
        </div>
      </div>

      {tenant && (
        <div style={{ background: '#0f172a', borderRadius: '8px', padding: '10px', marginBottom: '16px', fontSize: '12px' }}>
          <span style={{ color: '#64748b' }}>Khách thuê: </span>
          <span style={{ color: '#e2e8f0', fontWeight: '600' }}>{tenant.full_name}</span>
          {tenant.phone && <span style={{ color: '#64748b' }}> • {tenant.phone}</span>}
        </div>
      )}

      {/* Line items */}
      <div style={{ marginBottom: '16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              <th style={{ textAlign: 'left', padding: '6px 4px', color: '#64748b', fontWeight: '600', fontSize: '11px' }}>KHOẢN MỤC</th>
              <th style={{ textAlign: 'right', padding: '6px 4px', color: '#64748b', fontWeight: '600', fontSize: '11px' }}>THÀNH TIỀN</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #1e293b' }}>
              <td style={{ padding: '8px 4px', color: '#cbd5e1' }}>Tiền phòng</td>
              <td style={{ padding: '8px 4px', textAlign: 'right', color: '#f1f5f9', fontWeight: '500' }}>{formatCurrency(invoice.room_fee)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #1e293b' }}>
              <td style={{ padding: '8px 4px', color: '#cbd5e1' }}>
                <div>⚡ Điện ({invoice.elec_consumption} kWh × {formatCurrency(invoice.elec_unit_price)})</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Chỉ số: {invoice.elec_old_index} → {invoice.elec_new_index}</div>
              </td>
              <td style={{ padding: '8px 4px', textAlign: 'right', color: '#f1f5f9', fontWeight: '500' }}>{formatCurrency(invoice.elec_total)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #1e293b' }}>
              <td style={{ padding: '8px 4px', color: '#cbd5e1' }}>
                <div>💧 Nước ({invoice.water_consumption} m³ × {formatCurrency(invoice.water_unit_price)})</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Chỉ số: {invoice.water_old_index} → {invoice.water_new_index}</div>
              </td>
              <td style={{ padding: '8px 4px', textAlign: 'right', color: '#f1f5f9', fontWeight: '500' }}>{formatCurrency(invoice.water_total)}</td>
            </tr>
            {invoice.trash_fee > 0 && (
              <tr style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '8px 4px', color: '#cbd5e1' }}>🗑️ Rác</td>
                <td style={{ padding: '8px 4px', textAlign: 'right', color: '#f1f5f9', fontWeight: '500' }}>{formatCurrency(invoice.trash_fee)}</td>
              </tr>
            )}
            {invoice.wifi_fee > 0 && (
              <tr style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '8px 4px', color: '#cbd5e1' }}>📶 Wifi</td>
                <td style={{ padding: '8px 4px', textAlign: 'right', color: '#f1f5f9', fontWeight: '500' }}>{formatCurrency(invoice.wifi_fee)}</td>
              </tr>
            )}
            {invoice.surcharge > 0 && (
              <tr style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '8px 4px', color: '#fbbf24' }}>+ {invoice.surcharge_note || 'Phụ phí'}</td>
                <td style={{ padding: '8px 4px', textAlign: 'right', color: '#fbbf24', fontWeight: '500' }}>+{formatCurrency(invoice.surcharge)}</td>
              </tr>
            )}
            {invoice.discount > 0 && (
              <tr style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '8px 4px', color: '#4ade80' }}>- Giảm trừ</td>
                <td style={{ padding: '8px 4px', textAlign: 'right', color: '#4ade80', fontWeight: '500' }}>-{formatCurrency(invoice.discount)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div style={{ background: '#1d4ed8', borderRadius: '12px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontWeight: '700', fontSize: '15px', color: '#bfdbfe' }}>TỔNG CỘNG</span>
        <span style={{ fontWeight: '800', fontSize: '22px', color: '#ffffff' }}>{formatCurrency(invoice.total_amount)}</span>
      </div>

      {/* Bank info */}
      {settings?.bank_account_number && (
        <div style={{ background: '#0f172a', borderRadius: '8px', padding: '12px', fontSize: '12px' }}>
          <div style={{ color: '#64748b', marginBottom: '6px', fontWeight: '600', fontSize: '11px' }}>THÔNG TIN CHUYỂN KHOẢN</div>
          <div style={{ color: '#e2e8f0', lineHeight: '1.8' }}>
            <div>🏦 {settings.bank_name}</div>
            <div>💳 {settings.bank_account_number}</div>
            <div>👤 {settings.bank_account_name}</div>
            <div style={{ color: '#94a3b8', marginTop: '4px', fontSize: '11px' }}>
              ND: {room?.name} T{invoice.billing_month}/{invoice.billing_year}
            </div>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '10px', color: '#475569' }}>
        Tạo tự động bởi PhòngTrọ App
      </div>
    </div>
  )
})

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const toast = useToast()
  const printRef = useRef(null)

  const { data: invoice, loading, refetch } = useInvoice(id)
  const [settings, setSettings] = useState(null)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('settings').select('*').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => { setSettings(data); setLoadingSettings(false) })
  }, [user.id])

  const handleTogglePaid = async () => {
    setToggling(true)
    try {
      const newStatus = invoice.status === 'paid' ? 'unpaid' : 'paid'
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus, paid_at: newStatus === 'paid' ? new Date().toISOString() : null })
        .eq('id', id)
      if (error) throw error
      toast.success(newStatus === 'paid' ? 'Đã đánh dấu đã thu!' : 'Đã chuyển về chưa thu')
      refetch()
    } catch (err) {
      toast.error('Không thể cập nhật trạng thái')
    } finally {
      setToggling(false)
    }
  }

  const handleStartEdit = () => {
    setEditForm({
      surcharge: invoice.surcharge || 0,
      surcharge_note: invoice.surcharge_note || '',
      discount: invoice.discount || 0,
    })
    setEditMode(true)
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      const surcharge = Number(editForm.surcharge) || 0
      const discount = Number(editForm.discount) || 0
      const base = (invoice.room_fee || 0) + (invoice.elec_total || 0) + (invoice.water_total || 0) + (invoice.trash_fee || 0) + (invoice.wifi_fee || 0)
      const total = base + surcharge - discount

      const { error } = await supabase.from('invoices').update({
        surcharge,
        surcharge_note: editForm.surcharge_note || null,
        discount,
        total_amount: total,
      }).eq('id', id)

      if (error) throw error
      toast.success('Đã cập nhật hóa đơn!')
      setEditMode(false)
      refetch()
    } catch (err) {
      toast.error('Không thể cập nhật hóa đơn')
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = async () => {
    if (!printRef.current) return
    setDownloading(true)
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        backgroundColor: '#1e293b',
        useCORS: true,
        logging: false,
      })
      const link = document.createElement('a')
      link.download = `hoa-don-${invoice.rooms?.name}-T${invoice.billing_month}-${invoice.billing_year}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('Đã tải hóa đơn về máy!')
    } catch (err) {
      toast.error('Không thể xuất hóa đơn. Vui lòng thử lại.')
    } finally {
      setDownloading(false)
    }
  }

  if (loading || loadingSettings) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-96 w-full max-w-md" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="empty-state">
        <p className="text-surface-400">Không tìm thấy hóa đơn</p>
        <Link to="/invoices" className="btn-secondary mt-4">← Quay lại</Link>
      </div>
    )
  }

  const isPaid = invoice.status === 'paid'
  const canEdit = !isPaid

  return (
    <div className="animate-fade-in">
      {/* Back */}
      <Link to="/invoices" className="inline-flex items-center gap-2 text-sm text-surface-400 hover:text-surface-200 mb-5 transition-colors">
        <ArrowLeft size={16} />
        Danh sách hóa đơn
      </Link>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: invoice preview + actions */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <h1 className="page-title mb-0">
              Hóa đơn {invoice.rooms?.name}
            </h1>
            <span className={isPaid ? 'badge-paid' : 'badge-unpaid'}>
              {isPaid ? '✓ Đã thu' : '• Chưa thu'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 flex-wrap mb-5">
            <button
              id="toggle-paid-btn"
              onClick={handleTogglePaid}
              disabled={toggling}
              className={isPaid ? 'btn-secondary' : 'btn-success'}
            >
              {toggling ? '...' : isPaid ? (
                <><Clock size={15} /> Chuyển về chưa thu</>
              ) : (
                <><CheckCircle size={15} /> Đánh dấu đã thu</>
              )}
            </button>

            {canEdit && !editMode && (
              <button id="edit-invoice-btn" onClick={handleStartEdit} className="btn-secondary">
                <Edit2 size={15} />
                Thêm phụ phí / giảm trừ
              </button>
            )}

            <button
              id="download-invoice-btn"
              onClick={handleDownload}
              disabled={downloading}
              className="btn-primary"
            >
              {downloading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xuất...
                </span>
              ) : (
                <>
                  <Download size={15} />
                  Tải ảnh hóa đơn
                </>
              )}
            </button>
          </div>

          {/* Edit form */}
          {editMode && (
            <div className="card p-4 mb-5 animate-fade-in">
              <h3 className="font-semibold text-surface-100 mb-3 text-sm">Chỉnh sửa phụ phí / giảm trừ</h3>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="form-group">
                  <label className="label">Phụ phí (VNĐ)</label>
                  <input type="number" className="input" value={editForm.surcharge} onChange={e => setEditForm(f => ({ ...f, surcharge: e.target.value }))} placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="label">Giảm trừ (VNĐ)</label>
                  <input type="number" className="input" value={editForm.discount} onChange={e => setEditForm(f => ({ ...f, discount: e.target.value }))} placeholder="0" />
                </div>
              </div>
              <div className="form-group mb-3">
                <label className="label">Ghi chú phụ phí</label>
                <input className="input" value={editForm.surcharge_note} onChange={e => setEditForm(f => ({ ...f, surcharge_note: e.target.value }))} placeholder="VD: Sửa vòi nước..." />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditMode(false)} className="btn-secondary btn-sm">
                  <X size={14} /> Hủy
                </button>
                <button onClick={handleSaveEdit} disabled={saving} className="btn-primary btn-sm">
                  <Save size={14} /> {saving ? 'Lưu...' : 'Lưu'}
                </button>
              </div>
            </div>
          )}

          {/* Invoice print preview */}
          <div className="overflow-x-auto">
            <InvoicePrintArea invoice={invoice} settings={settings} ref={printRef} />
          </div>
        </div>
      </div>
    </div>
  )
}
