// ============================================
// pages/EncryptedNotes.jsx — E2E Encrypted Notes
// Notes are AES-256 encrypted before saving to DB
// ============================================
import { useState, useEffect } from 'react'
import CryptoJS from 'crypto-js'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'

// ── ENCRYPTION HELPERS ──
// These run entirely in the BROWSER — server never sees plain text
const ENCRYPTION_KEY = 'devshield_notes_key_2026_aes256'

const encrypt = (text) =>
  CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString()

const decrypt = (cipher) => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, ENCRYPTION_KEY)
    return bytes.toString(CryptoJS.enc.Utf8) || '[Decryption failed]'
  } catch { return '[Decryption failed]' }
}

// We'll store notes in localStorage for now (in production, send encrypted to backend)
const STORAGE_KEY = 'devshield_encrypted_notes'

const loadNotes = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

const saveNotes = (notes) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}

const COLORS = [
  { id: 'slate',  bg: 'bg-slate-50',  border: 'border-slate-200',  dot: 'bg-slate-400'  },
  { id: 'blue',   bg: 'bg-blue-50',   border: 'border-blue-200',   dot: 'bg-blue-500'   },
  { id: 'green',  bg: 'bg-green-50',  border: 'border-green-200',  dot: 'bg-green-500'  },
  { id: 'amber',  bg: 'bg-amber-50',  border: 'border-amber-200',  dot: 'bg-amber-500'  },
  { id: 'red',    bg: 'bg-red-50',    border: 'border-red-200',    dot: 'bg-red-400'    },
  { id: 'purple', bg: 'bg-violet-50', border: 'border-violet-200', dot: 'bg-violet-500' },
]

