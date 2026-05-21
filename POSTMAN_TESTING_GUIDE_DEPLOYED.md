# Postman Testing Guide: KaziKonnect Platform (Live Deployed)

**API Base URL:** `https://client-search-backend.onrender.com/api`

> **Note:** Replace `{{worker_id}}`, `{{admin_id}}`, `{{client_id}}` with actual IDs from responses.

---

## Phase 1: Authentication & Account Setup

### 1. Register a New Worker

- **Method:** `POST`
- **Endpoint:** `https://client-search-backend.onrender.com/api/auth/register`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Request Body:**
  ```json
  {
    "username": "james_plumber",
    "email": "james@plumber.com",
    "password": "SecurePass123!",
    "role": "WORKER"
  }
  ```
- **Expected Response (200 OK):**
  ```json
  {
    "message": "User registered successfully",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "username": "james_plumber",
    "email": "james@plumber.com",
    "role": "WORKER"
  }
  ```

---

### 2. Login as Worker (Get Token)

- **Method:** `POST`
- **Endpoint:** `https://client-search-backend.onrender.com/api/auth/login`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Request Body:**
  ```json
  {
    "email": "james@plumber.com",
    "password": "SecurePass123!"
  }
  ```
- **Expected Response (200 OK):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "james_plumber",
      "email": "james@plumber.com",
      "role": "WORKER"
    },
    "expiresIn": 86400
  }
  ```
- **Action:** Save the `token` value for Bearer Authentication in subsequent requests.

---

## Phase 2: Worker Profile Setup & Verification

### 3. Create Worker Profile

- **Method:** `POST`
- **Endpoint:** `https://client-search-backend.onrender.com/api/workers/profile`
- **Headers:**
  ```
  Content-Type: application/json
  Authorization: Bearer {{WORKER_TOKEN}}
  ```
- **Request Body:**
  ```json
  {
    "fullName": "James Kipchoge",
    "phoneNumber": "+254711223344",
    "location": "Nairobi",
    "experienceYears": 6,
    "bio": "Licensed plumber with 6 years experience in residential and commercial maintenance.",
    "category": "Plumber",
    "hourlyRate": 800,
    "skills": ["Pipe Repair", "Installation", "Maintenance", "Emergency Response"],
    "preferredLocations": ["Nairobi", "Westlands", "Karen"]
  }
  ```
- **Expected Response (200 OK):**
  ```json
  {
    "id": "prof-001-uuid",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "James Kipchoge",
    "email": "james@plumber.com",
    "phoneNumber": "+254711223344",
    "location": "Nairobi",
    "category": "Plumber",
    "status": "DRAFT",
    "hourlyRate": 800,
    "experienceYears": 6,
    "bio": "Licensed plumber with 6 years experience...",
    "skills": ["Pipe Repair", "Installation", "Maintenance", "Emergency Response"],
    "profilePictureUrl": null,
    "isOnline": false,
    "isVisible": false,
    "createdAt": "2026-05-20T10:30:00Z"
  }
  ```

---

### 4. Add Work History

- **Method:** `POST`
- **Endpoint:** `https://client-search-backend.onrender.com/api/workers/profile/{{worker_id}}/work-history`
- **Headers:**
  ```
  Content-Type: application/json
  Authorization: Bearer {{WORKER_TOKEN}}
  ```
- **Request Body:**
  ```json
  {
    "company": "Elite Plumbing Solutions",
    "role": "Senior Plumber",
    "period": "2020-2026",
    "description": "Led a team of 5 plumbers, managed complex residential projects across Nairobi, maintained 98% customer satisfaction."
  }
  ```
- **Expected Response (200 OK):**
  ```json
  {
    "id": "wh-001",
    "workerId": "prof-001-uuid",
    "company": "Elite Plumbing Solutions",
    "role": "Senior Plumber",
    "period": "2020-2026",
    "description": "Led a team of 5 plumbers...",
    "createdAt": "2026-05-20T10:35:00Z"
  }
  ```

---

### 5. Add Certifications

- **Method:** `POST`
- **Endpoint:** `https://client-search-backend.onrender.com/api/workers/profile/{{worker_id}}/certifications`
- **Headers:**
  ```
  Content-Type: application/json
  Authorization: Bearer {{WORKER_TOKEN}}
  ```
