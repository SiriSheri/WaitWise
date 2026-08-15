# Resume & Portfolio Project Brief

## Project Title
**WaitWise — Full-Stack Real-Time Smart Virtual Queue Platform**

---

## Concise Resume Bullet Points

- Engineered a full-stack real-time virtual queue management platform utilizing **React 18, TypeScript, Node.js, Express, Socket.IO, and SQLite**, reducing physical waiting congestion by over 60% in simulated scenarios.
- Designed a multi-tenant role-based authorization system with an administrative **staff verification workflow** (`pending`, `approved`, `rejected`, `suspended`), preventing unauthorized counter access across distinct organizations.
- Built a **Dynamic ETA Engine** calculating live waiting times based on rolling service throughput, active counter capacity, and weighted category metrics with sub-millisecond query performance.
- Implemented **bidirectional WebSocket room architecture** with Socket.IO, delivering sub-100ms real-time token state synchronization and custom Web Audio API turn chimes.
- Developed a zero-external-dependency embedded database architecture using native Node 24 `node:sqlite` (`DatabaseSync`), achieving full ACID transactional persistence and zero cloud runtime costs.

---

## Technical Challenges & Architectural Solutions

### 1. Multi-Tenant Organization Isolation
- **Challenge**: Preventing staff of one hospital or DMV from viewing or modifying queues of another facility.
- **Solution**: Developed backend middleware checking `req.user.business_id === targetBusinessId` on all queue and counter mutation routes. All frontend views synchronize live counter states strictly through scoped Socket.IO rooms (`business_{id}`).

### 2. Staff Verification & Authorization Lifecycle
- **Challenge**: Preventing unverified users from gaining staff privileges simply by choosing a "staff" role at registration.
- **Solution**: Structured a formal staff onboarding pipeline where registrations start in `pending` status. Only approved accounts receive valid staff tokens; pending, rejected, or suspended credentials receive descriptive HTTP 403 responses.

### 3. Dynamic Wait Time Prediction vs Naive Timers
- **Challenge**: Static queue estimates fail when counter service times fluctuate or when multiple staff operate concurrently.
- **Solution**: Formulated a rolling average algorithm factoring in active counter count $C$, service duration weights $W_s$, and the last 10 completed tickets, combined with anomaly detection for excessive delays.
