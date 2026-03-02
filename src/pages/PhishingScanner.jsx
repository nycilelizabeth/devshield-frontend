// pages/PhishingScanner.jsx — Phishing URL Scanner
// NOW calls backend which uses Google Safe Browsing API
import { useState } from 'react'
import { phishingAPI } from '../utils/api'

// ── LOCAL HEURISTIC CHECKS (run in browser for instant feedback) ──
function runLocalChecks(rawUrl) {
  let url = rawUrl.trim()
  if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url

  let parsed
  try { parsed = new URL(url) }
  catch { return null }

  const hostname = parsed.hostname.toLowerCase()
  const fullUrl  = url.toLowerCase()
  const checks   = []
  let riskScore  = 0

  // CHECK 1: HTTPS
  const hasHttps = parsed.protocol === 'https:'
  checks.push({
    id: 'https', name: 'HTTPS Secure Connection', pass: hasHttps, weight: 10,
    info: hasHttps ? 'Connection is encrypted with SSL/TLS certificate.'
      : 'Site uses HTTP — your data is sent unencrypted. Never enter passwords on HTTP sites.',
    fix: 'Only trust sites starting with https://'
  })
  if (!hasHttps) riskScore += 20

  // CHECK 2: IP address
  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)
  checks.push({
    id: 'ip', name: 'No IP Address Used as Domain', pass: !isIp, weight: 15,
    info: isIp ? '⚠ URL uses a raw IP address — classic phishing technique.' : 'URL uses a proper domain name.',
    fix: 'Legitimate websites always use domain names, never raw IP addresses.'
  })
  if (isIp) riskScore += 30

  // CHECK 3: Suspicious keywords
  const suspiciousWords = ['login','signin','verify','account','update','secure','banking','confirm','password','paypal','amazon','google','apple','microsoft','netflix']
  const foundWords = suspiciousWords.filter(w => fullUrl.includes(w))
  const hasSuspiciousWords = foundWords.length >= 2
  checks.push({
    id: 'keywords', name: 'No Suspicious Keywords in URL', pass: !hasSuspiciousWords, weight: 10,
    info: hasSuspiciousWords ? `⚠ URL contains suspicious keywords: "${foundWords.slice(0,3).join('", "')}"` : 'No suspicious keywords detected.',
    fix: 'Be suspicious of URLs with "verify", "login", "secure" combined with brand names.'
  })
  if (hasSuspiciousWords) riskScore += 20

  // CHECK 4: URL length
  const urlLength = rawUrl.length
  const isTooLong = urlLength > 100
  checks.push({
    id: 'length', name: 'Normal URL Length', pass: !isTooLong, weight: 8,
    info: isTooLong ? `URL is ${urlLength} characters — very long URLs often hide real destination.` : `URL length is ${urlLength} characters — normal range.`,
    fix: 'Suspicious URLs are often very long to hide redirects.'
  })
  if (isTooLong) riskScore += 15

  // CHECK 5: Multiple subdomains
  const subdomainCount = hostname.split('.').length - 2
  const tooManySubdomains = subdomainCount > 2
  checks.push({
    id: 'subdomains', name: 'No Excessive Subdomains', pass: !tooManySubdomains, weight: 12,
    info: tooManySubdomains ? `⚠ URL has ${subdomainCount} subdomains — phishers use deep subdomains to look real.` : `URL has ${Math.max(0,subdomainCount)} subdomain(s) — acceptable.`,
    fix: 'Be wary of URLs like "paypal.secure.evil.com" — real domain is "evil.com".'
  })
  if (tooManySubdomains) riskScore += 25

  // CHECK 6: Typosquatting
  const brands = ['paypa1','paypai','g00gle','googIe','arnazon','arnaz0n','micros0ft','app1e','netf1ix','faceb00k','linkedln']
  const isTypoSquat = brands.some(b => hostname.includes(b))
  checks.push({
    id: 'typosquat', name: 'No Typosquatting Detected', pass: !isTypoSquat, weight: 20,
    info: isTypoSquat ? '🚨 Domain appears typosquatted — uses "0" instead of "o" or "1" instead of "l".' : 'No typosquatting patterns detected.',
    fix: '"paypa1.com" is NOT "paypal.com". Always check carefully.'
  })
  if (isTypoSquat) riskScore += 40

  // CHECK 7: @ symbol
  const hasAtSymbol = fullUrl.includes('@')
  checks.push({
    id: 'atsymbol', name: 'No @ Symbol in URL', pass: !hasAtSymbol, weight: 15,
    info: hasAtSymbol ? '⚠ @ symbol in URL — browsers ignore everything before @, hiding real destination.' : 'No @ symbol found — good.',
    fix: 'Never trust URLs with @ symbols. They disguise the real destination.'
  })
  if (hasAtSymbol) riskScore += 35

  // CHECK 8: Known safe domains
  const knownSafe = ['google.com','github.com','microsoft.com','apple.com','amazon.com','youtube.com','facebook.com','twitter.com','linkedin.com','stackoverflow.com','wikipedia.org','npmjs.com','mongodb.com','vercel.app','netlify.app']
  const rootDomain = hostname.split('.').slice(-2).join('.')
  const isKnownSafe = knownSafe.includes(rootDomain)
  checks.push({
    id: 'whitelist', name: 'Domain Reputation Check', pass: isKnownSafe || riskScore < 20, weight: 10,
    info: isKnownSafe ? `"${rootDomain}" is a well-known, trusted domain.`
      : riskScore < 20 ? `"${rootDomain}" — no reputation data, but no obvious red flags.`
      : `"${rootDomain}" — unknown domain with other risk indicators. Extreme caution.`,
    fix: 'Stick to websites you know. Search directly instead of clicking links.'
  })

  return { checks, riskScore: Math.min(100, riskScore), hostname, url, rootDomain }
}

