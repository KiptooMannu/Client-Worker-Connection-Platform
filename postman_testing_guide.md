# Postman Testing Guide: End-to-End System Lifecycle

This guide follows the "Client Connection Platform" workflow from registration to a completed job. Use this to verify that all trust-driven logic and role-based dashboards are working correctly.

---

## Phase 1: Authentication & Account Setup

### 1. Register a new Worker
- **Method:** `POST`
- **URL:** `https://client-search-backend.onrender.com/api/auth/register`
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
- **URL:** `https://client-search-backend.onrender.com/api/auth/login`
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
- **URL:** `https://client-search-backend.onrender.com/api/workers/profile?email=kevin@worker.com`
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
- **URL:** `https://client-search-backend.onrender.com/api/documents?workerProfileId={{worker_id}}&type=ID_CARD&name=National_ID`
- **Body (form-data):** `file` (Select an image)
- **Expected Response:** `200 OK` - Document URL.

---

## Phase 3: Admin Review & Approval

### 5. Login as Admin
- **Method:** `POST`
- **URL:** `https://client-search-backend.onrender.com/api/auth/login`
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
- **URL:** `https://client-search-backend.onrender.com/api/admin/workers/pending`
- **Expected Response:** List containing Kevin's profile.

### 7. Approve Worker
- **Setup:** Authorization: Bearer Admin Token.
- **Method:** `PUT`
- **URL:** `https://client-search-backend.onrender.com/api/admin/workers/{{worker_id}}/approve?adminId={{admin_user_id}}`
- **Expected Response:** `"Worker verified and is now live!"`

---

## Phase 4: Client Interaction & Hiring

### 8. Register and Login as Client
- Repeat the Register/Login steps from Phase 1, but use `role: CLIENT`.
- **Copy the Client Token.**

### 9. Search for Verified Workers
- **Setup:** No Auth needed (Public Search).
- **Method:** `GET`
- **URL:** `https://client-search-backend.onrender.com/api/marketplace/search?location=Nairobi`
- **Expected Response:** List containing Kevin (since he is now approved).

### 10. Initiate Job Request
- **Setup:** Authorization: Bearer Client Token.
- **Method:** `POST`
- **URL:** `https://client-search-backend.onrender.com/api/jobs/request?clientId={{client_user_id}}&workerProfileId={{worker_id}}`
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
- **URL:** `https://client-search-backend.onrender.com/api/messages?senderId={{client_id}}&receiverId={{worker_id}}`
- **Body (JSON):** `{ "content": "I've sent a request, please check." }`
- **Expected Response:** `200 OK`.

### 12. Complete Job & Leave Review
- **Setup:** Authorization: Bearer Client Token.
- **Method:** `POST`
- **URL:** `https://client-search-backend.onrender.com/api/reviews?clientId={{client_id}}&workerProfileId={{worker_id}}`
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

---

## Phase 6: Payments & Escrow (Local testing)

> Base URL for local testing: `http://localhost:8080`

### 13. Initiate M-Pesa STK Push (Client)
- **Setup:** Authorization: Bearer Token (Client)
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/payments/mpesa/stkpush?jobId={{job_id}}&phoneNumber={{phone_number}}`
- **Expected Response:** `200 OK` with `checkoutRequestId` (STK push initiated)

### M-Pesa Sandbox Setup
Before using STK or webhook flows, make sure you have the following sandbox values from Safaricom Daraja:
- `MPESA_ENV` = `sandbox`
- `MPESA_CONSUMER_KEY`
- `MPESA_CONSUMER_SECRET`
- `MPESA_SHORTCODE` (typically `174379` for the sandbox)
- `MPESA_PASSKEY`
- `MPESA_CALLBACK_URL` = your publicly reachable HTTPS callback endpoint

For local development, `MPESA_CALLBACK_URL` must point to a public HTTPS address that Safaricom can reach. Use an ngrok or equivalent tunnel like:
- `https://<your-subdomain>.ngrok.io/api/payments/mpesa/callback`

If you want to test real worker payouts in the future, these additional sandbox fields may be required:
- `MPESA_B2C_INITIATOR_NAME`
- `MPESA_B2C_SECURITY_CREDENTIAL`
- `MPESA_B2C_RESULT_URL`
- `MPESA_B2C_TIMEOUT_URL`

### Local automation helper
- A runnable PowerShell harness is available at `backend/scripts/run-mpesa-payment-harness.ps1`
- Run it from the repo root with PowerShell:
  ```powershell
  cd "C:\Users\User\Desktop\Web app\backend"
  .\scripts\run-mpesa-payment-harness.ps1
  ```
- It will register/login admin/client/worker, create a worker profile, approve it, create a job, initiate STK push, simulate the callback, read status, and release escrow.

### 14. Check Payment Status
- **Setup:** Authorization: Bearer Token (any authenticated user)
- **Method:** `GET`
- **URL:** `http://localhost:8080/api/payments/status/{{job_id}}`
- **Expected Response:** JSON `PaymentStatusResponse` or a `NO_PAYMENT` status when none exists.

### 15. Simulate M-Pesa STK Callback (Webhook)
- **Setup:** No auth required (public webhook)
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/payments/mpesa/callback`
- **Body (JSON)** — example payload used in tests:
```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "12345",
      "CheckoutRequestID": "TEST-CHECKOUT-1",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          { "Name": "Amount", "Value": 1500 },
          { "Name": "MpesaReceiptNumber", "Value": "ABC123XYZ" },
          { "Name": "PhoneNumber", "Value": "254700000000" }
        ]
      }
    }
  }
}
```
- **Expected Response:** `200 OK` — `{ "status": "received" }` and a webhook log will be recorded by the backend.

### 16. Release Escrow (Client)
- **Setup:** Authorization: Bearer Token (Client who paid)
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/payments/escrow/release?jobId={{job_id}}`
- **Expected Response:** `200 OK` and worker wallet credited. Payment record updated with `platformFee` and `workerAmount`.

### 17. Refund Escrow (Client)
- **Setup:** Authorization: Bearer Token (Client)
- **Method:** `POST`
- **URL:** `http://localhost:8080/api/payments/escrow/refund?jobId={{job_id}}`
- **Expected Response:** `200 OK` and payment status set to `REFUNDED`.

---

If you want, I can export these requests to a Postman collection and attach it to this repo.
