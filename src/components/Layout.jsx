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
  const [title, subtitle] = pageTitles[location.pathname] || ['DevShield', '']

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-7 h-14 flex items-center gap-4 flex-shrink-0 shadow-sm">
          <div className="flex-1">
            <h1 className="text-sm font-bold text-slate-900">{title}</h1>
            <p className="text-xs text-slate-400 font-mono">{subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-green-50 text-green-700 border border-green-200 text-xs font-semibold px-3 py-1 rounded-full">
              🛡 Secured
            </span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}