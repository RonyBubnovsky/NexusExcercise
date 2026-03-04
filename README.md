# Digital Coupon Marketplace

A backend-focused digital marketplace for selling coupon-based products through two channels:

- **Direct customers** (via React frontend)
- **External resellers** (via REST API)

## Tech Stack

- **Backend:** Node.js (Express)
- **Frontend:** React + Vite
- **Database:** MongoDB
- **Containerization:** Docker + Docker Compose

## Quick Start (Docker)

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose installed

### Run the application

```bash
docker-compose up --build
```

This will start three containers:
| Service | URL |
|----------|------------------------------|
| Backend | http://localhost:5000 |
| Frontend | http://localhost:5173 |
| MongoDB | mongodb://localhost:27017 |

### Verify it's working

```bash
curl http://localhost:5000/api/v1/health
# Expected: { "status": "ok" }
```

## Environment Variables

See `.env.example` for all required variables.

| Variable           | Description                  | Default                                        |
| ------------------ | ---------------------------- | ---------------------------------------------- |
| `PORT`             | Backend server port          | `5000`                                         |
| `MONGO_URI`        | MongoDB connection string    | `mongodb://localhost:27017/coupon-marketplace` |
| `JWT_SECRET`       | Secret for token signing     | _(required)_                                   |
| `RESELLER_API_KEY` | API key for reseller auth    | _(required)_                                   |
| `VITE_API_URL`     | Backend API URL for frontend | `http://localhost:5000/api/v1`                 |

## Running Tests

```bash
cd server
npm install
npm test
```

## Project Structure

```
├── client/            # React + Vite frontend
│   ├── src/
│   └── Dockerfile
├── server/            # Express backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── models/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── index.js
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```
