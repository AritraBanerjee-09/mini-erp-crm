# Nexus Mini ERP + CRM Operations Portal

[![Open Source CI/CD Pipeline](https://github.com/AritraBanerjee-09/mini-erp-crm/actions/workflows/deploy.yml/badge.svg)](https://github.com/AritraBanerjee-09/mini-erp-crm/actions)
[![Deploy to Render](https://render.com/images/deploy-to-render.svg)](https://render.com/deploy?repo=https://github.com/AritraBanerjee-09/mini-erp-crm)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/AritraBanerjee-09/mini-erp-crm&root-directory=frontend)

A full-stack, production-ready **Mini ERP & CRM Portal** built for wholesale and distribution enterprises. This application manages customer relationships, catalog stock inventory, stock movement auditing, automated sales challans, invoice generation, and tax PDF receipt exports with strict role-based access control (RBAC).

**GitHub Repository**: [https://github.com/AritraBanerjee-09/mini-erp-crm](https://github.com/AritraBanerjee-09/mini-erp-crm)

---

## 🔑 Demo Role Profiles (Pre-seeded Accounts)

All demo accounts share the default password: `Password123`

| Role | Email | Permissions & Focus |
| :--- | :--- | :--- |
| **Admin** | `admin@minierp.com` | Full unrestricted access to all modules and configurations |
| **Sales** | `sales@minierp.com` | Customer CRM, Follow-up notes, Create & Manage Sales Challans |
| **Warehouse** | `warehouse@minierp.com` | Product stock levels, Low stock warnings, Manual Stock IN/OUT Logs |
| **Accounts** | `accounts@minierp.com` | Confirmed Sales Challans review, Invoice Generation, PDF Exports |

---

## 🛠️ Required Tech Stack

- **Backend**: Node.js (v18+), TypeScript, Express.js REST APIs, Prisma ORM, JWT Authentication, Zod validation, PDFKit.
- **Frontend**: React 18, TypeScript, Vite, Glassmorphism UI tokens, Responsive dark aesthetics, Lucide React icons.
- **Database**: SQLite (Zero-config local setup) & PostgreSQL ready (Render Postgres / Neon / Supabase).
- **Deployment / DevOps**: Render Blueprint, Vercel Config, GitHub Actions CI/CD Pipeline, Docker Compose.

---

## 📑 1. How the Server Was Set Up

The backend server is architected as a modular TypeScript Express application:
- **Express App Core** (`backend/src/server.ts`): Registers CORS middleware, JSON body parsing, global error handlers, health check endpoint (`/api/health`), and modular feature routers.
- **Prisma Client Initialization** (`backend/src/db.ts`): Provides a singleton database connection managing connections cleanly across requests.
- **Authentication & RBAC Middleware** (`backend/src/middleware/auth.ts`): Verifies JWT bearer tokens and enforces role restrictions per endpoint (e.g. only `WAREHOUSE` and `ADMIN` can adjust stock; only `ACCOUNTS` and `ADMIN` can generate invoices).
- **REST Endpoints**:
  - `POST /api/auth/login`, `GET /api/auth/me`
  - `GET /api/customers`, `POST /api/customers`, `GET /api/customers/:id`, `PUT /api/customers/:id`, `POST /api/customers/:id/followups`
  - `GET /api/products`, `POST /api/products`, `GET /api/products/:id`, `PUT /api/products/:id`, `POST /api/products/stock-movement`, `GET /api/products/:id/stock-logs`
  - `GET /api/challans`, `POST /api/challans`, `GET /api/challans/:id`, `PUT /api/challans/:id/status`
  - `GET /api/invoices`, `POST /api/invoices/generate/:challanId`, `GET /api/invoices/:id/pdf`
  - `GET /api/dashboard/stats`

---

## 🔑 2. How Environment Variables Are Managed

Environment variables are isolated cleanly between local development and production deployments:

- **Local Development**: Managed via `.env` file in `backend/` (ignored by Git for security):
  ```env
  PORT=5000
  DATABASE_URL="file:./dev.db"
  JWT_SECRET="mini_erp_crm_super_secret_jwt_key_2026"
  NODE_ENV="development"
  ```
- **Template Reference**: Provided in `backend/.env.example` as a reference for new environments.
- **Production Deployment**: Managed via cloud platform secret dashboards (Render / Vercel):
  - `DATABASE_URL`: Connection string pointing to PostgreSQL database (e.g., Supabase/Neon/Render Postgres).
  - `JWT_SECRET`: Random secure string used to sign JWT tokens.
  - `PORT`: Set automatically by hosting environment (defaults to `5000`).

---

## 💻 3. How to Run the Project Locally

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Step-by-step Local Launch

#### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Push database schema & seed initial demo data
npx prisma db push
npx prisma db seed

# Build & launch dev server
npm run dev
```
Backend API will run at `http://localhost:5000`.

#### 2. Frontend Setup
In a new terminal:
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite React dev server
npm run dev
```
Frontend Web Portal will launch at `http://localhost:3000`.

---

## ☁️ 4. How to Deploy the Project

### Option A: 1-Click Free Deployment (Render + Vercel)

1. **Deploy Backend & Database on Render**:
   - Click the 1-Click Deploy button: [![Deploy to Render](https://render.com/images/deploy-to-render.svg)](https://render.com/deploy?repo=https://github.com/AritraBanerjee-09/mini-erp-crm)
   - Render automatically reads [`render.yaml`](https://github.com/AritraBanerjee-09/mini-erp-crm/blob/main/render.yaml), provisions a **Render PostgreSQL Database**, runs Prisma database migrations/seeds, and launches the Express Web Service.

2. **Deploy Frontend on Vercel**:
   - Click the 1-Click Deploy button: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/AritraBanerjee-09/mini-erp-crm&root-directory=frontend)
   - Connect your GitHub account and click **Deploy**. Vercel will build and host the Vite React application.

### Option B: Docker Containerized Deployment

Run the complete stack via Docker Compose:
```bash
docker-compose up --build
```
- Frontend will be served at `http://localhost:3000`.
- Backend API will be served at `http://localhost:5000`.

---

## 💡 5. Any Assumptions Made

1. **Zero Negative Stock Policy**: Stock quantity cannot drop below zero under any condition. Stock validation is performed server-side before confirming any sales challan.
2. **Product Snapshots**: Historical sales challans preserve exact product snapshots (`name`, `sku`, `unitPrice`) at the time of creation in `productSnapshotJson`. Subsequent price edits to catalog items will not alter historical challans or invoices.
3. **Automatic Reversion**: Cancelling a confirmed sales challan automatically credits back stock to the warehouse and logs an `IN` stock movement entry in the audit trail.
4. **Credit Period**: Invoices generated from confirmed challans default to a 30-day payment due window.

---

## 📬 6. Postman Collection

The API test collection is available in the repository at:
[`postman/Mini_ERP_CRM.postman_collection.json`](https://github.com/AritraBanerjee-09/mini-erp-crm/blob/main/postman/Mini_ERP_CRM.postman_collection.json)

### Importing to Postman:
1. Open Postman → Click **Import**.
2. Select `postman/Mini_ERP_CRM.postman_collection.json`.
3. Set collection environment variable `baseUrl` to `http://localhost:5000/api`.
4. Run `Login (Admin)` to obtain JWT token, which auto-fills the `authToken` variable for testing all CRM, Inventory, Challan, and Invoice endpoints.

---

## 📜 License
This project is licensed under the [MIT License](LICENSE).
