# Database Design & Schema Specifications

## Overview
WaitWise utilizes an embedded **SQLite engine** powered by Node.js v24's native `node:sqlite` (`DatabaseSync`).

### Key Benefits:
- **Zero Cloud / Third-Party Dependencies**: No PostgreSQL, Supabase, or Firebase required.
- **Persistent Local Storage**: Persisted in `server/data/waitwise.db`.
- **Sub-Millisecond Query Latency**: Synchronous in-process execution eliminates network round-trips.
- **ACID Compliance**: Full transaction support with strict foreign key constraints.

---

## Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    BUSINESSES ||--o{ USERS : "employs"
    BUSINESSES ||--o{ SERVICES : "offers"
    BUSINESSES ||--o{ COUNTERS : "operates"
    BUSINESSES ||--o{ QUEUE_ENTRIES : "queues"
    BUSINESSES ||--o{ WAIT_TIME_STATS : "records"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ QUEUE_ENTRIES : "joins"
    COUNTERS ||--o{ QUEUE_ENTRIES : "serves"
    SERVICES ||--o{ QUEUE_ENTRIES : "categorizes"

    BUSINESSES {
        TEXT id PK
        TEXT name
        TEXT category
        TEXT address
        TEXT city
        TEXT operating_hours
        TEXT status
        INTEGER max_capacity
        INTEGER avg_service_time_mins
        TEXT image_url
        TEXT created_at
    }

    USERS {
        TEXT id PK
        TEXT name
        TEXT email UK
        TEXT password_hash
        TEXT role
        TEXT status
        TEXT job_title
        TEXT employee_id
        TEXT phone
        TEXT business_id FK
        TEXT verified_at
        TEXT verified_by FK
        TEXT rejection_reason
        TEXT created_at
    }

    SERVICES {
        TEXT id PK
        TEXT business_id FK
        TEXT name
        TEXT description
        INTEGER default_duration_mins
        REAL price
        INTEGER is_active
    }

    COUNTERS {
        TEXT id PK
        TEXT business_id FK
        TEXT name
        TEXT staff_id FK
        INTEGER is_active
        TEXT current_ticket_id
    }

    QUEUE_ENTRIES {
        TEXT id PK
        TEXT ticket_number
        TEXT business_id FK
        TEXT service_id FK
        TEXT user_id FK
        TEXT counter_id FK
        TEXT customer_name
        TEXT customer_phone
        TEXT status
        INTEGER priority
        TEXT notes
        INTEGER estimated_wait_mins
        INTEGER actual_wait_mins
        TEXT joined_at
        TEXT called_at
        TEXT served_at
        TEXT completed_at
    }

    NOTIFICATIONS {
        TEXT id PK
        TEXT user_id FK
        TEXT ticket_id FK
        TEXT type
        TEXT title
        TEXT message
        INTEGER is_read
        TEXT created_at
    }

    WAIT_TIME_STATS {
        TEXT id PK
        TEXT business_id FK
        TEXT service_id FK
        INTEGER day_of_week
        INTEGER hour_of_day
        REAL avg_wait_mins
        REAL avg_service_mins
        INTEGER sample_count
    }
```

---

## Indexing Strategy

| Index Name | Table | Columns | Purpose |
| :--- | :--- | :--- | :--- |
| `idx_users_role_status` | `users` | `(role, status)` | Fast filtration for admin verification workflows |
| `idx_users_business` | `users` | `(business_id)` | Efficient staff lookups by organization |
| `idx_queue_business_status` | `queue_entries` | `(business_id, status)` | High-speed active queue calculations & token retrieval |
| `idx_queue_user` | `queue_entries` | `(user_id)` | Fast lookup for customer active and historical tickets |
| `idx_stats_lookup` | `wait_time_stats` | `(business_id, day_of_week, hour_of_day)` | Instant retrieval of historical hourly waiting profiles |
