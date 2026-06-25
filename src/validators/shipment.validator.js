const { body, validationResult } = require('express-validator');

const validateShipment = [
  body('mode').isIn(['air', 'sea', 'road', 'courier']).withMessage('Unrecognized kinetic transit pipeline mode.'),
  body('type').isIn(['pickup', 'delivery']).withMessage('Operational intent must be explicit pickup or structural delivery.'),
  body('cargoType').isIn(['auto_parts', 'electronics', 'machinery', 'building_materials', 'pharmaceuticals', 'perishables', 'clothing', 'furniture', 'general']),
  body('weight').isNumeric().withMessage('Mass calculations require numerical metrics.'),
  body('dimensions.l').isNumeric(),
  body('dimensions.w').isNumeric(),
  body('dimensions.h').isNumeric(),
  body('origin.address').notEmpty().withMessage('Source coordinates map boundary is missing.'),
  body('destination.address').notEmpty().withMessage('Target destination vector map boundary is missing.'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'fail', errors: errors.array() });
    }
    next();
  }
];

module.exports = { validateShipment };