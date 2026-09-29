// SJC Canteen — St. Joseph's College, Trichy
// Express + EJS + Supabase (PostgreSQL) + express-session
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcryptjs');
const { supabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine + body parsing + static assets.
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session management.
app.use(session({
  secret: process.env.SESSION_SECRET || 'sjc-canteen-secret-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 8 },
}));

// Make session data available to all views.
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.cart = req.session.cart || [];
  next();
});

// --- Food menu data (in-app, not in DB) ---
const foods = [
  { id: 1, name: 'Idli', price: 20, image: '🫓', desc: 'Steamed rice cakes with sambar' },
  { id: 2, name: 'Dosa', price: 30, image: '🥞', desc: 'Crispy rice crepe with chutney' },
  { id: 3, name: 'Sambar Rice', price: 40, image: '🍚', desc: 'Rice with lentil sambar' },
  { id: 4, name: 'Chapati', price: 25, image: '🫓', desc: 'Whole wheat flatbread with curry' },
  { id: 5, name: 'Veg Noodles', price: 50, image: '🍜', desc: 'Stir-fried hakka noodles' },
  { id: 6, name: 'Parotta', price: 35, image: '🫓', desc: 'Flaky layered flatbread' },
  { id: 7, name: 'Tea', price: 10, image: '🍵', desc: 'Hot masala chai' },
  { id: 8, name: 'Coffee', price: 15, image: '☕', desc: 'South Indian filter coffee' },
  { id: 9, name: 'Fresh Juice', price: 30, image: '🧃', desc: 'Seasonal fruit juice' },
  { id: 10, name: 'Curd Rice', price: 35, image: '🍚', desc: 'Cooling yogurt rice' },
];

// --- Auth middleware ---
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/');
  next();
}

// --- Routes ---

// Page 1: Login & Registration
app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/home');
  res.render('login', { title: 'SJC Canteen', error: null, success: null });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.render('login', { title: 'SJC Canteen', error: 'Please enter both username and password.', success: null });
  }
  try {
    const { data: user } = await supabase
      .from('sjc_users')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.render('login', { title: 'SJC Canteen', error: 'Invalid username or password.', success: null });
    }

    req.session.user = { id: user.id, username: user.username, fullName: user.full_name };
    // Pass welcome message to home page via query param for the popup.
    res.redirect('/home?welcome=' + encodeURIComponent(user.full_name));
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', { title: 'SJC Canteen', error: 'Something went wrong. Please try again.', success: null });
  }
});

