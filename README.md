# Cielora Backend — Setup Guide

## Tech Stack
- **Node.js + Express** — Server
- **MongoDB Atlas** — Database (free cloud)
- **JWT** — Authentication
- **Razorpay** — Indian payment gateway
- **Nodemailer** — Email (Gmail SMTP)
- **Multer** — Image uploads

---

## Step 1 — MongoDB Atlas Setup (Free)

1. [mongodb.com/atlas](https://mongodb.com/atlas) pe jaao → Free account banao
2. **"Create a cluster"** → Free (M0) select karo → Region: Mumbai (ap-south-1)
3. **Database Access** → Add user → username + password set karo
4. **Network Access** → Add IP → `0.0.0.0/0` (allow all — for deployment)
5. **Connect** → Drivers → Copy URI:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/cielora
   ```
6. Is URI ko `.env` mein `MONGO_URI` mein daalo

---

## Step 2 — Razorpay Setup (Free test account)

1. [razorpay.com](https://razorpay.com) → Sign up (free)
2. Dashboard → Settings → API Keys → Generate Test Keys
3. `RAZORPAY_KEY_ID` aur `RAZORPAY_KEY_SECRET` `.env` mein daalo
4. Live keys ke liye KYC complete karo

---

## Step 3 — Gmail SMTP Setup

1. Gmail account mein jaao → Google Account → Security
2. **2-Step Verification** ON karo
3. **App Passwords** → Select app: Mail → Generate
4. 16-character password milega → `.env` mein `EMAIL_PASS` mein daalo

---

## Step 4 — Install & Run

```bash
# 1. Backend folder mein jaao
cd cielora-backend

# 2. .env file banao
cp .env.example .env
# .env file kholo aur apni values bharo

# 3. uploads folder banao
mkdir uploads

# 4. Dependencies install karo
npm install

# 5. Admin aur sample products seed karo
node seeder.js

# 6. Server start karo
npm run dev        # development (auto-restart)
npm start          # production
```

Server `http://localhost:5000` pe chalega ✅

---

## API Reference

### Auth Routes
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | New user register |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | User | Get profile |
| PUT | `/api/auth/profile` | User | Update name/phone |
| PUT | `/api/auth/password` | User | Change password |
| POST | `/api/auth/address` | User | Add delivery address |
| DELETE | `/api/auth/address/:id` | User | Delete address |
| PUT | `/api/auth/wishlist/:productId` | User | Toggle wishlist |

### Product Routes
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/products` | Public | List products (filter, search, paginate) |
| GET | `/api/products/:id` | Public | Single product |
| POST | `/api/products/:id/reviews` | User | Add review |
| GET | `/api/products/admin/all` | Admin | All products incl. inactive |
| POST | `/api/products/admin` | Admin | Create product (multipart/form-data) |
| PUT | `/api/products/admin/:id` | Admin | Update product |
| DELETE | `/api/products/admin/:id` | Admin | Soft delete product |

### Order Routes
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/orders` | User | Create order + Razorpay order |
| POST | `/api/orders/verify-payment` | User | Verify Razorpay payment |
| GET | `/api/orders/my` | User | My orders |
| GET | `/api/orders/:id` | User | Single order |
| PUT | `/api/orders/:id/cancel` | User | Cancel order |
| GET | `/api/orders/admin/all` | Admin | All orders |
| GET | `/api/orders/admin/dashboard` | Admin | Stats + recent orders |
| PUT | `/api/orders/admin/:id/status` | Admin | Update order status |

### Newsletter & Contact Routes
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/newsletter/subscribe` | Public | Subscribe to newsletter |
| POST | `/api/newsletter/unsubscribe` | Public | Unsubscribe |
| POST | `/api/contact` | Public | Submit contact form |
| GET | `/api/admin/subscribers` | Admin | List all subscribers |
| POST | `/api/admin/newsletter/send` | Admin | Blast email to all subscribers |
| GET | `/api/admin/contacts` | Admin | List contact messages |
| PUT | `/api/admin/contacts/:id` | Admin | Update contact status |

---

## Query Parameters (GET /api/products)

```
/api/products?category=necklaces
/api/products?search=pearl
/api/products?minPrice=500&maxPrice=2000
/api/products?sort=-price          (newest: -createdAt, cheapest: price)
/api/products?page=2&limit=12
/api/products?featured=true
/api/products?bestseller=true
```

---

## Auth Flow (Frontend se kaise use karein)

```javascript
// 1. Login
const res = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@email.com', password: 'password123' })
});
const { token, user } = await res.json();
localStorage.setItem('token', token);

// 2. Protected route call
const profile = await fetch('http://localhost:5000/api/auth/me', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
});
```

---

## Razorpay Payment Flow

```javascript
// Step 1: Create order on backend
const orderRes = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ items, shippingAddress, paymentMethod: 'razorpay' })
});
const { order, razorpayOrder, razorpayKeyId } = await orderRes.json();

// Step 2: Open Razorpay checkout
const rzp = new Razorpay({
  key: razorpayKeyId,
  order_id: razorpayOrder.id,
  amount: razorpayOrder.amount,
  currency: 'INR',
  name: 'Cielora',
  handler: async (response) => {
    // Step 3: Verify payment
    await fetch('/api/orders/verify-payment', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...response, orderId: order._id })
    });
  }
});
rzp.open();
```

---

## Deploy to Railway (Free)

1. [railway.app](https://railway.app) → Login with GitHub
2. **New Project** → **Deploy from GitHub repo**
3. Variables tab → Add all `.env` variables
4. Railway auto-detects Node.js aur deploy kar deta hai ✅
5. Custom domain bhi free mein milta hai

## Deploy to Render (Free)

1. [render.com](https://render.com) → New Web Service
2. GitHub se connect karo
3. Build command: `npm install`
4. Start command: `npm start`
5. Environment Variables add karo

---

## Folder Structure

```
cielora-backend/
├── server.js              ← Entry point
├── seeder.js              ← DB seed script
├── .env.example           ← Environment template
├── package.json
├── config/
│   └── db.js              ← MongoDB connection
├── models/
│   ├── User.js            ← User + addresses + wishlist
│   ├── Product.js         ← Products + reviews
│   ├── Order.js           ← Orders + Razorpay
│   └── Newsletter.js      ← Subscribers + Contact
├── controllers/
│   ├── authController.js
│   ├── productController.js
│   ├── orderController.js
│   └── newsletterController.js
├── routes/
│   ├── auth.js
│   ├── products.js
│   ├── orders.js
│   └── newsletter.js
├── middleware/
│   ├── auth.js            ← JWT protect + adminOnly
│   └── error.js           ← Global error handler
└── uploads/               ← Product images (create manually)
```
