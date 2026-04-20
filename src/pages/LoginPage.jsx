import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!email) errs.email = 'Vui lòng nhập email'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Email không hợp lệ'
    if (!password) errs.password = 'Vui lòng nhập mật khẩu'
    else if (password.length < 6) errs.password = 'Mật khẩu tối thiểu 6 ký tự'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) throw error
        navigate('/')
        toast.success('Đăng nhập thành công!')
      } else {
        const { error } = await signUp(email, password)
        if (error) throw error
        toast.success('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.')
        setMode('login')
      }
    } catch (err) {
      const msg = err?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.'
      const viMsg = msg.includes('Invalid login credentials')
        ? 'Email hoặc mật khẩu không đúng'
        : msg.includes('Email not confirmed')
          ? 'Vui lòng xác nhận email trước khi đăng nhập'
          : msg.includes('User already registered')
            ? 'Email này đã được đăng ký'
            : msg
      toast.error(viMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-surface-950 px-4 py-12 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-800/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center mb-4 shadow-lg shadow-primary-500/20">
            <Building2 size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-surface-50">Phòng Trọ</h1>
          <p className="text-sm text-surface-400 mt-1">Quản lý nhà trọ thông minh</p>
        </div>

        {/* Card */}
        <div className="card p-6">
          {/* Tabs */}
          <div className="flex rounded-lg bg-surface-800 p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrors({}) }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                mode === 'login'
                  ? 'bg-surface-700 text-surface-50 shadow-sm'
                  : 'text-surface-400 hover:text-surface-300'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrors({}) }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                mode === 'signup'
                  ? 'bg-surface-700 text-surface-50 shadow-sm'
                  : 'text-surface-400 hover:text-surface-300'
              }`}
            >
              Đăng ký
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="chuphong@gmail.com"
                className={`input ${errors.email ? 'input-error' : ''}`}
                autoComplete="email"
              />
              {errors.email && <p className="text-xs text-danger-400 mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="label">Mật khẩu</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-danger-400 mt-1">{errors.password}</p>}
            </div>

            <button
              id="submit-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xử lý...
                </span>
              ) : mode === 'login' ? (
                <>
                  <LogIn size={16} />
                  Đăng nhập
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Tạo tài khoản
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-surface-600 mt-6">
          Dữ liệu của bạn được bảo mật và riêng tư.
        </p>
      </div>
    </div>
  )
}
