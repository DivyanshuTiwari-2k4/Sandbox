import { io } from 'socket.io-client'

const socket = io('https://sandbox-3841.onrender.com', {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling']
})

socket.on('connect', () => {
  console.log('🔌 Socket connected:', socket.id)
})

socket.on('disconnect', (reason) => {
  console.log('🔌 Socket disconnected:', reason)
})

socket.on('connect_error', (err) => {
  console.warn('Socket connection error:', err.message)
})

export default socket