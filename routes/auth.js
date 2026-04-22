// ============ routes/auth.js ============
const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register',       ctrl.register);
router.post('/login',          ctrl.login);
router.get('/me',              protect, ctrl.getMe);
router.put('/profile',         protect, ctrl.updateProfile);
router.put('/password',        protect, ctrl.changePassword);
router.post('/address',        protect, ctrl.addAddress);
router.delete('/address/:id',  protect, ctrl.deleteAddress);
router.put('/wishlist/:productId', protect, ctrl.toggleWishlist);

module.exports = router;
