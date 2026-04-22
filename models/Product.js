const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:    { type: String, required: true },
  rating:  { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  slug:        { type: String, unique: true },
  description: { type: String, required: true },
  price:       { type: Number, required: true, min: 0 },
  comparePrice:{ type: Number },           // original MRP for strikethrough
  category:    { type: String, required: true, enum: ['necklaces', 'chokers', 'earrings', 'bridal', 'rings', 'bracelets'] },
  tags:        [{ type: String }],
  images:      [{ type: String }],         // file paths / URLs
  stock:       { type: Number, default: 0, min: 0 },
  sku:         { type: String, unique: true, sparse: true },
  material:    { type: String },           // e.g. "Faux Pearl, Rhinestone, Gold-plated"
  dimensions:  { type: String },           // e.g. "Necklace length: 45cm"
  isFeatured:  { type: Boolean, default: false },
  isBestseller:{ type: Boolean, default: false },
  isActive:    { type: Boolean, default: true },
  reviews:     [reviewSchema],
  numReviews:  { type: Number, default: 0 },
  avgRating:   { type: Number, default: 0 },
}, { timestamps: true });

// Auto-generate slug from name
productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  // Recalculate avgRating
  if (this.reviews.length > 0) {
    this.numReviews = this.reviews.length;
    this.avgRating  = this.reviews.reduce((acc, r) => acc + r.rating, 0) / this.reviews.length;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
