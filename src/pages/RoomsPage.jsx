import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Grid3X3, List, Building2, Users, DoorOpen } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { formatCurrency } from '../lib/utils'

function RoomForm({ initial, onSubmit, loading, onCancel }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    default_price: initial?.default_price || '',
  })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Vui lòng nhập tên phòng'
    if (!form.default_price || Number(form.default_price) <= 0) e.default_price = 'Vui lòng nhập giá thuê hợp lệ'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-group">
        <label className="label">Tên phòng <span className="text-danger-400">*</span></label>
        <input
          id="room-name"
          className={`input ${errors.name ? 'input-error' : ''}`}
          placeholder="VD: P101, Phòng 1..."
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        />
        {errors.name && <p className="text-xs text-danger-400">{errors.name}</p>}
      </div>
      <div className="form-group">
        <label className="label">Giá thuê mặc định (VNĐ/tháng) <span className="text-danger-400">*</span></label>
        <input
          id="room-price"
          type="number"
          className={`input ${errors.default_price ? 'input-error' : ''}`}
          placeholder="VD: 2500000"
          value={form.default_price}
          onChange={e => setForm(f => ({ ...f, default_price: e.target.value }))}
        />
        {errors.default_price && <p className="text-xs text-danger-400">{errors.default_price}</p>}
        {form.default_price > 0 && (
          <p className="text-xs text-surface-500">{formatCurrency(Number(form.default_price))}</p>
        )}
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Hủy</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Đang lưu...' : initial ? 'Cập nhật' : 'Thêm phòng'}
        </button>
      </div>
    </form>
  )
}

function RoomCard({ room, onClick }) {
  const isOccupied = room.status === 'occupied'
  return (
    <div
      onClick={() => onClick(room)}
      className={`card-hover p-4 group relative overflow-hidden cursor-pointer select-none`}
      id={`room-card-${room.id}`}
    >
      {/* Color indicator */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${isOccupied ? 'bg-warning-500' : 'bg-success-500'}`} />

      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          isOccupied ? 'bg-warning-500/15' : 'bg-success-500/15'
        }`}>
          {isOccupied ? (
            <Users size={18} className="text-warning-400" />
          ) : (
            <DoorOpen size={18} className="text-success-400" />
          )}
        </div>
        <span className={isOccupied ? 'badge-occupied' : 'badge-vacant'}>
          {isOccupied ? 'Đang thuê' : 'Trống'}
        </span>
      </div>

      <h3 className="font-bold text-surface-50 text-base mb-0.5">{room.name}</h3>
      <p className="text-sm text-surface-400">{formatCurrency(room.default_price)}<span className="text-surface-600">/tháng</span></p>

      {room.current_tenant && (
        <p className="text-xs text-surface-500 mt-2 truncate">👤 {room.current_tenant}</p>
      )}
    </div>
  )
}

