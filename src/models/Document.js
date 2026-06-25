const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', required: true },
  type: { 
    type: String, 
    enum: ['bill_of_lading', 'air_waybill', 'commercial_invoice', 'customs_clearance'], 
    required: true 
  },
  documentNumber: { type: String, unique: true, required: true }, // e.g., FLS-BOL-102938
  shipper: {
    name: String,
    company: String,
    address: String
  },
  consignee: { // Receiver
    name: String,
    company: String,
    address: String
  },
  vesselName: { type: String }, // Used for sea/maritime freight routing
  voyageNumber: { type: String },
  portOfLoading: { type: String },
  portOfDischarge: { type: String },
  fileUrl: { type: String, required: true }, // Secure cloud URL pointing to the generated PDF document
  issuedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);