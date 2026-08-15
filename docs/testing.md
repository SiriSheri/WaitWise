# Testing & Quality Assurance Guide

## Overview
WaitWise includes an automated end-to-end security and RBAC verification suite in `server/src/tests/security.test.ts` along with manual test scenarios across all user roles.

---

## 1. Automated Verification Suite

Run the full automated test suite with:
```bash
npm test
```

### Verified Automated Scenarios:
1. **Customer Registration**: Verifies user creation, password hashing with bcrypt, and 7-day JWT generation.
2. **Duplicate Email Rejection**: Verifies `HTTP 409 Conflict` on duplicate registration.
3. **Customer RBAC Protection**: Verifies `HTTP 403 Forbidden` when customers attempt to call staff endpoints (`/api/staff/walk-in`).
4. **Staff Onboarding (Pending State)**: Verifies staff registration enters `pending` state with no immediate token.
5. **Pending Staff Login Guard**: Verifies pending staff receives `HTTP 403` with a friendly *"awaiting verification"* response.
6. **Superadmin Authentication**: Verifies admin login and role assignment.
7. **Admin Verification Retrieval**: Verifies admin can list and filter pending verification requests.
8. **Admin Approval Action**: Verifies state transition from `pending` to `approved` with timestamp and reviewer ID.
9. **Approved Staff Authentication**: Verifies approved staff successfully logs in and receives a staff token.
10. **Walk-In Ticket Creation**: Verifies approved staff can generate priority walk-in tickets for their assigned facility.
11. **Multi-Tenant Isolation**: Verifies staff from Facility A receives `HTTP 403 Forbidden` when attempting actions on Facility B.
12. **Staff Suspension**: Verifies admin can suspend an active staff member.
13. **Suspended Staff Lockdown**: Verifies suspended tokens are immediately denied access to protected endpoints.
14. **Customer Virtual Queue Join**: Verifies virtual queue joining and position calculation.

---

## 2. Manual Testing Scenarios & Demo Credentials

### Demo Accounts Catalog:

| Role | Email | Password | Assigned Organization | Initial Status |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin@waitwise.com` | `password123` | Platform Superadmin | `approved` |
| **Approved Staff (Hospital)** | `metro.staff@waitwise.com` | `password123` | Metro Care General Hospital | `approved` |
| **Approved Staff (DMV)** | `dmv.staff@waitwise.com` | `password123` | Civic DMV & Licensing | `approved` |
| **Approved Staff (Salon)** | `salon.staff@waitwise.com` | `password123` | Radiant Glow Salon | `approved` |
| **Approved Staff (Dental)** | `apex.staff@waitwise.com` | `password123` | Apex Dental Care | `approved` |
| **Approved Staff (Tech)** | `tech.staff@waitwise.com` | `password123` | Urban Tech Care | `approved` |
| **Pending Staff** | `pending.staff@waitwise.com` | `password123` | Metro Care General Hospital | `pending` |
| **Rejected Staff** | `rejected.staff@waitwise.com` | `password123` | Civic DMV | `rejected` |
| **Suspended Staff** | `suspended.staff@waitwise.com` | `password123` | Radiant Glow Salon | `suspended` |
| **Customer** | `user@waitwise.com` | `password123` | N/A | `approved` |

---

## 3. Real-Time Multi-Browser Synchronization Test

1. Open **Browser 1** (Customer): Navigate to `http://localhost:5173/join/biz_metro_hospital` and join the queue.
2. Open **Browser 2** (Staff): Log in as `metro.staff@waitwise.com` and open `http://localhost:5173/staff/dashboard`.
3. In **Browser 2**, click **"Call Next"**:
   - Verify that **Browser 1** instantly plays the turn chime and displays *"Your turn! Proceed to Counter 1"*.
   - Verify that the waiting queue count decrements live without manual refresh.
