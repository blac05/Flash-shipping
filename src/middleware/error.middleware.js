const errorHandler = (err, req, res, next) => {
  console.error(`💥 Architectural Error Logged:`, err);

  // Handle Mongoose duplicate key index errors
  if (err.code === 11000) {
    return res.status(409).json({
      status: 'error',
      message: `Duplicate field error: ${Object.keys(err.keyValue)} already exists.`
    });
  }

  // Handle explicit Mongoose schema validation failures
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: err.message
    });
  }

  // Fallback structural safety boundary response
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Internal Logistics Engine Processing Exception.'
  });
};

module.exports = errorHandler;