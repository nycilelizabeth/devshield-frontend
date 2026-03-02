// ============================================
// pages/Audit.jsx — Password Strength Auditor
// ============================================
import { useState } from 'react'

function getStrength(pw) {
  const checks = {
    length8:   pw.length >= 8,
    length12:  pw.length >= 12,
    uppercase: /[A-Z]/.test(pw),
    lowercase: /[a-z]/.test(pw),
    numbers:   /[0-9]/.test(pw),
    special:   /[^A-Za-z0-9]/.test(pw),
  }
  const score = Object.values(checks).filter(Boolean).length
  return { checks, score }
}

function strengthInfo(s) {
  if(s<=1) return { label:'Very Weak', color:'bg-red-500',   text:'text-red-600',   bar:'w-1/6',  tip:'This password can be cracked in milliseconds.' }
  if(s<=2) return { label:'Weak',      color:'bg-red-400',   text:'text-red-500',   bar:'w-2/6',  tip:'This password can be cracked in minutes.' }
  if(s<=3) return { label:'Fair',      color:'bg-amber-500', text:'text-amber-600', bar:'w-3/6',  tip:'Moderate strength. Add more character types.' }
  if(s<=4) return { label:'Good',      color:'bg-blue-500',  text:'text-blue-600',  bar:'w-4/6',  tip:'Good password. Add length or special chars to make it stronger.' }
  if(s<=5) return { label:'Strong',    color:'bg-green-500', text:'text-green-600', bar:'w-5/6',  tip:'Strong password! Hard to crack.' }
  return          { label:'Very Strong',color:'bg-green-600', text:'text-green-700', bar:'w-full', tip:'Excellent! This would take thousands of years to crack.' }
}

function generatePassword(opts) {
  let chars = ''
  if(opts.upper)   chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if(opts.lower)   chars += 'abcdefghijklmnopqrstuvwxyz'
  if(opts.numbers) chars += '0123456789'
  if(opts.special) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'
  if(!chars) chars = 'abcdefghijklmnopqrstuvwxyz'
  return Array.from({length:opts.length}, () => chars[Math.floor(Math.random()*chars.length)]).join('')
}

