const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/auth');

// User routes
router.post('/',                protect, ctrl.createOrder);
router.post('/verify-payment',  protect, ctrl.verifyPayment);
router.get('/my',               protect, ctrl.getMyOrders);
router.get('/:id',              protect, ctrl.getOrder);
router.put('/:id/cancel',       protect, ctrl.cancelOrder);

// Admin routes
router.get('/admin/all',        protect, adminOnly, ctrl.adminGetOrders);
router.get('/admin/dashboard',  protect, adminOnly, ctrl.getDashboard);
router.put('/admin/:id/status', protect, adminOnly, ctrl.adminUpdateOrderStatus);

module.exports = router;
