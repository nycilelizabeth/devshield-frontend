// ============================================
// utils/api.js — Axios API Helper
//
// This is the single file that handles ALL
// communication between React and the backend.
//
// Every page will import functions from here
// instead of writing fetch() calls everywhere.
// ============================================

import axios from 'axios'

// Base URL of your backend server
const BASE_URL = 'https://devshield-backend-production.up.railway.app/api'

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
})

// ── REQUEST INTERCEPTOR ──
// Runs before EVERY request automatically
// Adds the JWT token to the Authorization header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('devshield_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── RESPONSE INTERCEPTOR ──
// Runs after EVERY response automatically
// If token expired (401), log user out
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('devshield_token')
      localStorage.removeItem('devshield_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── AUTH APIs ──
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  getMe:    ()     => api.get('/auth/me'),
}

// ── PASSWORD VAULT APIs ──
export const passwordAPI = {
  getAll: ()       => api.get('/passwords'),
  create: (data)   => api.post('/passwords', data),
  delete: (id)     => api.delete(`/passwords/${id}`),
}

// ── BUG TRACKER APIs ──
export const bugAPI = {
  getAll:  (filters) => api.get('/bugs', { params: filters }),
  create:  (data)    => api.post('/bugs', data),
  update:  (id, data)=> api.put(`/bugs/${id}`, data),
  delete:  (id)      => api.delete(`/bugs/${id}`),
}

// ── TEST CASE APIs ──
export const testAPI = {
  getAll:  (filters) => api.get('/testcases', { params: filters }),
  create:  (data)    => api.post('/testcases', data),
  update:  (id, data)=> api.put(`/testcases/${id}`, data),
  delete:  (id)      => api.delete(`/testcases/${id}`),
}

// ── BREACH CHECKER APIs ──
export const breachAPI = {
  check: (email) => api.get('/breach/check', { params: { email } }),
}

export default api
