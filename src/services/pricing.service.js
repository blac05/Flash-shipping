// Base rates per kg by mode
const BASE_RATES = {
  air:     8.50,
  sea:     1.20,
  road:    2.40,
  courier: 5.00,
}

// Zone multipliers (simplified — in production use lat/lng distance)
const ZONE_MULTIPLIERS = {
  air:     1.8,
  sea:     2.5,
  road:    1.3,
  courier: 1.0,
}

// Cargo type surcharges
const CARGO_SURCHARGES = {
  auto_parts:          0.10,
  electronics:         0.15,
  machinery:           0.20,
  building_materials:  0.05,
  pharmaceuticals:     0.25,
  perishables:         0.30,
  clothing:            0.00,
  furniture:           0.10,
  general:             0.00,
}

// ETA in business days
const ETA_DAYS = {
  air:     { min: 2,  max: 5  },
  sea:     { min: 14, max: 45 },
  road:    { min: 3,  max: 10 },
  courier: { min: 1,  max: 2  },
}

function calculate({ mode, weight, cargoType = 'general', declaredValue = 0 }) {
  const baseRate   = BASE_RATES[mode]     || BASE_RATES.general
  const zoneMulti  = ZONE_MULTIPLIERS[mode]|| 1.0
  const cargoExtra = CARGO_SURCHARGES[cargoType] || 0

  const base        = +(baseRate * 1).toFixed(2)             // flat base
  const weightCharge= +(baseRate * weight * 0.8).toFixed(2)  // per kg
  const zoneCharge  = +(base * (zoneMulti - 1)).toFixed(2)   // zone premium
  const cargoCharge = +((base + weightCharge) * cargoExtra).toFixed(2)
  const insurance   = declaredValue > 0 ? +(declaredValue * 0.02).toFixed(2) : 0
  const subtotal    = base + weightCharge + zoneCharge + cargoCharge + insurance
  const total       = +subtotal.toFixed(2)

  return { base, weight: weightCharge, zone: zoneCharge, cargo: cargoCharge, insurance, total, currency: 'USD' }
}

function getEtaDays(mode) {
  const range = ETA_DAYS[mode] || { min: 3, max: 7 }
  // Return midpoint
  return Math.round((range.min + range.max) / 2)
}

module.exports = { calculate, getEtaDays, BASE_RATES, ETA_DAYS }
