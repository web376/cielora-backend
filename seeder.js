// Run: node seeder.js
// Creates default admin user in DB

require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('./models/User');
const Product  = require('./models/Product');
const connectDB = require('./config/db');

const seedAdmin = async () => {
  await connectDB();

  // Create admin user
  const existing = await User.findOne({ email: process.env.ADMIN_EMAIL });
  if (existing) {
    console.log('⚠️  Admin already exists:', existing.email);
  } else {
    await User.create({
      name:     'Cielora Admin',
      email:    process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role:     'admin',
    });
    console.log('✅ Admin created:', process.env.ADMIN_EMAIL);
  }

  // Seed sample products
  const count = await Product.countDocuments();
  if (count === 0) {
    const products = [
      {
        name: 'Baroque Pearl Drop Set',
        description: 'Stunning baroque pearl necklace with matching drop earrings. Gold-plated clasps with rhinestone accents.',
        price: 2499, comparePrice: 3499,
        category: 'necklaces',
        stock: 25, isFeatured: true, isBestseller: true,
        material: 'Faux Pearl, Gold-plated brass, Rhinestone',
        dimensions: 'Necklace: 45cm + 5cm extender',
        tags: ['pearl', 'baroque', 'set', 'bestseller'],
      },
      {
        name: 'Rhinestone Pearl Choker',
        description: 'Elegant 3-layer faux pearl choker with central rhinestone and pearl cameo. Perfect for daily wear and special occasions.',
        price: 1899, comparePrice: 2500,
        category: 'chokers',
        stock: 40, isFeatured: true,
        material: 'Faux Pearl, Rhinestone, Gold-plated setting',
        dimensions: 'Fits neck: 32-38cm',
        tags: ['choker', 'rhinestone', 'layered'],
      },
      {
        name: 'Teardrop Pearl Earrings',
        description: 'Classic teardrop pearl drop earrings with rhinestone studded tops. Lightweight and comfortable.',
        price: 999, comparePrice: 1299,
        category: 'earrings',
        stock: 60, isBestseller: true,
        material: 'Faux Pearl, Rhinestone, Gold-plated',
        tags: ['earrings', 'teardrop', 'pearl'],
      },
      {
        name: "The Bride's Pearl Set",
        description: 'Complete bridal jewellery set: necklace, choker, earrings, and bracelet. Gift-wrapped in premium Cielora box.',
        price: 4199, comparePrice: 6000,
        category: 'bridal',
        stock: 15, isFeatured: true,
        material: 'Faux Pearl, Rhinestone, Gold-plated brass',
        tags: ['bridal', 'set', 'wedding', 'gift'],
      },
    ];
    await Product.insertMany(products);
    console.log('✅ Sample products seeded');
  }

  console.log('\n🎉 Seeding complete!');
  console.log(`   Admin email: ${process.env.ADMIN_EMAIL}`);
  console.log(`   Admin pass:  ${process.env.ADMIN_PASSWORD}`);
  console.log('\n⚠️  Change admin password after first login!\n');
  process.exit(0);
};

seedAdmin().catch(err => { console.error(err); process.exit(1); });
