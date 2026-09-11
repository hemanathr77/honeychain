# HoneyChain

HoneyChain is a full-stack, role-based application for traceable, verified honey supply chains. It connects customers, verified honey farmers, collectors, mentors, experts, and testing laboratories in a trusted digital ecosystem.

## Features

- **Role-Based Access Control:** Separate dashboards and permissions for Customer, Seller, Expert, Collector, and Admin.
- **Traceability:** Track honey batches from hive to home.
- **Verification & Lab Reports:** Integrated laboratory testing and farmer verification workflows.
- **Marketplace:** Customers can browse and purchase verified honey products.
- **Order Management:** Complete order lifecycle tracking (PENDING to DELIVERED/CANCELLED).

## Technology Stack

- **Frontend:** React, Vite, React Router v6, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (with `pg` driver)
- **Blockchain:** Hardhat (for local development and deployment of traceability smart contracts)

## Architecture

- **REST API:** The backend exposes RESTful endpoints under `/api`.
- **SPA:** The frontend is a Single Page Application that communicates with the backend.
- **Authentication:** JWT-based authentication with role-based authorization middleware.

## Local Setup

### Database Setup
1. Ensure PostgreSQL is running.
2. Create a database named `honeychain`.
3. Configure the `server/.env` file with your credentials (see Environment Variables).
4. The database tables will be initialized automatically on the first server start, or you can run `npm run db:init` from the `server` directory.

### Backend Setup
1. Navigate to the `server` directory: `cd server`
2. Install dependencies: `npm install`
3. Copy `server/.env.example` to `server/.env` and fill in the values.
4. Start the development server: `npm run dev` (starts on port 5000)

### Frontend Setup
1. Navigate to the project root.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` (optional for local dev, defaults to `http://localhost:5000/api`).
4. Start the frontend: `npm run dev` (starts on port 5173)

### Blockchain Setup (Optional for local testing)
1. Start the local Hardhat node: `npx hardhat node`
2. Open a new terminal and deploy the contract: `npx hardhat run scripts/deploy.js --network localhost`
3. Copy the RPC URL, Private Key (Account #0), and Contract Address to `server/.env`.

## Environment Variables

See `.env.example` in the root and `server/.env.example` in the `server` directory for required variables. **Never commit real credentials to version control.**

## Testing
- Run `npm run build` in the root to test the frontend build.
- Access `http://localhost:5000/api/health` to verify the backend is running.

## Deployment Overview
The project is configured for deployment to modern cloud platforms:
- **Backend:** Render or Railway (Node.js environment).
- **Database:** Managed PostgreSQL (e.g., Neon, Railway Postgres).
- **Frontend:** Vercel (SPA fallback configured via `vercel.json`).

Please refer to `DEPLOYMENT.md` for a detailed step-by-step deployment guide.
