const { nanoid } = require('nanoid');

/**
 * High-performance semantic tracking code vector generator
 */
const generateTrackingCode = () => {
  const currentYear = new Date().getFullYear();
  // Clean alphanumeric upper string sequence for extreme scannability layouts
  const safeMatrixSegment = nanoid(6).toUpperCase().replace(/[-_]/g, 'X');
  return `FLS-${currentYear}-${safeMatrixSegment}`;
};

module.exports = { generateTrackingCode };