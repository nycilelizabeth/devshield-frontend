// ============================================
// pages/ActivityLog.jsx — Audit Trail Page
// ============================================
import { useState, useEffect } from 'react'
import api from '../utils/api'

const ACTION_META = {
  BUG_CREATED:      { icon:'🐛', label:'Bug Created',       color:'bg-red-50 text-red-700 border-red-200'       },
  BUG_UPDATED:      { icon:'✏️', label:'Bug Updated',       color:'bg-amber-50 text-amber-700 border-amber-200' },
  BUG_RESOLVED:     { icon:'✅', label:'Bug Resolved',      color:'bg-green-50 text-green-700 border-green-200' },
  BUG_DELETED:      { icon:'🗑', label:'Bug Deleted',       color:'bg-slate-50 text-slate-600 border-slate-200' },
  TEST_CREATED:     { icon:'📝', label:'Test Created',      color:'bg-blue-50 text-blue-700 border-blue-200'    },
  TEST_PASSED:      { icon:'✅', label:'Test Passed',       color:'bg-green-50 text-green-700 border-green-200' },
  TEST_FAILED:      { icon:'❌', label:'Test Failed',       color:'bg-red-50 text-red-700 border-red-200'       },
  TEST_DELETED:     { icon:'🗑', label:'Test Deleted',      color:'bg-slate-50 text-slate-600 border-slate-200' },
  PASSWORD_SAVED:   { icon:'🔑', label:'Password Saved',    color:'bg-blue-50 text-blue-700 border-blue-200'    },
  PASSWORD_DELETED: { icon:'🗑', label:'Password Deleted',  color:'bg-slate-50 text-slate-600 border-slate-200' },
  BREACH_CHECKED:   { icon:'🛡', label:'Breach Check',      color:'bg-purple-50 text-purple-700 border-purple-200'},
  PHISHING_SCANNED: { icon:'🎣', label:'Phishing Scan',     color:'bg-amber-50 text-amber-700 border-amber-200' },
  NOTE_CREATED:     { icon:'📝', label:'Note Created',      color:'bg-blue-50 text-blue-700 border-blue-200'    },
  NOTE_DELETED:     { icon:'🗑', label:'Note Deleted',      color:'bg-slate-50 text-slate-600 border-slate-200' },
  USER_LOGIN:       { icon:'🔓', label:'Login',             color:'bg-green-50 text-green-700 border-green-200' },
  USER_REGISTER:    { icon:'🎉', label:'Registration',      color:'bg-blue-50 text-blue-700 border-blue-200'    },
  USER_LOGOUT:      { icon:'🔒', label:'Logout',            color:'bg-slate-50 text-slate-600 border-slate-200' },
}

const SEV_STYLE = {
  info:     'bg-blue-50 text-blue-600 border-blue-200',
  warning:  'bg-amber-50 text-amber-600 border-amber-200',
  critical: 'bg-red-50 text-red-600 border-red-200',
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60)   return `${Math.floor(diff)}s ago`
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  if (diff < 86400)return `${Math.floor(diff/3600)}h ago`
  return `${Math.floor(diff/86400)}d ago`
}