function getRiskLevel(score, googleThreats = []) {
  if (googleThreats.length > 0)
    return { label: 'Phishing!', color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300', bar: 'bg-red-600', emoji: '☠️' }
  if (score < 25) return { label: 'Safe',       color: 'text-green-600', bg: 'bg-green-50',  border: 'border-green-200', bar: 'bg-green-500',  emoji: '✅' }
  if (score < 50) return { label: 'Suspicious', color: 'text-amber-600', bg: 'bg-amber-50',  border: 'border-amber-200', bar: 'bg-amber-500',  emoji: '⚠️' }
  if (score < 75) return { label: 'Dangerous',  color: 'text-red-600',   bg: 'bg-red-50',    border: 'border-red-200',   bar: 'bg-red-500',    emoji: '🚨' }
  return              { label: 'Phishing!',    color: 'text-red-700',   bg: 'bg-red-100',   border: 'border-red-300',   bar: 'bg-red-600',    emoji: '☠️' }
}

const SAMPLE_URLS = [
  { label: 'Safe — GitHub',         url: 'https://github.com/login' },
  { label: 'Safe — Google',         url: 'https://google.com' },
  { label: 'Suspicious — HTTP',     url: 'http://paypal.com/verify-account' },
  { label: 'Dangerous — Typosquat', url: 'http://paypa1.com/login/verify/account/secure/update' },
  { label: 'Phishing — IP + @',     url: 'http://secure@192.168.1.1/login/verify/account/confirm' },
]

export default function PhishingScanner() {
  const [url, setUrl]           = useState('')
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [history, setHistory]   = useState([])
  const [googleData, setGoogle] = useState(null)

  const scan = async (targetUrl) => {
    const scanUrl = targetUrl || url
    if (!scanUrl.trim()) return
    setLoading(true)
    setResult(null)
    setGoogle(null)

    // Step 1 — run local checks instantly
    const localResult = runLocalChecks(scanUrl)
    if (!localResult) {
      setResult({ error: 'Invalid URL format. Please include a valid web address.' })
      setLoading(false)
      return
    }

    // Step 2 — call backend for Google Safe Browsing check
    let googleResult = null
    try {
      const res = await phishingAPI.scan(scanUrl)
      googleResult = res.data?.googleSafeBrowsing || null
      setGoogle(googleResult)
    } catch (e) {
      console.log('Backend scan failed — using local checks only')
    }

    // Step 3 — combine results
    const googleThreats = googleResult?.threats || []
    const finalScore = googleThreats.length > 0
      ? Math.max(localResult.riskScore, 80)  // if Google flags it, min score 80
      : localResult.riskScore

    const finalResult = {
      ...localResult,
      riskScore: finalScore,
      isSafe: finalScore < 25 && googleThreats.length === 0,
      googleThreats,
    }

    setResult(finalResult)
    setHistory(prev => [{
      url: scanUrl.length > 50 ? scanUrl.slice(0, 50) + '...' : scanUrl,
      safe: finalResult.isSafe,
      risk: finalScore,
      time: new Date(),
      googleChecked: !!googleResult?.checked,
    }, ...prev.slice(0, 7)])
    setLoading(false)
  }

  const loadSample = (sample) => {
    setUrl(sample.url)
    setResult(null)
    setTimeout(() => scan(sample.url), 100)
  }

  const risk = result && !result.error ? getRiskLevel(result.riskScore, result.googleThreats || []) : null

  return (
    <div className="space-y-5 max-w-3xl">

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Phishing URL Scanner</h2>
        <p className="text-slate-500 text-sm mt-0.5">
          Paste any suspicious link — analyzed with 8 local checks + Google Safe Browsing API
        </p>
      </div>

      {/* Warning banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex gap-3">
        <span className="text-xl flex-shrink-0">⚠️</span>
        <div>
          <p className="text-sm font-bold text-amber-800">Never click suspicious links directly</p>
          <p className="text-sm text-amber-700 mt-0.5">
            Copy the URL and paste it here first. We run 8 heuristic checks + verify against Google's threat database.
          </p>
        </div>
      </div>

      {/* Sample URLs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Try These Examples</p>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_URLS.map(s => (
            <button key={s.url} onClick={() => loadSample(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                s.label.startsWith('Safe') ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' :
                s.label.startsWith('Suspicious') ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' :
                'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scanner input */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="font-bold text-slate-800 text-sm mb-3">🔍 Scan a URL</h3>
        <div className="flex gap-2">
          <input
            value={url} onChange={e => { setUrl(e.target.value); setResult(null) }}
            onKeyDown={e => e.key === 'Enter' && scan()}
            placeholder="Paste URL here — e.g. https://suspicious-site.com/login/verify"
            className="flex-1 px-4 py-3 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder-slate-400"
          />
          <button onClick={() => scan()} disabled={loading || !url.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold px-6 py-3 rounded-lg text-sm transition shadow-sm whitespace-nowrap">
            {loading ? '🔄 Scanning...' : '🛡 Scan URL'}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Press Enter or click Scan · Runs 8 heuristic checks + Google Safe Browsing API verification
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm py-14 text-center">
          <div className="text-4xl mb-4 animate-pulse">🔍</div>
          <p className="text-slate-600 font-bold">Analyzing URL for phishing patterns...</p>
          <p className="text-slate-400 text-sm mt-1">Running 8 security checks + Google Safe Browsing API</p>
        </div>
      )}

      {/* Error */}
      {result?.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex gap-3">
          <span className="text-xl">❌</span>
          <p className="text-sm text-red-700">{result.error}</p>
        </div>
      )}

      {/* Result */}
      {result && !result.error && !loading && (
        <div className="space-y-4">

          {/* Risk verdict */}
          <div className={`rounded-xl border p-6 ${risk.bg} ${risk.border}`}>
            <div className="flex items-center gap-5">
              <span className="text-5xl">{risk.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className={`text-2xl font-black ${risk.color}`}>{risk.label}</h3>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full border ${risk.bg} ${risk.color} ${risk.border}`}>
                    Risk Score: {result.riskScore}/100
                  </span>
                </div>
                <p className="text-sm font-mono text-slate-600 mb-3 break-all">{result.url}</p>
                <div className="h-3 bg-white/60 rounded-full overflow-hidden border border-white">
                  <div className={`h-full rounded-full transition-all duration-700 ${risk.bar}`}
                    style={{ width: `${result.riskScore}%` }} />
                </div>
                <p className={`text-sm font-semibold mt-2 ${risk.color}`}>
                  {result.riskScore < 25 ? 'This URL appears safe. Standard caution still advised.'
                    : result.riskScore < 50 ? 'This URL has suspicious characteristics. Do not enter personal information.'
                    : result.riskScore < 75 ? 'This URL is likely malicious. Do NOT visit this site.'
                    : '🚨 STOP! This URL shows strong signs of being a phishing attack. Do NOT visit.'}
                </p>
              </div>
            </div>
          </div>

          {/* Google Safe Browsing result */}
          {googleData && (
            <div className={`rounded-xl border p-4 flex items-start gap-3 ${
              googleData.threats?.length > 0
                ? 'bg-red-50 border-red-200'
                : googleData.checked
                  ? 'bg-green-50 border-green-200'
                  : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-xl flex-shrink-0">
                {googleData.threats?.length > 0 ? '🚨' : googleData.checked ? '🛡' : 'ℹ️'}
              </span>
              <div>
                <p className={`text-sm font-bold ${
                  googleData.threats?.length > 0 ? 'text-red-800'
                    : googleData.checked ? 'text-green-800' : 'text-slate-600'
                }`}>
                  Google Safe Browsing API
                </p>
                <p className={`text-xs mt-0.5 ${
                  googleData.threats?.length > 0 ? 'text-red-700'
                    : googleData.checked ? 'text-green-700' : 'text-slate-500'
                }`}>
                  {googleData.message}
                </p>
                {googleData.threats?.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {googleData.threats.map(t => (
                      <span key={t} className="text-xs font-bold px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded">
                        {t.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Detailed checks */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Detailed Security Analysis</h3>
              <span className="text-xs text-slate-500 font-mono">
                {result.checks.filter(c => c.pass).length}/{result.checks.length} checks passed
              </span>
            </div>
            <div className="divide-y divide-slate-50">
              {result.checks.map(c => (
                <div key={c.id} className={`px-5 py-4 flex items-start gap-3 ${c.pass ? '' : 'bg-red-50/30'}`}>
                  <span className="text-lg flex-shrink-0 mt-0.5">{c.pass ? '✅' : '❌'}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-slate-800">{c.name}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                        c.pass ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                      }`}>{c.pass ? 'PASS' : 'FAIL'}</span>
                    </div>
                    <p className={`text-xs ${c.pass ? 'text-slate-500' : 'text-red-700'}`}>{c.info}</p>
                    {!c.pass && (
                      <div className="mt-1.5 flex items-start gap-1.5">
                        <span className="text-amber-500 text-xs">→</span>
                        <p className="text-xs text-amber-700 font-semibold">{c.fix}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* What to do */}
          <div className={`rounded-xl border p-5 ${result.isSafe ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <h4 className={`font-bold text-sm mb-3 ${result.isSafe ? 'text-green-800' : 'text-red-800'}`}>
              {result.isSafe ? '✅ What You Can Do' : '🛑 What You Should Do Right Now'}
            </h4>
            <ul className={`space-y-1.5 text-sm ${result.isSafe ? 'text-green-700' : 'text-red-700'}`}>
              {(result.isSafe ? [
                'URL passed most security checks — reasonably safe to visit',
                'Still use caution — never enter passwords unless you trust the site',
                'Verify the domain matches the company you expect',
                'Make sure your browser shows a padlock icon when visiting',
              ] : [
                'Do NOT click this link or visit this website',
                'Do NOT enter any personal information, passwords, or payment details',
                'Report this URL to your IT team or email provider as phishing',
                'If you already visited, change your passwords immediately',
                'Run a virus scan on your device to check for malware',
              ]).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="flex-shrink-0">{result.isSafe ? '→' : '⚡'}</span>{item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Scan history */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm">Recent Scans</h3>
          </div>
          {history.map((h, i) => (
            <div key={i} className={`px-5 py-3 flex items-center gap-3 ${i !== history.length - 1 ? 'border-b border-slate-50' : ''}`}>
              <span>{h.safe ? '✅' : '🚨'}</span>
              <span className="text-xs font-mono text-slate-600 flex-1 truncate">{h.url}</span>
              {h.googleChecked && <span className="text-xs text-blue-500 font-semibold">🛡 Google</span>}
              <span className={`text-xs font-bold px-2 py-0.5 rounded border font-mono ${
                h.safe ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
              }`}>{h.risk}/100</span>
              <span className="text-xs text-slate-400">{h.time.toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="font-bold text-slate-800 text-sm mb-4">📚 How to Spot Phishing URLs Yourself</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: '🔍', title: 'Check the domain carefully', desc: '"paypa1.com" is NOT "paypal.com". Look for number/letter substitutions.' },
            { icon: '🔒', title: 'Always look for HTTPS',      desc: 'Never enter any information on an HTTP site. No exceptions.' },
            { icon: '📧', title: 'Hover before you click',     desc: 'Hover over any link in email to see the real URL before clicking.' },
            { icon: '🌐', title: 'Type directly instead',      desc: 'Instead of clicking a link, manually type the website address.' },
          ].map(tip => (
            <div key={tip.title} className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xl flex-shrink-0">{tip.icon}</span>
              <div>
                <p className="text-xs font-bold text-slate-700 mb-1">{tip.title}</p>
                <p className="text-xs text-slate-500">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}