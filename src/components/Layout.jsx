import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Building2, Zap, FileText, Settings, LogOut, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/rooms', icon: Building2, label: 'Phòng trọ' },
  { to: '/billing', icon: Zap, label: 'Chốt điện nước' },
  { to: '/invoices', icon: FileText, label: 'Hóa đơn' },
  { to: '/settings', icon: Settings, label: 'Cài đặt' },
]

function NavItem({ to, icon: Icon, label, exact, mobile }) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        mobile
          ? isActive ? 'nav-item-active' : 'nav-item-inactive'
          : isActive
            ? 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary-400 bg-primary-500/10 transition-all'
            : 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-surface-400 hover:text-surface-200 hover:bg-surface-800 transition-all'
      }
    >
      <Icon size={mobile ? 20 : 18} />
      {mobile ? <span className="text-[10px] leading-tight">{label}</span> : <span>{label}</span>}
    </NavLink>
  )
}

export default function Layout({ children }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-surface-900 border-r border-surface-800 fixed top-0 left-0 bottom-0 z-40">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-surface-800">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0">
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-surface-50 leading-tight">Phòng Trọ</p>
            <p className="text-[10px] text-surface-500">Quản lý nhà trọ</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-surface-800">
          <div className="flex items-center gap-2 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-primary-700 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary-200">
                {user?.email?.[0].toUpperCase() || 'U'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-surface-200 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-surface-400 hover:text-danger-400 hover:bg-danger-500/10 transition-all"
          >
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-dvh">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-surface-900/80 backdrop-blur border-b border-surface-800 sticky top-0 z-30 safe-top">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center">
              <Building2 size={16} className="text-white" />
            </div>
            <span className="font-bold text-surface-50 text-sm">Phòng Trọ</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(v => !v)}
            className="btn-ghost btn-sm p-2"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-[57px] bg-surface-950/95 backdrop-blur z-20 p-4 animate-slide-down">
            <nav className="space-y-1">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'text-primary-400 bg-primary-500/10'
                        : 'text-surface-300 hover:bg-surface-800'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={20} className={isActive ? 'text-primary-400' : 'text-surface-500'} />
                      {item.label}
                    </>
                  )}
                </NavLink>
              ))}
              <div className="border-t border-surface-800 pt-2 mt-2">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-danger-400 hover:bg-danger-500/10 transition-all"
                >
                  <LogOut size={20} />
                  Đăng xuất
                </button>
              </div>
            </nav>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface-900/95 backdrop-blur border-t border-surface-800 z-30 safe-bottom">
        <div className="flex items-center justify-around px-2 pt-1.5 pb-1">
          {navItems.map(item => (
            <NavItem key={item.to} {...item} mobile />
          ))}
        </div>
      </nav>
    </div>
  )
}
