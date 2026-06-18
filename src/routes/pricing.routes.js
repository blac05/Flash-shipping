const express = require('express')
const router  = express.Router()
const pricingService = require('../services/pricing.service')

// POST /api/pricing/calculate
router.post('/calculate', async (req, res) => {
  try {
    const { mode, weight, cargoType, declaredValue, originAddress, destinationAddress } = req.body
    if (!mode || !weight) return res.status(400).json({ message: 'mode and weight are required.' })

    const quote    = pricingService.calculate({ mode, weight: +weight, cargoType, declaredValue: +declaredValue || 0 })
    const etaDays  = pricingService.getEtaDays(mode)

    res.json({ quote: { ...quote, etaDays, originAddress, destinationAddress } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
