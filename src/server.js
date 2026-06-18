require('dotenv').config()
const express    = require('express')
const http       = require('http')
const cors       = require('cors')
const helmet     = require('helmet')
const morgan     = require('morgan')
const rateLimit  = require('express-rate-limit')

const connectDB  = require('./config/db')
const initSocket = require('./sockets/tracking.socket')

// Routes
const authRoutes         = require('./routes/auth.routes')
const shipmentRoutes     = require('./routes/shipment.routes')
const pricingRoutes      = require('./routes/pricing.routes')
const courierRoutes      = require('./routes/courier.routes')
const notificationRoutes = require('./routes/notification.routes')
const documentRoutes     = require('./routes/document.routes')
const adminRoutes        = require('./routes/admin.routes')
const uploadRoutes        = require('./routes/upload.routes')

const app    = express()
const server = http.createServer(app)

// Connect DB
connectDB()

// Init Socket.IO
initSocket(server)

// ── Middleware ────────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Global rate limiter
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max:      200,
  message:  { message: 'Too many requests. Please try again later.' },
}))

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes)
app.use('/api/shipments',     shipmentRoutes)
app.use('/api/pricing',       pricingRoutes)
app.use('/api/couriers',      courierRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/documents',     documentRoutes)
app.use('/api/admin',         adminRoutes)
app.use('/api/upload',        uploadRoutes)

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', service: 'Flash Shipping API', time: new Date() }))

// 404
app.use((req, res) => res.status(404).json({ message: 'Route not found' }))

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message)
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' })
})

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000
server.listen(PORT, () => console.log(`⚡ Flash API running on port ${PORT}`))
