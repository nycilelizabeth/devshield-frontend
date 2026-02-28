// ============================================
// pages/Dashboard.jsx
// ============================================
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { bugAPI, testAPI, passwordAPI } from '../utils/api'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats]           = useState({ bugs:0, tests:0, passwords:0, passRate:0 })
  const [recentBugs, setRecentBugs] = useState([])
  const [recentTests, setRecentTests] = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [bRes, tRes, pRes] = await Promise.all([
          bugAPI.getAll(), testAPI.getAll(), passwordAPI.getAll()
        ])
        const bugs  = bRes.data.bugs       || []
        const tests = tRes.data.testCases  || []
        const pws   = pRes.data.passwords  || []
        setStats({
          bugs:      bugs.filter(b => b.status !== 'Resolved').length,
          tests:     tests.length,
          passwords: pws.length,
          passRate:  tRes.data.stats?.passRate || 0,
        })
        setRecentBugs(bugs.slice(0,4))
        setRecentTests(tests.slice(0,4))
      } catch(e){ console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const score = Math.min(100, Math.round(
    (stats.passRate * 0.4) +
    (stats.passwords > 0 ? 30 : 0) +
    (stats.bugs === 0 ? 30 : Math.max(0, 30 - stats.bugs * 3))
  ))
  const grade = score>=90?'A':score>=75?'B+':score>=60?'B':score>=45?'C':'D'
  const dash  = `${(score/100)*251} 251`

  const greet = () => {
    const h = new Date().getHours()
    return h<12?'Good morning':h<17?'Good afternoon':'Good evening'
  }

  if(loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-36 bg-slate-200 rounded-xl"/>
      <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_,i)=><div key={i} className="h-24 bg-slate-200 rounded-xl"/>)}</div>
      <div className="grid grid-cols-2 gap-6"><div className="h-56 bg-slate-200 rounded-xl"/><div className="h-56 bg-slate-200 rounded-xl"/></div>
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Hero banner */}
      <div className="bg-gradient-to-r from-slate-800 to-blue-900 rounded-xl p-6 text-white flex items-center justify-between">
        <div>
          <p className="text-blue-300 text-sm mb-1">{greet()},</p>
          <h2 className="text-2xl font-bold mb-1">{user?.name} 👋</h2>
          <p className="text-slate-400 text-sm font-mono">
            {new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
          </p>
          <div className="flex gap-2 mt-3">
            <span className="bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold px-2.5 py-1 rounded-full">
              {stats.bugs} Open Bugs
            </span>
            <span className="bg-green-500/20 text-green-300 border border-green-500/30 text-xs font-semibold px-2.5 py-1 rounded-full">
              {stats.passRate}% Pass Rate
            </span>
          </div>
        </div>
        {/* Score ring */}
        <div className="text-center flex-shrink-0">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8"/>
              <circle cx="48" cy="48" r="40" fill="none" stroke="#3b82f6" strokeWidth="8"
                strokeDasharray={dash} strokeLinecap="round" className="transition-all duration-700"/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold font-mono leading-none">{score}</span>
              <span className="text-xs text-slate-400">/100</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">Security Score</p>
          <span className="text-blue-400 text-sm font-bold font-mono">Grade: {grade}</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon:'🐛', label:'Open Bugs',    value:stats.bugs,       color:'red',    to:'/bugs'      },
          { icon:'✅', label:'Test Cases',   value:stats.tests,      color:'green',  to:'/testcases' },
          { icon:'📊', label:'Pass Rate',    value:`${stats.passRate}%`, color:'blue', to:'/testcases'},
          { icon:'🔑', label:'Credentials',  value:stats.passwords,  color:'purple', to:'/vault'     },
        ].map(c => (
          <Link key={c.to} to={c.to} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4 hover:border-blue-300 hover:shadow-md transition-all group">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0
              ${c.color==='red'?'bg-red-50':c.color==='green'?'bg-green-50':c.color==='blue'?'bg-blue-50':'bg-violet-50'}`}>
              {c.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 font-mono leading-none">{c.value}</p>
              <p className="text-xs text-slate-500 mt-1">{c.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent bugs + tests */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Recent Bugs</h3>
            <Link to="/bugs" className="text-blue-600 text-xs font-semibold hover:underline">View all →</Link>
          </div>
          {recentBugs.length === 0
            ? <Empty icon="🐛" text="No bugs yet — great job!" />
            : recentBugs.map(b => (
              <div key={b._id} className="px-5 py-3 flex items-center gap-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${b.severity==='High'?'bg-red-500':b.severity==='Medium'?'bg-amber-500':'bg-blue-400'}`}/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate">{b.title}</p>
                  <p className="text-xs text-slate-400">{b.project || 'General'}</p>
                </div>
                <SBadge v={b.status} map={{Open:'bg-red-50 text-red-600 border-red-200','In Progress':'bg-amber-50 text-amber-600 border-amber-200',Resolved:'bg-green-50 text-green-600 border-green-200'}}/>
              </div>
            ))
          }
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Recent Test Cases</h3>
            <Link to="/testcases" className="text-blue-600 text-xs font-semibold hover:underline">View all →</Link>
          </div>
          {recentTests.length === 0
            ? <Empty icon="✅" text="No test cases yet" />
            : recentTests.map(t => (
              <div key={t._id} className="px-5 py-3 flex items-center gap-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                <span>{t.status==='Pass'?'✅':t.status==='Fail'?'❌':t.status==='Skip'?'⏭':'⬜'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate">{t.title}</p>
                  <p className="text-xs text-slate-400">{t.module} · {t.priority}</p>
                </div>
                <SBadge v={t.status} map={{Pass:'bg-green-50 text-green-600 border-green-200',Fail:'bg-red-50 text-red-600 border-red-200',Skip:'bg-amber-50 text-amber-600 border-amber-200','Not Run':'bg-slate-50 text-slate-500 border-slate-200'}}/>
              </div>
            ))
          }
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="font-bold text-slate-800 text-sm mb-4">Quick Actions</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { to:'/bugs',      icon:'🐛', label:'Report Bug',    sub:'Log a new bug'        },
            { to:'/testcases', icon:'✅', label:'Add Test Case',  sub:'Write test scenario'  },
            { to:'/vault',     icon:'🔑', label:'Add Password',   sub:'Save credentials'     },
            { to:'/breach',    icon:'🛡', label:'Check Breach',   sub:'Scan email for leaks' },
          ].map(a => (
            <Link key={a.to} to={a.to} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-blue-200 hover:bg-blue-50 transition-all text-center">
              <span className="text-2xl">{a.icon}</span>
              <span className="text-xs font-bold text-slate-700">{a.label}</span>
              <span className="text-xs text-slate-400">{a.sub}</span>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}

function SBadge({ v, map }) {
  return <span className={`text-xs font-bold px-2 py-0.5 rounded border font-mono flex-shrink-0 ${map[v]||'bg-slate-50 text-slate-500 border-slate-200'}`}>{v}</span>
}
function Empty({ icon, text }) {
  return <div className="py-10 text-center"><div className="text-3xl mb-2">{icon}</div><p className="text-slate-400 text-sm">{text}</p></div>
}
