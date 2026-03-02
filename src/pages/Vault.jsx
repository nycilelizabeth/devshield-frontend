// ============================================
// pages/Vault.jsx — Password Vault
// ============================================
import { useState, useEffect } from 'react'
import { passwordAPI } from '../utils/api'

// Password strength checker
function getStrength(pw) {
  let score = 0
  if(pw.length >= 8)  score++
  if(pw.length >= 12) score++
  if(/[A-Z]/.test(pw)) score++
  if(/[a-z]/.test(pw)) score++
  if(/[0-9]/.test(pw)) score++
  if(/[^A-Za-z0-9]/.test(pw)) score++
  return score
}
function strengthLabel(s) {
  if(s<=1) return ['Very Weak','bg-red-500','text-red-600']
  if(s<=2) return ['Weak','bg-red-400','text-red-500']
  if(s<=3) return ['Fair','bg-amber-500','text-amber-600']
  if(s<=4) return ['Good','bg-blue-500','text-blue-600']
  if(s<=5) return ['Strong','bg-green-500','text-green-600']
  return ['Very Strong','bg-green-600','text-green-700']
}

// Random strong password generator
function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  return Array.from({length:16}, () => chars[Math.floor(Math.random()*chars.length)]).join('')
}

export default function Vault() {
  const [passwords, setPasswords] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [search, setSearch]       = useState('')
  const [visible, setVisible]     = useState({})
  const [copied, setCopied]       = useState('')
  const [msg, setMsg]             = useState('')
  const [saving, setSaving]       = useState(false)
  const [form, setForm]           = useState({ service:'', username:'', password:'', project:'General' })
  const [pwStrength, setPwStrength] = useState(0)

  const load = async () => {
    try {
      const res = await passwordAPI.getAll()
      setPasswords(res.data.passwords || [])
    } catch(e){ console.error(e) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const notify = (m) => { setMsg(m); setTimeout(()=>setMsg(''), 2500) }

  const handlePwChange = (val) => {
    setForm({...form, password:val})
    setPwStrength(getStrength(val))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if(!form.service || !form.username || !form.password) return
    setSaving(true)
    try {
      await passwordAPI.create({ ...form, strength: pwStrength })
      setForm({ service:'', username:'', password:'', project:'General' })
      setPwStrength(0)
      setShowForm(false)
      notify('✅ Password saved securely!')
      load()
    } catch(e){ notify('❌ Failed to save password') }
    finally { setSaving(false) }
  }

  const copyPassword = async (id, pw) => {
    try {
      await navigator.clipboard.writeText(pw)
      setCopied(id)
      notify('✅ Password copied to clipboard!')
      setTimeout(()=>setCopied(''), 2000)
    } catch { notify('❌ Copy failed') }
  }

  const deletePassword = async (id) => {
    if(!confirm('Delete this credential?')) return
    try {
      await passwordAPI.delete(id)
      notify('🗑 Credential deleted')
      load()
    } catch(e){ notify('❌ Delete failed') }
  }

  const filtered = passwords.filter(p =>
    p.service.toLowerCase().includes(search.toLowerCase()) ||
    p.username.toLowerCase().includes(search.toLowerCase()) ||
    (p.project||'').toLowerCase().includes(search.toLowerCase())
  )

  const weakCount = passwords.filter(p => (p.strength||0) <= 2).length

  return (
    <div className="space-y-5">

      {msg && <div className="fixed top-5 right-5 z-50 bg-slate-800 text-white text-sm px-4 py-3 rounded-xl shadow-lg">{msg}</div>}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Password Vault</h2>
          <p className="text-slate-500 text-sm mt-0.5">AES-256 encrypted · {passwords.length} credentials stored</p>
        </div>
        <button onClick={()=>setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition flex items-center gap-2 shadow-sm">
          {showForm ? '✕ Cancel' : '+ Add Credential'}
        </button>
      </div>

      {/* Warning if weak passwords */}
      {weakCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-sm font-bold text-red-700">{weakCount} weak password{weakCount>1?'s':''} detected</p>
            <p className="text-xs text-red-500">Update them to improve your security score</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
          <span className="text-2xl">🔑</span>
          <div><p className="text-2xl font-bold font-mono text-blue-600">{passwords.length}</p><p className="text-xs text-slate-500">Total Credentials</p></div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div><p className="text-2xl font-bold font-mono text-green-600">{passwords.filter(p=>(p.strength||0)>=4).length}</p><p className="text-xs text-slate-500">Strong Passwords</p></div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div><p className="text-2xl font-bold font-mono text-red-500">{weakCount}</p><p className="text-xs text-slate-500">Weak Passwords</p></div>
        </div>
      </div>

      {/* Add credential form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4">🔑 Add New Credential</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Service / Website *</label>
                <input className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. GitHub, AWS, MongoDB" value={form.service}
                  onChange={e=>setForm({...form,service:e.target.value})} required/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Username / Email *</label>
                <input className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@example.com" value={form.username}
                  onChange={e=>setForm({...form,username:e.target.value})} required/>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password *</label>
              <div className="flex gap-2">
                <input className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="Enter or generate a password" value={form.password}
                  onChange={e=>handlePwChange(e.target.value)} required/>
                <button type="button" onClick={()=>handlePwChange(generatePassword())}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition border border-slate-200 whitespace-nowrap">
                  ⚡ Generate
                </button>
              </div>
              {/* Strength indicator */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[...Array(6)].map((_,i)=>(
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i<pwStrength ? strengthLabel(pwStrength)[1] : 'bg-slate-100'}`}/>
                    ))}
                  </div>
                  <p className={`text-xs font-semibold ${strengthLabel(pwStrength)[2]}`}>{strengthLabel(pwStrength)[0]}</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Project</label>
              <input className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. DevShield, Personal" value={form.project}
                onChange={e=>setForm({...form,project:e.target.value})}/>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition">
                {saving ? 'Encrypting & Saving...' : '🔒 Save Securely'}
              </button>
              <button type="button" onClick={()=>setShowForm(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-5 py-2.5 rounded-lg transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        <input className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search credentials..." value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      {/* Password list */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400">Loading vault...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">🔑</div>
            <p className="text-slate-500 font-semibold">{passwords.length===0?'Vault is empty':'No results found'}</p>
            <p className="text-slate-400 text-sm mt-1">{passwords.length===0?'Add your first credential above':'Try a different search term'}</p>
          </div>
        ) : filtered.map((pw, i) => {
          const [sLabel, sBar, sText] = strengthLabel(pw.strength||0)
          const isVisible = visible[pw._id]
          return (
            <div key={pw._id} className={`px-5 py-4 flex items-center gap-4 ${i!==filtered.length-1?'border-b border-slate-100':''} hover:bg-slate-50/50 transition-colors ${(pw.strength||0)<=2?'border-l-2 border-l-red-300':''}`}>
              {/* Service icon */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {pw.service[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-slate-800 text-sm">{pw.service}</p>
                  {pw.project && <span className="text-xs text-slate-400 font-mono">· {pw.project}</span>}
                  {(pw.strength||0)<=2 && <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">⚠ Weak</span>}
                </div>
                <p className="text-xs text-slate-500 font-mono mb-1.5">{pw.username}</p>
                {/* Password field */}
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-slate-100 rounded px-2 py-1 font-mono text-slate-600 select-all">
                    {isVisible ? pw.password : '••••••••••••'}
                  </code>
                  <button onClick={()=>setVisible({...visible,[pw._id]:!isVisible})}
                    className="text-xs text-slate-400 hover:text-slate-700 transition">
                    {isVisible?'🙈 Hide':'👁 Show'}
                  </button>
                </div>
                {/* Strength bar */}
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex gap-0.5">
                    {[...Array(6)].map((_,j)=>(
                      <div key={j} className={`w-4 h-1 rounded-full ${j<(pw.strength||0)?sBar:'bg-slate-100'}`}/>
                    ))}
                  </div>
                  <span className={`text-xs font-semibold ${sText}`}>{sLabel}</span>
                </div>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={()=>copyPassword(pw._id, pw.password)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${copied===pw._id?'bg-green-50 text-green-700 border-green-200':'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'}`}>
                  {copied===pw._id ? '✓ Copied!' : '📋 Copy'}
                </button>
                <button onClick={()=>deletePassword(pw._id)}
                  className="text-xs bg-slate-50 text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition">
                  Delete
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
