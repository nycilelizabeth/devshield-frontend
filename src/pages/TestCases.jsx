// pages/TestCases.jsx — Test Case Manager with Project Filter
import { useState, useEffect } from 'react'
import { testAPI } from '../utils/api'

export default function TestCases() {
  const [tests, setTests]                 = useState([])
  const [loading, setLoading]             = useState(true)
  const [showForm, setShowForm]           = useState(false)
  const [filter, setFilter]               = useState('All')
  const [projectFilter, setProjectFilter] = useState('All')
  const [search, setSearch]               = useState('')
  const [saving, setSaving]               = useState(false)
  const [msg, setMsg]                     = useState('')
  const [form, setForm]                   = useState({ title:'', description:'', steps:'', expectedResult:'', priority:'Medium', module:'General', project:'General' })

  const load = async () => {
    try { const res = await testAPI.getAll(); setTests(res.data.testCases || []) }
    catch(e){ console.error(e) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])
  const notify = (m) => { setMsg(m); setTimeout(()=>setMsg(''), 3000) }

  const handleSubmit = async (e) => {
    e.preventDefault(); if(!form.title.trim()) return; setSaving(true)
    try { await testAPI.create(form); setForm({ title:'', description:'', steps:'', expectedResult:'', priority:'Medium', module:'General', project:'General' }); setShowForm(false); notify('Test case created!'); load() }
    catch(e){ notify('Failed') } finally { setSaving(false) }
  }
  const runTest = async (id, result) => {
    try { await testAPI.update(id, { status: result, actualResult: result === 'Pass' ? 'Test passed' : 'Test failed' }); notify(`Test marked as ${result}`); load() }
    catch(e){ notify('Update failed') }
  }
  const deleteTest = async (id) => {
    if(!confirm('Delete this test case?')) return
    try { await testAPI.delete(id); notify('Deleted'); load() } catch(e){ notify('Failed') }
  }

  const stats = {
    total:    tests.length,
    pass:     tests.filter(t=>t.status==='Pass').length,
    fail:     tests.filter(t=>t.status==='Fail').length,
    notRun:   tests.filter(t=>t.status==='Not Run').length,
    passRate: tests.length > 0 ? Math.round((tests.filter(t=>t.status==='Pass').length / tests.length)*100) : 0,
  }

  // Get unique project names dynamically
  const projects = ['All', ...Array.from(new Set(tests.map(t => t.project || 'General')))]

  const filtered = tests.filter(t => {
    const matchFilter  = filter === 'All' || t.status === filter
    const matchProject = projectFilter === 'All' || (t.project || 'General') === projectFilter
    const matchSearch  = t.title.toLowerCase().includes(search.toLowerCase()) ||
                         (t.module||'').toLowerCase().includes(search.toLowerCase()) ||
                         (t.project||'').toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchProject && matchSearch
  })

  const statusIcon  = { Pass:'✅', Fail:'❌', Skip:'⏭', 'Not Run':'⬜' }
  const statusBadge = { Pass:'bg-green-50 text-green-700 border-green-200', Fail:'bg-red-50 text-red-700 border-red-200', Skip:'bg-amber-50 text-amber-700 border-amber-200', 'Not Run':'bg-slate-50 text-slate-500 border-slate-200' }
  const priBadge    = { High:'bg-red-50 text-red-600 border-red-200', Medium:'bg-amber-50 text-amber-600 border-amber-200', Low:'bg-slate-50 text-slate-500 border-slate-200' }

  return (
    <div className="space-y-5">
      {msg && <div className="fixed top-5 right-5 z-50 bg-slate-800 text-white text-sm px-4 py-3 rounded-xl shadow-lg">{msg}</div>}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Test Cases</h2>
          <p className="text-slate-500 text-sm mt-0.5">{stats.total} cases · {stats.passRate}% pass rate</p>
        </div>
        <button onClick={()=>setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition shadow-sm">
          {showForm ? 'Cancel' : '+ Add Test Case'}
        </button>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-700">Overall Pass Rate</span>
          <span className="text-2xl font-bold font-mono text-blue-600">{stats.passRate}%</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
          <div className="bg-green-500 h-full transition-all duration-500" style={{width:`${stats.passRate}%`}}/>
          <div className="bg-red-400 h-full transition-all duration-500" style={{width:`${stats.total>0?Math.round((stats.fail/stats.total)*100):0}%`}}/>
        </div>
        <div className="flex gap-6 mt-3">
          {[['✅','Passed',stats.pass,'text-green-600'],['❌','Failed',stats.fail,'text-red-600'],['⬜','Not Run',stats.notRun,'text-slate-500'],['📋','Total',stats.total,'text-blue-600']].map(([ico,lbl,val,col])=>(
            <div key={lbl} className="flex items-center gap-2">
              <span>{ico}</span>
              <div><p className={`text-lg font-bold font-mono leading-none ${col}`}>{val}</p><p className="text-xs text-slate-400">{lbl}</p></div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4">Add New Test Case</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Test Case Title *</label>
              <input className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Valid login with correct credentials" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Priority</label>
                <select className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
                  <option>High</option><option>Medium</option><option>Low</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Project</label>
                <input className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. DevShield Web" value={form.project} onChange={e=>setForm({...form,project:e.target.value})}/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Module</label>
                <input className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Auth, Vault, API" value={form.module} onChange={e=>setForm({...form,module:e.target.value})}/>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Test Steps</label>
                <textarea className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24 font-mono"
                  placeholder="1. Navigate to /login&#10;2. Enter valid email&#10;3. Click Sign In" value={form.steps} onChange={e=>setForm({...form,steps:e.target.value})}/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Expected Result</label>
                <textarea className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                  placeholder="User should be redirected to dashboard" value={form.expectedResult} onChange={e=>setForm({...form,expectedResult:e.target.value})}/>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition">
                {saving ? 'Saving...' : 'Save Test Case'}
              </button>
              <button type="button" onClick={()=>setShowForm(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-5 py-2.5 rounded-lg transition">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* PROJECT FILTER */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Filter by Project</span>
          {projectFilter !== 'All' && (
            <button onClick={()=>setProjectFilter('All')} className="text-xs text-blue-600 hover:underline ml-auto">Clear filter</button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {projects.map(p => (
            <button key={p} onClick={()=>setProjectFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${projectFilter===p ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50'}`}>
              {p === 'All' ? 'All Projects' : p}
              {p !== 'All' && (
                <span className="ml-1.5 opacity-70">
                  ({tests.filter(t=>(t.project||'General')===p).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Status filters + search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search test cases..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['All','Pass','Fail','Not Run'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${filter===f?'bg-blue-600 text-white border-blue-600':'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
              {statusIcon[f]||'📋'} {f}
            </button>
          ))}
        </div>
      </div>

      {(projectFilter !== 'All' || search) && (
        <div className="text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2">
          Showing <span className="font-bold text-blue-700">{filtered.length}</span> result{filtered.length!==1?'s':''}
          {projectFilter !== 'All' && <> in <span className="font-bold text-blue-700">"{projectFilter}"</span></>}
          {search && <> matching <span className="font-bold text-blue-700">"{search}"</span></>}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400">Loading test cases...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-slate-500 font-semibold">No test cases found</p>
            <p className="text-slate-400 text-sm mt-1">{tests.length === 0 ? 'Add your first test case above' : 'Try a different filter or project'}</p>
          </div>
        ) : filtered.map((t,i) => (
          <div key={t._id} className={`px-5 py-4 flex items-start gap-4 ${i!==filtered.length-1?'border-b border-slate-100':''} hover:bg-slate-50/50 transition-colors`}>
            <span className="text-xl flex-shrink-0 mt-0.5">{statusIcon[t.status]||'⬜'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-xs text-slate-400 font-mono">TC-{String(i+1).padStart(3,'0')}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${priBadge[t.priority]}`}>{t.priority}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${statusBadge[t.status]||statusBadge['Not Run']}`}>{t.status}</span>
                {t.project && <span className="text-xs font-semibold px-2 py-0.5 rounded border bg-blue-50 text-blue-600 border-blue-200">📁 {t.project}</span>}
                {t.module  && <span className="text-xs text-slate-400 font-mono">{t.module}</span>}
              </div>
              <p className="font-semibold text-slate-800 text-sm mb-1">{t.title}</p>
              {t.expectedResult && <p className="text-xs text-slate-500"><span className="font-semibold text-slate-600">Expected: </span>{t.expectedResult}</p>}
              {t.steps && (
                <details className="mt-2">
                  <summary className="text-xs text-blue-600 cursor-pointer font-semibold">View steps</summary>
                  <pre className="text-xs text-slate-500 mt-1.5 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap font-mono border border-slate-100">{t.steps}</pre>
                </details>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={()=>runTest(t._id,'Pass')} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1.5 rounded-lg font-semibold hover:bg-green-100 transition">✓ Pass</button>
              <button onClick={()=>runTest(t._id,'Fail')} className="text-xs bg-red-50 text-red-700 border border-red-200 px-2.5 py-1.5 rounded-lg font-semibold hover:bg-red-100 transition">✗ Fail</button>
              <button onClick={()=>deleteTest(t._id)} className="text-xs bg-slate-50 text-slate-500 border border-slate-200 px-2.5 py-1.5 rounded-lg font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}