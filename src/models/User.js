const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const userSchema = new mongoose.Schema({
  fullName:    { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:       { type: String, required: true, trim: true },
  passwordHash:{ type: String, required: true },

  role:        { type: String, enum: ['user','courier','admin'], default: 'user' },
  accountType: { type: String, enum: ['personal','business','industry'], default: 'personal' },

  companyName: { type: String },
  taxId:       { type: String },

  gpsAddress: {
    lat:              { type: Number },
    lng:              { type: Number },
    formattedAddress: { type: String },
    placeId:          { type: String },
  },

  verified:   { type: Boolean, default: false },
  verifyToken:{ type: String },

  kycStatus:  { type: String, enum: ['none','pending','verified','rejected'], default: 'none' },
  kycDocUrl:  { type: String },

  refreshToken: { type: String },
  lastLogin:    { type: Date },
}, { timestamps: true })

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next()
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12)
  next()
})

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash)
}

userSchema.methods.toSafe = function () {
  const obj = this.toObject()
  delete obj.passwordHash
  delete obj.refreshToken
  delete obj.verifyToken
  return obj
}

module.exports = mongoose.model('User', userSchema)
