# Postman Testing Guide: End-to-End System Lifecycle

This guide follows the "Client Connection Platform" workflow from registration to a completed job. Use this to verify that all trust-driven logic and role-based dashboards are working correctly.

---

## Phase 1: Authentication & Account Setup

### 1. Register a new Worker
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/auth/register`
- **Body (JSON):**
  ```json
  {
    "username": "kevin_worker",
    "email": "kevin@worker.com",
    "password": "password123",
    "role": "WORKER"
  }
  ```
- **Expected Response:** `200 OK` - "User registered successfully"

### 2. Login as Worker (Get Token)
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/auth/login`
- **Body (JSON):**
  ```json
  {
    "email": "kevin@worker.com",
    "password": "password123"
  }
  ```
- **Expected Response:** `200 OK` - A JWT Token. **Copy this token.**

---

## Phase 2: Worker Profile & Verification Flow

### 3. Create Worker Profile
- **Setup:** Go to **Authorization** tab -> **Bearer Token** -> Paste Worker Token.
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/workers/profile?email=kevin@worker.com`
- **Body (JSON):**
  ```json
  {
    "fullName": "Kevin Worker",
    "phoneNumber": "0711223344",
    "location": "Nairobi",
    "experienceYears": 4,
    "bio": "Certified Plumber specialized in residential maintenance."
  }
  ```
- **Expected Response:** `200 OK` - Profile object with `status: DRAFT` and `isVisible: false`.

### 4. Upload Verification Documents
- **Setup:** Authorization: Bearer Token.
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/documents?workerProfileId={{worker_id}}&type=ID_CARD&name=National_ID`
- **Body (form-data):** `file` (Select an image)
- **Expected Response:** `200 OK` - Document URL.

---

## Phase 3: Admin Review & Approval

### 5. Login as Admin
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/auth/login`
- **Body (JSON):**
  ```json
  {
    "email": "admin@kazikonnect.com",
    "password": "admin123"
  }
  ```
- **Expected Response:** `200 OK` - JWT Token. **Copy this Admin Token.**

### 6. View Pending Workers
- **Setup:** Authorization: Bearer Admin Token.
- **Method:** `GET`
- **URL:** `http://localhost:8080/api/admin/workers/pending`
- **Expected Response:** List containing Kevin's profile.

### 7. Approve Worker
- **Setup:** Authorization: Bearer Admin Token.
- **Method:** `PUT`
- **URL:** `http://localhost:8080/api/admin/workers/{{worker_id}}/approve?adminId={{admin_user_id}}`
- **Expected Response:** `"Worker verified and is now live!"`

---

## Phase 4: Client Interaction & Hiring

### 8. Register and Login as Client
- Repeat the Register/Login steps from Phase 1, but use `role: CLIENT`.
- **Copy the Client Token.**

### 9. Search for Verified Workers
- **Setup:** No Auth needed (Public Search).
- **Method:** `GET`
- **URL:** `http://localhost:8080/api/marketplace/search?location=Nairobi`
- **Expected Response:** List containing Kevin (since he is now approved).

### 10. Initiate Job Request
- **Setup:** Authorization: Bearer Client Token.
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/jobs/request?clientId={{client_user_id}}&workerProfileId={{worker_id}}`
- **Body (JSON):**
  ```json
  {
    "description": "Repair kitchen sink leak",
    "location": "Nairobi West",
    "scheduledDate": "2026-05-10T14:30:00"
  }
  ```
- **Expected Response:** `200 OK` - Job Request with `status: PENDING`.

---

## Phase 5: Communication & Feedback

### 11. Send Message to Worker
- **Setup:** Authorization: Bearer Client Token.
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/messages?senderId={{client_id}}&receiverId={{worker_id}}`
- **Body (JSON):** `{ "content": "I've sent a request, please check." }`
- **Expected Response:** `200 OK`.

### 12. Complete Job & Leave Review
- **Setup:** Authorization: Bearer Client Token.
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/reviews?clientId={{client_id}}&workerProfileId={{worker_id}}`
- **Body (JSON):**
  ```json
  {
    "rating": 5,
    "comment": "Excellent service and arrived on time!"
  }
  ```
- **Expected Response:** `200 OK`.

---

## Tips for Postman Success:
1. **Variables:** Use Postman Environments to store `token`, `worker_id`, and `client_id` so you don't have to copy-paste them every time.
2. **Headers:** Always ensure `Content-Type: application/json` is set in the Headers tab.
3. **Role Enforcement:** Try accessing `/api/admin/workers` with a Worker token—the system should return `403 Forbidden`, confirming your security logic is working.
