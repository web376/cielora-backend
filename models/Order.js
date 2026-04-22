const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:     { type: String, required: true },
  image:    { type: String },
  price:    { type: Number, required: true },
  qty:      { type: Number, required: true, min: 1 },
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderNumber: { type: String, unique: true },

  items:       [orderItemSchema],
  shippingAddress: {
    name:    { type: String, required: true },
    phone:   { type: String, required: true },
    line1:   { type: String, required: true },
    line2:   { type: String },
    city:    { type: String, required: true },
    state:   { type: String, required: true },
    pincode: { type: String, required: true },
  },

  // Pricing
  subtotal:      { type: Number, required: true },
  shippingCost:  { type: Number, default: 0 },
  discount:      { type: Number, default: 0 },
  total:         { type: Number, required: true },
  couponCode:    { type: String },

  // Payment
  paymentMethod: { type: String, enum: ['razorpay', 'cod'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  razorpayOrderId:   { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  paidAt: { type: Date },

  // Order Status
  status: {
    type: String,
    enum: ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'placed',
  },
  trackingNumber: { type: String },
  courier:        { type: String },
  deliveredAt:    { type: Date },
  cancelReason:   { type: String },
  notes:          { type: String },
}, { timestamps: true });

// Auto-generate order number
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `CL${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
