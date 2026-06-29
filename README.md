# Kazi Konnect

A full-stack Kenya-focused workforce marketplace platform with a Spring Boot backend, Angular frontend, M-Pesa escrow payments, Cloudinary media uploads, real-time messaging, dispute resolution, and admin management.

## Project Structure

- `backend/` - Java Spring Boot API server
- `Web-App/` - Angular 21 frontend with server-side rendering support
- `render.yaml` - Render deployment configuration for the backend
- `backend/docker-compose.yml` - Local PostgreSQL setup
- `backend/Dockerfile` - Container build definition for the backend

## Technology Stack

### Backend
- Java 21
- Spring Boot 3.4.5
- Spring Security, JWT authentication
- Spring Data JPA + Hibernate
- PostgreSQL runtime, H2 support for local tests
- Flyway database migrations
- Cloudinary image upload integration
- M-Pesa STK PUSH + B2C callback handling
- Spring WebSocket support for real-time messaging
- Spring Mail for email verification and password reset
- `spring-dotenv` environment variable support

### Frontend
- Angular 21
- Angular Material
- Angular SSR support via `@angular/ssr`
- RxJS
- STOMP over WebSocket with SockJS fallback
- Tailwind CSS
- Prettier formatting
- Vitest testing support

## Key Features

- User registration and login with email verification
- Role-based access control: Client, Worker, Admin
- Public worker marketplace search by skill and location
- Worker profile creation, document upload, and verification workflow
- Client booking and negotiation flow with offer/counter-offer support
- Escrow-backed payment lifecycle using M-Pesa
- Wallet summary, withdraw requests, and admin credit adjustments
- Real-time messaging and conversation features
- Dispute filing, evidence collection, and admin resolution
- Admin user, job, dispute, fee, and activity management
- Media uploads via Cloudinary
- Health check endpoint and OpenAPI documentation support

## Backend Overview

The backend is implemented as a Spring Boot application with the following major modules:

- `AuthController` - registration, login, password reset, email verification
- `ClientController` - client profile CRUD
- `WorkerController` - worker profile CRUD, profile picture upload, verification submission
- `MarketplaceController` - public marketplace search, skill/location listings, worker detail retrieval
- `JobRequestController` - hire request creation, counter offers, accept/reject flows, job listings for client and worker, dispute integration
- `PaymentController` - M-Pesa STK push initiation, payment status, receipt verification, escrow release/refund, B2C callbacks
- `WalletController` - wallet balance, withdraw requests, transaction history, admin credit operations
- `DisputeController` - dispute creation, evidence upload, request evidence, messaging, resolution, admin audit trail
- `MessageController` - contact lists, conversation retrieval, message sending, typing indicator
- `NotificationController` - unread notifications and user notification retrieval
- `MediaController` - file upload endpoint for Cloudinary
- `AdminController` - admin dashboards and management APIs

### Security and Auth

- JWT authentication with a stateless filter chain
- Password hashing via BCrypt
- CORS is configured for `http://localhost:4200` and `https://client-worker-connection-platform.vercel.app`
- Public routes include auth, marketplace search, worker reviews, M-Pesa callbacks, health, Swagger, and some marketplace resources
- Admin-only APIs are scoped under `/api/admin/**`

## Frontend Overview

The Angular frontend uses standalone components and route-based lazy loading. It exposes distinct experiences for:

- Guest users: landing, login, register, password reset, email verification
- Clients: marketplace, negotiation, worker profiles, bookings, messages, settings
- Workers: dashboard, profile management, document verification, history, messages, settings
- Admins: dashboard, verification queue, user/job/dispute management, fee tracking, activity logs, messaging

### Route Structure

The route groupings are defined in `Web-App/src/app/app.routes.ts`:

- `/` - public landing page
- `/login`, `/register`, `/reset-password`, `/verify-email`
- `/client/*` - client workspace
- `/worker/*` - worker workspace
- `/admin/*` - admin workspace

Common shared pages include messaging and settings.

## Environment Variables

The backend reads configuration from environment variables via `backend/src/main/resources/application.properties`.

### Required backend env vars

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `MPESA_ENV` (default: `sandbox`)
- `MPESA_CONSUMER_KEY`
- `MPESA_CONSUMER_SECRET`
- `MPESA_SHORTCODE`
- `MPESA_PASSKEY`
- `MPESA_CALLBACK_URL`
- `MPESA_CALLBACK_ALLOWED_IPS`
- `MPESA_CALLBACK_SECRET`
- `MPESA_B2C_INITIATOR_NAME`
- `MPESA_B2C_SECURITY_CREDENTIAL`
- `MPESA_SECURITY_CREDENTIAL`
- `MPESA_B2C_RESULT_URL`
- `MPESA_B2C_TIMEOUT_URL`
- `PAYMENT_B2C_MAX_RETRIES`
- `PAYMENT_B2C_INITIAL_BACKOFF_MINUTES`
- `PAYMENT_B2C_MAX_BACKOFF_MINUTES`
- `PAYMENT_STK_PUSH_TIMEOUT_MINUTES`
- `PAYMENT_PLATFORM_FEE_PERCENT`
- `ADMIN_EMAIL`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `DATA_SEED_ENABLED`
- `EMAIL_SMTP_USERNAME`
- `EMAIL_SMTP_PASSWORD`
- `EMAIL_FROM`
- `EMAIL_TMP_DIR`
- `FRONTEND_URL`

### Frontend configuration

The frontend environment is configured in `Web-App/src/environments/environment.ts`:

