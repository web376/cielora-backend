const Product = require('../models/Product');

// @GET /api/products — public, with filters, search, pagination
exports.getProducts = async (req, res, next) => {
  try {
    const {
      category, search, minPrice, maxPrice,
      sort = '-createdAt', page = 1, limit = 12,
      featured, bestseller,
    } = req.query;

    const query = { isActive: true };
    if (category)    query.category    = category;
    if (featured)    query.isFeatured  = true;
    if (bestseller)  query.isBestseller= true;
    if (search)      query.name        = { $regex: search, $options: 'i' };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sort).skip(skip).limit(Number(limit));

    res.json({
      success: true,
      count: products.length,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      products,
    });
  } catch (err) { next(err); }
};

// @GET /api/products/:id
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      $or: [{ _id: req.params.id.match(/^[a-f\d]{24}$/i) ? req.params.id : null }, { slug: req.params.id }],
      isActive: true,
    }).populate('reviews.user', 'name');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) { next(err); }
};

// @POST /api/admin/products — admin only
exports.createProduct = async (req, res, next) => {
  try {
    const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
    const product = await Product.create({ ...req.body, images });
    res.status(201).json({ success: true, product });
  } catch (err) { next(err); }
};

// @PUT /api/admin/products/:id
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) { next(err); }
};

// @DELETE /api/admin/products/:id
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    product.isActive = false; // soft delete
    await product.save();
    res.json({ success: true, message: 'Product removed' });
  } catch (err) { next(err); }
};

// @POST /api/products/:id/reviews — logged in user
exports.addReview = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const alreadyReviewed = product.reviews.find(
      r => r.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed)
      return res.status(400).json({ success: false, message: 'You already reviewed this product' });

    product.reviews.push({ user: req.user._id, name: req.user.name, ...req.body });
    await product.save();
    res.status(201).json({ success: true, message: 'Review added' });
  } catch (err) { next(err); }
};

// @GET /api/admin/products — admin sees all including inactive
exports.adminGetProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query).sort('-createdAt').skip(skip).limit(Number(limit));
    res.json({ success: true, total, products });
  } catch (err) { next(err); }
};
