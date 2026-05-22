import axios from 'axios'

const BACKEND_URL = 'https://sandbox-3841.onrender.com'

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Request failed'
    return Promise.reject(new Error(message))
  }
)

export default api