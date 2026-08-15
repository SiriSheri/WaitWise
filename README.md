# WaitWise — Real-Time Smart Waiting-Time Management Platform

WaitWise is a production-quality, real-time waiting-time management web application designed to eliminate physical waiting lines across hospitals, medical & dental clinics, government offices/DMVs, salons, restaurants, and tech support centers.

---

## 🌟 Key Architecture & Features

- **Frontend**: React 18 + Vite + TypeScript + TailwindCSS + Lucide Icons + Web Audio API synthesizer + QR Code generator.
- **Backend**: Node.js + Express + TypeScript + Socket.IO + Persistent Embedded SQLite (via native `node:sqlite` in Node 24).
- **Zero Cloud Friction**: Completely self-contained; no Firebase, Supabase, or MongoDB cloud lock-in required.
- **Real-Time Engine**: Bi-directional WebSockets with room dispatchers (`business_{id}`, `ticket_{id}`) providing instant queue advancement, live serving token updates, and turn alert bells.
- **Smart Dynamic ETA**: Automatically computes remaining wait times based on rolling completed ticket speeds, specific service duration complexity, active counter capacity, and time-of-day rush multipliers.
- **Anomaly Detection**: Warns both staff and customers if handling time exceeds 135% of expected projections.
- **Predictive Peak Insights**: Recommends optimal least-busy windows based on historical hourly velocity.
- **Walk-in Support**: One-click in-person ticket generation for receptionists with printable slips and QR code.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** >= v22.0.0 (Recommended v24.x)
- **npm** >= 10.x
- **Git**

### 2. Installation
Install all dependencies across the monorepo:
```bash
npm run install:all
```
*(Or install manually in root, `/server`, and `/client`)*:
```bash
npm install
npm --prefix server install
npm --prefix client install
```

### 3. Seed Realistic Database Data
Pre-populate realistic businesses (Metro General Hospital, Apex Dental, Civic DMV, Radiant Salon, Urban Tech Care), services, active counters, live queue tickets, and hourly wait time statistics:
```bash
npm run seed
```

### 4. Running Locally
Start both backend (Port 5000) and frontend (Port 5173) concurrently:
```bash
npm run dev
```

The application will be accessible at:
- **Customer Web App**: [http://localhost:5173](http://localhost:5173)
- **Backend API & WebSockets**: [http://localhost:5000](http://localhost:5000)

---

## 🔑 Demo & Test Credentials

All demo accounts use password: `password123`

| Role | Email | Password | Location Assignment |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@waitwise.com` | `password123` | Global Platform |
| **Hospital Staff** | `metro.staff@waitwise.com` | `password123` | Metro Care General Hospital |
| **DMV Staff** | `dmv.staff@waitwise.com` | `password123` | Civic DMV & Licensing Center |
| **Salon Staff** | `salon.staff@waitwise.com` | `password123` | Radiant Glow Salon & Spa |
| **Dental Clinic Staff** | `apex.staff@waitwise.com` | `password123` | Apex Dental & Orthodontics |
| **Demo Customer** | `user@waitwise.com` | `password123` | Alex Morgan |

*Note: You can also use the **1-Click Quick Demo Login** buttons on the Login and Staff Login pages to test immediately!*

---

## 📁 Directory Structure

```
WaitWise/
├── client/                      # React + Vite + TypeScript Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/          # Navbar, Footer, StatusBadge, WaitTimePill, LoadingSpinner
│   │   │   ├── queue/           # LiveTicketCard, AnomalyAlert
│   │   │   ├── business/        # BusinessCard, CategoryFilter, PeakHoursChart
│   │   │   └── staff/           # CallNextControl, WalkInModal
│   │   ├── context/             # AuthContext, SocketContext, NotificationContext
│   │   ├── lib/                 # api.ts, soundUtils.ts, utils.ts
│   │   ├── pages/               # HomePage, PlacesSearchPage, PlaceDetailsPage,
│   │   │                        # JoinQueuePage, ActiveTicketTrackerPage,
│   │   │                        # UserDashboardPage, StaffLoginPage,
│   │   │                        # StaffDashboardPage, BusinessSettingsPage
│   │   └── types/               # TypeScript data models
│   ├── tailwind.config.js
│   └── vite.config.ts
├── server/                      # Node.js + Express + Socket.IO + SQLite Backend
│   ├── src/
│   │   ├── db/                  # schema.sql, index.ts, seed.ts
│   │   ├── middleware/          # auth.ts, errorHandler.ts
│   │   ├── routes/              # auth, business, queue, staff, notifications
│   │   ├── services/            # queueEngine.ts, waitTimeCalculator.ts
│   │   ├── sockets/             # queueSocket.ts
│   │   └── index.ts             # Server entrypoint
│   └── data/                    # Persistent local SQLite database (waitwise.db)
├── package.json                 # Root script runner (concurrently)
├── .gitignore
└── README.md
```

---

## 🛡️ Security & Real-Time Sync
- Input validation enforced with **Zod** on all mutation routes.
- Password hashing with **bcryptjs** (10 salt rounds).
- Stateless **JWT** authentication with role-based route guards (`customer`, `staff`, `admin`).
- Safe parameterized queries with SQLite to eliminate SQL injection.
- Browser Audio chime synthesizer using native Web Audio API with zero external audio assets or CDNs.
