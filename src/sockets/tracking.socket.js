const { Server } = require('socket.io')
const jwt        = require('jsonwebtoken')

let io = null

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin:      process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    },
  })

  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('Authentication required'))
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      socket.userId = decoded.id
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', socket => {
    console.log(`[Socket] User ${socket.userId} connected — ${socket.id}`)

    // Client joins a tracking room by code
    socket.on('join-tracking', code => {
      socket.join(code)
      console.log(`[Socket] ${socket.id} joined tracking room: ${code}`)
    })

    socket.on('leave-tracking', code => {
      socket.leave(code)
    })

    // Courier updates their GPS position
    socket.on('courier-location-update', async ({ courierId, lat, lng, trackingCode }) => {
      try {
        const { Courier } = require('../models/index')
        await Courier.findOneAndUpdate({ userId: courierId }, { 'currentLocation.lat': lat, 'currentLocation.lng': lng, 'currentLocation.updatedAt': new Date() })
        // Broadcast to tracking room
        if (trackingCode) {
          io.to(trackingCode).emit('tracking-update', { courierId, lat, lng, updatedAt: new Date() })
        }
      } catch (err) {
        console.error('[Socket] courier-location-update error:', err.message)
      }
    })

    socket.on('disconnect', () => {
      console.log(`[Socket] ${socket.id} disconnected`)
    })
  })

  return io
}

function getIO() { return io }

module.exports = initSocket
module.exports.getIO = getIO
