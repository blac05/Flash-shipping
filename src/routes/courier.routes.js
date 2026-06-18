// ─── courier.routes.js ────────────────────────────────────────
const express  = require('express')
const { Courier } = require('../models/index')
const Shipment = require('../models/Shipment')
const { protect, courierOnly, adminOnly } = require('../middleware/auth.middleware')

const router = express.Router()
router.use(protect)

// GET /api/couriers/my-assignments
router.get('/my-assignments', courierOnly, async (req, res) => {
  try {
    const courier   = await Courier.findOne({ userId: req.user._id })
    if (!courier) return res.status(404).json({ message: 'Courier profile not found.' })
    const shipments = await Shipment.find({ courierId: req.user._id, status: { $in: ['pending','picked_up','out_for_delivery'] } })
    res.json({ shipments })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PATCH /api/couriers/status
router.patch('/status', courierOnly, async (req, res) => {
  try {
    const { status } = req.body
    const courier = await Courier.findOneAndUpdate({ userId: req.user._id }, { status }, { new: true })
    res.json({ courier })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PATCH /api/couriers/location
router.patch('/location', courierOnly, async (req, res) => {
  try {
    const { lat, lng } = req.body
    await Courier.findOneAndUpdate({ userId: req.user._id }, { 'currentLocation.lat': lat, 'currentLocation.lng': lng, 'currentLocation.updatedAt': new Date() })
    res.json({ message: 'Location updated.' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PATCH /api/couriers/shipments/:id/pickup
router.patch('/shipments/:id/pickup', courierOnly, async (req, res) => {
  try {
    const shipment = await Shipment.findByIdAndUpdate(req.params.id, { status: 'picked_up' }, { new: true })
    res.json({ shipment })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PATCH /api/couriers/shipments/:id/delivered
router.patch('/shipments/:id/delivered', courierOnly, async (req, res) => {
  try {
    const shipment = await Shipment.findByIdAndUpdate(req.params.id, { status: 'out_for_delivery' }, { new: true })
    res.json({ shipment })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/couriers/nearby — admin only
router.get('/nearby', adminOnly, async (req, res) => {
  try {
    const couriers = await Courier.find({ status: 'available' }).populate('userId', 'fullName phone')
    res.json({ couriers })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/couriers/assign — admin
router.post('/assign', adminOnly, async (req, res) => {
  try {
    const { courierId, shipmentId } = req.body
    const shipment = await Shipment.findByIdAndUpdate(shipmentId, { courierId, status: 'picked_up' }, { new: true })
    await Courier.findOneAndUpdate({ userId: courierId }, { $addToSet: { assignedShipments: shipmentId } })
    res.json({ shipment })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router
