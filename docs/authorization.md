# Role-Based Access Control (RBAC) & Multi-Tenant Isolation

## Overview
WaitWise enforces a defense-in-depth security model combining **Role-Based Access Control (RBAC)** and **Multi-Tenant Facility Isolation** at the backend middleware and service layer.

---

## 1. Role Capabilities Matrix

| Feature / Resource | Customer | Staff (Approved) | Admin (Superadmin) |
| :--- | :---: | :---: | :---: |
| Search & Explore Businesses | ✅ | ✅ | ✅ |
| View Real-Time Business Token Boards | ✅ | ✅ | ✅ |
| Join Virtual Queue (Online) | ✅ | ✅ | ✅ |
| Cancel Own Active Queue Entry | ✅ | ❌ | ✅ |
| Receive Personal Turn Notifications | ✅ | ❌ | ❌ |
| View Assigned Staff Dashboard | ❌ | ✅ (Assigned Org Only) | ✅ (All Orgs) |
| Call Next Waiting Token | ❌ | ✅ (Assigned Org Only) | ✅ (All Orgs) |
| Mark Ticket Serving / Completed / Skipped | ❌ | ✅ (Assigned Org Only) | ✅ (All Orgs) |
| Issue Walk-In Queue Tickets | ❌ | ✅ (Assigned Org Only) | ✅ (All Orgs) |
| Pause / Resume Facility Queue | ❌ | ✅ (Assigned Org Only) | ✅ (All Orgs) |
| Manage Facility Counters & Services | ❌ | ✅ (Assigned Org Only) | ✅ (All Orgs) |
| Review Staff Verification Requests | ❌ | ❌ | ✅ |
| Approve / Reject / Suspend Staff Accounts | ❌ | ❌ | ✅ |

---

## 2. Multi-Tenant Organization Isolation

A staff member belonging to Facility A (e.g. *Metro Care General Hospital*) must never be capable of manipulating tickets, counters, or settings for Facility B (e.g. *Civic DMV*).

### Backend Implementation Pattern:
```typescript
function checkBusinessAuthorization(req: AuthRequest, targetBusinessId: string): boolean {
  // Superadmins have platform-wide oversight
  if (req.user?.role === 'admin') return true;
  
  // Staff members must match the business ID
  return req.user?.business_id === targetBusinessId;
}
```

If a staff member sends a payload or requests a resource belonging to a different organization:
- The server responds with `HTTP 403 Forbidden`:
  ```json
  {
    "error": "Forbidden: You are only authorized to manage queues for your assigned organization."
  }
  ```

---

## 3. Defense Against Frontend Manipulation

- Frontend navigation checks (`wouter` route guards) provide user-friendly redirects.
- **Security Rule**: The backend never relies on client assertions. All authorization checks verify:
  1. Valid, non-expired Bearer token.
  2. Live database check confirming account status is `approved`.
  3. Role membership check (`requireRole(['staff', 'admin'])`).
  4. Tenant association check (`req.user.business_id === targetBusinessId`).
