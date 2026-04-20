import { useState, useEffect } from 'react'
import { Settings, Save, Zap, Droplets, Trash2, Wifi, Building, CreditCard } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { formatCurrency } from '../lib/utils'

function SettingInput({ id, icon: Icon, iconColor, label, helper, value, onChange, prefix, suffix, placeholder }) {
  return (
    <div className="form-group">
      <label htmlFor={id} className="label flex items-center gap-1.5">
        <Icon size={13} className={iconColor} />
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 text-sm">{prefix}</span>
        )}
        <input
          id={id}
          type="number"
          className={`input ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-12' : ''}`}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 text-xs">{suffix}</span>
        )}
      </div>
      {helper && <p className="text-xs text-surface-500">{helper}</p>}
      {value > 0 && <p className="text-xs text-primary-400">{formatCurrency(Number(value))}</p>}
    </div>
  )
}

export default function SettingsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    electricity_price: '',
    water_price: '',
    trash_fee: '',
    wifi_fee: '',
    bank_account_name: '',
    bank_account_number: '',
    bank_name: '',
  })

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }))

  useEffect(() => {
    supabase.from('settings').select('*').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setForm({
            electricity_price: data.electricity_price || '',
            water_price: data.water_price || '',
            trash_fee: data.trash_fee || '',
            wifi_fee: data.wifi_fee || '',
            bank_account_name: data.bank_account_name || '',
            bank_account_number: data.bank_account_number || '',
            bank_name: data.bank_name || '',
          })
        }
        setLoading(false)
      })
  }, [user.id])

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        user_id: user.id,
        electricity_price: Number(form.electricity_price) || 0,
        water_price: Number(form.water_price) || 0,
        trash_fee: Number(form.trash_fee) || 0,
        wifi_fee: Number(form.wifi_fee) || 0,
        bank_account_name: form.bank_account_name.trim() || null,
        bank_account_number: form.bank_account_number.trim() || null,
        bank_name: form.bank_name.trim() || null,
      }

      const { error } = await supabase
        .from('settings')
        .upsert(payload, { onConflict: 'user_id' })

      if (error) throw error
      toast.success('Cài đặt đã được lưu thành công!')
    } catch (err) {
      toast.error(err.message || 'Không thể lưu cài đặt')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in max-w-xl">
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-80 w-full" />
        <div className="skeleton h-60 w-full" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in max-w-xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cài đặt</h1>
          <p className="text-sm text-surface-400">Đơn giá dịch vụ & thông tin ngân hàng</p>
        </div>
      </div>

      {/* Service prices */}
      <div className="card p-5 mb-4">
        <h2 className="font-semibold text-surface-50 mb-4 flex items-center gap-2">
          <Settings size={16} className="text-primary-400" />
          Đơn giá dịch vụ
        </h2>

        <SettingInput
          id="electricity-price"
          icon={Zap}
          iconColor="text-yellow-400"
          label="Đơn giá điện"
          helper="Thường dao động 3,500 - 3,800 đ/kWh"
          value={form.electricity_price}
          onChange={set('electricity_price')}
          suffix="đ/kWh"
          placeholder="3500"
        />
        <SettingInput
          id="water-price"
          icon={Droplets}
          iconColor="text-blue-400"
          label="Đơn giá nước"
          helper="VD: 15,000 đ/m³ hoặc 50,000 đ/người"
          value={form.water_price}
          onChange={set('water_price')}
          suffix="đ/m³"
          placeholder="15000"
        />
        <SettingInput
          id="trash-fee"
          icon={Trash2}
          iconColor="text-orange-400"
          label="Phí rác (mỗi phòng)"
          value={form.trash_fee}
          onChange={set('trash_fee')}
          suffix="đ/tháng"
          placeholder="20000"
        />
        <SettingInput
          id="wifi-fee"
          icon={Wifi}
          iconColor="text-green-400"
          label="Phí Wifi (mỗi phòng)"
          value={form.wifi_fee}
          onChange={set('wifi_fee')}
          suffix="đ/tháng"
          placeholder="50000"
        />
      </div>

      {/* Bank info */}
      <div className="card p-5 mb-5">
        <h2 className="font-semibold text-surface-50 mb-4 flex items-center gap-2">
          <CreditCard size={16} className="text-primary-400" />
          Thông tin ngân hàng (hiển thị trên hóa đơn)
        </h2>

        <div className="form-group">
          <label htmlFor="bank-name" className="label flex items-center gap-1.5">
            <Building size={13} className="text-primary-400" />
            Tên ngân hàng
          </label>
          <input
            id="bank-name"
            className="input"
            placeholder="VD: Vietcombank, BIDV..."
            value={form.bank_name}
            onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))}
          />
        </div>

        <div className="form-group">
          <label htmlFor="bank-account-number" className="label">Số tài khoản</label>
          <input
            id="bank-account-number"
            className="input"
            placeholder="0123456789"
            value={form.bank_account_number}
            onChange={e => setForm(f => ({ ...f, bank_account_number: e.target.value }))}
          />
        </div>

        <div className="form-group">
          <label htmlFor="bank-account-name" className="label">Tên chủ tài khoản</label>
          <input
            id="bank-account-name"
            className="input"
            placeholder="NGUYEN VAN A"
            value={form.bank_account_name}
            onChange={e => setForm(f => ({ ...f, bank_account_name: e.target.value }))}
          />
        </div>

        {form.bank_account_number && (
          <div className="mt-3 p-3 rounded-lg bg-surface-800 text-xs text-surface-400">
            <p className="font-medium text-surface-300 mb-1">Preview cú pháp chuyển khoản:</p>
            <p>🏦 {form.bank_name || '[Ngân hàng]'}</p>
            <p>💳 {form.bank_account_number}</p>
            <p>👤 {form.bank_account_name || '[Tên chủ TK]'}</p>
            <p>ND: [Tên phòng] T[Tháng]/[Năm]</p>
          </div>
        )}
      </div>

      <button
        id="save-settings-btn"
        onClick={handleSave}
        disabled={saving}
        className="btn-primary w-full"
      >
        {saving ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Đang lưu...
          </span>
        ) : (
          <>
            <Save size={16} />
            Lưu cài đặt
          </>
        )}
      </button>
    </div>
  )
}
