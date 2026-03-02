// ============================================
// pages/Breach.jsx — Breach Monitor
// ============================================
import { useState } from 'react'
import { breachAPI } from '../utils/api'

export default function Breach() {
  const [email, setEmail]     = useState('')
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [error, setError]     = useState('')

  const check = async (e) => {
    e.preventDefault()
    if(!email || !email.includes('@')) { setError('Please enter a valid email'); return }
    setLoading(true)
    setResult(null)
    setError('')
    try {
      const res = await breachAPI.check(email)
      const data = res.data
      setResult(data)
      setHistory(prev => [{ email, safe: data.safe, count: data.breachCount, time: new Date() }, ...prev.slice(0,4)])
    } catch(e) {
      setError(e.response?.data?.message || 'Check failed. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Breach Monitor</h2>
        <p className="text-slate-500 text-sm mt-0.5">Check if your email was exposed in a known data breach</p>
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h3 className="font-bold text-blue-800 text-sm mb-2">🛡 How This Works</h3>
        <p className="text-blue-700 text-sm leading-relaxed">
          This tool checks your email against the <strong>HaveIBeenPwned</strong> database — 
          a collection of billions of credentials leaked from known hacks at companies like LinkedIn, 
          Adobe, Dropbox, and thousands more. If your email appears, it means your password from 
          that breach may be known to hackers. <strong>Change that password immediately.</strong>
        </p>
      </div>

      {/* Check form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 mb-4 text-sm">Check an Email Address</h3>
        <form onSubmit={check} className="flex gap-3">
          <input
            type="email" value={email} onChange={e=>{setEmail(e.target.value);setError('');setResult(null)}}
            placeholder="Enter email address to check..."
            className="flex-1 px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button type="submit" disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-6 py-3 rounded-lg text-sm transition shadow-sm whitespace-nowrap">
            {loading ? 'Checking...' : '🔍 Check Now'}
          </button>
        </form>
        {error && <p className="text-red-600 text-sm mt-3">⚠ {error}</p>}

        {/* Loading state */}
        {loading && (
          <div className="mt-5 py-6 text-center">
            <div className="animate-spin text-3xl mb-3">🔄</div>
            <p className="text-slate-500 text-sm">Scanning {(0.3*1e9).toLocaleString()}+ breached accounts...</p>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className={`mt-5 rounded-xl border p-5 ${result.safe ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-start gap-4">
              <span className="text-4xl">{result.safe ? '✅' : '🚨'}</span>
              <div className="flex-1">
                <h4 className={`font-bold text-base mb-1 ${result.safe ? 'text-green-800' : 'text-red-800'}`}>
                  {result.safe ? 'No Breaches Found!' : `${result.breachCount} Breach${result.breachCount>1?'es':''} Found!`}
                </h4>
                <p className={`text-sm ${result.safe ? 'text-green-700' : 'text-red-700'}`}>{result.message}</p>

                {/* Breach list */}
                {!result.safe && result.breaches?.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-bold text-red-800 uppercase tracking-wide">Affected Breaches:</p>
                    {result.breaches.map((b,i) => (
                      <div key={i} className="bg-white border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{b.title || b.name}</p>
                          {b.date && <p className="text-xs text-slate-500 font-mono">Breach date: {b.date}</p>}
                          {b.pwnCount && <p className="text-xs text-slate-500">{b.pwnCount.toLocaleString()} accounts affected</p>}
                        </div>
                        <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded">EXPOSED</span>
                      </div>
                    ))}
                    <div className="bg-red-100 rounded-lg px-4 py-3 mt-3">
                      <p className="text-sm font-bold text-red-800">⚡ Immediate Actions Required:</p>
                      <ul className="text-sm text-red-700 mt-1.5 space-y-1 list-disc list-inside">
                        <li>Change your password on the affected services immediately</li>
                        <li>Enable two-factor authentication (2FA) on those accounts</li>
                        <li>Check if you used the same password on other sites</li>
                        <li>Save your new strong password in the DevShield Vault</li>
                      </ul>
                    </div>
                  </div>
                )}

                {result.safe && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-green-600 text-sm">✓ Your email was not found in any known data breach.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Check history */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm">Recent Checks</h3>
          </div>
          {history.map((h,i) => (
            <div key={i} className={`px-5 py-3.5 flex items-center gap-3 ${i!==history.length-1?'border-b border-slate-50':''}`}>
              <span className="text-xl">{h.safe ? '✅' : '🚨'}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-700 font-mono">{h.email}</p>
                <p className="text-xs text-slate-400">{h.time.toLocaleTimeString()}</p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${h.safe?'bg-green-50 text-green-700 border-green-200':'bg-red-50 text-red-700 border-red-200'}`}>
                {h.safe ? 'Safe' : `${h.count} breach${h.count>1?'es':''}`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Tips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { icon:'🔑', title:'Use Unique Passwords', desc:'Never reuse the same password across multiple websites. If one site is breached, all accounts with that password are at risk.' },
          { icon:'⚡', title:'Enable 2FA Everywhere', desc:'Two-factor authentication adds a second layer of security. Even if your password is stolen, hackers cannot access your account without your phone.' },
          { icon:'🔒', title:'Use a Password Manager', desc:'Store all your passwords in the DevShield Vault. Use the password generator to create strong unique passwords for every site.' },
          { icon:'🔔', title:'Check Regularly', desc:'New breaches are discovered every week. Check your email every month to catch new exposures quickly before they can be exploited.' },
        ].map(tip => (
          <div key={tip.title} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex gap-3">
            <span className="text-2xl flex-shrink-0">{tip.icon}</span>
            <div>
              <p className="font-bold text-slate-700 text-sm mb-1">{tip.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{tip.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