- **Request Body:**
  ```json
  {
    "name": "Master Plumber License",
    "issuer": "NITA (National Industrial Training Authority)",
    "year": 2024
  }
  ```
- **Expected Response (200 OK):**
  ```json
  {
    "id": "cert-001",
    "workerId": "prof-001-uuid",
    "name": "Master Plumber License",
    "issuer": "NITA",
    "year": 2024,
    "createdAt": "2026-05-20T10:40:00Z"
  }
  ```

---

### 6. Upload Profile Picture

- **Method:** `POST`
- **Endpoint:** `https://client-search-backend.onrender.com/api/workers/profile/{{worker_id}}/picture`
- **Headers:**
  ```
  Authorization: Bearer {{WORKER_TOKEN}}
  ```
- **Body (form-data):**
  - `file`: [Select an image file (JPG/PNG, max 5MB)]
- **Expected Response (200 OK):**
  ```json
  {
    "id": "prof-001-uuid",
    "profilePictureUrl": "https://storage.onrender.com/profiles/prof-001-uuid.jpg",
    "message": "Profile picture updated successfully"
  }
  ```

---

### 7. Upload ID Documents (Primary Credentials)

#### 7a. Upload ID Front

- **Method:** `POST`
- **Endpoint:** `https://client-search-backend.onrender.com/api/documents/upload`
- **Headers:**
  ```
  Authorization: Bearer {{WORKER_TOKEN}}
  ```
- **Body (form-data):**
  - `workerProfileId`: `prof-001-uuid`
  - `type`: `ID-Front`
  - `name`: `James_National_ID_Front`
  - `file`: [Select ID front image]
- **Expected Response (200 OK):**
  ```json
  {
    "id": "doc-id-front-001",
    "workerId": "prof-001-uuid",
    "type": "ID-Front",
    "name": "James_National_ID_Front",
    "documentUrl": "https://storage.onrender.com/documents/doc-id-front-001.jpg",
    "status": "UPLOADED",
    "uploadedAt": "2026-05-20T11:00:00Z"
  }
  ```

#### 7b. Upload ID Back

- **Method:** `POST`
- **Endpoint:** `https://client-search-backend.onrender.com/api/documents/upload`
- **Headers:**
  ```
  Authorization: Bearer {{WORKER_TOKEN}}
  ```
- **Body (form-data):**
  - `workerProfileId`: `prof-001-uuid`
  - `type`: `ID-Back`
  - `name`: `James_National_ID_Back`
  - `file`: [Select ID back image]
- **Expected Response (200 OK):** Same as 7a, but with `type: ID-Back`

---

### 8. Upload Trade Certification Documents (Secondary Proof)

- **Method:** `POST`
- **Endpoint:** `https://client-search-backend.onrender.com/api/documents/upload`
- **Headers:**
  ```
  Authorization: Bearer {{WORKER_TOKEN}}
  ```
- **Body (form-data):**
  - `workerProfileId`: `prof-001-uuid`
  - `type`: `Certification`
  - `name`: `Master_Plumber_Certificate_2024`
  - `file`: [Select PDF or image file]
- **Expected Response (200 OK):**
  ```json
  {
    "id": "doc-cert-001",
    "workerId": "prof-001-uuid",
    "type": "Certification",
    "name": "Master_Plumber_Certificate_2024",
    "documentUrl": "https://storage.onrender.com/documents/doc-cert-001.pdf",
    "status": "UPLOADED",
    "uploadedAt": "2026-05-20T11:05:00Z"
  }
  ```

---

### 9. Get Worker Profile (Check Completion %)

- **Method:** `GET`
- **Endpoint:** `https://client-search-backend.onrender.com/api/workers/profile`
- **Headers:**
  ```
  Authorization: Bearer {{WORKER_TOKEN}}
  ```
