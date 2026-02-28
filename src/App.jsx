import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout          from './components/Layout'
import Login           from './pages/Login'
import Register        from './pages/Register'
import Dashboard       from './pages/Dashboard'
import Bugs            from './pages/Bugs'
import TestCases       from './pages/TestCases'
import ApiTester       from './pages/ApiTester'
import Vault           from './pages/Vault'
import Breach          from './pages/Breach'
import PhishingScanner from './pages/PhishingScanner'
import Audit           from './pages/Audit'
import EncryptedNotes  from './pages/EncryptedNotes'
import ActivityLog     from './pages/ActivityLog'
import Reports         from './pages/Reports'

function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center"><div className="text-4xl mb-3">🛡</div>
        <p className="text-slate-500 text-sm font-mono">Loading DevShield...</p></div>
    </div>
  )
  return isLoggedIn ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { isLoggedIn } = useAuth()
  return (
    <Routes>
      <Route path="/login"    element={isLoggedIn ? <Navigate to="/dashboard"/> : <Login/>}    />
      <Route path="/register" element={isLoggedIn ? <Navigate to="/dashboard"/> : <Register/>} />
      <Route path="/" element={<ProtectedRoute><Layout/></ProtectedRoute>}>
        <Route index            element={<Navigate to="/dashboard"/>}  />
        <Route path="dashboard" element={<Dashboard/>}        />
        <Route path="bugs"      element={<Bugs/>}             />
        <Route path="testcases" element={<TestCases/>}        />
        <Route path="apitester" element={<ApiTester/>}        />
        <Route path="vault"     element={<Vault/>}            />
        <Route path="breach"    element={<Breach/>}           />
        <Route path="phishing"  element={<PhishingScanner/>}  />
        <Route path="audit"     element={<Audit/>}            />
        <Route path="notes"     element={<EncryptedNotes/>}   />
        <Route path="activity"  element={<ActivityLog/>}      />
        <Route path="reports"   element={<Reports/>}          />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard"/>} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider><AppRoutes/></AuthProvider>
    </BrowserRouter>
  )
}
