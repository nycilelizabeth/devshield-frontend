import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../context/AuthContext'

const pageTitles = {
  '/dashboard': ['Dashboard',         "Welcome back — here's your security overview"],
  '/bugs':      ['Bug Tracker',       'Track and resolve bugs across all projects'],
  '/testcases': ['Test Cases',        'Write, run and track test cases'],
  '/apitester': ['API Tester',        'Send HTTP requests and scan for vulnerabilities'],
  '/vault':     ['Password Vault',    'AES-256 encrypted credential storage'],
  '/breach':    ['Breach Monitor',    'Monitor emails for known data breaches'],
  '/phishing':  ['Phishing Scanner',  'Analyze URLs for phishing and malware indicators'],
  '/audit':     ['Password Audit',    'Analyze and improve password strength'],
  '/notes':     ['Encrypted Notes',   'End-to-end encrypted private notes'],
  '/reports':   ['Security Report',   'Complete security health overview'],
  '/team':      ['Team',              'Collaborate with your team members'],
  '/activity':  ['Audit Trail',       'Complete log of all security activities'],
}

export default function Layout() {
  const { user }  = useAuth()
  const location  = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [title, subtitle] = pageTitles[location.pathname] || ['DevShield', '']

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile, slides in when open */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-60 transition-transform duration-300 lg:relative lg:translate-x-0 lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-slate-200 px-4 lg:px-7 h-14 flex items-center gap-3 flex-shrink-0 shadow-sm">

          {/* Hamburger menu — mobile only */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-600 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100 transition flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-slate-900 truncate">{title}</h1>
            <p className="text-xs text-slate-400 font-mono hidden sm:block truncate">{subtitle}</p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="bg-green-50 text-green-700 border border-green-200 text-xs font-semibold px-2 lg:px-3 py-1 rounded-full hidden sm:block">
              🛡 Secured
            </span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}