const { Subscriber, Contact } = require('../models/Newsletter');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   Number(process.env.EMAIL_PORT),
  secure: false,
  auth:   { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// =================== NEWSLETTER ===================

// @POST /api/newsletter/subscribe
exports.subscribe = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    const existing = await Subscriber.findOne({ email });
    if (existing) {
      if (existing.isActive)
        return res.status(400).json({ success: false, message: 'Already subscribed!' });
      existing.isActive = true;
      await existing.save();
      return res.json({ success: true, message: 'Welcome back! You are now subscribed.' });
    }

    await Subscriber.create({ email });

    // Send welcome email
    try {
      await transporter.sendMail({
        from:    process.env.EMAIL_FROM,
        to:      email,
        subject: 'Welcome to Cielora ✨',
        html: `
          <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#3d2b1f">
            <h1 style="font-size:32px;font-weight:300;color:#c9a96e;letter-spacing:3px">CIELORA</h1>
            <p style="font-size:18px;font-weight:300">Thank you for joining our world of elegance.</p>
            <p>You'll be the first to know about new arrivals, exclusive offers, and styling stories.</p>
            <p style="color:#9a8575;font-size:13px">With love,<br/>The Cielora Team</p>
          </div>`,
      });
    } catch (emailErr) {
      console.warn('Welcome email failed:', emailErr.message);
    }

    res.status(201).json({ success: true, message: 'Subscribed successfully! Check your inbox.' });
  } catch (err) { next(err); }
};

// @POST /api/newsletter/unsubscribe
exports.unsubscribe = async (req, res, next) => {
  try {
    const { email } = req.body;
    await Subscriber.findOneAndUpdate({ email }, { isActive: false });
    res.json({ success: true, message: 'Unsubscribed successfully.' });
  } catch (err) { next(err); }
};

// @GET /api/admin/subscribers — admin
exports.getSubscribers = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Subscriber.countDocuments({ isActive: true });
    const subscribers = await Subscriber.find({ isActive: true })
      .sort('-createdAt').skip(skip).limit(Number(limit));
    res.json({ success: true, total, subscribers });
  } catch (err) { next(err); }
};

// @POST /api/admin/newsletter/send — blast email to all subscribers
exports.sendNewsletter = async (req, res, next) => {
  try {
    const { subject, htmlContent } = req.body;
    const subscribers = await Subscriber.find({ isActive: true });
    if (!subscribers.length)
      return res.status(400).json({ success: false, message: 'No active subscribers' });

    const emails = subscribers.map(s => s.email);
    await transporter.sendMail({
      from:    process.env.EMAIL_FROM,
      bcc:     emails,
      subject,
      html:    htmlContent,
    });

    res.json({ success: true, message: `Newsletter sent to ${emails.length} subscribers.` });
  } catch (err) { next(err); }
};

// =================== CONTACT FORM ===================

// @POST /api/contact
exports.submitContact = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, subject, message } = req.body;
    const contact = await Contact.create({ firstName, lastName, email, phone, subject, message });

    // Auto-reply to customer
    try {
      await transporter.sendMail({
        from:    process.env.EMAIL_FROM,
        to:      email,
        subject: `We received your message — Cielora`,
        html: `
          <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#3d2b1f">
            <h1 style="font-size:28px;font-weight:300;color:#c9a96e;letter-spacing:3px">CIELORA</h1>
            <p>Dear ${firstName},</p>
            <p>Thank you for reaching out. We've received your message and will get back to you within 24 hours.</p>
            <p style="background:#f8f4ee;padding:16px;border-left:3px solid #c9a96e;font-style:italic">"${message}"</p>
            <p>With love,<br/>The Cielora Team</p>
          </div>`,
      });
    } catch (emailErr) {
      console.warn('Auto-reply email failed:', emailErr.message);
    }

    // Notify admin
    try {
      await transporter.sendMail({
        from:    process.env.EMAIL_FROM,
        to:      process.env.ADMIN_EMAIL,
        subject: `New Contact: ${subject} — ${firstName} ${lastName}`,
        html: `<p><b>From:</b> ${firstName} ${lastName} (${email})<br/><b>Phone:</b> ${phone || 'N/A'}<br/><b>Subject:</b> ${subject}</p><p>${message}</p>`,
      });
    } catch (e) {}

    res.status(201).json({ success: true, message: 'Message received! We will reply within 24 hours.', id: contact._id });
  } catch (err) { next(err); }
};

// @GET /api/admin/contacts
exports.getContacts = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    const skip     = (Number(page) - 1) * Number(limit);
    const total    = await Contact.countDocuments(query);
    const contacts = await Contact.find(query).sort('-createdAt').skip(skip).limit(Number(limit));
    res.json({ success: true, total, contacts });
  } catch (err) { next(err); }
};

// @PUT /api/admin/contacts/:id
exports.updateContact = async (req, res, next) => {
  try {
    const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, contact });
  } catch (err) { next(err); }
};
