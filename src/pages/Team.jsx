// pages/Team.jsx — Team Collaboration Page
import { useState, useEffect } from 'react'
import { teamAPI } from '../utils/api'
import { useAuth } from '../context/AuthContext'

export default function Team() {
  const { user } = useAuth()
  const [team, setTeam]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [msg, setMsg]           = useState('')
  const [msgType, setMsgType]   = useState('success')
  const [tab, setTab]           = useState('overview')

  // Create form
  const [createForm, setCreateForm] = useState({ name: '', description: '' })
  const [creating, setCreating]     = useState(false)

  // Join form
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining]   = useState(false)

  const load = async () => {
    try {
      const res = await teamAPI.getMyTeam()
      setTeam(res.data.team)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const notify = (m, type = 'success') => {
    setMsg(m); setMsgType(type)
    setTimeout(() => setMsg(''), 4000)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!createForm.name.trim()) return
    setCreating(true)
    try {
      await teamAPI.create(createForm)
      notify('✅ Team created successfully!')
      load()
    } catch(e) {
      notify(e.response?.data?.message || '❌ Failed to create team', 'error')
    } finally { setCreating(false) }
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    if (!joinCode.trim()) return
    setJoining(true)
    try {
      await teamAPI.join(joinCode.trim())
      notify('✅ Joined team successfully!')
      load()
    } catch(e) {
      notify(e.response?.data?.message || '❌ Invalid invite code', 'error')
    } finally { setJoining(false) }
  }

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this team?')) return
    try {
      await teamAPI.leave()
      notify('✅ Left team')
      setTeam(null)
    } catch(e) {
      notify(e.response?.data?.message || '❌ Failed to leave', 'error')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this team? This cannot be undone. All shared data will remain but will be unlinked.')) return
    try {
      await teamAPI.delete()
      notify('✅ Team deleted')
      setTeam(null)
    } catch(e) {
      notify(e.response?.data?.message || '❌ Failed to delete', 'error')
    }
  }

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Remove this member from the team?')) return
    try {
      await teamAPI.removeMember(memberId)
      notify('✅ Member removed')
      load()
    } catch(e) {
      notify('❌ Failed to remove member', 'error')
    }
  }

  const handleRoleChange = async (memberId, role) => {
    try {
      await teamAPI.updateRole(memberId, role)
      notify('✅ Role updated')
      load()
    } catch(e) {
      notify('❌ Failed to update role', 'error')
    }
  }

  const copyInviteCode = () => {
    navigator.clipboard.writeText(team.inviteCode)
    notify('📋 Invite code copied to clipboard!')
  }

  const isOwner = team?.owner?._id === user?._id || team?.owner === user?._id
  const myMember = team?.members?.find(m => 
    (m.user?._id || m.user) === user?._id
  )

  const roleColor = {
    owner:  'bg-purple-50 text-purple-700 border-purple-200',
    admin:  'bg-blue-50 text-blue-700 border-blue-200',
    member: 'bg-slate-50 text-slate-600 border-slate-200',
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-pulse">👥</div>
        <p className="text-slate-400 text-sm">Loading team...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Toast */}
      {msg && (
        <div className={`fixed top-5 right-5 z-50 text-white text-sm px-4 py-3 rounded-xl shadow-lg ${msgType === 'error' ? 'bg-red-600' : 'bg-slate-800'}`}>
          {msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Team Collaboration</h2>
        <p className="text-slate-500 text-sm mt-0.5">
          {team ? `You are in "${team.name}" · ${team.members.length} member${team.members.length !== 1 ? 's' : ''}` : 'Create or join a team to collaborate'}
        </p>
      </div>

      {/* NO TEAM — Show create/join */}
      {!team && (
        <div className="grid grid-cols-2 gap-6">

          {/* Create Team */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="text-3xl mb-3">🏗</div>
            <h3 className="font-bold text-slate-800 text-lg mb-1">Create a Team</h3>
            <p className="text-slate-500 text-sm mb-5">Start a new workspace and invite your team members</p>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Team Name *</label>
                <input className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. DevShield QA Team" value={createForm.name}
                  onChange={e => setCreateForm({...createForm, name: e.target.value})} required/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
                <input className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What does this team work on?" value={createForm.description}
                  onChange={e => setCreateForm({...createForm, description: e.target.value})}/>
              </div>
              <button type="submit" disabled={creating}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold py-2.5 rounded-lg transition">
                {creating ? 'Creating...' : '🏗 Create Team'}
              </button>
            </form>
          </div>

          {/* Join Team */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="text-3xl mb-3">🔗</div>
            <h3 className="font-bold text-slate-800 text-lg mb-1">Join a Team</h3>
            <p className="text-slate-500 text-sm mb-5">Enter an invite code shared by your team owner</p>
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Invite Code *</label>
                <input className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-widest uppercase"
                  placeholder="e.g. A1B2C3D4" value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={8} required/>
              </div>
              <p className="text-xs text-slate-400">Ask your team owner for the 8-character invite code</p>
              <button type="submit" disabled={joining}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-semibold py-2.5 rounded-lg transition">
                {joining ? 'Joining...' : '🔗 Join Team'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* HAS TEAM — Show team details */}
      {team && (
        <>
          {/* Team Info Card */}
          <div className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">👥</div>
                  <div>
                    <h3 className="text-xl font-bold">{team.name}</h3>
                    {team.description && <p className="text-blue-100 text-sm">{team.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-sm text-blue-100">
                  <span>👑 Owner: {team.owner?.name}</span>
                  <span>👥 {team.members.length} member{team.members.length !== 1 ? 's' : ''}</span>
                  <span>📅 Created {new Date(team.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${myMember?.role === 'owner' ? 'bg-white/20 border-white/30' : 'bg-white/10 border-white/20'}`}>
                {myMember?.role?.toUpperCase() || 'MEMBER'}
              </span>
            </div>
          </div>

          {/* Invite Code */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-bold text-slate-800">🔑 Invite Code</h4>
                <p className="text-slate-500 text-xs mt-0.5">Share this code with teammates so they can join</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-center">
                <span className="text-3xl font-bold font-mono tracking-widest text-blue-600">{team.inviteCode}</span>
              </div>
              <button onClick={copyInviteCode}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-4 rounded-xl transition">
                📋 Copy
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">Teammates go to Team page → Join Team → Enter this code</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-200">
            {['overview', 'members'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition capitalize ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                {t === 'overview' ? '📊 Overview' : '👥 Members'}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {tab === 'overview' && (
            <div className="grid grid-cols-3 gap-4">
              {[
                ['👥', 'Total Members', team.members.length, 'text-blue-600'],
                ['👑', 'Owners', team.members.filter(m=>m.role==='owner').length, 'text-purple-600'],
                ['🛡', 'Admins', team.members.filter(m=>m.role==='admin').length, 'text-blue-600'],
              ].map(([ico, lbl, val, col]) => (
                <div key={lbl} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
                  <span className="text-2xl">{ico}</span>
                  <div>
                    <p className={`text-2xl font-bold font-mono ${col}`}>{val}</p>
                    <p className="text-xs text-slate-500">{lbl}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Members Tab */}
          {tab === 'members' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h4 className="font-bold text-slate-800">Team Members</h4>
                <span className="text-xs text-slate-500">{team.members.length} member{team.members.length !== 1 ? 's' : ''}</span>
              </div>
              {team.members.map((member, i) => {
                const memberId = member.user?._id || member.user
                const isMe = memberId === user?._id
                const isMemberOwner = member.role === 'owner'
                return (
                  <div key={memberId || i} className={`px-5 py-4 flex items-center gap-4 ${i !== team.members.length - 1 ? 'border-b border-slate-100' : ''}`}>
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {member.user?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-800 text-sm">{member.user?.name || 'Unknown'}</p>
                        {isMe && <span className="text-xs bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded-full font-semibold">You</span>}
                      </div>
                      <p className="text-xs text-slate-400">{member.user?.email}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Joined {new Date(member.joinedAt).toLocaleDateString('en-IN')}</p>
                    </div>
                    {/* Role */}
                    <div className="flex items-center gap-2">
                      {isOwner && !isMe && !isMemberOwner ? (
                        <select
                          value={member.role}
                          onChange={e => handleRoleChange(memberId, e.target.value)}
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${roleColor[member.role] || roleColor.member}`}>
                          {member.role === 'owner' ? '👑 Owner' : member.role === 'admin' ? '🛡 Admin' : '👤 Member'}
                        </span>
                      )}
                      {isOwner && !isMe && !isMemberOwner && (
                        <button onClick={() => handleRemoveMember(memberId)}
                          className="text-xs bg-red-50 text-red-600 border border-red-200 px-2.5 py-1.5 rounded-lg font-semibold hover:bg-red-100 transition">
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Danger Zone */}
          <div className="bg-white rounded-xl border border-red-200 shadow-sm p-5">
            <h4 className="font-bold text-red-700 mb-1">⚠️ Danger Zone</h4>
            <p className="text-slate-500 text-xs mb-4">These actions cannot be undone</p>
            <div className="flex gap-3">
              {!isOwner && (
                <button onClick={handleLeave}
                  className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-sm font-semibold px-4 py-2 rounded-lg transition">
                  🚪 Leave Team
                </button>
              )}
              {isOwner && (
                <button onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
                  🗑 Delete Team
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}