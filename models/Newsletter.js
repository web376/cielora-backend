const mongoose = require('mongoose');

// Newsletter Subscriber
const subscriberSchema = new mongoose.Schema({
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  isActive:  { type: Boolean, default: true },
  source:    { type: String, default: 'website' },
}, { timestamps: true });

// Contact Form Message
const contactSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName:  { type: String, trim: true },
  email:     { type: String, required: true, lowercase: true, trim: true },
  phone:     { type: String },
  subject:   { type: String, enum: ['order', 'custom', 'return', 'other'], default: 'other' },
  message:   { type: String, required: true },
  status:    { type: String, enum: ['new', 'read', 'replied', 'closed'], default: 'new' },
  adminNotes:{ type: String },
}, { timestamps: true });

const Subscriber = mongoose.model('Subscriber', subscriberSchema);
const Contact    = mongoose.model('Contact', contactSchema);

module.exports = { Subscriber, Contact };
