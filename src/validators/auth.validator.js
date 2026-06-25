const { body, validationResult } = require('express-validator');

const validateRegister = [
  body('email').isEmail().withMessage('Provide a pristine, valid email infrastructure routing address.').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Security architecture rules dictate passwords must span 8+ characters.'),
  body('fullName').trim().notEmpty().withMessage('Legal tracking identities demand an official full name.'),
  body('phone').notEmpty().withMessage('Telephony notifications require a verified telephone string.'),
  body('accountType').optional().isIn(['personal', 'business', 'industrial']).withMessage('Invalid corporate asset account classification tier.'),
  body('gpsAddress').notEmpty().withMessage('Spatial mapping telemetry requires an initial location string.'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'fail', errors: errors.array() });
    }
    next();
  }
];

module.exports = { validateRegister };