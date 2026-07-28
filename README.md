# Nexus Mini ERP + CRM Operations Portal

[![Open Source CI/CD Pipeline](https://github.com/AritraBanerjee-09/mini-erp-crm/actions/workflows/deploy.yml/badge.svg)](https://github.com/AritraBanerjee-09/mini-erp-crm/actions)
[![Deploy to Render](https://render.com/images/deploy-to-render.svg)](https://render.com/deploy?repo=https://github.com/AritraBanerjee-09/mini-erp-crm)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/AritraBanerjee-09/mini-erp-crm&root-directory=frontend)

A full-stack, production-ready **Mini ERP & CRM Portal** built for wholesale and distribution enterprises. This application manages customer relationships, catalog stock inventory, stock movement auditing, automated sales challans, invoice generation, and tax PDF receipt exports with strict role-based access control (RBAC).

**GitHub Repository**: [https://github.com/AritraBanerjee-09/mini-erp-crm](https://github.com/AritraBanerjee-09/mini-erp-crm)

---

## 🚀 Demo Role Profiles (Pre-seeded Demo Accounts)

All accounts share the default password: `Password123`

| Role | Email | Permissions & Focus |
| :--- | :--- | :--- |
| **Admin** | `admin@minierp.com` | Full unrestricted access to all modules and configurations |
| **Sales** | `sales@minierp.com` | Customer CRM, Follow-up notes, Create & Manage Sales Challans |
| **Warehouse** | `warehouse@minierp.com` | Product stock levels, Low stock warnings, Manual Stock IN/OUT Logs |
| **Accounts** | `accounts@minierp.com` | Confirmed Sales Challans review, Invoice Generation, PDF Exports |

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js (v18+) with TypeScript
- **Framework**: Express.js REST APIs
- **ORM & Database**: Prisma ORM with SQLite (zero-config local) & PostgreSQL ready
- **Authentication**: JWT (JSON Web Tokens) with role middleware
- **Validation**: Zod schema validation
- **PDF Generation**: PDFKit stream generator

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Glassmorphism CSS Design Tokens, Responsive layout & dark modern aesthetics
- **Icons**: Lucide React

---

## 📋 Core Modules & Key Features

### 1. Authentication & Role-Based Access Control (RBAC)
- JWT token authentication with 24-hour expiration.
- Pre-configured demo login cards for 1-click role switching on the frontend.
- Granular API route protection by role (`ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`).

### 2. Customer CRM Module
- Complete customer profiles: Customer Name, Business Name, Mobile, Email, GST Number, Customer Type (*Retail, Wholesale, Distributor*), Address, Status (*Lead, Active, Inactive*), Follow-up Date, and Notes.
- Search across name, business name, mobile, email, and GST numbers.
- Filter by status and customer type.
- Interactive CRM Timeline: Add follow-up notes with auto-updating next follow-up dates.

### 3. Product & Inventory Control Module
- Product attributes: Name, SKU code, Category, Unit Price, Current Stock, Minimum Stock Alert Limit, Warehouse Location.
- Visual warning badges for products below minimum stock thresholds.
- Stock Movement Logs: Tracks every stock change with quantity changed, movement type (`IN` / `OUT`), reason, created by user, and timestamp.
- Manual Stock Adjustment modal for receiving restock shipments or logging loss.

### 4. Sales Challan Module
- Select customer and pick multiple products with real-time stock availability feedback.
- Auto-generated unique Challan Numbers (e.g. `CH-202607-0001`).
- Save as `Draft` or `Confirmed`.
- **Strict Business Logic & Stock Guard**:
  - Confirmed status atomically reduces product stock and writes `StockLog` entries (`movementType: OUT`).
  - Prevents negative stock levels. If stock is insufficient, returns explicit `400 Bad Request` with item details.
  - Snapshot storage: Stores exact product details (name, SKU, unit price) in `productSnapshotJson` at the time of creation to protect against historical price mutations.
  - Status transition: Draft → Confirmed (deducts stock) or Confirmed → Cancelled (restores stock).

### 5. Invoices & PDF Export (Bonus Feature)
- Generate official tax invoices directly from confirmed sales challans.
- Auto-calculated 30-day payment credit window.
- Downloadable & printable PDF tax receipts generated on-the-fly via `/api/invoices/:id/pdf`.

---

## 💻 Local Setup & Execution Guide

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Step 1: Clone & Prepare Project
```bash
git clone <repository-url>
cd mini-erp-crm
```

### Step 2: Set Up Backend
```bash
cd backend

# 1. Install dependencies
npm install

# 2. Configure Environment Variables
# Copy .env.example to .env
# (Default uses SQLite dev.db for zero setup required)

# 3. Initialize Prisma Database & Seed Sample Data
npx prisma db push
npx prisma db seed

# 4. Start Backend Server
npm run dev
# Server will run at http://localhost:5000
```

### Step 3: Set Up Frontend
Open a new terminal window:
```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start Frontend Dev Server
npm run dev
# App will launch at http://localhost:3000
```

---

## 🐳 Docker Deployment Instructions (Bonus Feature)

To run the full stack (Backend + Frontend) via Docker:

```bash
# Build and run containerized services
docker-compose up --build
```
- Frontend available at: `http://localhost:3000`
- Backend API available at: `http://localhost:5000`

---

## ☁️ Deployment Guide (Free Hosting Platforms)

### 1. Backend Deployment (Render / Railway / Fly.io)
1. Push code to GitHub repository.
2. Create a Web Service on **Render** (or Railway).
3. Connect your repository and select root directory as `backend`.
4. Set build command: `npm install && npx prisma db push && npx prisma db seed && npm run build`
5. Set start command: `npm start`
6. Add Environment Variables:
   - `PORT`: `5000`
   - `DATABASE_URL`: `postgresql://user:password@ep-xyz.postgres.database.azure.com/minierp` (from Supabase/Neon)
   - `JWT_SECRET`: `your_random_secret_key`

### 2. Frontend Deployment (Vercel / Netlify)
1. Create a project on **Vercel**.
2. Connect your repository and set root directory to `frontend`.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Set `VITE_API_URL` environment variable pointing to your deployed backend URL.

---

## 📂 Project Structure

```
mini-erp-crm/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Prisma Database Schema
│   │   └── seed.ts              # Initial Database Seed Script
│   ├── src/
│   │   ├── middleware/          # Auth & Role verification middleware
│   │   ├── routes/              # Express API Routes (Auth, Customers, Products, Challans, Invoices, Dashboard)
│   │   ├── db.ts                # Prisma Client Instance
│   │   └── server.ts            # Main Express Server
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/                 # Fetch API wrapper
│   │   ├── components/          # Navbar, Sidebar, Modal components
│   │   ├── context/             # Auth Context & State Provider
│   │   ├── pages/               # Login, Dashboard, Customers, Products, Challans, Invoices
│   │   ├── types/               # TypeScript Interfaces
│   │   ├── App.tsx              # Main App layout & routing
│   │   └── index.css            # Glassmorphism Design Tokens
│   ├── Dockerfile
│   └── package.json
├── postman/
│   └── Mini_ERP_CRM.postman_collection.json # API Test Collection
├── docker-compose.yml
└── README.md
```

---

## 💡 Key Business Assumptions
1. **Zero Negative Stock**: Stock cannot drop below zero. Stock validation is performed before any challan is confirmed.
2. **Product Snapshots**: Historical sales records (challans) store snapshots of product prices and names at the time of order creation, ensuring that subsequent price edits do not alter historical records.
3. **Automatic Reversion**: Cancelling a confirmed sales challan automatically credits back stock to the warehouse and logs an `IN` stock movement entry.
