# REST API Documentation

## Base URL
`http://localhost:5000/api`

---

## 1. Authentication Endpoints

### Customer Registration
- **URL**: `POST /auth/register`
- **Body**:
  ```json
  {
    "name": "Jane Customer",
    "email": "jane@example.com",
    "password": "password123",
    "phone": "+15551234567"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "message": "Account created successfully",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr_...",
      "name": "Jane Customer",
      "email": "jane@example.com",
      "role": "customer",
      "status": "approved"
    }
  }
  ```

### Staff Onboarding Registration
- **URL**: `POST /auth/staff-register`
- **Body**:
  ```json
  {
    "name": "Dr. Jonathan Hayes",
    "email": "dr.hayes@hospital.org",
    "password": "password123",
    "phone": "+15558889999",
    "business_id": "biz_metro_hospital",
    "job_title": "Attending Physician",
    "employee_id": "EMP-HOSP-990"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "message": "Staff registration submitted successfully. Your account is awaiting organization verification by an administrator.",
    "status": "pending",
    "user": { "id": "usr_staff_...", "status": "pending" }
  }
  ```

### Login
- **URL**: `POST /auth/login`
- **Body**: `{ "email": "metro.staff@waitwise.com", "password": "password123" }`
- **Response**: `200 OK` (if approved) or `403 Forbidden` (if pending, rejected, or suspended)

### Get Current User Profile
- **URL**: `GET /auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` `{ "user": { ... } }`

---

## 2. Admin Verification Endpoints
*All admin endpoints require an Admin Bearer token.*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/admin/verifications` | List staff applicants with optional `?status=pending` filter |
| `POST` | `/admin/verifications/:id/approve` | Approve staff credentials and activate counter access |
| `POST` | `/admin/verifications/:id/reject` | Reject application with mandatory `{ "reason": "..." }` |
| `POST` | `/admin/verifications/:id/suspend` | Suspend active staff member |
| `POST` | `/admin/verifications/:id/reactivate` | Reactivate suspended staff member |

---

## 3. Public Business Discovery

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/businesses` | List facilities (filters: `category`, `city`, `search`) |
| `GET` | `/businesses/:id` | Get facility details, active services, counters & stats |
| `GET` | `/businesses/:id/stats` | Hourly waiting time averages & off-peak insights |

---

## 4. Virtual Queue Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/queue/join` | Join virtual queue (returns digital ticket & initial ETA) |
| `GET` | `/queue/ticket/:id` | Real-time position & status for a specific ticket |
| `POST` | `/queue/ticket/:id/cancel` | Cancel active ticket |
| `GET` | `/queue/user/active` | Retrieve logged-in user's active tickets |
| `GET` | `/queue/user/history` | Retrieve user's completed/cancelled ticket history |

---

## 5. Staff Counter & Queue Management
*All staff endpoints require an Approved Staff or Admin token with matching organization authorization.*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/staff/queue-state/:businessId` | Full live state (waiting line, serving counters, metrics) |
| `POST` | `/staff/call-next` | Call next waiting token to a counter station |
| `POST` | `/staff/ticket/:id/status` | Transition ticket status (`serving`, `completed`, `skipped`) |
| `POST` | `/staff/walk-in` | Issue physical walk-in queue ticket from reception desk |
| `POST` | `/staff/pause-queue` | Pause / resume queue intake |
| `POST` | `/staff/counter/toggle` | Activate / deactivate a counter station |
| `POST` | `/staff/counter/create` | Add a new counter station |
| `POST` | `/staff/service/create` | Add a new service category |
