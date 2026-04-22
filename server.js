require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const rateLimit  = require('express-rate-limit');
const connectDB  = require('./config/db');
const errorHandler = require('./middleware/error');

// ── Connect Database ───────────────────────────
connectDB();

const app = express();

// ── Middleware ─────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  message: { success: false, message: 'Too many requests. Please try again after 15 minutes.' },
});
app.use('/api', limiter);

// Stricter limit for auth routes
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { success: false, message: 'Too many login attempts. Please try after 1 hour.' },
});
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

// ── Routes ──────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/products',  require('./routes/products'));
app.use('/api/orders',    require('./routes/orders'));
app.use('/api',           require('./routes/newsletter'));

// ── Health Check ────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '✨ Cielora API is running',
    env:     process.env.NODE_ENV,
    time:    new Date().toISOString(),
  });
});

// ── 404 handler ─────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global error handler ─────────────────────────
app.use(errorHandler);

// ── Start server ─────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Cielora Backend running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📡 API Base: http://localhost:${PORT}/api\n`);
});
