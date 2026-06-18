const express  = require('express')
const Shipment = require('../models/Shipment')
const { Notification } = require('../models/index')
const { protect, adminOnly } = require('../middleware/auth.middleware')
const pricingService  = require('../services/pricing.service')
const emailService    = require('../services/email.service')
const { getIO }       = require('../sockets/tracking.socket')

const router = express.Router()

// GET /api/shipments/track/:code  — PUBLIC
router.get('/track/:code', async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ trackingCode: req.params.code.toUpperCase() })
      .populate('stops.harborId', 'name city country')
    if (!shipment) return res.status(404).json({ message: 'No shipment found for that tracking code.' })
    res.json({ shipment })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// All routes below require auth
router.use(protect)

// GET /api/shipments
router.get('/', async (req, res) => {
  try {
    const { status, mode, page = 1, limit = 20 } = req.query
    const filter = { userId: req.user._id }
    if (status) filter.status = status
    if (mode)   filter.mode   = mode

    const shipments = await Shipment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(+limit)

    const total = await Shipment.countDocuments(filter)
    res.json({ shipments, total, page: +page, pages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/shipments/:id
router.get('/:id', async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('courierId', 'fullName phone')
      .populate('documents')
    if (!shipment) return res.status(404).json({ message: 'Shipment not found.' })
    res.json({ shipment })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/shipments
router.post('/', async (req, res) => {
  try {
    const { type, mode, cargoType, weight, dimensions, declaredValue, originAddress, destinationAddress, notes } = req.body

    if (!type || !mode || !weight || !originAddress || !destinationAddress)
      return res.status(400).json({ message: 'type, mode, weight, originAddress and destinationAddress are required.' })

    // Calculate pricing
    const pricing = pricingService.calculate({ mode, weight: +weight, cargoType, declaredValue: +declaredValue || 0 })

    // ETA
    const etaDays = pricingService.getEtaDays(mode)
    const eta     = new Date(Date.now() + etaDays * 24 * 60 * 60 * 1000)

    const shipment = await Shipment.create({
      userId: req.user._id,
      type, mode,
      cargoType: cargoType || 'general',
      weight: +weight,
      dimensions,
      declaredValue: +declaredValue || 0,
      origin:      { address: originAddress },
      destination: { address: destinationAddress },
      pricing, eta, notes,
    })

    // Notification
    await Notification.create({
      userId:     req.user._id,
      shipmentId: shipment._id,
      type:       'shipment_update',
      title:      '📦 Shipment Booked',
      message:    `Your shipment ${shipment.trackingCode} has been booked. ${mode.toUpperCase()} · ETA: ${eta.toDateString()}`,
    })

    // Email confirmation (non-blocking)
    emailService.sendShipmentConfirmation(req.user, shipment).catch(console.error)

    res.status(201).json({ shipment })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PATCH /api/shipments/:id/confirm — delivery confirmation slide
router.patch('/:id/confirm', async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ _id: req.params.id, userId: req.user._id })
    if (!shipment) return res.status(404).json({ message: 'Shipment not found.' })
    if (shipment.deliveryConfirmed) return res.status(400).json({ message: 'Already confirmed.' })

    shipment.deliveryConfirmed = true
    shipment.confirmedAt       = new Date()
    shipment.status            = 'delivered'
    shipment.actualDeliveredAt = new Date()
    await shipment.save()

    // Notify
    await Notification.create({
      userId: req.user._id, shipmentId: shipment._id,
      type: 'delivered', title: '✅ Delivery Confirmed',
      message: `You confirmed receipt of shipment ${shipment.trackingCode}. Thank you!`,
    })

    // Real-time update
    getIO()?.to(shipment.trackingCode).emit('shipment-status-change', { status: 'delivered', trackingCode: shipment.trackingCode })

    res.json({ shipment })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/shipments/:id/rate
router.post('/:id/rate', async (req, res) => {
  try {
    const { score, comment } = req.body
    if (!score || score < 1 || score > 5) return res.status(400).json({ message: 'Score must be 1–5.' })

    const shipment = await Shipment.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { rating: { score: +score, comment, ratedAt: new Date() } },
      { new: true }
    )
    if (!shipment) return res.status(404).json({ message: 'Shipment not found.' })
    res.json({ shipment })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PATCH /api/shipments/:id/status — admin / courier only
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ['pending','picked_up','in_transit','at_hub','out_for_delivery','delivered','failed']
    if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status.' })

    const shipment = await Shipment.findByIdAndUpdate(req.params.id, { status }, { new: true })
    if (!shipment) return res.status(404).json({ message: 'Shipment not found.' })

    // Push real-time
    getIO()?.to(shipment.trackingCode).emit('shipment-status-change', { status, trackingCode: shipment.trackingCode })

    // Notify user
    await Notification.create({
      userId: shipment.userId, shipmentId: shipment._id,
      type: 'shipment_update', title: `Shipment Update`,
      message: `${shipment.trackingCode} is now ${status.replace(/_/g,' ')}.`,
    })

    res.json({ shipment })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