- **Expected Response (200 OK):**
  ```json
  {
    "id": "prof-001-uuid",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "James Kipchoge",
    "email": "james@plumber.com",
    "category": "Plumber",
    "status": "DRAFT",
    "completionPercentage": 100,
    "skills": ["Pipe Repair", "Installation", "Maintenance", "Emergency Response"],
    "workHistory": [{ "company": "Elite Plumbing Solutions", ... }],
    "certifications": [{ "name": "Master Plumber License", ... }],
    "documents": [
      { "type": "ID-Front", "status": "UPLOADED", ... },
      { "type": "ID-Back", "status": "UPLOADED", ... },
      { "type": "Certification", "status": "UPLOADED", ... }
    ],
    "isVisible": false
  }
  ```

---

### 10. Submit Profile for Verification

- **Method:** `PUT`
- **Endpoint:** `https://client-search-backend.onrender.com/api/workers/profile/{{worker_id}}/submit`
- **Headers:**
  ```
  Authorization: Bearer {{WORKER_TOKEN}}
  ```
- **Request Body:**
  ```json
  {}
  ```
- **Expected Response (200 OK):**
  ```json
  {
    "id": "prof-001-uuid",
    "status": "PENDING",
    "message": "Profile submitted for verification",
    "isVisible": false,
    "submittedAt": "2026-05-20T11:10:00Z"
  }
  ```

---

## Phase 3: Admin Review & Approval

### 11. Admin Login

- **Method:** `POST`
- **Endpoint:** `https://client-search-backend.onrender.com/api/auth/login`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Request Body:**
  ```json
  {
    "email": "admin@kazikonnect.com",
    "password": "AdminPass123!"
  }
  ```
- **Expected Response (200 OK):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "admin-uuid-001",
      "username": "admin",
      "email": "admin@kazikonnect.com",
      "role": "ADMIN"
    },
    "expiresIn": 86400
  }
  ```

---

### 12. Get Pending Workers (Admin)

- **Method:** `GET`
- **Endpoint:** `https://client-search-backend.onrender.com/api/admin/workers/pending`
- **Headers:**
  ```
  Authorization: Bearer {{ADMIN_TOKEN}}
  ```
- **Expected Response (200 OK):**
  ```json
  {
    "content": [
      {
        "id": "prof-001-uuid",
        "fullName": "James Kipchoge",
        "email": "james@plumber.com",
        "category": "Plumber",
        "status": "PENDING",
        "submittedAt": "2026-05-20T11:10:00Z",
        "documents": [
          { "type": "ID-Front", "status": "UPLOADED" },
          { "type": "ID-Back", "status": "UPLOADED" },
          { "type": "Certification", "status": "UPLOADED" }
        ]
      }
    ],
    "totalElements": 1,
    "currentPage": 0
  }
  ```

---

### 13. Approve Worker (Admin)

- **Method:** `PUT`
- **Endpoint:** `https://client-search-backend.onrender.com/api/admin/workers/{{worker_id}}/approve`
- **Headers:**
  ```
  Content-Type: application/json
  Authorization: Bearer {{ADMIN_TOKEN}}
  ```
- **Request Body:**
  ```json
  {
    "adminNotes": "All documents verified. Licensed plumber with excellent credentials."
  }
  ```
- **Expected Response (200 OK):**
  ```json
  {
    "id": "prof-001-uuid",
    "fullName": "James Kipchoge",
    "status": "VERIFIED",
    "isVisible": true,
    "message": "Worker verified and is now live on marketplace!",
    "approvedAt": "2026-05-20T11:15:00Z"
  }
  ```

---

### 14. Reject Worker (Admin)

- **Method:** `PUT`
- **Endpoint:** `https://client-search-backend.onrender.com/api/admin/workers/{{worker_id}}/reject`
- **Headers:**
  ```
  Content-Type: application/json
  Authorization: Bearer {{ADMIN_TOKEN}}
  ```
- **Request Body:**
  ```json
  {
    "rejectionReason": "ID documents appear to be expired. Please resubmit with valid identification."
  }
  ```
- **Expected Response (200 OK):**
  ```json
  {
    "id": "prof-001-uuid",
    "status": "REJECTED",
    "rejectionReason": "ID documents appear to be expired...",
    "message": "Worker profile rejected. Notification sent.",
    "rejectedAt": "2026-05-20T11:20:00Z"
  }
  ```

---

## Phase 4: Client Registration & Marketplace Search