- `frontendUrl` - `http://localhost:4200`
- `backendUrl` - `http://localhost:8080`
- `apiUrl` - `http://localhost:8080/api`
- `authUrl` - `http://localhost:8080/api/auth`

## Local Development

### Backend

1. Install Java 21 and Maven.
2. Configure the required environment variables.
3. Start local PostgreSQL or use `backend/docker-compose.yml`:

```bash
cd backend
docker compose up -d
```

4. Build and run:

```bash
cd backend
mvn clean package -DskipTests
java -jar target/*.jar
```

Or run directly with Spring Boot:

```bash
mvn spring-boot:run
```

### Frontend

1. Install Node.js and npm 10.
2. Install packages:

```bash
cd Web-App
npm install
```

3. Run the development server:

```bash
npm start
```

4. Open `http://localhost:4200`

### SSR Frontend

Build and serve the server-side rendered frontend:

```bash
cd Web-App
npm run build
npm run serve:ssr:Web-App
```

## Docker and Deployment

### Backend Docker

The backend includes a multi-stage Dockerfile in `backend/Dockerfile`.

Build locally:

```bash
docker build -t kazikonnect-backend ./backend
```

Run container:

```bash
docker run -p 8080:8080 --env-file ./backend/.env kazikonnect-backend
```

### Render

The repository includes `render.yaml` for a backend service named `kazikonnect-backend`.

It requires Docker deployment and environment variables for database and external credentials.

## API Documentation

Swagger/OpenAPI is available via Springdoc under the backend server at:

- `/v3/api-docs`
- `/swagger-ui/index.html`

## Important Endpoints

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/password-reset/request`
- `POST /api/auth/password-reset/confirm`
- `POST /api/auth/resend-verification`
- `POST /api/auth/verify-email`

### Marketplace
- `GET /api/marketplace/skills`
- `GET /api/marketplace/locations`
- `GET /api/marketplace/search`
- `GET /api/marketplace/workers/{profileId}`

### Worker profile
- `POST /api/workers/profile`
- `GET /api/workers/profile/{userId}`
- `POST /api/workers/profile/{userId}/profile-picture`

### Client profile
- `POST /api/clients/profile`
- `GET /api/clients/profile/{userId}`

### Job requests and negotiations
- `POST /api/jobs/request`
- `POST /api/jobs/{jobId}/counter-offer`
- `POST /api/jobs/{jobId}/accept-counter-offer`
- `POST /api/jobs/{jobId}/client-counter-offer`
- `POST /api/jobs/{jobId}/reject-counter-offer`
- `GET /api/jobs/client/{clientId}`
- `GET /api/jobs/worker/user/{userId}`
- `POST /api/jobs/{jobId}/dispute`
- `POST /api/jobs/{jobId}/dispute/respond`
- `POST /api/jobs/{jobId}/admin/resolve`

### Payments
- `POST /api/payments/mpesa/stkpush`
- `GET /api/payments/status/{jobId}`
- `GET /api/payments/receipt/{jobId}`
- `POST /api/payments/verify-receipt/{jobId}`
- `POST /api/payments/escrow/release/{jobId}`
- `POST /api/payments/escrow/refund/{jobId}`
- `GET /api/payments/escrow/all`
- `GET /api/payments/admin/fees`
- `POST /api/payments/mpesa/callback`
- `POST /api/payments/mpesa/result`
- `POST /api/payments/mpesa/timeout`

### Wallet
- `GET /api/wallet/balance`
- `POST /api/wallet/withdraw`
- `GET /api/wallet/transactions`
- `POST /api/wallet/admin/credit`

### Disputes
- `POST /api/disputes/file`
- `POST /api/disputes/{disputeId}/evidence`
- `POST /api/disputes/{disputeId}/request-evidence`
- `POST /api/disputes/{disputeId}/messages`
- `GET /api/disputes/{disputeId}/messages`
- `POST /api/disputes/{disputeId}/resolve`
- `GET /api/disputes/my`
- `GET /api/disputes/admin/{adminId}`
- `GET /api/disputes/unassigned`
- `GET /api/disputes/{disputeId}/audit-trail`

### Messaging and notifications
- `GET /api/messages/contacts`
- `GET /api/messages/contacts/search`
- `GET /api/messages/users`
- `POST /api/messages`
- `GET /api/messages/{messageId}`
- `GET /api/messages/conversation`
- `GET /api/messages/conversation/legacy`
- `GET /api/messages/user/{userId}/recent`
- `GET /api/messages/recent-contacts/{userId}`
- `POST /api/messages/typing`
- `GET /api/notifications/user/{userId}`
- `GET /api/notifications/user/{userId}/unread-count`

### Media
- `POST /api/media/upload`

### Health
- `GET /health`

## Development Notes

- The backend uses `spring.jpa.hibernate.ddl-auto=validate`, so the database schema must be created by Flyway migrations.
- `backend/docker-compose.yml` provides a local PostgreSQL instance for development.
- The frontend uses local state and service wrappers to support client/worker/admin functionality.
- WebSocket messaging is handled by STOMP with fallback via SockJS.

## Useful Commands

### Backend
- `cd backend && mvn clean package -DskipTests`
- `cd backend && mvn spring-boot:run`
- `cd backend && docker compose up -d`

### Frontend
- `cd Web-App && npm install`
- `cd Web-App && npm start`
- `cd Web-App && npm run serve:ssr:Web-App`

## Notes

- The existing `Web-App/README.md` contains a generated Angular scaffold summary. This root README is the authoritative repository-level documentation for the entire full-stack application.
- Review `render.yaml` for Render deployment settings and `backend/Dockerfile` for container packaging.
