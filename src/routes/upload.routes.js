const express    = require('express')
const multer     = require('multer')
const cloudinary = require('../config/cloudinary')
const { protect } = require('../middleware/auth.middleware')

const router  = express.Router()
const storage = multer.memoryStorage()
const upload  = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }) // 10MB

router.use(protect)

// POST /api/upload/document
router.post('/document', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' })

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'flash-shipping/documents', resource_type: 'auto' },
        (err, result) => err ? reject(err) : resolve(result)
      )
      stream.end(req.file.buffer)
    })

    res.json({ url: result.secure_url, publicId: result.public_id })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router