export default function Audit() {
  const [password, setPassword]   = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [copied, setCopied]       = useState(false)
  const [genOpts, setGenOpts]     = useState({ length:16, upper:true, lower:true, numbers:true, special:true })
  const [generated, setGenerated] = useState('')
  const [genCopied, setGenCopied] = useState(false)

  const { checks, score } = getStrength(password)
  const info = strengthInfo(score)

  const copy = async (text, setter) => {
    try { await navigator.clipboard.writeText(text); setter(true); setTimeout(()=>setter(false),2000) } catch{}
  }

  const generate = () => {
    const pw = generatePassword(genOpts)
    setGenerated(pw)
    setGenCopied(false)
  }

  const criteriaList = [
    { key:'length8',   label:'At least 8 characters',         met: checks.length8   },
    { key:'length12',  label:'At least 12 characters',        met: checks.length12  },
    { key:'uppercase', label:'Contains uppercase (A-Z)',       met: checks.uppercase },
    { key:'lowercase', label:'Contains lowercase (a-z)',       met: checks.lowercase },
    { key:'numbers',   label:'Contains numbers (0-9)',         met: checks.numbers   },
    { key:'special',   label:'Contains special chars (!@#$)',  met: checks.special   },
  ]

  return (
    <div className="space-y-6 max-w-3xl">

      <div>
        <h2 className="text-xl font-bold text-slate-900">Password Audit</h2>
        <p className="text-slate-500 text-sm mt-0.5">Analyze password strength and generate secure passwords</p>
      </div>

      {/* Strength Analyzer */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 mb-4 text-sm">⚡ Password Strength Analyzer</h3>
        <div className="relative mb-4">
          <input
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={e=>setPassword(e.target.value)}
            placeholder="Type or paste a password to analyze..."
            className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 pr-20"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
            <button onClick={()=>setShowPw(!showPw)} className="text-slate-400 hover:text-slate-700 text-xs transition">
              {showPw ? '🙈' : '👁'}
            </button>
            {password && (
              <button onClick={()=>copy(password, setCopied)} className="text-slate-400 hover:text-slate-700 text-xs transition">
                {copied ? '✅' : '📋'}
              </button>
            )}
          </div>
        </div>

        {password ? (
          <div className="space-y-4">
            {/* Score bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className={`font-bold text-sm ${info.text}`}>{info.label}</span>
                <span className="text-xs text-slate-500 font-mono">{score}/6 criteria met</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${info.color} ${info.bar}`}/>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">{info.tip}</p>
            </div>

            {/* Criteria checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {criteriaList.map(c => (
                <div key={c.key} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm ${c.met?'bg-green-50 border-green-200':'bg-slate-50 border-slate-200'}`}>
                  <span className={c.met?'text-green-500':'text-slate-300'}>{c.met?'✓':'○'}</span>
                  <span className={c.met?'text-green-700':'text-slate-500'}>{c.label}</span>
                </div>
              ))}
            </div>

            {/* Time to crack estimate */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 px-4 py-3">
              <p className="text-xs font-semibold text-slate-600 mb-1">Estimated time to crack:</p>
              <p className={`font-bold text-sm ${info.text}`}>
                {score<=1?'Less than 1 second':score<=2?'A few minutes':score<=3?'A few hours':score<=4?'Several days':score<=5?'Several years':'Thousands of years'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Using modern brute-force attack methods</p>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400">
            <div className="text-4xl mb-2">⚡</div>
            <p className="text-sm">Start typing to analyze password strength in real time</p>
          </div>
        )}
      </div>

      {/* Password Generator */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 mb-4 text-sm">🎲 Secure Password Generator</h3>

        {/* Options */}
        <div className="space-y-4 mb-5">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-semibold text-slate-600">Password Length</label>
              <span className="text-xs font-bold text-blue-600 font-mono">{genOpts.length} characters</span>
            </div>
            <input type="range" min="8" max="32" value={genOpts.length}
              onChange={e=>setGenOpts({...genOpts,length:+e.target.value})}
              className="w-full accent-blue-600"/>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key:'upper',   label:'Uppercase (A-Z)' },
              { key:'lower',   label:'Lowercase (a-z)' },
              { key:'numbers', label:'Numbers (0-9)'    },
              { key:'special', label:'Special (!@#$)'   },
            ].map(opt => (
              <label key={opt.key} className="flex items-center gap-2.5 cursor-pointer group">
                <input type="checkbox" checked={genOpts[opt.key]}
                  onChange={e=>setGenOpts({...genOpts,[opt.key]:e.target.checked})}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"/>
                <span className="text-sm text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <button onClick={generate}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition shadow-sm mb-4">
          🎲 Generate Password
        </button>

        {/* Generated password display */}
        {generated && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Generated Password</p>
              <button onClick={()=>copy(generated, setGenCopied)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${genCopied?'bg-green-50 text-green-700 border-green-200':'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'}`}>
                {genCopied ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
            <code className="text-sm font-mono text-slate-800 break-all bg-white border border-slate-200 rounded-lg px-3 py-2.5 block">
              {generated}
            </code>
            <div className="flex items-center gap-2 mt-3">
              {(() => { const {score: gs} = getStrength(generated); const gi = strengthInfo(gs)
                return <>
                  <div className="flex gap-0.5">
                    {[...Array(6)].map((_,i)=><div key={i} className={`w-5 h-1.5 rounded-full ${i<gs?gi.color:'bg-slate-200'}`}/>)}
                  </div>
                  <span className={`text-xs font-bold ${gi.text}`}>{gi.label}</span>
                </>
              })()}
              <span className="text-xs text-slate-400 ml-auto">Save this in your Vault!</span>
            </div>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h3 className="font-bold text-amber-800 text-sm mb-3">💡 Password Best Practices</h3>
        <ul className="space-y-2">
          {[
            'Use a different password for every website — never reuse passwords',
            'Never use personal info like your name, birthday, or phone number',
            'Longer passwords (16+ chars) are always better than complex short ones',
            'Store generated passwords in the DevShield Vault immediately',
            'Change passwords on any site that sends a "security breach" notification',
          ].map((tip,i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
              <span className="text-amber-500 mt-0.5">→</span>{tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
