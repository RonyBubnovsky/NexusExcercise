# Digital Coupon Marketplace

A backend-focused digital marketplace for selling coupon-based products through two channels:

- **Direct customers** – browse and buy coupons through the React frontend
- **External resellers** – integrate via authenticated REST API

## Tech Stack

| Layer            | Technology                               |
| ---------------- | ---------------------------------------- |
| Backend          | Node.js 20 + Express 4                   |
| Frontend         | React 19 + Vite 7                        |
| Database         | MongoDB 7 (Mongoose 8 ODM)               |
| Auth             | JWT (admin), Bearer key (reseller)       |
| Testing          | Jest + Supertest + mongodb-memory-server |
| Containerization | Docker + Docker Compose                  |
| CI/CD            | GitHub Actions + Render Deploy Hooks     |

### Live Demo

| Service  | URL                                     |
| -------- | --------------------------------------- |
| Frontend | https://nexusexcercise.onrender.com     |
| Backend  | https://nexus-backend-r8oc.onrender.com |

---

## CI/CD Pipeline

The project uses **GitHub Actions** with two workflows:

| Workflow                                    | Trigger                | What it does                                                 |
| ------------------------------------------- | ---------------------- | ------------------------------------------------------------ |
| **CI** (`.github/workflows/ci.yml`)         | Pull request to `main` | Runs server tests (Jest + MongoDB) and verifies client build |
| **Deploy** (`.github/workflows/deploy.yml`) | PR merged to `main`    | Triggers Render deploy hooks for server and client           |

---

## Quick Start (Docker)

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose installed

### 1. Clone and configure

```bash
git clone https://github.com/RonyBubnovsky/NexusExcercise.git
cd NexusExcercise
cp .env.example .env
```

Edit `.env` and set secure values for `JWT_SECRET`, `RESELLER_API_KEY`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD`.

### 2. Start the application

```bash
docker-compose up --build
```

This starts three containers:

| Service  | URL                       |
| -------- | ------------------------- |
| Frontend | http://localhost:5173     |
| Backend  | http://localhost:5000     |
| MongoDB  | mongodb://localhost:27017 |

### 3. Verify it's working

```bash
curl http://localhost:5000/api/v1/health
# → { "status": "ok" }
```

### 4. Stop the application

```bash
docker-compose down
```

Add `-v` to also remove the database volume: `docker-compose down -v`

---

## Local Development (without Docker)

### Backend

```bash
cd server
npm install
npm run dev          # starts with nodemon (auto-restart on changes)
```

Requires a running MongoDB instance. Set `MONGO_URI` in the root `.env` file.

### Frontend

```bash
cd client
npm install
npm run dev          # Vite dev server with HMR
```

Set `VITE_API_URL` in `.env` (defaults to `http://localhost:5000/api/v1`).

---

## Running Tests

```bash
cd server
npm test
```

Tests use **mongodb-memory-server** – no external database required. The test suite covers:

- **Model tests** – Mongoose schema validation, pricing formula, pre-save hooks
- **Repository tests** – CRUD operations, atomic `markAsSold`
- **Service tests** – business logic, purchase flow, error conditions (mocked repository)
- **API integration tests** – admin, reseller, store, and health endpoints (full HTTP)
- **Validation tests** – input validation, auth rejection, edge cases

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

| Variable           | Description                        | Default / Example                              |
| ------------------ | ---------------------------------- | ---------------------------------------------- |
| `PORT`             | Backend server port                | `5000`                                         |
| `MONGO_URI`        | MongoDB connection string          | `mongodb://localhost:27017/coupon-marketplace` |
| `JWT_SECRET`       | Secret key for signing admin JWTs  | _(required – use a long random string)_        |
| `RESELLER_API_KEY` | Bearer token for reseller API auth | _(required – use a long random string)_        |
| `ADMIN_USERNAME`   | Admin login username               | _(required)_                                   |
| `ADMIN_PASSWORD`   | Admin login password               | _(required)_                                   |
| `VITE_API_URL`     | Backend URL for the React frontend | `http://localhost:5000/api/v1`                 |

> **Security note:** Never commit the `.env` file. It is excluded via `.gitignore`.

---

## Architecture

```
Client (React)  ──HTTP──▶  Express Server  ──Mongoose──▶  MongoDB
                           │
                           ├── controllers/   ← thin HTTP handlers
                           ├── services/      ← business logic & validation
                           ├── repositories/  ← database access (Mongoose queries)
                           ├── models/        ← Mongoose schemas (Product ← Coupon discriminator)
                           ├── middleware/     ← auth guards, error handler
                           ├── routes/        ← route definitions
                           └── utils/         ← AppError class
```

### Key design decisions

- **Discriminator pattern** – `Product` is the base model; `Coupon` extends it via Mongoose discriminators. This makes it easy to add new product types (e.g., subscription, gift card) without schema changes.
- **Atomic purchase** – `markAsSold` uses `findOneAndUpdate` with `{ is_sold: false }` as a filter, ensuring only one buyer succeeds even under concurrent requests.
- **Derived pricing** – `minimum_sell_price` is always calculated server-side via a pre-save hook. It is never accepted from client input.
- **Layered validation** – input validation in the service layer (field presence, types, ranges), business-rule validation in the service layer (price checks), and schema-level validation in Mongoose (required, min, enum).

