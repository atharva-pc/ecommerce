# ArtCommerce - Physical Art Marketplace

A modern e-commerce platform for selling original physical artworks (paintings, drawings, sketches) built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## 🎨 Features

### Customer Features
- **Browse Artworks** - Explore original art pieces by category
- **Limited Edition Section** - Discover exclusive limited edition artworks
- **Product Details** - View detailed artwork information with artist profiles
- **Shopping Cart** - Add items to cart with real-time updates
- **Secure Checkout** - Razorpay payment integration
- **Shipping Calculation** - Real-time shipping cost via Shiprocket API
- **Order Tracking** - Track your order status
- **Favorites** - Like and save artworks
- **Commission Requests** - Request custom artwork from artists

### Vendor/Artist Features
- **Vendor Dashboard** - Manage products, orders, and commissions
- **Product Upload** - Upload artwork with preview images
- **Limited Edition** - Mark artworks as limited edition
- **Commission Management** - Accept/decline custom commission requests
- **Order Management** - View and manage sales
- **Analytics** - Track earnings and sales (70% commission)

### Admin Features
- **Admin Dashboard** - Manage entire platform
- **Vendor Approval** - Review and approve vendor applications
- **Order Management** - View all orders and create shipments
- **Commission Oversight** - Monitor all commission requests
- **Product Management** - Edit/delete any product
- **User Management** - View all users
- **Demo Mode** - Toggle demo mode for testing

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (Google OAuth)
- **Storage:** Supabase Storage
- **Payment:** Razorpay
- **Shipping:** Shiprocket API
- **UI Components:** Custom components with Radix UI primitives

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Razorpay account (for payments)
- Shiprocket account (for shipping)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/artcommerce.git
cd artcommerce
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Shiprocket
SHIPROCKET_EMAIL=your_shiprocket_email
SHIPROCKET_PASSWORD=your_shiprocket_password
```

4. **Set up Supabase Database**

Run the SQL files in your Supabase SQL Editor in this order:

- `working.sql` - Creates core tables and RLS policies
- `ADD_LIMITED_EDITION_COLUMN.sql` - Adds limited edition support
- `FIX_ARTIST_PROFILE_ACCESS.sql` - Enables public vendor profile viewing
- `FIX_COMMISSIONS_RLS.sql` - Sets up commission permissions

5. **Configure Supabase Storage**

Create two storage buckets in Supabase:
- `product-previews` (public) - For product images
- `product-files` (private) - For digital files (if needed)

6. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📂 Project Structure

```
artcommerce/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes
│   ├── cart/              # Shopping cart
│   ├── checkout/          # Checkout page
│   ├── products/          # Product listing & details
│   ├── profile/           # User profile
│   └── vendor/            # Vendor dashboard
├── components/            # React components
├── lib/                   # Utilities and contexts
├── utils/                 # Helper functions
├── types/                 # TypeScript types
└── public/               # Static assets
```

## 🔑 Key Features Explained

### Limited Edition Artworks
- Vendors can mark artworks as limited edition during upload
- Homepage carousel displays only limited edition pieces
- Commission requests disabled for limited editions
- Special badge displayed on product cards

### Commission System
- Customers can request custom artwork
- Artists review and set quoted prices
- Payment upon acceptance
- Track status in profile

### Shipping Integration
- Real-time shipping cost calculation via Shiprocket
- Automatic shipment creation
- Order tracking
- Domestic shipping only (7-10 days)

### Payment Processing
- Secure Razorpay integration
- Demo mode for testing
- Order confirmation emails
- Commission payments

## 👥 User Roles

### Customer
- Default role on signup
- Can browse, purchase, and request commissions

### Vendor
- Apply through vendor signup form
- Requires admin approval
- Can upload and sell artworks
- Receives 70% of sale price

### Admin
- Manually set in database
- Full platform access
- Vendor approval authority
- Order and commission management

## 🎨 Categories

- Painting
- Drawing
- Sketch
- Digital Art

## 🔐 Security

- Row Level Security (RLS) on all tables
- Secure authentication with Supabase
- Protected API routes
- Environment variables for sensitive data

## 📱 Flutter Compatible

The backend is designed as an API-first architecture with:
- RESTful API endpoints
- Clean separation of frontend/backend
- Ready for Flutter app integration

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables on Vercel

Add all variables from `.env.local` to Vercel project settings.

## 📄 License

This project is private and proprietary.

## 👨‍💻 Author

Created for the Best Website Making Competition

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Supabase for backend infrastructure
- Razorpay for payment processing
- Shiprocket for shipping integration
