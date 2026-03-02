import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navGroups = [
  { label:'Overview', items:[
    { to:'/dashboard', icon:'⊞',  label:'Dashboard'   },
    { to:'/activity',  icon:'📋', label:'Audit Trail'  },
    { to:'/team',      icon:'👥', label:'Team'         },
  ]},
  { label:'Testing', items:[
    { to:'/bugs',      icon:'🐛', label:'Bug Tracker'  },
    { to:'/testcases', icon:'✅', label:'Test Cases'    },
    { to:'/apitester', icon:'🔌', label:'API Tester'   },
  ]},
  { label:'Security', items:[
    { to:'/vault',    icon:'🔑', label:'Password Vault'   },
    { to:'/breach',   icon:'🛡', label:'Breach Monitor'   },
    { to:'/phishing', icon:'🎣', label:'Phishing Scanner' },
    { to:'/audit',    icon:'⚡', label:'Password Audit'   },
    { to:'/notes',    icon:'📝', label:'Encrypted Notes'  },
  ]},
  { label:'Reports', items:[
    { to:'/reports', icon:'📊', label:'Security Report' },
  ]},
]

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }
  const initials = user?.name?.split(' ').map(n=>n[0]).join('').toUpperCase() || 'U'

  const handleNavClick = () => {
    if (onClose) onClose()
  }

  return (
    <aside className="w-60 h-full bg-slate-900 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm">🛡</div>
            <span className="text-white font-bold text-base">DevShield</span>
          </div>
          <p className="text-slate-500 text-xs font-mono pl-10">security platform</p>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {navGroups.map(group => (
          <div key={group.label} className="px-4 py-2">
            <p className="text-slate-600 text-xs font-bold uppercase tracking-widest mb-1">{group.label}</p>
            {group.items.map(item => (
              <NavLink key={item.to} to={item.to}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all mb-0.5 border-l-2 ${
                    isActive
                      ? 'bg-blue-900/40 text-white border-blue-500'
                      : 'text-slate-400 border-transparent hover:bg-slate-800 hover:text-slate-200'
                  }`}>
                <span className="text-sm w-4 text-center">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User profile */}
      <div className="px-4 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-200 text-xs font-semibold truncate">{user?.name || 'User'}</p>
            <p className="text-slate-500 text-xs truncate capitalize">{user?.role?.replace('_', ' ') || 'Member'}</p>
          </div>
          <button onClick={handleLogout} className="text-slate-600 hover:text-red-400 transition-colors text-sm" title="Logout">⏻</button>
        </div>
      </div>
    </aside>
  )
}