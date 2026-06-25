require('dotenv').config()
const express    = require('express')
const http       = require('http')
const cors       = require('cors')
const helmet     = require('helmet')
const morgan     = require('morgan')
const path       = require('path')
const rateLimit  = require('express-rate-limit')

const connectDB    = require('./config/db')
const initSocket   = require('./sockets/tracking.socket')
const errorHandler = require('./middleware/error.middleware') // 🚀 New centralized error handler

// Routes
const authRoutes         = require('./routes/auth.routes')
const shipmentRoutes     = require('./routes/shipment.routes')
const pricingRoutes      = require('./routes/pricing.routes')
const courierRoutes      = require('./routes/courier.routes')
const notificationRoutes = require('./routes/notification.routes')
const documentRoutes     = require('./routes/document.routes')
const adminRoutes        = require('./routes/admin.routes')
const uploadRoutes       = require('./routes/upload.routes')

const app    = express()
const server = http.createServer(app)

// Connect DB
connectDB()

// Init Socket.IO Telemetry
initSocket(server)

// ── Security & Utility Middleware ────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Allows flexible cross-origin assets for ultra-modern 3D frontend configurations
}))
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json({ limit: '25mb' })) // Expanded payload ceiling to accommodate heavy Bill of Lading PDF encodings
app.use(express.urlencoded({ extended: true, limit: '25mb' }))

// Serve static assets natively (Allows loading /terms.html directly in a browser layout)
app.use(express.static(path.join(__dirname, '../public')))

// Global Network Rate Limiter
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max:      300,            // Raised ceiling to accommodate swift high-frequency real-time map requests
  message:  { status: 'fail', message: 'Too many logistics network requests routed from this vector. Try again in 15 minutes.' },
}))

// ── Application Routes ────────────────────────────────────────
app.use('/api/auth',          authRoutes)
app.use('/api/shipments',     shipmentRoutes)
app.use('/api/pricing',       pricingRoutes)
app.use('/api/couriers',      courierRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/documents',     documentRoutes)
app.use('/api/admin',         adminRoutes)
app.use('/api/upload',        uploadRoutes)

// Core API Status Node & Health Check
app.get('/health', (_, res) => res.status(200).json({ 
  status: 'ok', 
  service: 'Flash Shipping Intercontinental Engine', 
  time: new Date() 
}))

// Catch-All Unhandled Fallback Asset Paths (404 Route)
app.use((req, res) => res.status(404).json({ 
  status: 'fail', 
  message: 'Logistics vector array path mismatch: Route not found' 
}))

// ── Centralized Error Boundary Interceptor ────────────────────
// Crucial: This structural safety web MUST be positioned dead last below all routing definitions
app.use(errorHandler)

// ── Boot System Engine ────────────────────────────────────────
const PORT = process.env.PORT || 5000
server.listen(PORT, () => console.log(`⚡ Flash API running on port ${PORT}`))