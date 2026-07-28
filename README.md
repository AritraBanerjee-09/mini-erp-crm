# Nexus Mini ERP + CRM Operations Portal

A full-stack, enterprise-grade **Mini ERP & CRM Operations Portal** designed for wholesale and distribution businesses. This application manages customer relationships, catalog stock inventory, stock movement auditing, automated sales challans, tax invoice generation, and PDF receipt exports with strict role-based access control (RBAC).

---

## 👤 Author & Developer

**Created and Developed by**: **Aritra Banerjee**  
- **GitHub Profile**: [https://github.com/AritraBanerjee-09](https://github.com/AritraBanerjee-09)  
- **GitHub Repository**: [https://github.com/AritraBanerjee-09/mini-erp-crm](https://github.com/AritraBanerjee-09/mini-erp-crm)

---

## 📸 User Interface Showcase & Screenshots

### 1. Operations Overview Dashboard
![Operations Overview Dashboard](assets/dashboard.png)
* **Explanation**: The real-time operational dashboard provides executive KPI metric cards for Total Customers, Catalog Products, Low Stock Alerts, Confirmed Sales Revenue, and Pending Receivables. It features a **Low Stock Alert Monitor** highlighting critical inventory items below threshold limits and an **Upcoming Lead Follow-ups** widget displaying scheduled CRM follow-up dates.

---

### 2. Customer CRM Management
![Customer CRM Management](assets/crm.png)
* **Explanation**: The CRM module manages customer profiles across status types (**Lead**, **Active**, **Inactive**) and business categories (**Retail**, **Wholesale**, **Distributor**). It includes real-time multi-field search (Name, Business, Mobile, Email, GST Number), next follow-up scheduling, and interactive detail drawers for logging staff follow-up notes.

---

### 3. Product & Inventory Control
![Product & Inventory Control](assets/products.png)
* **Explanation**: The central inventory catalog displays product details, SKU codes, categories, unit prices (INR), warehouse locations, and current stock levels. Items below threshold limits trigger prominent **Low Stock Warning Badges** (`LOW STOCK (MIN: 5)`). Warehouse managers can adjust inventory via the **± Stock** button or inspect audit history via the **Logs** button.

---

### 4. Sales Challans & Dispatch
![Sales Challans & Dispatch](assets/challans.png)
* **Explanation**: The Sales Challan manager tracks auto-generated sequential order numbers (e.g., `CH-202607-0001`), customer profiles, item counts, total amounts, and status badges (**Draft**, **Confirmed**, **Cancelled**). Confirming a challan automatically verifies stock availability, deducts inventory, and records `OUT` stock movement logs.

---

### 5. Invoices & Billing
![Invoices & Billing](assets/invoices.png)
* **Explanation**: The Invoices module generates official tax billing receipts from confirmed sales challans with an auto-calculated 30-day payment credit window. Users can view invoice details or export vector **PDF tax receipts** directly via the **PDF** download button.

---

## 🔑 Demo Role Profiles (Pre-seeded Accounts)

All accounts share the default password: `Password123`

| Role | Email | Permissions & Focus |
| :--- | :--- | :--- |
| **Admin** | `admin@minierp.com` | Full unrestricted access across all system modules |
| **Sales** | `sales@minierp.com` | Customer CRM, Follow-up notes, Create & Manage Sales Challans |
| **Warehouse** | `warehouse@minierp.com` | Product stock levels, Low stock alerts, Manual Stock IN/OUT Logs |
| **Accounts** | `accounts@minierp.com` | Confirmed Sales Challans review, Invoice Generation, PDF Exports |

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js REST APIs
- **ORM & Database**: Prisma ORM with PostgreSQL / SQLite support
- **Authentication**: JWT (JSON Web Tokens) with role middleware
- **Validation**: Zod schema validation
- **PDF Generation**: PDFKit document stream generator

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Glassmorphism CSS Design Tokens, Responsive layout & dark modern aesthetics
- **Icons**: Lucide React

---

## 📋 Core Modules & System Features

### 1. Authentication & User Registration
- JWT token authentication with 24-hour expiration.
- User Registration (`POST /api/auth/register`): Allows new users to create an account and select an assigned role.
- 1-Click Role Quick Login shortcuts on the login screen for testing permissions.

### 2. Customer CRM Module
- Comprehensive Customer Profiles: Customer Name, Business Name, Mobile, Email, GST Number, Customer Type (*Retail, Wholesale, Distributor*), Address, Status (*Lead, Active, Inactive*), Follow-up Date, and Notes.
- Multi-field Search (Name, Business Name, Mobile, Email, GST) & Filter by Status/Type.
- Interactive CRM Timeline: Add follow-up notes with auto-updating next follow-up dates.

### 3. Product & Inventory Control Module
- Product Attributes: Name, SKU Code, Category, Unit Price, Current Stock, Minimum Stock Alert Limit, Warehouse Location.
- Low Stock Warning Monitor: Highlights items below threshold limits.
- Stock Movement Logs: Tracks every inventory change with quantity changed, movement type (`IN` / `OUT`), reason, created by user, and timestamp.
- Manual Stock Adjustment modal for receiving restock shipments or logging loss.

### 4. Sales Challan Module
- Customer selection with multi-product picker and real-time stock availability feedback.
- Auto-generated unique Challan Numbers (e.g. `CH-202607-0001`).
- Save as `Draft` or `Confirmed`.
- **Stock Guard Logic**: Confirmed status automatically reduces stock and logs `OUT` stock movements. Prevents negative stock levels with explicit `400 Bad Request` validation.
- **Product Snapshot Data**: Stores historical product snapshots (`name`, `sku`, `unitPrice`) at creation time to protect against future price modifications.
- Status transition: Draft → Confirmed (deducts stock) or Confirmed → Cancelled (restores stock).

### 5. Invoices & PDF Export
- Generate official tax invoices directly from confirmed sales challans.
- Auto-calculated 30-day payment credit window.
- Downloadable & printable PDF tax receipts generated via `/api/invoices/:id/pdf`.

---

## ⚙️ Server Architecture & API Overview

The backend server is structured with modular TypeScript routers:

| Method | Endpoint | Description | Allowed Roles |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user account | Public |
| `POST` | `/api/auth/login` | Authenticate user & get JWT token | Public |
| `GET` | `/api/auth/me` | Fetch current user profile | Authenticated |
| `GET` | `/api/customers` | Search & list CRM customers | Authenticated |
| `POST` | `/api/customers` | Add new customer profile | Admin, Sales |
| `POST` | `/api/customers/:id/followups` | Add follow-up note to customer | Admin, Sales |
| `GET` | `/api/products` | List inventory & low stock items | Authenticated |
| `POST` | `/api/products` | Create catalog product | Admin, Warehouse |
| `POST` | `/api/products/stock-movement` | Record manual stock adjustment | Admin, Warehouse |
| `GET` | `/api/products/:id/stock-logs` | Fetch stock audit logs for item | Authenticated |
| `GET` | `/api/challans` | List sales challans | Authenticated |
| `POST` | `/api/challans` | Create sales challan | Admin, Sales |
| `PUT` | `/api/challans/:id/status` | Update challan status (Confirm/Cancel) | Admin, Sales, Warehouse |
| `GET` | `/api/invoices` | List tax invoices | Authenticated |
| `POST` | `/api/invoices/generate/:challanId` | Generate tax invoice | Admin, Accounts |
| `GET` | `/api/invoices/:id/pdf` | Stream downloadable PDF tax receipt | Authenticated |
| `GET` | `/api/dashboard/stats` | Operational summary statistics | Authenticated |

---

## 🔑 Environment Variable Management

- **Backend Configuration** (`backend/.env`):
  ```env
  PORT=5000
  DATABASE_URL="postgresql://user:password@localhost:5432/minierp?schema=public"
  JWT_SECRET="your_jwt_secret_key_2026"
  NODE_ENV="development"
  ```
- **Template Reference**: Provided in `backend/.env.example`.

---

## 💻 How to Run the Project Locally

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Step 1: Backend Setup
```bash
cd backend

# 1. Install dependencies
npm install

# 2. Push database schema & seed initial data
npx prisma db push
npx prisma db seed

# 3. Start development server
npm run dev
```
Backend API will run at `http://localhost:5000`.

### Step 2: Frontend Setup
In a new terminal:
```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev
```
Frontend Web Portal will run at `http://localhost:3000`.

---

## 📬 Postman Collection Guide

The complete API collection is located at:
[`postman/Mini_ERP_CRM.postman_collection.json`](postman/Mini_ERP_CRM.postman_collection.json)

### How to Use in Postman:
1. Open Postman → Click **Import**.
2. Select `postman/Mini_ERP_CRM.postman_collection.json`.
3. Set collection variable `baseUrl` to `http://localhost:5000/api`.
4. Execute `Login (Admin)` to obtain JWT token, which populates `authToken` for testing all API endpoints.

---

## 💡 Key Business Assumptions
1. **Zero Negative Stock Policy**: Stock cannot drop below zero. Server-side validation rejects any order exceeding current stock levels.
2. **Product Snapshots**: Historical sales records (challans) store immutable snapshots of product names and prices at order creation time.
3. **Automated Reversion**: Cancelling a confirmed sales challan automatically restores stock to the warehouse and logs an `IN` stock movement.
4. **Credit Window**: Invoices default to a 30-day payment due window.

---

## 📜 License
This project is created and developed by **Aritra Banerjee** and is licensed under the [MIT License](LICENSE).
