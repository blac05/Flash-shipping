const express  = require('express')
const { Document } = require('../models/index')
const Shipment = require('../models/Shipment')
const { protect, adminOnly } = require('../middleware/auth.middleware')

const router = express.Router()
router.use(protect)

// POST /api/documents/generate
router.post('/generate', async (req, res) => {
  try {
    const { shipmentId, type } = req.body
    const shipment = await Shipment.findById(shipmentId).populate('userId')
    if (!shipment) return res.status(404).json({ message: 'Shipment not found.' })

    const doc = await Document.create({
      shipmentId,
      type,
      data: {
        trackingCode:    shipment.trackingCode,
        origin:          shipment.origin,
        destination:     shipment.destination,
        weight:          shipment.weight,
        cargoType:       shipment.cargoType,
        declaredValue:   shipment.declaredValue,
        shipper:         shipment.userId?.fullName,
        generatedAt:     new Date(),
      },
    })

    // Link document to shipment
    await Shipment.findByIdAndUpdate(shipmentId, { $addToSet: { documents: doc._id } })

    res.status(201).json({ document: doc })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/documents/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id).populate('shipmentId')
    if (!doc) return res.status(404).json({ message: 'Document not found.' })
    res.json({ document: doc })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/documents/shipment/:shipmentId
router.get('/shipment/:shipmentId', async (req, res) => {
  try {
    const docs = await Document.find({ shipmentId: req.params.shipmentId })
    res.json({ documents: docs })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router
