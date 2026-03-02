// pages/Bugs.jsx — Bug Tracker with Screenshot Upload + Project Filter
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { bugAPI } from '../utils/api'

const BASE_URL = 'https://devshield-backend-production.up.railway.app/api'

export default function Bugs() {
  const [bugs, setBugs]                   = useState([])
  const [loading, setLoading]             = useState(true)
  const [showForm, setShowForm]           = useState(false)
  const [filter, setFilter]               = useState('All')
  const [projectFilter, setProjectFilter] = useState('All')
  const [search, setSearch]               = useState('')
  const [form, setForm]                   = useState({ title:'', description:'', severity:'Medium', project:'General', module:'', steps:'', environment:'' })
  const [screenshot, setScreenshot]       = useState(null)
  const [screenshotPreview, setScreenshotPreview] = useState(null)
  const [saving, setSaving]               = useState(false)
  const [msg, setMsg]                     = useState('')
  const [expandedImg, setExpandedImg]     = useState(null)
  const fileRef                           = useRef()

  const load = async () => {
    try { const res = await bugAPI.getAll(); setBugs(res.data.bugs || []) }
    catch(e){ console.error(e) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])
  const notify = (m) => { setMsg(m); setTimeout(()=>setMsg(''),3000) }

  const handleScreenshot = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { notify('❌ Image too large — max 5MB'); return }
    setScreenshot(file)
    setScreenshotPreview(URL.createObjectURL(file))
  }

  const removeScreenshot = () => {
    setScreenshot(null)
    setScreenshotPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const token = localStorage.getItem('devshield_token')
      // Use FormData to support file upload
      const formData = new FormData()
      Object.entries(form).forEach(([k, v]) => formData.append(k, v))
      if (screenshot) formData.append('screenshot', screenshot)

      await axios.post(`${BASE_URL}/bugs`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      setForm({ title:'', description:'', severity:'Medium', project:'General', module:'', steps:'', environment:'' })
      removeScreenshot()
      setShowForm(false)
      notify('✅ Bug reported successfully!')
      load()
    } catch(e) { notify('❌ Failed to report bug') }
    finally { setSaving(false) }
  }

  const updateStatus = async (id, status) => {
    try { await bugAPI.update(id, { status }); notify(`✅ Status updated to ${status}`); load() }
    catch(e){ notify('❌ Update failed') }
  }

  const deleteBug = async (id) => {
    if (!confirm('Delete this bug?')) return
    try { await bugAPI.delete(id); notify('🗑 Bug deleted'); load() }
    catch(e){ notify('❌ Delete failed') }
  }

  const projects = ['All', ...Array.from(new Set(bugs.map(b => b.project || 'General')))]

  const filtered = bugs.filter(b => {
    const matchStatus  = filter === 'All' || b.status === filter
    const matchProject = projectFilter === 'All' || (b.project || 'General') === projectFilter
    const matchSearch  = b.title.toLowerCase().includes(search.toLowerCase()) ||
                         (b.project||'').toLowerCase().includes(search.toLowerCase()) ||
                         (b.module||'').toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchProject && matchSearch
  })

  const counts   = { All: bugs.length, Open: bugs.filter(b=>b.status==='Open').length, 'In Progress': bugs.filter(b=>b.status==='In Progress').length, Resolved: bugs.filter(b=>b.status==='Resolved').length }
  const sevColor = { High:'border-l-red-500 bg-red-50/30', Medium:'border-l-amber-500 bg-amber-50/20', Low:'border-l-blue-400 bg-blue-50/20' }
  const sevBadge = { High:'bg-red-50 text-red-600 border-red-200', Medium:'bg-amber-50 text-amber-600 border-amber-200', Low:'bg-slate-50 text-slate-500 border-slate-200' }
  const statBadge = { Open:'bg-red-50 text-red-600 border-red-200', 'In Progress':'bg-amber-50 text-amber-600 border-amber-200', Resolved:'bg-green-50 text-green-600 border-green-200' }

  return (
    <div className="space-y-5">

      {/* Toast */}
      {msg && <div className="fixed top-5 right-5 z-50 bg-slate-800 text-white text-sm px-4 py-3 rounded-xl shadow-lg">{msg}</div>}

      {/* Image lightbox */}
      {expandedImg && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={()=>setExpandedImg(null)}>
          <div className="relative max-w-4xl w-full">
            <button className="absolute -top-10 right-0 text-white text-2xl font-bold" onClick={()=>setExpandedImg(null)}>✕</button>
            <img src={expandedImg} alt="Bug screenshot" className="w-full rounded-xl shadow-2xl"/>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Bug Tracker</h2>
          <p className="text-slate-500 text-sm mt-0.5">{bugs.filter(b=>b.status!=='Resolved').length} open bugs across all projects</p>
        </div>
        <button onClick={()=>setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition flex items-center gap-2 shadow-sm">
          {showForm ? '✕ Cancel' : '+ Report Bug'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[['🔴','High',bugs.filter(b=>b.severity==='High'&&b.status!=='Resolved').length,'text-red-600'],
          ['🟡','Medium',bugs.filter(b=>b.severity==='Medium'&&b.status!=='Resolved').length,'text-amber-600'],
          ['✅','Resolved',bugs.filter(b=>b.status==='Resolved').length,'text-green-600'],
          ['📊','Total',bugs.length,'text-blue-600']].map(([ico,lbl,val,col])=>(
          <div key={lbl} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
            <span className="text-xl">{ico}</span>
            <div>
              <p className={`text-xl font-bold font-mono ${col}`}>{val}</p>
              <p className="text-xs text-slate-500">{lbl}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Report form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4">🐛 Report New Bug</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bug Title *</label>
              <input className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of the issue..." value={form.title}
                onChange={e=>setForm({...form,title:e.target.value})} required/>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Severity</label>
                <select className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={form.severity} onChange={e=>setForm({...form,severity:e.target.value})}>
                  <option>High</option><option>Medium</option><option>Low</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Project</label>
                <input className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. DevShield Web" value={form.project}
                  onChange={e=>setForm({...form,project:e.target.value})}/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Module</label>
                <input className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Auth, Vault, UI" value={form.module}
                  onChange={e=>setForm({...form,module:e.target.value})}/>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
              <textarea className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
                placeholder="Detailed description of the bug..." value={form.description}
                onChange={e=>setForm({...form,description:e.target.value})}/>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Steps to Reproduce</label>
                <textarea className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20 font-mono"
                  placeholder="1. Go to...&#10;2. Click...&#10;3. Observe..." value={form.steps}
                  onChange={e=>setForm({...form,steps:e.target.value})}/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Environment</label>
                <input className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Chrome 121 / Windows 11" value={form.environment}
                  onChange={e=>setForm({...form,environment:e.target.value})}/>
              </div>
            </div>

            {/* Screenshot Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">📸 Screenshot (optional)</label>
              {!screenshotPreview ? (
                <div
                  onClick={()=>fileRef.current.click()}
                  className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all">
                  <div className="text-3xl mb-2">📷</div>
                  <p className="text-sm font-semibold text-slate-600">Click to upload screenshot</p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG, GIF up to 5MB</p>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleScreenshot}/>
                </div>
              ) : (
                <div className="relative">
                  <img src={screenshotPreview} alt="Preview" className="w-full max-h-48 object-cover rounded-xl border border-slate-200"/>
                  <button type="button" onClick={removeScreenshot}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold hover:bg-red-600 shadow-lg">
                    ✕
                  </button>
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
                    {screenshot?.name}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition">
                {saving ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    {screenshot ? 'Uploading...' : 'Submitting...'}
                  </span>
                ) : 'Submit Bug Report'}
              </button>
              <button type="button" onClick={()=>{ setShowForm(false); removeScreenshot() }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-5 py-2.5 rounded-lg transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Project Filter */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">📁 Filter by Project</span>
          {projectFilter !== 'All' && (
            <button onClick={()=>setProjectFilter('All')} className="text-xs text-blue-600 hover:underline ml-auto">Clear filter</button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {projects.map(p => (
            <button key={p} onClick={()=>setProjectFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${projectFilter===p ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50'}`}>
              {p === 'All' ? 'All Projects' : p}
              {p !== 'All' && <span className="ml-1.5 opacity-70">({bugs.filter(b=>(b.project||'General')===p).length})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Status filters + search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search bugs..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div className="flex gap-2">
          {Object.entries(counts).map(([k,v])=>(
            <button key={k} onClick={()=>setFilter(k)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${filter===k?'bg-blue-600 text-white border-blue-600':'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
              {k} ({v})
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

      {/* Bug list */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400">Loading bugs...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">🐛</div>
            <p className="text-slate-500 font-semibold">No bugs found</p>
            <p className="text-slate-400 text-sm mt-1">{bugs.length === 0 ? 'Report your first bug above' : 'Try changing the filter or project'}</p>
          </div>
        ) : (
          <div>
            {filtered.map((bug, i) => (
              <div key={bug._id} className={`border-l-4 ${sevColor[bug.severity]||'border-l-slate-300'} px-5 py-4 ${i!==filtered.length-1?'border-b border-slate-100':''} hover:bg-slate-50/80 transition-colors`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs text-slate-400 font-mono">BUG-{String(i+1).padStart(3,'0')}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${sevBadge[bug.severity]}`}>{bug.severity}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${statBadge[bug.status]||'bg-slate-50 text-slate-500 border-slate-200'}`}>{bug.status}</span>
                      {bug.project && <span className="text-xs font-semibold px-2 py-0.5 rounded border bg-blue-50 text-blue-600 border-blue-200">📁 {bug.project}</span>}
                      {bug.module  && <span className="text-xs text-slate-500 font-mono">{bug.module}</span>}
                      {bug.screenshot?.url && <span className="text-xs font-semibold px-2 py-0.5 rounded border bg-purple-50 text-purple-600 border-purple-200">📸 Screenshot</span>}
                    </div>
                    <p className="font-semibold text-slate-800 text-sm mb-1">{bug.title}</p>
                    {bug.description && <p className="text-xs text-slate-500 line-clamp-1">{bug.description}</p>}
                    {bug.environment && <p className="text-xs text-slate-400 mt-1 font-mono">📱 {bug.environment}</p>}

                    {/* Screenshot thumbnail */}
                    {bug.screenshot?.url && (
                      <div className="mt-3">
                        <img
                          src={bug.screenshot.url}
                          alt="Bug screenshot"
                          onClick={()=>setExpandedImg(bug.screenshot.url)}
                          className="h-24 rounded-lg border border-slate-200 cursor-zoom-in object-cover hover:opacity-90 transition shadow-sm"
                        />
                        <p className="text-xs text-slate-400 mt-1">Click to enlarge</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {bug.status === 'Open' && (
                      <button onClick={()=>updateStatus(bug._id,'In Progress')}
                        className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1.5 rounded-lg font-semibold hover:bg-amber-100 transition">
                        In Progress
                      </button>
                    )}
                    {bug.status !== 'Resolved' && (
                      <button onClick={()=>updateStatus(bug._id,'Resolved')}
                        className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1.5 rounded-lg font-semibold hover:bg-green-100 transition">
                        Resolve ✓
                      </button>
                    )}
                    <button onClick={()=>deleteBug(bug._id)}
                      className="text-xs bg-slate-50 text-slate-500 border border-slate-200 px-2.5 py-1.5 rounded-lg font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}