export default function RoomsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editRoom, setEditRoom] = useState(null)
  const [deleteRoom, setDeleteRoom] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchRooms = async () => {
    setLoading(true)
    try {
      // Fetch rooms with active tenant name
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          *,
          tenants!inner(full_name)
        `)
        .eq('user_id', user.id)
        .is('tenants.end_date', null)
        .order('name')

      // Also fetch vacant rooms (no tenants or all ended)
      const { data: blankData, error: blankError } = await supabase
        .from('rooms')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (blankError) throw blankError

      // Merge tenant names
      const tenantMap = {}
      if (!error && data) {
        data.forEach(r => {
          tenantMap[r.id] = r.tenants?.full_name
        })
      }

      setRooms((blankData || []).map(r => ({
        ...r,
        current_tenant: tenantMap[r.id] || null,
      })))
    } catch (err) {
      toast.error('Không thể tải danh sách phòng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRooms() }, [user.id])

  const handleAdd = async (form) => {
    setSubmitting(true)
    try {
      const { error } = await supabase.from('rooms').insert({
        user_id: user.id,
        name: form.name.trim(),
        default_price: Number(form.default_price),
        status: 'vacant',
      })
      if (error) throw error
      toast.success(`Thêm phòng "${form.name}" thành công!`)
      setShowAddModal(false)
      fetchRooms()
    } catch (err) {
      toast.error(err.message || 'Không thể thêm phòng')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (form) => {
    setSubmitting(true)
    try {
      const { error } = await supabase.from('rooms').update({
        name: form.name.trim(),
        default_price: Number(form.default_price),
      }).eq('id', editRoom.id)
      if (error) throw error
      toast.success('Cập nhật phòng thành công!')
      setEditRoom(null)
      fetchRooms()
    } catch (err) {
      toast.error(err.message || 'Không thể cập nhật phòng')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setSubmitting(true)
    try {
      const { error } = await supabase.from('rooms').delete().eq('id', deleteRoom.id)
      if (error) throw error
      toast.success(`Đã xóa phòng "${deleteRoom.name}"`)
      setDeleteRoom(null)
      fetchRooms()
    } catch (err) {
      toast.error(err.message || 'Không thể xóa phòng')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRoomClick = (room) => {
    navigate(`/rooms/${room.id}`)
  }

  const filtered = rooms.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.current_tenant && r.current_tenant.toLowerCase().includes(search.toLowerCase()))
  )

  const vacantCount = rooms.filter(r => r.status === 'vacant').length
  const occupiedCount = rooms.filter(r => r.status === 'occupied').length

  return (
    <div className="animate-fade-in">
      <div className="page-header flex-wrap gap-3">
        <div>
          <h1 className="page-title">Danh sách phòng</h1>
          <p className="text-sm text-surface-400">{rooms.length} phòng • {occupiedCount} đang thuê • {vacantCount} trống</p>
        </div>
        <button id="add-room-btn" onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus size={16} />
          Thêm phòng
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-primary-400" />
            <span className="stat-label">Tổng phòng</span>
          </div>
          <p className="stat-value">{rooms.length}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-warning-400" />
            <span className="stat-label">Đang thuê</span>
          </div>
          <p className="stat-value text-warning-400">{occupiedCount}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <DoorOpen size={16} className="text-success-400" />
            <span className="stat-label">Còn trống</span>
          </div>
          <p className="stat-value text-success-400">{vacantCount}</p>
        </div>
      </div>

      {/* Search + View toggle */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
          <input
            id="room-search"
            className="input pl-9"
            placeholder="Tìm phòng, tên khách..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex rounded-lg overflow-hidden border border-surface-700">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-surface-800 text-surface-400 hover:text-surface-200'}`}
          >
            <Grid3X3 size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-surface-800 text-surface-400 hover:text-surface-200'}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Rooms */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-32" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Building2 size={48} className="text-surface-700 mb-4" />
          <h3 className="text-surface-300 font-semibold mb-1">
            {search ? 'Không tìm thấy phòng' : 'Chưa có phòng nào'}
          </h3>
          <p className="text-surface-500 text-sm mb-4">
            {search ? 'Thử tìm với từ khóa khác' : 'Bắt đầu bằng cách thêm phòng đầu tiên'}
          </p>
          {!search && (
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              <Plus size={16} /> Thêm phòng đầu tiên
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(room => (
            <RoomCard key={room.id} room={room} onClick={handleRoomClick} />
          ))}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Phòng</th>
                <th>Trạng thái</th>
                <th>Khách thuê</th>
                <th>Giá thuê</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(room => (
                <tr key={room.id} onClick={() => handleRoomClick(room)} className="cursor-pointer">
                  <td className="font-medium text-surface-50">{room.name}</td>
                  <td>
                    <span className={room.status === 'occupied' ? 'badge-occupied' : 'badge-vacant'}>
                      {room.status === 'occupied' ? 'Đang thuê' : 'Trống'}
                    </span>
                  </td>
                  <td className="text-surface-400">{room.current_tenant || '--'}</td>
                  <td>{formatCurrency(room.default_price)}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditRoom(room)}
                        className="btn-secondary btn-sm"
                      >
                        Sửa
                      </button>
                      {room.status === 'vacant' && (
                        <button
                          onClick={() => setDeleteRoom(room)}
                          className="btn-danger btn-sm"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Thêm phòng mới">
        <RoomForm
          onSubmit={handleAdd}
          loading={submitting}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editRoom} onClose={() => setEditRoom(null)} title="Chỉnh sửa phòng">
        {editRoom && (
          <RoomForm
            initial={editRoom}
            onSubmit={handleEdit}
            loading={submitting}
            onCancel={() => setEditRoom(null)}
          />
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteRoom}
        onClose={() => setDeleteRoom(null)}
        onConfirm={handleDelete}
        title={`Xóa phòng "${deleteRoom?.name}"?`}
        message="Thao tác này không thể hoàn tác. Hãy chắc chắn phòng không có khách đang thuê."
        confirmLabel="Xóa phòng"
        loading={submitting}
      />
    </div>
  )
}
