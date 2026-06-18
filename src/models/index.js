const mongoose = require('mongoose')

// ── Document ──────────────────────────────────────────────────
const documentSchema = new mongoose.Schema({
  shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', required: true },
  type: {
    type: String,
    enum: ['bill_of_lading','air_waybill','commercial_invoice','packing_list',
           'customs_declaration','certificate_of_origin','dangerous_goods','insurance_certificate'],
    required: true,
  },
  fileUrl:     { type: String },
  generatedAt: { type: Date, default: Date.now },
  signedAt:    { type: Date },
  signedBy:    { type: String },
  data:        { type: mongoose.Schema.Types.Mixed }, // JSON data used to generate doc
}, { timestamps: true })

const Document = mongoose.model('Document', documentSchema)

// ── Notification ──────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
  type: {
    type: String,
    enum: ['shipment_update','delivery_scheduled','delivered','payment','document_ready','courier_assigned','system'],
    required: true,
  },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  read:    { type: Boolean, default: false },
  channel: { type: String, enum: ['in_app','email','sms','push'], default: 'in_app' },
}, { timestamps: true })

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 })
const Notification = mongoose.model('Notification', notificationSchema)

// ── Harbor ────────────────────────────────────────────────────
const harborSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  code:      { type: String, required: true, unique: true, uppercase: true },
  type:      { type: String, enum: ['sea','air','land'], required: true },
  location: {
    lat:       Number,
    lng:       Number,
    city:      String,
    country:   String,
    continent: { type: String, enum: ['Africa','Europe','Asia','Americas','Oceania','Middle East'] },
  },
  capacity:       Number,
  operatingHours: String,
  active:         { type: Boolean, default: true },
}, { timestamps: true })

const Harbor = mongoose.model('Harbor', harborSchema)

// ── Courier Profile ───────────────────────────────────────────
const courierSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  mode:   { type: String, enum: ['bike','motorcycle','van','truck'], default: 'motorcycle' },
  licenseNumber: { type: String },
  vehicleReg:    { type: String },
  currentLocation: {
    lat:       Number,
    lng:       Number,
    updatedAt: { type: Date, default: Date.now },
  },
  status: { type: String, enum: ['available','on_duty','offline'], default: 'offline' },
  assignedShipments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' }],
  rating:         { type: Number, default: 5.0 },
  totalDeliveries:{ type: Number, default: 0 },
}, { timestamps: true })

const Courier = mongoose.model('Courier', courierSchema)

module.exports = { Document, Notification, Harbor, Courier }
