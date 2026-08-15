# Product Strategy & Design Document

## 1. Problem Statement
Physical waiting rooms in hospitals, clinics, government agencies, salons, and customer support centers create significant friction:
- **Time Inefficiency**: Visitors lose hours stuck in waiting areas with unpredictable delays.
- **Overcrowding & Health Risks**: Crowded waiting halls increase airborne viral transmission risk.
- **Staff Burnout**: Front-desk staff endure constant verbal inquiries (*"When is my number going to be called?"*).
- **No-Show Losses**: Unannounced departures leave counters idle and skew scheduling.

---

## 2. Solution: WaitWise
WaitWise replaces physical lobbies with a **Real-Time Smart Virtual Queue**:
- **Remote Check-In**: Customers discover participating places, view real-time lines, and join virtually.
- **Live Ticket Tracker**: Mobile-first dashboard showing position countdown, dynamic ETA, and visual station cards.
- **Audio & Visual Turn Alerting**: Notifies visitors when their token is called, eliminating the need to watch a physical TV monitor.
- **Multi-Tenant Staff Portal**: Counter operators manage lines with 1-click calls, status transitions, and reception walk-in ticketing.
- **Superadmin Verification**: Enforces staff verification to ensure only authorized employees can manage facility counters.

---

## 3. User Journeys

### Customer Journey
1. **Discover**: Browse hospitals, clinics, DMV, salons, or banks with live wait times.
2. **Join**: Select a service and join the queue in one click.
3. **Track**: Monitor real-time position and dynamic ETA remotely while commuting or relaxing nearby.
4. **Arrive**: Receive a turn approaching alert, proceed to the counter, and get served.

### Staff Journey
1. **Onboard**: Register with facility name, job title, and staff badge ID.
2. **Verification**: Account reviewed and authorized by an organization administrator.
3. **Serve**: Log in to the counter station, click *Call Next*, start serving, and mark tickets complete.
4. **Walk-In Support**: Issue priority walk-in tickets for visitors arriving without smartphones.

### Organization Admin Journey
1. **Manage**: Review incoming staff verification requests.
2. **Authorize**: Verify employee credentials and approve access with 1 click.
3. **Audit**: Suspend or reactivate staff accounts as staffing changes occur.

---

## 4. Feature Implementation Status

| Feature Area | Status | Implementation Details |
| :--- | :---: | :--- |
| **Customer Auth & Dashboards** | ✅ Implemented | JWT + Bcrypt, active ticket tracking, queue history |
| **Staff Verification System** | ✅ Implemented | Pending/Approved/Rejected/Suspended workflow |
| **Admin Command Center** | ✅ Implemented | Staff authorization and multi-tenant management |
| **Live WebSocket Sync** | ✅ Implemented | Socket.IO room broadcasting |
| **Dynamic ETA Calculator** | ✅ Implemented | Rolling throughput and service weight algorithm |
| **Walk-In Ticketing** | ✅ Implemented | Reception desk ticket generation |
| **Web Audio Alerting** | ✅ Implemented | Web Audio API dual-tone chimes |
| **SMS Gateway Integration** | 🔮 Roadmap | Twilio / AWS SNS SMS delivery |
| **Hardware Display Kiosk** | 🔮 Roadmap | Fullscreen waiting-hall TV display mode |
