const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/newsletterController');
const { protect, adminOnly } = require('../middleware/auth');

// Public
router.post('/newsletter/subscribe',   ctrl.subscribe);
router.post('/newsletter/unsubscribe', ctrl.unsubscribe);
router.post('/contact',                ctrl.submitContact);

// Admin
router.get('/admin/subscribers',          protect, adminOnly, ctrl.getSubscribers);
router.post('/admin/newsletter/send',     protect, adminOnly, ctrl.sendNewsletter);
router.get('/admin/contacts',             protect, adminOnly, ctrl.getContacts);
router.put('/admin/contacts/:id',         protect, adminOnly, ctrl.updateContact);

module.exports = router;
