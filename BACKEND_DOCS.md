# Multicart Backend Documentation

## Overview
Multicart is a multi-vendor e-commerce platform built with Next.js (App Router), MongoDB (Mongoose), and NextAuth.js for authentication.

---

## Authentication (JWT via NextAuth.js)

### Files
- `src/auth.ts` - NextAuth configuration with JWT strategy
- `/api/auth/[...nextauth]/route.ts` - Auth handler (GET/POST)
- `/api/auth/register/route.ts` - User signup API

### JWT Flow
1. User logs in via credentials (email/password)
2. `Credentials` provider validates credentials against MongoDB
3. On success, JWT token is created with user data (id, email, name, role)
4. Token stored in browser cookie
5. Every protected API call includes this JWT via cookie
6. `auth()` function extracts user from JWT for protected routes

### JWT Token Structure
```javascript
{
  id: "user_id",
  name: "John",
  email: "john@example.com",
  role: "user" | "vendor" | "admin"
}
```

---

## Database Connection

### File: `src/lib/db.ts`
- Uses Mongoose for MongoDB connection
- Connection URL from `MONGODB_URL` env variable
- Implements connection caching for performance

---

## MongoDB Data Models

### 1. User Model (`src/models/user.model.ts`)
```javascript
{
  name: string,
  email: string,
  password: string (hashed),
  role: "user" | "vendor" | "admin",
  phone: string,
  image: string,
  
  // Vendor-specific fields
  shopName: string,
  businessAddress: string,
  gstNumber: string,
  verificationStatus: "pending" | "approved" | "rejected",
  vendorProducts: [ObjectId],
  
  // User-specific fields
  cart: [{ product: ObjectId, quantity: number }],
  orders: [ObjectId]
}
```

### 2. Product Model (`src/models/product.model.ts`)
```javascript
{
  title: string,
  description: string,
  price: number,
  stock: number,
  isStockAvailable: boolean,
  
  image1: string (Cloudinary URL),
  image2: string,
  image3: string,
  image4: string,
  
  category: string,
  vendor: ObjectId (ref: User),
  
  // Wearable product fields
  isWearable: boolean,
  sizes: string[],
  
  // Product policies
  replacementDays: number,
  freeDelivery: boolean,
  warranty: string,
  payOnDelivery: boolean,
  
  // Product highlights
  detailsPoints: string[],
  
  // Admin verification
  verificationStatus: "pending" | "approved" | "rejected",
  isActive: boolean,
  
  // Reviews
  reviews: [{
    user: ObjectId,
    rating: number,
    comment: string,
    image: string
  }]
}
```

### 3. Order Model (`src/models/order.model.ts`)
```javascript
{
  buyer: ObjectId (ref: User),
  products: [{
    product: ObjectId,
    quantity: number,
    price: number
  }],
  productVendor: [ObjectId],
  
  productsTotal: number,
  deliveryCharge: number,
  serviceCharge: number,
  totalAmount: number,
  
  paymentMethod: "cod" | "online",
  isPaid: boolean,
  orderStatus: "pending" | "confirmed" | "shipped" | "out_for_delivery" | "delivered" | "cancelled" | "returned",
  returnedAmount: number,
  
  address: {
    name: string,
    phone: string,
    address: string,
    city: string,
    pincode: string
  },
  
  deliveryOTP: number,
  deliveredAt: Date
}
```

---

## API Routes

### Authentication Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth handler |
| `/api/auth/register` | POST | User signup |

**Register Request:**
```json
{
  "name": "John",
  "email": "john@example.com",
  "password": "123456",
  "isAdmin": false
}
```

---

### User Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/currentUser` | GET | Get current user with cart |
| `/api/user/edit-role-mobile` | POST | Update user role/phone |
| `/api/user/edit-user-profile` | POST | Update user profile |

---

### Cart Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/cart/add` | POST | Add product to cart |
| `/api/cart/get` | GET | Get user's cart |
| `/api/cart/update` | POST | Update cart item quantity |
| `/api/cart/remove` | POST | Remove item from cart |

**Add to Cart Request:**
```json
{
  "productId": "product_object_id",
  "quantity": 1
}
```

---

### Product Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/product/all-products-data` | GET | Get all approved products |
| `/api/product/add-review` | POST | Add product review |

