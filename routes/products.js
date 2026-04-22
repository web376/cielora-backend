const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const ctrl     = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/auth');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, process.env.UPLOAD_PATH || './uploads'),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, '-')}`),
});
const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Images only (jpg, png, webp)'));
  },
});

// Public
router.get('/',    ctrl.getProducts);
router.get('/:id', ctrl.getProduct);
router.post('/:id/reviews', protect, ctrl.addReview);

// Admin
router.get('/admin/all',       protect, adminOnly, ctrl.adminGetProducts);
router.post('/admin',          protect, adminOnly, upload.array('images', 6), ctrl.createProduct);
router.put('/admin/:id',       protect, adminOnly, ctrl.updateProduct);
router.delete('/admin/:id',    protect, adminOnly, ctrl.deleteProduct);

module.exports = router;