---

## API Reference

### Health Check

```
GET /api/v1/health
→ 200 { "status": "ok" }
```

---

### Admin API (`/api/v1/admin`)

All endpoints (except login) require a JWT token in the `Authorization` header.

#### Login

```
POST /api/v1/admin/login
Body: { "username": "...", "password": "..." }
→ 200 { "token": "jwt-token-here" }
```

#### Create Coupon

```
POST /api/v1/admin/products
Headers: Authorization: Bearer <jwt>
Body: {
  "name": "Amazon $100 Coupon",
  "description": "Gift card",
  "image_url": "https://example.com/amazon.png",
  "cost_price": 80,
  "margin_percentage": 25,
  "value_type": "STRING",
  "value": "ABCD-1234-EFGH"
}
→ 201 { full coupon object with minimum_sell_price calculated }
```

#### List All Coupons

```
GET /api/v1/admin/products
Headers: Authorization: Bearer <jwt>
→ 200 [ array of all coupons, including sold ]
```

#### Get Coupon by ID

```
GET /api/v1/admin/products/:id
Headers: Authorization: Bearer <jwt>
→ 200 { full coupon object }
→ 404 { "error_code": "PRODUCT_NOT_FOUND", "message": "..." }
```

#### Update Coupon

```
PUT /api/v1/admin/products/:id
Headers: Authorization: Bearer <jwt>
Body: { fields to update }
→ 200 { updated coupon object }
```

#### Delete Coupon

```
DELETE /api/v1/admin/products/:id
Headers: Authorization: Bearer <jwt>
→ 204 (no content)
```

---

### Reseller API (`/api/v1/products`)

All endpoints require the reseller API key: `Authorization: Bearer <RESELLER_API_KEY>`

#### List Available Products

```
GET /api/v1/products
→ 200 [
  {
    "id": "uuid",
    "name": "Amazon $100 Coupon",
    "description": "Gift card",
    "image_url": "https://...",
    "price": 100.00
  }
]
```

Does **not** include: `cost_price`, `margin_percentage`, coupon `value`.

#### Get Product by ID

```
GET /api/v1/products/:id
→ 200 { "id", "name", "description", "image_url", "price" }
→ 404 { "error_code": "PRODUCT_NOT_FOUND" }
```

#### Purchase Product

```
POST /api/v1/products/:id/purchase
Body: { "reseller_price": 120.00 }
→ 200 {
  "product_id": "uuid",
  "final_price": 120.00,
  "value_type": "STRING",
  "value": "ABCD-1234"
}
```

| Error                    | Code | Condition                               |
| ------------------------ | ---- | --------------------------------------- |
| `PRODUCT_NOT_FOUND`      | 404  | Product does not exist                  |
| `PRODUCT_ALREADY_SOLD`   | 409  | Product was already purchased           |
| `RESELLER_PRICE_TOO_LOW` | 400  | `reseller_price` < `minimum_sell_price` |
| `VALIDATION_ERROR`       | 400  | Missing or invalid `reseller_price`     |
| `UNAUTHORIZED`           | 401  | Missing or invalid API key              |

---

### Store API (`/api/v1/store`) – Public

No authentication required. Used by the frontend for direct customers.

#### List Available Products

```
GET /api/v1/store/products
→ 200 [ same format as reseller API ]
```

#### Get Product by ID

```
GET /api/v1/store/products/:id
→ 200 { same format as reseller API }
```

#### Purchase Product

```
POST /api/v1/store/products/:id/purchase
→ 200 {
  "product_id": "uuid",
  "final_price": 100.00,
  "value_type": "STRING",
  "value": "ABCD-1234"
}
```

Customers always pay `minimum_sell_price` – no price override is accepted.

---

## Frontend

The React frontend has two modes accessible via the top navigation:

- **Store** (`/`) – browse available coupons, view details, purchase and reveal coupon value
- **Admin** (`/admin`) – login, create new coupons, view all coupons with sold/available status

---

## Project Structure

```
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── pages/          # StorePage, ProductDetailPage, AdminLoginPage, AdminDashboardPage
│   │   ├── services/       # api.js – centralized HTTP client (axios)
│   │   ├── App.jsx         # Router + navigation
│   │   └── main.jsx        # Entry point
│   └── Dockerfile
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/         # database.js – MongoDB connection
│   │   ├── controllers/    # adminController, productController, storeController
│   │   ├── services/       # productService (business logic), authService (JWT)
│   │   ├── repositories/   # productRepository (Mongoose queries)
│   │   ├── models/         # Product (base), Coupon (discriminator)
│   │   ├── middleware/      # adminAuth (JWT), resellerAuth (API key), errorHandler
│   │   ├── routes/         # adminRoutes, productRoutes, storeRoutes
│   │   ├── utils/          # AppError class
│   │   ├── __tests__/      # 8 test suites, 111 tests
│   │   ├── app.js          # Express configuration
│   │   └── index.js        # Server entry point
│   └── Dockerfile
├── docker-compose.yml      # 3 services: mongo, server, client
├── .github/workflows/      # CI + Deploy GitHub Actions
├── .env.example            # Template for environment variables
└── README.md
```
