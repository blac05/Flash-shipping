const express = require('express')
const jwt     = require('jsonwebtoken')
const User    = require('../models/User')
const { protect } = require('../middleware/auth.middleware')
const emailService = require('../services/email.service')

const router = express.Router()

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, phone, password, accountType, companyName, taxId, gpsAddress } = req.body

    if (!fullName || !email || !phone || !password)
      return res.status(400).json({ message: 'fullName, email, phone and password are required.' })

    const exists = await User.findOne({ email: email.toLowerCase() })
    if (exists) return res.status(409).json({ message: 'Email already registered.' })

    const user = await User.create({
      fullName, email, phone,
      passwordHash: password, // pre-save hook hashes it
      accountType:  accountType || 'personal',
      companyName, taxId, gpsAddress,
    })

    // Send welcome email (non-blocking)
    emailService.sendWelcome(user).catch(console.error)

    const token = signToken(user._id)
    res.status(201).json({ token, user: user.toSafe() })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' })

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) return res.status(401).json({ message: 'Invalid email or password.' })

    const match = await user.comparePassword(password)
    if (!match) return res.status(401).json({ message: 'Invalid email or password.' })

    user.lastLogin = new Date()
    await user.save({ validateBeforeSave: false })

    const token = signToken(user._id)
    res.json({ token, user: user.toSafe() })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user.toSafe ? req.user.toSafe() : req.user })
})

// PATCH /api/auth/update-profile
router.patch('/update-profile', protect, async (req, res) => {
  try {
    const allowed = ['fullName','phone','companyName','taxId','gpsAddress']
    const updates = {}
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k] })
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-passwordHash')
    res.json({ user })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PATCH /api/auth/change-password
router.patch('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id)
    const match = await user.comparePassword(currentPassword)
    if (!match) return res.status(400).json({ message: 'Current password is incorrect.' })
    user.passwordHash = newPassword
    await user.save()
    res.json({ message: 'Password updated.' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