### 15. Register as Client

- **Method:** `POST`
- **Endpoint:** `https://client-search-backend.onrender.com/api/auth/register`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Request Body:**
  ```json
  {
    "username": "alice_client",
    "email": "alice@client.com",
    "password": "ClientPass123!",
    "role": "CLIENT"
  }
  ```
- **Expected Response (200 OK):** Same format as worker registration

---

### 16. Login as Client

- **Method:** `POST`
- **Endpoint:** `https://client-search-backend.onrender.com/api/auth/login`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Request Body:**
  ```json
  {
    "email": "alice@client.com",
    "password": "ClientPass123!"
  }
  ```
- **Expected Response (200 OK):** JWT token for Client

---

### 17. Search Verified Workers by Location

- **Method:** `GET`
- **Endpoint:** `https://client-search-backend.onrender.com/api/marketplace/search?location=Nairobi`
- **Headers:**
  ```
  Authorization: Bearer {{CLIENT_TOKEN}}
  ```
- **Expected Response (200 OK):**
  ```json
  {
    "content": [
      {
        "id": "prof-001-uuid",
        "fullName": "James Kipchoge",
        "category": "Plumber",
        "hourlyRate": 800,
        "rating": 4.8,
        "reviews": 25,
        "location": "Nairobi",
        "bio": "Licensed plumber with 6 years experience...",
        "skills": ["Pipe Repair", "Installation", "Maintenance", "Emergency Response"],
        "profilePictureUrl": "https://storage.onrender.com/profiles/prof-001-uuid.jpg",
        "status": "VERIFIED",
        "isOnline": true
      }
    ],
    "totalElements": 1
  }
  ```

---

### 18. Search Workers by Category

- **Method:** `GET`
- **Endpoint:** `https://client-search-backend.onrender.com/api/marketplace/search?category=Plumber`
- **Headers:**
  ```
  Authorization: Bearer {{CLIENT_TOKEN}}
  ```
- **Expected Response (200 OK):** Same format as 17

---

## Phase 5: Job Requests & Communication

### 19. Create Job Request

- **Method:** `POST`
- **Endpoint:** `https://client-search-backend.onrender.com/api/jobs/request`
- **Headers:**
  ```
  Content-Type: application/json
  Authorization: Bearer {{CLIENT_TOKEN}}
  ```
- **Request Body:**
  ```json
  {
    "workerProfileId": "prof-001-uuid",
    "description": "Kitchen sink leak repair and pipe inspection",
    "location": "Nairobi West, Runda",
    "scheduledDate": "2026-05-25T14:30:00Z",
    "estimatedBudget": 3000
  }
  ```
- **Expected Response (200 OK):**
  ```json
  {
    "id": "job-req-001",
    "clientId": "client-uuid-001",
    "workerId": "prof-001-uuid",
    "description": "Kitchen sink leak repair and pipe inspection",
    "location": "Nairobi West, Runda",
    "scheduledDate": "2026-05-25T14:30:00Z",
    "estimatedBudget": 3000,
    "status": "PENDING",
    "createdAt": "2026-05-20T12:00:00Z"
  }
  ```

---

### 20. Send Message to Worker

- **Method:** `POST`
- **Endpoint:** `https://client-search-backend.onrender.com/api/messages`
- **Headers:**
  ```
  Content-Type: application/json
  Authorization: Bearer {{CLIENT_TOKEN}}
  ```
- **Request Body:**
  ```json
  {
    "recipientId": "prof-001-uuid",
    "content": "Hi James, I have an urgent kitchen sink leak. Can you come tomorrow morning?"
  }
  ```
- **Expected Response (200 OK):**
  ```json
  {
    "id": "msg-001",
    "senderId": "client-uuid-001",
    "recipientId": "prof-001-uuid",
    "content": "Hi James, I have an urgent kitchen sink leak...",
    "timestamp": "2026-05-20T12:05:00Z",
    "isRead": false
  }
  ```

---

### 21. Get Messages (Retrieve Conversation)

- **Method:** `GET`
- **Endpoint:** `https://client-search-backend.onrender.com/api/messages?withUserId={{worker_id}}`
- **Headers:**
  ```
  Authorization: Bearer {{CLIENT_TOKEN}}
  ```
