import axios from 'axios'

const BASE_URL = 'https://devshield-backend-production.up.railway.app/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('devshield_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

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

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  getMe:    ()     => api.get('/auth/me'),
}

export const passwordAPI = {
  getAll: ()     => api.get('/passwords'),
  create: (data) => api.post('/passwords', data),
  delete: (id)   => api.delete(`/passwords/${id}`),
}

export const bugAPI = {
  getAll: (filters)   => api.get('/bugs', { params: filters }),
  create: (data)      => api.post('/bugs', data),
  update: (id, data)  => api.put(`/bugs/${id}`, data),
  delete: (id)        => api.delete(`/bugs/${id}`),
}

export const testAPI = {
  getAll: (filters)   => api.get('/testcases', { params: filters }),
  create: (data)      => api.post('/testcases', data),
  update: (id, data)  => api.put(`/testcases/${id}`, data),
  delete: (id)        => api.delete(`/testcases/${id}`),
}

export const breachAPI = {
  check: (email) => api.get('/breach/check', { params: { email } }),
}

export const teamAPI = {
  getMyTeam: ()         => api.get('/teams/my'),
  create:    (data)     => api.post('/teams/create', data),
  join:      (code)     => api.post('/teams/join', { inviteCode: code }),
  leave:     ()         => api.post('/teams/leave'),
  delete:    ()         => api.delete('/teams/delete'),
  removeMember: (id)    => api.delete(`/teams/members/${id}`),
  updateRole: (id, role)=> api.put(`/teams/members/${id}/role`, { role }),
}

export default api