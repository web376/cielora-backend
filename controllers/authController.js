const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  user.password = undefined;
  res.status(statusCode).json({ success: true, token, user });
};

// @POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ name, email, password, phone });
    sendToken(user, 201, res);
  } catch (err) { next(err); }
};

// @POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Please provide email and password' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    if (!user.isActive)
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact support.' });

    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });
    sendToken(user, 200, res);
  } catch (err) { next(err); }
};

// @GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// @PUT /api/auth/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

// @PUT /api/auth/password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword)))
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();
    sendToken(user, 200, res);
  } catch (err) { next(err); }
};

// @POST /api/auth/address — add address
exports.addAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (req.body.isDefault) {
      user.addresses.forEach(a => (a.isDefault = false));
    }
    user.addresses.push(req.body);
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) { next(err); }
};

// @DELETE /api/auth/address/:id
exports.deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.id);
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) { next(err); }
};

// @PUT /api/auth/wishlist/:productId — toggle wishlist
exports.toggleWishlist = async (req, res, next) => {
  try {
    const user   = await User.findById(req.user._id);
    const prodId = req.params.productId;
    const idx    = user.wishlist.indexOf(prodId);
    if (idx > -1) { user.wishlist.splice(idx, 1); }
    else          { user.wishlist.push(prodId); }
    await user.save();
    res.json({ success: true, wishlist: user.wishlist });
  } catch (err) { next(err); }
};