- **Expected Response (200 OK):**
  ```json
  {
    "messages": [
      {
        "id": "msg-001",
        "senderId": "client-uuid-001",
        "senderName": "Alice",
        "content": "Hi James, I have an urgent kitchen sink leak...",
        "timestamp": "2026-05-20T12:05:00Z",
        "isRead": true
      }
    ]
  }
  ```

---

## Phase 6: Reviews & Ratings

### 22. Leave Review (After Job Completion)

- **Method:** `POST`
- **Endpoint:** `https://client-search-backend.onrender.com/api/reviews`
- **Headers:**
  ```
  Content-Type: application/json
  Authorization: Bearer {{CLIENT_TOKEN}}
  ```
- **Request Body:**
  ```json
  {
    "workerId": "prof-001-uuid",
    "jobId": "job-req-001",
    "rating": 5,
    "comment": "James was professional, punctual, and thorough. Highly recommend!"
  }
  ```
- **Expected Response (200 OK):**
  ```json
  {
    "id": "review-001",
    "clientId": "client-uuid-001",
    "workerId": "prof-001-uuid",
    "jobId": "job-req-001",
    "rating": 5,
    "comment": "James was professional, punctual, and thorough...",
    "createdAt": "2026-05-20T16:00:00Z"
  }
  ```

---

### 23. Get Worker Reviews & Rating

- **Method:** `GET`
- **Endpoint:** `https://client-search-backend.onrender.com/api/workers/{{worker_id}}/reviews`
- **Headers:**
  ```
  Authorization: Bearer {{CLIENT_TOKEN}}
  ```
- **Expected Response (200 OK):**
  ```json
  {
    "workerId": "prof-001-uuid",
    "averageRating": 4.85,
    "totalReviews": 26,
    "reviews": [
      {
        "id": "review-001",
        "clientName": "Alice",
        "rating": 5,
        "comment": "James was professional, punctual...",
        "createdAt": "2026-05-20T16:00:00Z"
      }
    ]
  }
  ```

---

## Testing Checklist

- [ ] Worker Registration & Login
- [ ] Profile Creation (100% completion)
- [ ] Work History Added
- [ ] Certifications Added
- [ ] ID Documents Uploaded (Front & Back)
- [ ] Trade Certification Documents Uploaded
- [ ] Profile Submitted for Verification
- [ ] Admin Approval Successful
- [ ] Worker Visible in Marketplace
- [ ] Client Can Search & Find Worker
- [ ] Job Request Created
- [ ] Messages Exchanged
- [ ] Review Left & Rating Updated

---

## Postman Environment Variables

Set up these variables in Postman for easier testing:

```
{
  "base_url": "https://client-search-backend.onrender.com/api",
  "worker_token": "{{paste worker JWT here}}",
  "admin_token": "{{paste admin JWT here}}",
  "client_token": "{{paste client JWT here}}",
  "worker_id": "{{paste worker profile ID here}}",
  "client_id": "{{paste client ID here}}"
}
```

Then use `{{base_url}}`, `{{worker_token}}`, etc. in your requests!

---

## Common Response Status Codes

| Code | Meaning |
|------|---------|
| **200** | OK - Request successful |
| **201** | Created - Resource created successfully |
| **400** | Bad Request - Invalid input |
| **401** | Unauthorized - Missing or invalid token |
| **403** | Forbidden - Insufficient permissions |
| **404** | Not Found - Resource doesn't exist |
| **500** | Server Error - Backend issue |

---

## Troubleshooting

**Issue:** 401 Unauthorized
- **Solution:** Check that your Bearer token is valid and not expired. Re-login to get a new token.

**Issue:** 403 Forbidden
- **Solution:** Ensure you have the correct role (Admin/Worker/Client) for that endpoint.

**Issue:** Profile stuck at 80%
- **Solution:** Make sure to upload:
  1. Trade Certification proof documents (20%)
  2. ID Front & Back documents (20%)
  3. All profile data filled out

**Issue:** Cannot find worker in marketplace
- **Solution:** Verify worker status is "VERIFIED" (approved by admin) and `isVisible` is `true`.

