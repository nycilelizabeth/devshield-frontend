// ============================================
// pages/ApiTester.jsx — API Security Tester
// ============================================
import { useState } from 'react'
import axios from 'axios'

// ── SECURITY CHECKS ──
// These run automatically on every API response
function runSecurityChecks(url, response, duration) {
  const headers = response?.headers || {}
  const data    = JSON.stringify(response?.data || '')
  const status  = response?.status || 0

  return [
    {
      id:    'https',
      name:  'HTTPS Enforced',
      pass:  url.startsWith('https://'),
      info:  url.startsWith('https://')
               ? 'Connection is encrypted using HTTPS.'
               : 'URL uses HTTP — data is sent unencrypted. Anyone on the network can read it.',
      fix:   'Change your API URL to start with https://',
    },
    {
      id:    'csp',
      name:  'Content-Security-Policy Header',
      pass:  !!(headers['content-security-policy']),
      info:  headers['content-security-policy']
               ? `CSP present: ${headers['content-security-policy'].slice(0,80)}...`
               : 'CSP header missing. Without it, browsers allow any scripts to run on the page.',
      fix:   'Add Content-Security-Policy header in your server response.',
    },
    {
      id:    'xframe',
      name:  'X-Frame-Options Header',
      pass:  !!(headers['x-frame-options']),
      info:  headers['x-frame-options']
               ? `X-Frame-Options: ${headers['x-frame-options']}`
               : 'X-Frame-Options missing. Your app could be embedded in iframes for clickjacking attacks.',
      fix:   'Add X-Frame-Options: DENY or SAMEORIGIN header.',
    },
    {
      id:    'sensitive',
      name:  'No Sensitive Data Exposed',
      pass:  !/(password|secret|token|apikey|api_key|private_key)/i.test(data),
      info:  /(password|secret|token|apikey|api_key|private_key)/i.test(data)
               ? '⚠ Response contains sensitive keywords like password, secret, or token.'
               : 'No sensitive keywords detected in the response body.',
      fix:   'Never return passwords, secrets, or private keys in API responses.',
    },
    {
      id:    'responseTime',
      name:  'Response Time < 2000ms',
      pass:  duration < 2000,
      info:  `API responded in ${duration}ms. ${duration < 500 ? 'Excellent speed.' : duration < 2000 ? 'Acceptable speed.' : 'Too slow — may indicate server issues or DDoS vulnerability.'}`,
      fix:   'Optimize database queries, add caching, or use a CDN.',
    },
    {
      id:    'statusCode',
      name:  'Valid Status Code',
      pass:  status >= 200 && status < 400,
      info:  `Response status: ${status}. ${status>=200&&status<300?'Success range (2xx).':status>=400&&status<500?'Client error (4xx).':status>=500?'Server error (5xx) — internal errors exposed.':'Unknown status.'}`,
      fix:   'Ensure your API returns appropriate HTTP status codes.',
    },
    {
      id:    'cors',
      name:  'CORS Headers Present',
      pass:  !!(headers['access-control-allow-origin']),
      info:  headers['access-control-allow-origin']
               ? `CORS origin: ${headers['access-control-allow-origin']}`
               : 'CORS header missing or blocked by browser. This may prevent frontend apps from calling this API.',
      fix:   'Add Access-Control-Allow-Origin header to your server.',
    },
    {
      id:    'contentType',
      name:  'Content-Type Header',
      pass:  !!(headers['content-type']),
      info:  headers['content-type']
               ? `Content-Type: ${headers['content-type']}`
               : 'Content-Type header missing. Browsers may misinterpret the response format.',
      fix:   'Always set Content-Type: application/json for JSON APIs.',
    },
  ]
}

