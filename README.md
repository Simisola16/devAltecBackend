# devAltec Backend — Live Visitor Geolocation & Analytics Service

> **Build • Innovate • Scale**  
> High-performance Node.js / Express / TypeScript backend and telemetry engine for **devAltec**.  
> Features real-time IP Geolocation resolution, MongoDB Atlas visit persistence, and confidential administrator analytics.

---

## ⚡ Features

- **Accurate IP Geolocation**: Resolves country, metropolitan city, state/region, coordinates (latitude & longitude), and network ISP/organization.
- **Persistent Telemetry**: Stores structured visitor journeys and session metadata in MongoDB Atlas.
- **Confidential Admin API**: Protected analytics endpoints (`/api/analytics/stats`, `/api/analytics/visits`) secured via master secret key authentication.
- **Reverse-Proxy Aware**: Built-in support for `x-forwarded-for`, `x-real-ip`, and Cloudflare `cf-connecting-ip` headers.
- **Zero-Downtime Resilience**: Fast in-memory caching for IP lookups with multi-provider fallbacks.

---

## 🚀 API Endpoints

### 1. Ingestion / Tracking
- `POST /api/track`: Record a new page hit with client metadata and IP geolocation.
- `POST /api/track/duration`: Update session duration upon beacon/page exit.

### 2. Admin & Analytics (Requires `x-admin-key` header or `?key=...`)
- `GET /api/analytics/verify`: Verify administrator master passkey.
- `GET /api/analytics/stats`: Aggregated metrics (total hits, unique visitors, top countries/cities, devices, OS).
- `GET /api/analytics/visits`: Paginated real-time visitor stream with query filters.
- `DELETE /api/analytics/visits/:id`: Delete a specific visit record.

### 3. Health Check
- `GET /health`: Server status and timestamp.

---

## 🛠️ Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@devaltecv.zhhbtid.mongodb.net/devaltec?retryWrites=true&w=majority
ADMIN_SECRET_KEY=your_secure_admin_key
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

---

## 📦 Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build & Production
```bash
npm run build
npm start
```
