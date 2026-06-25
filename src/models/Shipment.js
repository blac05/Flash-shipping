const mongoose = require('mongoose')
const { nanoid } = require('nanoid')

const stopSchema = new mongoose.Schema({
  name:       { type: String },
  harborId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Harbor' },
  arrivedAt:  { type: Date },
  departedAt: { type: Date },
}, { _id: false })

const shipmentSchema = new mongoose.Schema({
  trackingCode: {
    type:    String,
    unique:  true, // This natively creates the unique index safely
    default: () => `FLS-${new Date().getFullYear()}-${nanoid(6).toUpperCase()}`,
  },

  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  type: { type: String, enum: ['pickup','delivery'], required: true },
  mode: { type: String, enum: ['air','sea','road','courier'], required: true },

  status: {
    type:    String,
    enum:    ['pending','picked_up','in_transit','at_hub','out_for_delivery','delivered','failed'],
    default: 'pending',
  },

  cargoType: {
    type: String,
    enum: ['auto_parts','electronics','machinery','building_materials','pharmaceuticals','perishables','clothing','furniture','general'],
    default: 'general',
  },

  weight:     { type: Number, required: true },
  dimensions: { l: Number, w: Number, h: Number },
  declaredValue: { type: Number, default: 0 },

  origin: {
    address: { type: String, required: true },
    lat:     { type: Number },
    lng:     { type: Number },
  },
  destination: {
    address: { type: String, required: true },
    lat:     { type: Number },
    lng:     { type: Number },
  },

  stops: [stopSchema],

  eta:              { type: Date },
  actualDeliveredAt:{ type: Date },

  pricing: {
    base:      Number,
    weight:    Number,
    zone:      Number,
    cargo:     Number,
    insurance: Number,
    total:     Number,
    currency:  { type: String, default: 'USD' },
  },

  paymentStatus: { type: String, enum: ['unpaid','paid','refunded'], default: 'unpaid' },
  stripePaymentId: { type: String },

  documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],

  deliveryConfirmed: { type: Boolean, default: false },
  confirmedAt:       { type: Date },

  rating: {
    score:   { type: Number, min: 1, max: 5 },
    comment: { type: String },
    ratedAt: { type: Date },
  },

  notes: { type: String },
}, { timestamps: true })

// Keeping your other necessary secondary indexes
shipmentSchema.index({ userId: 1, createdAt: -1 })
shipmentSchema.index({ courierId: 1 })
shipmentSchema.index({ status: 1 })

module.exports = mongoose.model('Shipment', shipmentSchema)