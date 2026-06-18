const express = require('express')
const { Notification } = require('../models/index')
const { protect } = require('../middleware/auth.middleware')

const router = express.Router()
router.use(protect)

// GET /api/notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 }).limit(50)
    res.json({ notifications })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { read: true })
    res.json({ message: 'Marked as read.' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true })
    res.json({ message: 'All marked as read.' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router
