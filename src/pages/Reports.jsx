// ============================================
// pages/Reports.jsx — Security Report
// ============================================
import { useState, useEffect } from 'react'
import { bugAPI, testAPI, passwordAPI } from '../utils/api'
import { useAuth } from '../context/AuthContext'

export default function Reports() {
  const { user }  = useAuth()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [bRes, tRes, pRes] = await Promise.all([
          bugAPI.getAll(), testAPI.getAll(), passwordAPI.getAll()
        ])
        const bugs  = bRes.data.bugs      || []
        const tests = tRes.data.testCases || []
        const pws   = pRes.data.passwords || []
        setData({ bugs, tests, pws, stats: tRes.data.stats || {} })
      } catch(e){ console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  if(loading) return <div className="py-16 text-center text-slate-400 animate-pulse">Generating report...</div>
  if(!data)   return <div className="py-16 text-center text-slate-400">Failed to load data</div>

  const { bugs, tests, pws, stats } = data

  const openBugs     = bugs.filter(b=>b.status!=='Resolved').length
  const highBugs     = bugs.filter(b=>b.severity==='High'&&b.status!=='Resolved').length
  const resolvedBugs = bugs.filter(b=>b.status==='Resolved').length
  const passRate     = stats.passRate || 0
  const weakPws      = pws.filter(p=>(p.strength||0)<=2).length
  const strongPws    = pws.filter(p=>(p.strength||0)>=4).length

  // Weighted security score
  const pwScore   = pws.length > 0 ? Math.round(((pws.length - weakPws) / pws.length) * 100) : 50
  const testScore = passRate
  const bugScore  = bugs.length > 0 ? Math.round(Math.max(0, 100 - (openBugs * 8) - (highBugs * 5))) : 100
  const overallScore = Math.round((pwScore * 0.35) + (testScore * 0.35) + (bugScore * 0.3))

  const grade = overallScore>=90?'A':overallScore>=75?'B+':overallScore>=60?'B':overallScore>=45?'C':'D'
  const gradeColor = overallScore>=75?'text-green-600':overallScore>=45?'text-amber-600':'text-red-600'

  // Action items
  const actions = [
    highBugs > 0 && { sev:'HIGH',   text:`Fix ${highBugs} high-severity bug${highBugs>1?'s':''} immediately` },
    weakPws  > 0 && { sev:'HIGH',   text:`Update ${weakPws} weak password${weakPws>1?'s':''} in your vault` },
    openBugs > 5 && { sev:'MEDIUM', text:`${openBugs} open bugs — prioritize resolution this sprint` },
    passRate < 70 && { sev:'MEDIUM', text:`Pass rate at ${passRate}% — review and fix failing test cases` },
    pws.length===0 && { sev:'LOW',   text:'Start using the Password Vault to secure team credentials' },
    tests.length===0 && { sev:'LOW', text:'Add test cases to start tracking software quality' },
  ].filter(Boolean)

  const print = () => window.print()

  return (
    <div className="space-y-4 lg:space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Security Report</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Generated {new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})} · {user?.name}
          </p>
        </div>
        <button onClick={print}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-2">
          🖨 Print / Save PDF
        </button>
      </div>

      {/* Overall score */}
      <div className="bg-gradient-to-r from-slate-800 to-blue-900 rounded-xl p-4 lg:p-6 text-white flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-8">
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
            <circle cx="56" cy="56" r="48" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10"/>
            <circle cx="56" cy="56" r="48" fill="none" stroke="#3b82f6" strokeWidth="10"
              strokeDasharray={`${(overallScore/100)*301.6} 301.6`} strokeLinecap="round"/>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold font-mono">{overallScore}</span>
            <span className="text-xs text-slate-400">/100</span>
          </div>
        </div>
        <div>
          <p className="text-blue-300 text-sm">Overall Security Score</p>
          <p className={`text-5xl font-bold font-mono mt-1 mb-2 ${gradeColor.replace('text-','text-').replace('600','300')}`}>
            {grade}
          </p>
          <p className="text-slate-400 text-sm">
            {overallScore>=75?'Good security posture. A few improvements recommended.':
             overallScore>=45?'Moderate security. Several issues need attention.':
             'Poor security posture. Immediate action required.'}
          </p>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label:'Password Health', score:pwScore,   icon:'🔑', desc:`${strongPws} strong, ${weakPws} weak` },
          { label:'Test Coverage',   score:testScore,  icon:'✅', desc:`${passRate}% pass rate, ${tests.length} total` },
          { label:'Bug Control',     score:bugScore,   icon:'🐛', desc:`${openBugs} open, ${resolvedBugs} resolved` },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{s.icon}</span>
                <p className="text-sm font-bold text-slate-700">{s.label}</p>
              </div>
              <span className={`text-xl font-bold font-mono ${s.score>=70?'text-green-600':s.score>=45?'text-amber-600':'text-red-600'}`}>
                {s.score}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div className={`h-full rounded-full transition-all duration-700 ${s.score>=70?'bg-green-500':s.score>=45?'bg-amber-500':'bg-red-500'}`}
                style={{width:`${s.score}%`}}/>
            </div>
            <p className="text-xs text-slate-500">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Summary table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm">📊 Detailed Summary</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {[
            ['Total Bugs Reported',   bugs.length,        ''],
            ['Open Bugs',             openBugs,            openBugs>5?'red':openBugs>0?'amber':'green'],
            ['High Severity Bugs',    highBugs,            highBugs>0?'red':'green'],
            ['Bugs Resolved',         resolvedBugs,        'green'],
            ['Total Test Cases',      tests.length,        ''],
            ['Tests Passing',         stats.passed||0,     'green'],
            ['Tests Failing',         stats.failed||0,     stats.failed>0?'red':'green'],
            ['Overall Pass Rate',     `${passRate}%`,      passRate>=70?'green':passRate>=50?'amber':'red'],
            ['Credentials Stored',    pws.length,          pws.length>0?'green':''],
            ['Strong Passwords',      strongPws,           'green'],
            ['Weak Passwords',        weakPws,             weakPws>0?'red':'green'],
          ].map(([label, val, color]) => (
            <div key={label} className="px-5 py-3.5 flex items-center justify-between">
              <span className="text-sm text-slate-600">{label}</span>
              <span className={`text-sm font-bold font-mono ${
                color==='green'?'text-green-600':color==='red'?'text-red-600':color==='amber'?'text-amber-600':'text-slate-700'
              }`}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action items */}
      {actions.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm">⚡ Recommended Actions</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {actions.map((a,i) => (
              <div key={i} className="px-5 py-3.5 flex items-center gap-3">
                <span className={`text-xs font-bold px-2 py-1 rounded border flex-shrink-0 ${
                  a.sev==='HIGH'  ?'bg-red-50 text-red-700 border-red-200':
                  a.sev==='MEDIUM'?'bg-amber-50 text-amber-700 border-amber-200':
                                   'bg-slate-50 text-slate-600 border-slate-200'
                }`}>{a.sev}</span>
                <span className="text-sm text-slate-700">{a.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {actions.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
          <div className="text-3xl mb-2">🎉</div>
          <p className="font-bold text-green-800">All clear! No immediate actions required.</p>
          <p className="text-green-700 text-sm mt-1">Keep monitoring regularly and continue good security practices.</p>
        </div>
      )}
    </div>
  )
}