---

### Order Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/order/create-cod` | POST | Create COD order |
| `/api/order/online-pay` | POST | Create online payment order |
| `/api/order/stripe/webhook` | POST | Stripe webhook handler |
| `/api/order/allOrder` | GET | Get all orders |
| `/api/order/update-status` | POST | Update order status |
| `/api/order/cancel` | POST | Cancel order |
| `/api/order/return` | POST | Return order |
| `/api/order/verify-delivery-otp` | POST | Verify delivery OTP |

**Create COD Order Request:**
```json
{
  "items": [
    { "productId": "product_object_id", "quantity": 2 }
  ],
  "address": {
    "name": "John",
    "phone": "1234567890",
    "address": "123 Main St",
    "city": "Mumbai",
    "pincode": "400001"
  },
  "deliveryCharge": 50,
  "serviceCharge": 10
}
```

---

### Vendor Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/vendor/add-product` | POST | Add new product |
| `/api/vendor/update-product` | POST | Update product |
| `/api/vendor/update-details` | POST | Update vendor shop details |
| `/api/vendor/all-vendor` | GET | Get all vendors |
| `/api/vendor/active-product` | POST | Activate/deactivate product |
| `/api/vendor/verify-again` | POST | Re-submit for verification |

**Add Product Request (FormData):**
```
title: string
description: string
price: number
stock: number
category: string
image1: Blob
image2: Blob
image3: Blob
image4: Blob
isWearable: boolean
sizes: string[]
replacementDays: number
freeDelivery: boolean
warranty: string
payOnDelivery: boolean
detailsPoints: string[]
```

---

### Admin Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/admin/check-admin` | GET | Check if admin exists |
| `/api/admin/update-product-status` | POST | Approve/reject product |
| `/api/admin/update-vendor-status` | POST | Approve/reject vendor |

---

### Other Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/search` | GET | Search products |
| `/api/chat/send` | POST | Send chat message |
| `/api/chat/get` | GET | Get chat messages |

---

## API Call Flow

### User Registration
1. POST to `/api/auth/register`
2. Server hashes password with bcrypt
3. Server creates user in MongoDB
4. Returns user object

### User Login
1. POST to `/api/auth/[...nextauth]` (via NextAuth)
2. Server validates credentials
3. Server creates JWT token
4. Browser stores JWT in cookie

### Add to Cart
1. POST to `/api/cart/add` with JWT cookie
2. Server verifies JWT via `auth()`
3. Server finds user by email from JWT
4. Server adds product to user's cart array
5. Server saves user to MongoDB

### Place COD Order
1. POST to `/api/order/create-cod` with JWT cookie
2. Server verifies JWT
3. Server validates all products
4. Server checks stock availability
5. Server creates order in MongoDB
6. Server decrements product stock
7. Server clears user's cart

### Vendor Add Product
1. POST to `/api/vendor/add-product` with FormData + JWT
2. Server verifies JWT
3. Server uploads images to Cloudinary
4. Server creates product with `verificationStatus: "pending"`
5. Server links product to vendor
6. Admin must approve product before it shows to users

---

## State Management

### Redux Store (`src/redux/`)
- `store.ts` - Redux store configuration
- `userSlice.ts` - User state
- `vendorSlice.ts` - Vendor state
- `orderSlice.ts` - Order state

**Note:** Redux appears redundant since:
- Next.js App Router handles server state
- API routes handle backend logic
- Could simplify with React Context

---

## Supporting Libraries

| File | Purpose |
|------|---------|
| `src/lib/db.ts` | MongoDB connection |
| `src/lib/mailer.ts` | Email sending |
| `src/lib/cloudinary.ts` | Image uploads to Cloudinary |
| `src/lib/utils.ts` | Utility functions |

---

## User & Vendor Panel Summary

### User Panel Features
- Login/Register
- Browse products
- Add to cart
- Place COD order
- View orders
- Track order status
- Add product reviews

### Vendor Panel Features
- Complete vendor profile
- Add products (pending approval)
- Update products
- View orders for their products
- Update order status
- Re-submit for verification

### Backend Flow
1. User/Vendor logs in → JWT token
2. All API calls include JWT cookie
3. `auth()` extracts user from JWT
4. Protected routes verify user.role
5. Data stored in MongoDB collections
