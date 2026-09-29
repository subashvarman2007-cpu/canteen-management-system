# SJC Canteen — St. Joseph's College, Trichy

A full-stack canteen ordering web app built with Express.js, EJS templates, and PostgreSQL (Supabase).

## Features

- **Login & Registration** — Username/password auth with bcrypt hashing, session-based
- **Home Page** — Hero section, featured menu preview, canteen info
- **Menu Page** — 10 food items (Idli, Dosa, Sambar Rice, Chapati, Noodles, Parotta, Tea, Coffee, Juice, Curd Rice) in a card grid with "Add to Cart"
- **Cart Page** — Itemized list with +/− quantity buttons, subtotals, remove, and total
- **Payment Page** — Order summary with two payment options (Online mock UPI/card form + Cash payment), order confirmation with success message
- **Session cart** — Cart persists in the session across page navigation
- **Welcome popup** — Modal greeting on successful login

## Tech Stack

- **Backend:** Express.js (Node.js)
- **Database:** PostgreSQL via Supabase
- **Templating:** EJS
- **Auth:** express-session + bcryptjs
- **Styling:** Custom CSS (warm orange/yellow canteen theme, responsive)

## Quick Start

```bash
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

## Database

The app uses a Supabase (PostgreSQL) database. The `sjc_users` table stores registered accounts:

```sql
CREATE TABLE sjc_users (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name     TEXT NOT NULL,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

The table is pre-created via Supabase migration. Row-level security is enabled with anon-accessible SELECT and INSERT policies (the app uses its own session auth, not Supabase Auth).

See `db.sql` for the full schema.

## File Structure

```
sjc-canteen/
├── public/
│   └── css/style.css       # Warm canteen theme
├── views/
│   ├── login.ejs           # Login + Registration page
│   ├── home.ejs            # Home page with hero + featured items
│   ├── menu.ejs            # Food menu grid
│   ├── cart.ejs            # Cart with quantity controls
│   └── payment.ejs         # Order summary + payment options
├── .env                    # Supabase credentials + session secret
├── db.sql                   # SQL schema
├── db.js                    # Supabase client setup
├── app.js                   # Express app with all routes
└── package.json
```

## Routes

| Method | Path                  | Description                        |
|--------|-----------------------|------------------------------------|
| GET    | `/`                   | Login & registration page         |
| POST   | `/login`              | Process login                      |
| POST   | `/register`           | Process registration               |
| POST   | `/logout`             | Logout                             |
| GET    | `/home`               | Home page (protected)              |
| GET    | `/menu`               | Menu page (protected)              |
| POST   | `/cart/add`           | Add item to cart                   |
| GET    | `/cart`               | View cart (protected)              |
| POST   | `/cart/update`        | Update item quantity               |
| POST   | `/cart/remove`        | Remove item from cart              |
| GET    | `/payment`           | Payment / order summary (protected)|
| POST   | `/payment/confirm`   | Confirm order, clear cart          |

## Food Menu

Food items are defined as a JavaScript array in `app.js` (no separate database table). Each item has an id, name, price (in ₹), emoji image, and description.

## Security

- Passwords hashed with bcryptjs (10 rounds)
- Session-based authentication with httpOnly cookies
- Protected routes redirect to login if unauthenticated
- SQL injection prevented via Supabase parameterized queries