export default function ActivityLog() {
  const [logs, setLogs]         = useState([])
  const [stats, setStats]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')
  const [sevFilter, setSevFilter] = useState('all')
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const params = { page: p, limit: 20 }
      if (filter !== 'all')    params.action   = filter
      if (sevFilter !== 'all') params.severity = sevFilter

      const [logsRes, statsRes] = await Promise.all([
        api.get('/activity', { params }),
        api.get('/activity/stats')
      ])
      setLogs(logsRes.data.logs || [])
      setTotalPages(logsRes.data.totalPages || 1)
      setStats(statsRes.data.stats)
      setPage(p)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load(1) }, [filter, sevFilter])

  const filtered = logs.filter(l =>
    l.description.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase())
  )

  const exportCSV = () => {
    const rows = [
      ['Time', 'Action', 'Description', 'Severity', 'IP Address'],
      ...logs.map(l => [
        new Date(l.createdAt).toLocaleString('en-IN'),
        l.action, l.description, l.severity, l.ipAddress
      ])
    ]
    const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `devshield-audit-${Date.now()}.csv`; a.click()
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Audit Trail</h2>
          <p className="text-slate-500 text-sm mt-0.5">Complete record of every action — required for compliance</p>
        </div>
        <button onClick={exportCSV}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-2">
          📥 Export CSV
        </button>
      </div>

      {/* Compliance banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 flex gap-3">
        <span className="text-xl flex-shrink-0">📋</span>
        <div>
          <p className="text-sm font-bold text-blue-800">Compliance Audit Trail</p>
          <p className="text-sm text-blue-700 mt-0.5">
            Every action is automatically recorded with timestamp, user, and IP address.
            This meets compliance requirements for <strong>ISO 27001</strong>, <strong>HIPAA</strong>, and <strong>SOC 2</strong> audits.
            Export to CSV for compliance reports.
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon:'📋', label:'Total Events',    value: stats.total,    color:'text-blue-600'   },
            { icon:'📅', label:'Last 30 Days',    value: stats.recent,   color:'text-green-600'  },
            { icon:'🚨', label:'Critical Events', value: stats.critical, color:'text-red-600'    },
            { icon:'📊', label:'Event Types',     value: stats.byAction?.length || 0, color:'text-purple-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className={`text-2xl font-bold font-mono leading-none ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search activity..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>

        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Actions</option>
          <optgroup label="Bugs">
            <option value="BUG_CREATED">Bug Created</option>
            <option value="BUG_RESOLVED">Bug Resolved</option>
            <option value="BUG_DELETED">Bug Deleted</option>
          </optgroup>
          <optgroup label="Tests">
            <option value="TEST_CREATED">Test Created</option>
            <option value="TEST_PASSED">Test Passed</option>
            <option value="TEST_FAILED">Test Failed</option>
          </optgroup>
          <optgroup label="Security">
            <option value="PASSWORD_SAVED">Password Saved</option>
            <option value="BREACH_CHECKED">Breach Checked</option>
            <option value="PHISHING_SCANNED">Phishing Scanned</option>
          </optgroup>
          <optgroup label="Auth">
            <option value="USER_LOGIN">Login</option>
            <option value="USER_REGISTER">Registration</option>
          </optgroup>
        </select>

        <div className="flex gap-2">
          {['all','info','warning','critical'].map(s => (
            <button key={s} onClick={() => setSevFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-bold border transition capitalize ${
                sevFilter === s
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
              }`}>
              {s === 'all' ? '📋 All' : s === 'critical' ? '🚨 Critical' : s === 'warning' ? '⚠️ Warning' : 'ℹ️ Info'}
            </button>
          ))}
        </div>
      </div>

      {/* Activity list */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

        {loading ? (
          <div className="py-16 text-center">
            <div className="text-3xl mb-3 animate-pulse">📋</div>
            <p className="text-slate-400 text-sm">Loading audit trail...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-slate-500 font-semibold">No activity yet</p>
            <p className="text-slate-400 text-sm mt-1">Actions you take in DevShield will appear here automatically</p>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 grid grid-cols-12 gap-3 text-xs font-bold text-slate-500 uppercase tracking-wide">
              <div className="col-span-1">Sev</div>
              <div className="col-span-2">Action</div>
              <div className="col-span-5">Description</div>
              <div className="col-span-2">IP Address</div>
              <div className="col-span-2 text-right">Time</div>
            </div>

            {filtered.map((log, i) => {
              const meta = ACTION_META[log.action] || { icon:'📋', label: log.action, color:'bg-slate-50 text-slate-600 border-slate-200' }
              return (
                <div key={log._id}
                  className={`px-5 py-3.5 grid grid-cols-12 gap-3 items-center text-sm
                    ${i !== filtered.length - 1 ? 'border-b border-slate-50' : ''}
                    ${log.severity === 'critical' ? 'bg-red-50/30' : ''}
                    hover:bg-slate-50/70 transition-colors`}>

                  {/* Severity */}
                  <div className="col-span-1">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${SEV_STYLE[log.severity]}`}>
                      {log.severity === 'critical' ? '🚨' : log.severity === 'warning' ? '⚠️' : 'ℹ️'}
                    </span>
                  </div>

                  {/* Action badge */}
                  <div className="col-span-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded border whitespace-nowrap flex items-center gap-1 w-fit ${meta.color}`}>
                      <span>{meta.icon}</span>
                      <span className="hidden lg:inline">{meta.label}</span>
                    </span>
                  </div>

                  {/* Description */}
                  <div className="col-span-5">
                    <p className="text-slate-700 text-xs truncate">{log.description}</p>
                  </div>

                  {/* IP */}
                  <div className="col-span-2">
                    <span className="text-xs font-mono text-slate-400">{log.ipAddress || '—'}</span>
                  </div>

                  {/* Time */}
                  <div className="col-span-2 text-right">
                    <span className="text-xs text-slate-400 font-mono" title={new Date(log.createdAt).toLocaleString('en-IN')}>
                      {timeAgo(log.createdAt)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => load(page - 1)} disabled={page === 1}
            className="px-4 py-2 text-sm font-semibold border border-slate-200 rounded-lg bg-white disabled:opacity-40 hover:border-blue-300 transition">
            ← Prev
          </button>
          <span className="text-sm text-slate-500 font-mono">Page {page} of {totalPages}</span>
          <button onClick={() => load(page + 1)} disabled={page === totalPages}
            className="px-4 py-2 text-sm font-semibold border border-slate-200 rounded-lg bg-white disabled:opacity-40 hover:border-blue-300 transition">
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
