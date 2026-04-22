const Razorpay = require('razorpay');
const crypto   = require('crypto');
const Order    = require('../models/Order');
const Product  = require('../models/Product');

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @POST /api/orders — create order (user)
exports.createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod, couponCode, notes } = req.body;

    // Validate stock & calc subtotal
    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive)
        return res.status(400).json({ success: false, message: `Product not found: ${item.product}` });
      if (product.stock < item.qty)
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });

      subtotal += product.price * item.qty;
      orderItems.push({
        product: product._id,
        name:    product.name,
        image:   product.images[0] || '',
        price:   product.price,
        qty:     item.qty,
      });
    }

    const shippingCost = subtotal >= 999 ? 0 : 79;
    const discount     = 0; // coupon logic can be added
    const total        = subtotal + shippingCost - discount;

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      couponCode,
      notes,
      subtotal,
      shippingCost,
      discount,
      total,
    });

    // Deduct stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty } });
    }

    // Create Razorpay order if not COD
    let razorpayOrder = null;
    if (paymentMethod === 'razorpay') {
      razorpayOrder = await razorpay.orders.create({
        amount:   Math.round(total * 100), // paise
        currency: 'INR',
        receipt:  order.orderNumber,
      });
      order.razorpayOrderId = razorpayOrder.id;
      await order.save();
    }

    res.status(201).json({
      success: true,
      order,
      razorpayOrder,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) { next(err); }
};

// @POST /api/orders/verify-payment — verify Razorpay signature
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const body      = razorpay_order_id + '|' + razorpay_payment_id;
    const expected  = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body).digest('hex');

    if (expected !== razorpay_signature)
      return res.status(400).json({ success: false, message: 'Payment verification failed' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.paymentStatus    = 'paid';
    order.status           = 'confirmed';
    order.razorpayPaymentId= razorpay_payment_id;
    order.razorpaySignature= razorpay_signature;
    order.paidAt           = Date.now();
    await order.save();

    res.json({ success: true, message: 'Payment verified', order });
  } catch (err) { next(err); }
};

// @GET /api/orders/my — user's own orders
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort('-createdAt')
      .populate('items.product', 'name images');
    res.json({ success: true, orders });
  } catch (err) { next(err); }
};

// @GET /api/orders/:id — single order (user sees own, admin sees all)
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product', 'name images');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorised' });
    res.json({ success: true, order });
  } catch (err) { next(err); }
};

// @PUT /api/orders/:id/cancel — user cancel
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorised' });
    if (!['placed', 'confirmed'].includes(order.status))
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });

    order.status       = 'cancelled';
    order.cancelReason = req.body.reason || 'Cancelled by customer';
    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.qty } });
    }
    await order.save();
    res.json({ success: true, order });
  } catch (err) { next(err); }
};

// === ADMIN ===

// @GET /api/admin/orders
exports.adminGetOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    const skip   = (Number(page) - 1) * Number(limit);
    const total  = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort('-createdAt').skip(skip).limit(Number(limit))
      .populate('user', 'name email');
    res.json({ success: true, total, orders });
  } catch (err) { next(err); }
};

// @PUT /api/admin/orders/:id/status
exports.adminUpdateOrderStatus = async (req, res, next) => {
  try {
    const { status, trackingNumber, courier } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (courier)        order.courier = courier;
    if (status === 'delivered') order.deliveredAt = Date.now();
    await order.save();
    res.json({ success: true, order });
  } catch (err) { next(err); }
};

// @GET /api/admin/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const [totalOrders, totalRevenue, pendingOrders, totalProducts] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.countDocuments({ status: { $in: ['placed', 'confirmed', 'processing'] } }),
      Product.countDocuments({ isActive: true }),
    ]);

    const recentOrders = await Order.find().sort('-createdAt').limit(5).populate('user', 'name email');
    const topProducts  = await Product.find({ isActive: true }).sort('-numReviews').limit(5);

    res.json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingOrders,
        totalProducts,
      },
      recentOrders,
      topProducts,
    });
  } catch (err) { next(err); }
};