const METHODS   = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const SAMPLE_URLS = [
  { label: 'JSONPlaceholder — Get Posts',    method:'GET',  url:'https://jsonplaceholder.typicode.com/posts/1',    body:'' },
  { label: 'JSONPlaceholder — Create Post',  method:'POST', url:'https://jsonplaceholder.typicode.com/posts',      body:'{\n  "title": "Test Post",\n  "body": "Hello World",\n  "userId": 1\n}' },
  { label: 'GitHub API — User Info',         method:'GET',  url:'https://api.github.com/users/octocat',            body:'' },
  { label: 'DevShield — Health Check',       method:'GET',  url:'http://localhost:5000/api/health',                body:'' },
]

export default function ApiTester() {
  const [method,  setMethod]   = useState('GET')
  const [url,     setUrl]      = useState('')
  const [body,    setBody]     = useState('')
  const [headers, setHeaders]  = useState('{\n  "Content-Type": "application/json"\n}')
  const [response, setResponse]= useState(null)
  const [checks,  setChecks]   = useState([])
  const [loading, setLoading]  = useState(false)
  const [error,   setError]    = useState('')
  const [history, setHistory]  = useState([])
  const [activeTab, setActiveTab] = useState('response') // response | headers | checks

  const loadSample = (s) => {
    setMethod(s.method)
    setUrl(s.url)
    setBody(s.body)
    setResponse(null)
    setChecks([])
    setError('')
  }

  const sendRequest = async () => {
    if(!url.trim()) { setError('Please enter a URL'); return }
    setLoading(true)
    setError('')
    setResponse(null)
    setChecks([])

    const start = Date.now()
    try {
      // Parse custom headers
      let parsedHeaders = {}
      try { parsedHeaders = JSON.parse(headers) } catch { parsedHeaders = {} }

      // Parse body for POST/PUT/PATCH
      let parsedBody = undefined
      if(['POST','PUT','PATCH'].includes(method) && body.trim()) {
        try { parsedBody = JSON.parse(body) } catch { parsedBody = body }
      }

      const res = await axios({
        method:  method.toLowerCase(),
        url:     url.trim(),
        headers: parsedHeaders,
        data:    parsedBody,
        timeout: 10000,
        // Don't throw on 4xx/5xx so we can still show response
        validateStatus: () => true,
      })

      const duration = Date.now() - start
      const secChecks = runSecurityChecks(url, res, duration)

      setResponse({ ...res, duration, size: JSON.stringify(res.data).length })
      setChecks(secChecks)
      setActiveTab('response')

      // Add to history
      const passed = secChecks.filter(c=>c.pass).length
      setHistory(prev => [{
        method, url: url.length>50?url.slice(0,50)+'...':url,
        status: res.status, duration, passed, total: secChecks.length,
        time: new Date()
      }, ...prev.slice(0,9)])

    } catch(e) {
      const duration = Date.now() - start
      if(e.code === 'ECONNABORTED') {
        setError(`Request timed out after 10 seconds. The server did not respond.`)
      } else if(e.message?.includes('Network Error') || e.message?.includes('CORS')) {
        // Still run security checks with what we know
        const secChecks = runSecurityChecks(url, null, duration)
        setChecks(secChecks)
        setError(`Network Error / CORS blocked. The browser blocked this request. This is actually a CORS security check result — the server doesn't allow cross-origin requests from this browser.`)
        setActiveTab('checks')
      } else {
        setError(`Request failed: ${e.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if(e.ctrlKey && e.key==='Enter') sendRequest()
  }

  const passed = checks.filter(c=>c.pass).length
  const secScore = checks.length > 0 ? Math.round((passed/checks.length)*100) : null

  const statusColor = (s) => {
    if(!s) return 'text-slate-500'
    if(s>=200&&s<300) return 'text-green-600'
    if(s>=300&&s<400) return 'text-blue-600'
    if(s>=400&&s<500) return 'text-amber-600'
    return 'text-red-600'
  }

  const methodColor = (m) => ({
    GET:'bg-green-50 text-green-700 border-green-200',
    POST:'bg-blue-50 text-blue-700 border-blue-200',
    PUT:'bg-amber-50 text-amber-700 border-amber-200',
    PATCH:'bg-purple-50 text-purple-700 border-purple-200',
    DELETE:'bg-red-50 text-red-700 border-red-200',
  }[m]||'bg-slate-50 text-slate-600 border-slate-200')

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">API Security Tester</h2>
        <p className="text-slate-500 text-sm mt-0.5">
          Send HTTP requests and automatically scan responses for 8 OWASP security vulnerabilities
        </p>
      </div>

      {/* Sample URLs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Quick Load — Sample Endpoints</p>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_URLS.map(s => (
            <button key={s.label} onClick={()=>loadSample(s)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-700 transition">
              <span className={`px-1.5 py-0.5 rounded text-xs font-bold border ${methodColor(s.method)}`}>{s.method}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Request Builder */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm">Request Builder</h3>
        </div>

        <div className="p-5 space-y-4">
          {/* Method + URL + Send */}
          <div className="flex gap-2">
            <select
              value={method} onChange={e=>setMethod(e.target.value)}
              className={`px-3 py-2.5 border rounded-lg text-sm font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${methodColor(method)}`}
            >
              {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input
              value={url} onChange={e=>setUrl(e.target.value)} onKeyDown={handleKey}
              placeholder="https://api.example.com/endpoint"
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder-slate-400"
            />
            <button onClick={sendRequest} disabled={loading || !url.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition shadow-sm flex items-center gap-2 whitespace-nowrap">
              {loading
                ? <><span className="animate-spin">⟳</span> Sending...</>
                : <>▶ Send  <span className="text-blue-300 text-xs font-normal">Ctrl+Enter</span></>
              }
            </button>
          </div>

          {/* Headers */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Request Headers (JSON)</label>
            <textarea
              value={headers} onChange={e=>setHeaders(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-slate-50"
            />
          </div>

          {/* Body (only for POST/PUT/PATCH) */}
          {['POST','PUT','PATCH'].includes(method) && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Request Body (JSON)</label>
              <textarea
                value={body} onChange={e=>setBody(e.target.value)}
                rows={5}
                placeholder={'{\n  "key": "value"\n}'}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-slate-50"
              />
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex gap-3">
          <span className="text-xl flex-shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-bold text-amber-800 mb-1">Request Note</p>
            <p className="text-sm text-amber-700">{error}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm py-14 text-center">
          <div className="text-3xl mb-3 animate-spin inline-block">⟳</div>
          <p className="text-slate-500 text-sm font-semibold">Sending request & running security checks...</p>
        </div>
      )}

      {/* Response + Checks */}
      {(response || checks.length > 0) && !loading && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Response meta bar */}
          {response && (
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-4 flex-wrap">
              <span className={`text-sm font-bold font-mono ${statusColor(response.status)}`}>
                {response.status} {response.statusText}
              </span>
              <span className="text-xs text-slate-500 font-mono">⏱ {response.duration}ms</span>
              <span className="text-xs text-slate-500 font-mono">📦 {(response.size/1024).toFixed(2)} KB</span>
              {secScore !== null && (
                <span className={`ml-auto text-xs font-bold px-3 py-1 rounded-full border ${
                  secScore>=75?'bg-green-50 text-green-700 border-green-200':
                  secScore>=50?'bg-amber-50 text-amber-700 border-amber-200':
                              'bg-red-50 text-red-700 border-red-200'
                }`}>
                  🛡 Security: {passed}/{checks.length} checks passed ({secScore}%)
                </span>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            {[
              { id:'response', label:'Response Body',    show: !!response },
              { id:'rheaders', label:'Response Headers', show: !!response },
              { id:'checks',   label:`Security Checks ${checks.length>0?`(${passed}/${checks.length})`:''}`, show: checks.length>0 },
            ].filter(t=>t.show).map(tab => (
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
                className={`px-5 py-3 text-xs font-bold border-b-2 transition ${
                  activeTab===tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-5">

            {/* Response Body */}
            {activeTab==='response' && response && (
              <pre className="text-xs font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-4 overflow-auto max-h-80 whitespace-pre-wrap">
                {JSON.stringify(response.data, null, 2)}
              </pre>
            )}

            {/* Response Headers */}
            {activeTab==='rheaders' && response && (
              <div className="space-y-2">
                {Object.entries(response.headers).map(([k,v]) => (
                  <div key={k} className="flex gap-3 text-xs py-2 border-b border-slate-50 last:border-0">
                    <span className="font-mono font-bold text-blue-600 w-52 flex-shrink-0">{k}</span>
                    <span className="font-mono text-slate-600 break-all">{v}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Security Checks */}
            {activeTab==='checks' && checks.length > 0 && (
              <div className="space-y-3">
                {/* Score bar */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-700">API Security Score</span>
                    <span className={`text-xl font-bold font-mono ${
                      secScore>=75?'text-green-600':secScore>=50?'text-amber-600':'text-red-600'
                    }`}>{secScore}%</span>
                  </div>
                  <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${
                      secScore>=75?'bg-green-500':secScore>=50?'bg-amber-500':'bg-red-500'
                    }`} style={{width:`${secScore}%`}}/>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {passed} of {checks.length} OWASP security checks passed · {checks.length-passed} issues found
                  </p>
                </div>

                {/* Individual checks */}
                {checks.map(c => (
                  <div key={c.id}
                    className={`rounded-xl border p-4 ${c.pass?'bg-green-50 border-green-200':'bg-red-50 border-red-200'}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0 mt-0.5">{c.pass?'✅':'❌'}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`text-sm font-bold ${c.pass?'text-green-800':'text-red-800'}`}>{c.name}</p>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                            c.pass?'bg-green-100 text-green-700 border-green-300':'bg-red-100 text-red-700 border-red-300'
                          }`}>{c.pass?'PASS':'FAIL'}</span>
                        </div>
                        <p className={`text-xs ${c.pass?'text-green-700':'text-red-700'}`}>{c.info}</p>
                        {!c.pass && (
                          <div className="mt-2 flex items-start gap-1.5">
                            <span className="text-amber-500 text-xs flex-shrink-0">→</span>
                            <p className="text-xs text-amber-700 font-semibold">{c.fix}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!response && !loading && checks.length===0 && !error && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm py-16 text-center">
          <div className="text-5xl mb-4">🔌</div>
          <p className="text-slate-600 font-bold text-base mb-2">Enter a URL and click Send</p>
          <p className="text-slate-400 text-sm mb-6">DevShield will send the request and automatically run 8 security checks on the response</p>
          <div className="grid grid-cols-4 gap-3 max-w-lg mx-auto text-xs">
            {['HTTPS Check','Sensitive Data','Security Headers','Response Time'].map(c=>(
              <div key={c} className="bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-2 text-slate-500 font-semibold">{c}</div>
            ))}
          </div>
        </div>
      )}

      {/* Request History */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm">Request History</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {history.map((h,i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                <span className={`text-xs font-bold px-2 py-0.5 rounded border flex-shrink-0 ${methodColor(h.method)}`}>
                  {h.method}
                </span>
                <span className="text-xs font-mono text-slate-600 flex-1 truncate">{h.url}</span>
                <span className={`text-xs font-bold font-mono ${statusColor(h.status)}`}>{h.status}</span>
                <span className="text-xs text-slate-400 font-mono">{h.duration}ms</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                  h.passed===h.total?'bg-green-50 text-green-700 border-green-200':
                  h.passed>=h.total*0.6?'bg-amber-50 text-amber-700 border-amber-200':
                  'bg-red-50 text-red-700 border-red-200'
                }`}>
                  🛡 {h.passed}/{h.total}
                </span>
                <span className="text-xs text-slate-400">{h.time.toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
