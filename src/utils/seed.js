require('dotenv').config()
const mongoose = require('mongoose')
const User     = require('../models/User')
const { Harbor } = require('../models/index')

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'flash-shipping' })
  console.log('Connected. Seeding...')

  // Create admin user
  const adminExists = await User.findOne({ email: 'admin@flashshipping.com' })
  if (!adminExists) {
    await User.create({
      fullName:     'Flash Admin',
      email:        'admin@flashshipping.com',
      phone:        '+1000000000',
      passwordHash: 'Admin@12345',
      role:         'admin',
      accountType:  'business',
      verified:     true,
    })
    console.log('✅ Admin created — admin@flashshipping.com / Admin@12345')
  }

  // Create sample harbors
  const harbors = [
    { name: 'Tema Port',          code: 'TMA', type: 'sea',  location: { lat: 5.6271,   lng: 0.0143,   city: 'Tema',      country: 'Ghana',        continent: 'Africa' } },
    { name: 'Kotoka International', code: 'ACC', type: 'air', location: { lat: 5.6052,   lng: -0.1668,  city: 'Accra',     country: 'Ghana',        continent: 'Africa' } },
    { name: 'Port of Rotterdam',  code: 'RTM', type: 'sea',  location: { lat: 51.9225,  lng: 4.4792,   city: 'Rotterdam', country: 'Netherlands',  continent: 'Europe' } },
    { name: 'Heathrow Cargo',     code: 'LHR', type: 'air',  location: { lat: 51.4700,  lng: -0.4543,  city: 'London',    country: 'UK',           continent: 'Europe' } },
    { name: 'Shanghai Port',      code: 'SHA', type: 'sea',  location: { lat: 31.2304,  lng: 121.4737, city: 'Shanghai',  country: 'China',        continent: 'Asia' } },
    { name: 'Dubai World Central',code: 'DWC', type: 'air',  location: { lat: 24.8960,  lng: 55.1611,  city: 'Dubai',     country: 'UAE',          continent: 'Middle East' } },
    { name: 'Port of New York',   code: 'NYC', type: 'sea',  location: { lat: 40.6840,  lng: -74.0440, city: 'New York',  country: 'USA',          continent: 'Americas' } },
    { name: 'Mombasa Port',       code: 'MBA', type: 'sea',  location: { lat: -4.0435,  lng: 39.6682,  city: 'Mombasa',   country: 'Kenya',        continent: 'Africa' } },
    { name: 'Port of Singapore',  code: 'SIN', type: 'sea',  location: { lat: 1.2897,   lng: 103.8501, city: 'Singapore', country: 'Singapore',    continent: 'Asia' } },
    { name: 'Lagos Apapa Port',   code: 'LOS', type: 'sea',  location: { lat: 6.4474,   lng: 3.3903,   city: 'Lagos',     country: 'Nigeria',      continent: 'Africa' } },
  ]

  for (const h of harbors) {
    await Harbor.findOneAndUpdate({ code: h.code }, h, { upsert: true })
  }
  console.log(`✅ ${harbors.length} harbors seeded`)

  mongoose.disconnect()
  console.log('Done.')
}

seed().catch(err => { console.error(err); process.exit(1) })
