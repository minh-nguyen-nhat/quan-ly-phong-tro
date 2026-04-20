import { useState, useEffect } from 'react'
import { Zap, Save, Calendar, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { formatCurrency, getCurrentMonthYear, getMonthOptions, getYearOptions } from '../lib/utils'

function IndexInput({ room, prevInvoice, settings, value, onChange, error }) {
  const prevElec = prevInvoice?.elec_new_index ?? 0
  const prevWater = prevInvoice?.water_new_index ?? 0
  const elecConsumption = Math.max(0, (value.elec || 0) - prevElec)
  const waterConsumption = Math.max(0, (value.water || 0) - prevWater)
  const elecTotal = elecConsumption * (settings?.electricity_price || 0)
  const waterTotal = waterConsumption * (settings?.water_price || 0)

  return (
    <div className="card p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-surface-50">{room.name}</h3>
        <span className="text-xs text-surface-500">{room.current_tenant || 'Chưa có tên'}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Electricity */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-yellow-400 text-sm">⚡</span>
            <span className="text-xs font-semibold text-surface-300 uppercase tracking-wide">Điện</span>
          </div>
          <div className="flex items-center justify-between text-xs text-surface-500">
            <span>Chỉ số cũ</span>
            <span className="font-medium text-surface-300">{prevElec.toLocaleString()} kWh</span>
          </div>
          <div>
            <input
              type="number"
              className={`input text-sm ${error?.elec ? 'input-error' : ''}`}
              placeholder="Chỉ số mới..."
              value={value.elec ?? ''}
              onChange={e => onChange({ ...value, elec: e.target.value === '' ? '' : Number(e.target.value) })}
            />
            {error?.elec && <p className="text-xs text-danger-400 mt-1">{error.elec}</p>}
          </div>
          {value.elec !== '' && value.elec !== undefined && (
            <div className={`rounded-lg p-2 text-xs ${elecConsumption >= 0 && !error?.elec ? 'bg-success-500/10 text-success-400' : 'bg-danger-500/10 text-danger-400'}`}>
              Tiêu thụ: <strong>{elecConsumption} kWh</strong> → {formatCurrency(elecTotal)}
            </div>
          )}
        </div>

        {/* Water */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-blue-400 text-sm">💧</span>
            <span className="text-xs font-semibold text-surface-300 uppercase tracking-wide">Nước</span>
          </div>
          <div className="flex items-center justify-between text-xs text-surface-500">
            <span>Chỉ số cũ</span>
            <span className="font-medium text-surface-300">{prevWater.toLocaleString()} m³</span>
          </div>
          <div>
            <input
              type="number"
              className={`input text-sm ${error?.water ? 'input-error' : ''}`}
              placeholder="Chỉ số mới..."
              value={value.water ?? ''}
              onChange={e => onChange({ ...value, water: e.target.value === '' ? '' : Number(e.target.value) })}
            />
            {error?.water && <p className="text-xs text-danger-400 mt-1">{error.water}</p>}
          </div>
          {value.water !== '' && value.water !== undefined && (
            <div className={`rounded-lg p-2 text-xs ${waterConsumption >= 0 && !error?.water ? 'bg-blue-500/10 text-blue-400' : 'bg-danger-500/10 text-danger-400'}`}>
              Tiêu thụ: <strong>{waterConsumption} m³</strong> → {formatCurrency(waterTotal)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function BillingPage() {
  const { user } = useAuth()
  const toast = useToast()
  const { month: curMonth, year: curYear } = getCurrentMonthYear()

  const [month, setMonth] = useState(curMonth)
  const [year, setYear] = useState(curYear)
  const [rooms, setRooms] = useState([])
  const [prevInvoices, setPrevInvoices] = useState({})
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [inputs, setInputs] = useState({}) // { [roomId]: { elec, water } }
  const [errors, setErrors] = useState({}) // { [roomId]: { elec?, water? } }

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch occupied rooms with active tenant
      const { data: roomsData, error: roomsErr } = await supabase
        .from('rooms')
        .select('*, tenants(full_name)')
        .eq('user_id', user.id)
        .eq('status', 'occupied')
        .is('tenants.end_date', null)
        .order('name')

      if (roomsErr) throw roomsErr

      const rooms = (roomsData || []).map(r => ({
        ...r,
        current_tenant: r.tenants?.[0]?.full_name || null,
      }))
      setRooms(rooms)

      // Fetch previous month's invoices for old index
      const prevM = month === 1 ? 12 : month - 1
      const prevY = month === 1 ? year - 1 : year

      if (rooms.length > 0) {
        const roomIds = rooms.map(r => r.id)
        const { data: prevData } = await supabase
          .from('invoices')
          .select('room_id, elec_new_index, water_new_index')
          .in('room_id', roomIds)
          .eq('billing_month', prevM)
          .eq('billing_year', prevY)

        const prevMap = {}
        ;(prevData || []).forEach(inv => { prevMap[inv.room_id] = inv })
        setPrevInvoices(prevMap)
      }

      // Settings
      const { data: settingsData } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      setSettings(settingsData)
    } catch (err) {
      toast.error('Không thể tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [month, year, user.id])

  const validate = () => {
    const errs = {}
    rooms.forEach(room => {
      const v = inputs[room.id] || {}
      const prev = prevInvoices[room.id]
      const roomErrs = {}

      if (v.elec !== undefined && v.elec !== '') {
        const prevElec = prev?.elec_new_index ?? 0
        if (Number(v.elec) < prevElec) {
          roomErrs.elec = `Phải ≥ chỉ số cũ (${prevElec})`
        }
      }
      if (v.water !== undefined && v.water !== '') {
        const prevWater = prev?.water_new_index ?? 0
        if (Number(v.water) < prevWater) {
          roomErrs.water = `Phải ≥ chỉ số cũ (${prevWater})`
        }
      }
      if (Object.keys(roomErrs).length > 0) errs[room.id] = roomErrs
    })
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) {
      toast.error('Có lỗi trong dữ liệu nhập. Vui lòng kiểm tra lại.')
      return
    }

    const filledRooms = rooms.filter(r => {
      const v = inputs[r.id] || {}
      return v.elec !== undefined && v.elec !== '' || v.water !== undefined && v.water !== ''
    })

    if (filledRooms.length === 0) {
      toast.warning('Chưa nhập chỉ số cho phòng nào!')
      return
    }

    setSaving(true)
    try {
      const invoicesToUpsert = filledRooms.map(room => {
        const v = inputs[room.id] || {}
        const prev = prevInvoices[room.id]
        const elecOld = prev?.elec_new_index ?? 0
        const waterOld = prev?.water_new_index ?? 0
        const elecNew = v.elec !== '' && v.elec !== undefined ? Number(v.elec) : elecOld
        const waterNew = v.water !== '' && v.water !== undefined ? Number(v.water) : waterOld
        const elecConsumption = Math.max(0, elecNew - elecOld)
        const waterConsumption = Math.max(0, waterNew - waterOld)
        const elecPrice = settings?.electricity_price || 0
        const waterPrice = settings?.water_price || 0
        const trashFee = settings?.trash_fee || 0
        const wifiFee = settings?.wifi_fee || 0
        const elecTotal = elecConsumption * elecPrice
        const waterTotal = waterConsumption * waterPrice
        const total = room.default_price + elecTotal + waterTotal + trashFee + wifiFee

        return {
          user_id: user.id,
          room_id: room.id,
          billing_month: month,
          billing_year: year,
          room_fee: room.default_price,
          elec_old_index: elecOld,
          elec_new_index: elecNew,
          elec_consumption: elecConsumption,
          elec_unit_price: elecPrice,
          elec_total: elecTotal,
          water_old_index: waterOld,
          water_new_index: waterNew,
          water_consumption: waterConsumption,
          water_unit_price: waterPrice,
          water_total: waterTotal,
          trash_fee: trashFee,
          wifi_fee: wifiFee,
          discount: 0,
          surcharge: 0,
          surcharge_note: null,
          total_amount: total,
          status: 'unpaid',
        }
      })

      const { error } = await supabase
        .from('invoices')
        .upsert(invoicesToUpsert, {
          onConflict: 'room_id,billing_month,billing_year',
          ignoreDuplicates: false,
        })

      if (error) throw error

      toast.success(`Đã tạo ${filledRooms.length} hóa đơn tháng ${month}/${year}!`)
      setInputs({})
    } catch (err) {
      toast.error(err.message || 'Không thể lưu chỉ số')
    } finally {
      setSaving(false)
    }
  }

  const monthOptions = getMonthOptions()
  const yearOptions = getYearOptions()

  return (
    <div className="animate-fade-in">
      <div className="page-header flex-wrap gap-3">
        <div>
          <h1 className="page-title">Chốt điện nước</h1>
          <p className="text-sm text-surface-400">Nhập chỉ số điện nước hàng tháng</p>
        </div>
      </div>

      {/* Month/Year selector */}
      <div className="card p-4 mb-5 flex items-center gap-3 flex-wrap">
        <Calendar size={18} className="text-primary-400 flex-shrink-0" />
        <span className="text-sm font-medium text-surface-300">Kỳ tính:</span>
        <select
          id="billing-month"
          className="input w-auto"
          value={month}
          onChange={e => setMonth(Number(e.target.value))}
        >
          {monthOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          id="billing-year"
          className="input w-auto"
          value={year}
          onChange={e => setYear(Number(e.target.value))}
        >
          {yearOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {!settings && (
          <div className="flex items-center gap-2 text-warning-400 text-xs">
            <AlertCircle size={14} />
            <span>Chưa cài đặt đơn giá. <a href="/settings" className="underline">Cài ngay</a></span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-40" />)}
        </div>
      ) : rooms.length === 0 ? (
        <div className="empty-state">
          <Zap size={48} className="text-surface-700 mb-4" />
          <h3 className="text-surface-300 font-semibold mb-1">Không có phòng đang thuê</h3>
          <p className="text-surface-500 text-sm">Chỉ hiển thị phòng đang có khách thuê</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-5">
            {rooms.map(room => (
              <IndexInput
                key={room.id}
                room={room}
                prevInvoice={prevInvoices[room.id]}
                settings={settings}
                value={inputs[room.id] || {}}
                onChange={v => setInputs(prev => ({ ...prev, [room.id]: v }))}
                error={errors[room.id]}
              />
            ))}
          </div>

          <div className="flex items-center gap-4 p-4 card">
            <div className="flex-1">
              <p className="text-sm text-surface-400">
                {Object.keys(inputs).filter(k => {
                  const v = inputs[k]
                  return (v.elec !== '' && v.elec !== undefined) || (v.water !== '' && v.water !== undefined)
                }).length} / {rooms.length} phòng đã nhập chỉ số
              </p>
            </div>
            <button
              id="save-billing-btn"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang lưu...
                </span>
              ) : (
                <>
                  <Save size={16} />
                  Lưu & tạo hóa đơn
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
