import axios from 'axios'

const api = axios.create({
  baseURL: 'https://sandbox-3841.onrender.com/api',
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