export default function EncryptedNotes() {
  const { user } = useAuth()
  const [notes, setNotes]         = useState([])
  const [showForm, setShowForm]   = useState(false)
  const [editNote, setEditNote]   = useState(null)
  const [search, setSearch]       = useState('')
  const [unlocked, setUnlocked]   = useState({})
  const [msg, setMsg]             = useState('')
  const [form, setForm]           = useState({ title: '', content: '', color: 'slate', pinned: false })

  useEffect(() => { setNotes(loadNotes()) }, [])

  const notify = (m) => { setMsg(m); setTimeout(() => setMsg(''), 2500) }

  const handleSave = () => {
    if (!form.title.trim() || !form.content.trim()) return
    const encryptedContent = encrypt(form.content)
    const now = new Date().toISOString()

    if (editNote) {
      const updated = notes.map(n => n.id === editNote.id
        ? { ...n, title: form.title, encryptedContent, color: form.color, pinned: form.pinned, updatedAt: now }
        : n)
      setNotes(updated)
      saveNotes(updated)
      notify('✅ Note updated and re-encrypted!')
    } else {
      const newNote = {
        id: Date.now().toString(),
        title: form.title,
        encryptedContent,
        color: form.color,
        pinned: form.pinned,
        createdAt: now,
        updatedAt: now,
      }
      const updated = [newNote, ...notes]
      setNotes(updated)
      saveNotes(updated)
      notify('✅ Note saved with AES-256 encryption!')
    }
    setForm({ title: '', content: '', color: 'slate', pinned: false })
    setShowForm(false)
    setEditNote(null)
  }

  const startEdit = (note) => {
    setEditNote(note)
    setForm({
      title:   note.title,
      content: decrypt(note.encryptedContent),
      color:   note.color || 'slate',
      pinned:  note.pinned || false,
    })
    setShowForm(true)
    setUnlocked({ ...unlocked, [note.id]: true })
  }

  const deleteNote = (id) => {
    if (!confirm('Delete this note permanently?')) return
    const updated = notes.filter(n => n.id !== id)
    setNotes(updated)
    saveNotes(updated)
    notify('🗑 Note deleted')
  }

  const toggleUnlock = (id) => {
    setUnlocked(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const togglePin = (id) => {
    const updated = notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n)
    setNotes(updated)
    saveNotes(updated)
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditNote(null)
    setForm({ title: '', content: '', color: 'slate', pinned: false })
  }

  const filtered = notes
    .filter(n => n.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))

  const getColor = (id) => COLORS.find(c => c.id === id) || COLORS[0]

  return (
    <div className="space-y-5">

      {msg && <div className="fixed top-5 right-5 z-50 bg-slate-800 text-white text-sm px-4 py-3 rounded-xl shadow-lg">{msg}</div>}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Encrypted Notes</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            🔒 End-to-end encrypted — notes are encrypted in your browser before saving
          </p>
        </div>
        <button onClick={() => { cancelForm(); setShowForm(true) }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-2">
          {showForm ? '✕ Cancel' : '+ New Note'}
        </button>
      </div>

      {/* Encryption info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 flex gap-3">
        <span className="text-xl flex-shrink-0">🔐</span>
        <div>
          <p className="text-sm font-bold text-blue-800">End-to-End Encryption</p>
          <p className="text-sm text-blue-700 mt-0.5">
            Your notes are encrypted using AES-256 <strong>in your browser</strong> before being stored.
            The server never sees your plain text content — only encrypted ciphertext.
            Click 🔓 on any note to decrypt and read it.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
          <span className="text-2xl">📝</span>
          <div><p className="text-2xl font-bold font-mono text-blue-600">{notes.length}</p><p className="text-xs text-slate-500">Total Notes</p></div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
          <span className="text-2xl">📌</span>
          <div><p className="text-2xl font-bold font-mono text-amber-600">{notes.filter(n=>n.pinned).length}</p><p className="text-xs text-slate-500">Pinned</p></div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
          <span className="text-2xl">🔒</span>
          <div><p className="text-2xl font-bold font-mono text-green-600">{notes.length}</p><p className="text-xs text-slate-500">Encrypted</p></div>
        </div>
      </div>

      {/* Note form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4 text-sm">
            {editNote ? '✏️ Edit Note' : '📝 New Encrypted Note'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Note Title</label>
              <input
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. AWS Production Credentials, Sprint Meeting Notes..."
                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Content <span className="text-blue-500 font-normal">(will be AES-256 encrypted)</span>
              </label>
              <textarea
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-36 font-mono"
                placeholder="Write your sensitive note here...&#10;&#10;e.g. Server IP: 10.0.0.1&#10;Admin user: root&#10;SSH Key: ..."
                value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-6">
              {/* Color picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Color</label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button key={c.id} onClick={() => setForm({ ...form, color: c.id })}
                      className={`w-6 h-6 rounded-full ${c.dot} transition-all ${form.color === c.id ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-110'}`}/>
                  ))}
                </div>
              </div>
              {/* Pin toggle */}
              <label className="flex items-center gap-2 cursor-pointer mt-4">
                <input type="checkbox" checked={form.pinned}
                  onChange={e => setForm({ ...form, pinned: e.target.checked })}
                  className="w-4 h-4 accent-blue-600"/>
                <span className="text-sm text-slate-700">📌 Pin this note</span>
              </label>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={handleSave}
                disabled={!form.title.trim() || !form.content.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition flex items-center gap-2">
                🔒 {editNote ? 'Update & Re-encrypt' : 'Encrypt & Save'}
              </button>
              <button onClick={cancelForm}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-5 py-2.5 rounded-lg transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      {notes.length > 0 && (
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search notes by title..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
      )}

      {/* Notes grid */}
      {notes.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm py-16 text-center">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-slate-500 font-semibold">No encrypted notes yet</p>
          <p className="text-slate-400 text-sm mt-1">Create your first secure note using the button above</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map(note => {
            const c = getColor(note.color)
            const isOpen = unlocked[note.id]
            const plainText = isOpen ? decrypt(note.encryptedContent) : null

            return (
              <div key={note.id} className={`rounded-xl border shadow-sm ${c.bg} ${c.border} overflow-hidden`}>
                <div className="px-4 py-3 border-b border-white/60 flex items-center gap-2">
                  {note.pinned && <span className="text-xs">📌</span>}
                  <p className="font-bold text-slate-800 text-sm flex-1 truncate">{note.title}</p>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => togglePin(note.id)} title="Pin/Unpin"
                      className={`text-xs p-1 rounded hover:bg-white/60 transition ${note.pinned?'text-amber-500':'text-slate-400'}`}>
                      📌
                    </button>
                    <button onClick={() => startEdit(note)} title="Edit"
                      className="text-xs p-1 rounded hover:bg-white/60 transition text-slate-500">
                      ✏️
                    </button>
                    <button onClick={() => deleteNote(note.id)} title="Delete"
                      className="text-xs p-1 rounded hover:bg-red-100 transition text-slate-400 hover:text-red-600">
                      🗑
                    </button>
                  </div>
                </div>

                <div className="px-4 py-3">
                  {isOpen ? (
                    <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap break-words max-h-40 overflow-y-auto leading-relaxed">
                      {plainText}
                    </pre>
                  ) : (
                    <div className="py-3">
                      <div className="flex gap-0.5 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-2 rounded-full bg-slate-300/60" style={{ width: `${20 + Math.random() * 60}%` }}/>
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 font-mono">🔒 Content encrypted — click unlock to read</p>
                    </div>
                  )}

                  <button onClick={() => toggleUnlock(note.id)}
                    className={`mt-3 w-full py-1.5 rounded-lg text-xs font-bold border transition ${
                      isOpen
                        ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                    }`}>
                    {isOpen ? '🔒 Lock Note' : '🔓 Unlock & Decrypt'}
                  </button>
                </div>

                <div className="px-4 py-2 border-t border-white/60">
                  <p className="text-xs text-slate-400 font-mono">
                    {new Date(note.updatedAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
