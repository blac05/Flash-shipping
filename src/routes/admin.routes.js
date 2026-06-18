const express  = require('express')
const Shipment = require('../models/Shipment')
const User     = require('../models/User')
const { Courier } = require('../models/index')
const { protect, adminOnly } = require('../middleware/auth.middleware')

const router = express.Router()
router.use(protect, adminOnly)

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0)
    const [totalShipments, active, deliveredToday, totalUsers, revenueResult] = await Promise.all([
      Shipment.countDocuments(),
      Shipment.countDocuments({ status: { $in: ['pending','picked_up','in_transit','at_hub','out_for_delivery'] } }),
      Shipment.countDocuments({ status: 'delivered', actualDeliveredAt: { $gte: today } }),
      User.countDocuments(),
      Shipment.aggregate([{ $group: { _id: null, total: { $sum: '$pricing.total' } } }]),
    ])
    res.json({ totalShipments, active, deliveredToday, totalUsers, revenue: revenueResult[0]?.total || 0 })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/admin/shipments
router.get('/shipments', async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query
    const filter = status ? { status } : {}
    const shipments = await Shipment.find(filter)
      .populate('userId', 'fullName email')
      .populate('courierId', 'fullName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(+limit)
    const total = await Shipment.countDocuments(filter)
    res.json({ shipments, total })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).limit(100)
    res.json({ users })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-passwordHash')
    res.json({ user })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router