app.post('/register', async (req, res) => {
  const { fullName, username, password } = req.body;
  if (!fullName || !username || !password) {
    return res.render('login', { title: 'SJC Canteen', error: null, success: 'All fields are required.' });
  }
  try {
    const { data: existing } = await supabase
      .from('sjc_users')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existing) {
      return res.render('login', { title: 'SJC Canteen', error: null, success: 'That username is already taken.' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const { error } = await supabase
      .from('sjc_users')
      .insert({ full_name: fullName, username, password_hash: hash });

    if (error) throw error;

    res.render('login', { title: 'SJC Canteen', error: null, success: 'Registration successful! Please log in.' });
  } catch (err) {
    console.error('Registration error:', err);
    res.render('login', { title: 'SJC Canteen', error: null, success: 'Registration failed. Please try again.' });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// Page 2: Home
app.get('/home', requireLogin, (req, res) => {
  res.render('home', {
    title: 'Home — SJC Canteen',
    welcomeName: req.query.welcome || null,
  cartCount: (req.session.cart || []).reduce((s, i) => s + i.quantity, 0),
  user: req.session.user,
  foods: foods.slice(0, 4),
  popularItems: foods.slice(0, 3),
  recentOrders: [],
  recommended: foods.slice(4, 8),
  cart: req.session.cart || [],
  walletBalance: 500,
  locations: [
    { id: 1, name: 'Main Block Canteen', block: 'Main Block', opening_hours: '7:00 AM – 8:00 PM', is_active: true },
    { id: 2, name: 'Engineering Block Canteen', block: 'Engineering Block', opening_hours: '8:00 AM – 6:00 PM', is_active: true },
    { id: 3, name: 'Library Canteen', block: 'Library Block', opening_hours: '9:00 AM – 9:00 PM', is_active: true },
  ],
    featured: foods.slice(0, 6),
  categories: [
    { id: 1, name: 'Breakfast', icon: '🌅' },
    { id: 2, name: 'Lunch', icon: '🍚' },
    { id: 3, name: 'Snacks', icon: '🥨' },
    { id: 4, name: 'Beverages', icon: '☕' },
  ],
  stats: { orders: 0, revenue: 0 },
    recentOrdersList: [],
  });
});

// Page 3: Menu
app.get('/menu', requireLogin, (req, res) => {
  res.render('menu', {
    title: 'Menu — SJC Canteen',
    foods,
    cartCount: (req.session.cart || []).reduce((s, i) => s + i.quantity, 0),
    user: req.session.user,
    cart: req.session.cart || [],
  });
});

// Add to cart (POST, supports fetch or form)
app.post('/cart/add', requireLogin, (req, res) => {
  const foodId = parseInt(req.body.foodId, 10);
  const food = foods.find((f) => f.id === foodId);
  if (!food) {
    return req.headers.accept?.includes('application/json')
      ? res.json({ success: false, message: 'Item not found.' })
      : res.redirect('/menu');
  }

  const cart = req.session.cart || [];
  const existing = cart.find((i) => i.foodId === foodId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ foodId: food.id, name: food.name, price: food.price, image: food.image, quantity: 1 });
  }
  req.session.cart = cart;

  if (req.headers.accept?.includes('application/json')) {
    return res.json({ success: true, cartCount: cart.reduce((s, i) => s + i.quantity, 0) });
  }
  res.redirect('/menu');
});

// Page 4: Cart
app.get('/cart', requireLogin, (req, res) => {
  const cart = req.session.cart || [];
  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  res.render('cart', {
    title: 'Cart — SJC Canteen',
    cart,
    total,
    cartCount: cart.reduce((s, i) => s + i.quantity, 0),
    user: req.session.user,
  });
});

// Update quantity (+ / -)
app.post('/cart/update', requireLogin, (req, res) => {
  const { foodId, action } = req.body;
  const fid = parseInt(foodId, 10);
  const cart = req.session.cart || [];
  const item = cart.find((i) => i.foodId === fid);
  if (!item) return res.redirect('/cart');

  if (action === 'increase') item.quantity += 1;
  else if (action === 'decrease') {
    item.quantity -= 1;
    if (item.quantity <= 0) {
      req.session.cart = cart.filter((i) => i.foodId !== fid);
      return res.redirect('/cart');
    }
  }
  req.session.cart = cart;
  res.redirect('/cart');
});

// Remove item
app.post('/cart/remove', requireLogin, (req, res) => {
  const fid = parseInt(req.body.foodId, 10);
  req.session.cart = (req.session.cart || []).filter((i) => i.foodId !== fid);
  res.redirect('/cart');
});

// Page 5: Payment / Order Summary
app.get('/payment', requireLogin, (req, res) => {
  const cart = req.session.cart || [];
  if (cart.length === 0) return res.redirect('/menu');
  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  res.render('payment', {
    title: 'Payment — SJC Canteen',
    cart,
    total,
    cartCount: cart.reduce((s, i) => s + i.quantity, 0),
    user: req.session.user,
  });
});

app.post('/payment/confirm', requireLogin, (req, res) => {
  const cart = req.session.cart || [];
  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const name = req.session.user?.fullName || 'Guest';
  req.session.cart = [];
  res.render('payment', {
    title: 'Payment — SJC Canteen',
    cart: [],
    total: 0,
    cartCount: 0,
    user: req.session.user,
    orderConfirmed: `Order placed successfully! Thank you, ${name}.`,
    orderTotal: total,
  });
});

// 404
app.use((req, res) => {
  res.status(404).render('login', { title: 'SJC Canteen', error: 'Page not found.', success: null });
});

app.listen(PORT, () => {
  console.log(`\n  SJC Canteen running at http://localhost:${PORT}\n`);
});
