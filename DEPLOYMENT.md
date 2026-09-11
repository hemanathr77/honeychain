# HoneyChain Deployment Guide

This document outlines the step-by-step process for deploying HoneyChain to production.

## Deployment Order

STEP 1: Create GitHub repository.

STEP 2: Push HoneyChain source code (ensure no secrets are committed).

STEP 3: Create production PostgreSQL database (e.g., on Neon or Railway).

STEP 4: Configure backend environment variables for your hosting provider.

STEP 5: Deploy Express backend to Render or Railway.
- Build command: `npm install` (within the `server` directory, or use root `npm install --prefix server`)
- Start command: `npm start` (within the `server` directory)

STEP 6: Verify backend health:
`GET https://YOUR-BACKEND-DOMAIN/api/health`

STEP 7: Obtain the real backend HTTPS URL.

STEP 8: Configure Vercel environment variables. Set `VITE_API_URL=https://YOUR-BACKEND-DOMAIN/api`.

STEP 9: Deploy React frontend to Vercel.
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

STEP 10: Configure Vercel environment variables (if not done in Step 8).

STEP 11: Redeploy frontend on Vercel to pick up the environment variables.

STEP 12: Configure backend CORS. Set `CLIENT_URL` in the backend environment to your Vercel frontend URL (e.g., `https://your-honeychain-app.vercel.app`).

STEP 13: Test authentication.

STEP 14: Test all five roles (Customer, Seller, Expert, Collector, Admin).

STEP 15: Test marketplace.

STEP 16: Test orders.

STEP 17: Test batch creation.

STEP 18: Test lab reports.

STEP 19: Test QR verification.

STEP 20: Test blockchain (ensure a real testnet/mainnet RPC URL and private key are configured in the backend).

STEP 21: Test GPS (browser geolocation).

STEP 22: Test camera/file upload.

STEP 23: Test English/Tamil/Hindi language switching.

STEP 24: Perform final production security test.
