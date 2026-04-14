# HealthMonitor Pro - Backend Documentation (Frontend-Aligned)

Version: 2.0
Last updated: 2026-04-10
Scope: Backend planning and implementation guide based on completed frontend flows.

---

## 1. Goal

This document defines the backend requirements needed to support the current frontend implementation.
It includes:
- role-based auth and access control
- API contracts mapped to frontend routes
- MongoDB local setup
- data models and indexes
- sockets and notifications
- phased implementation plan

---

## 2. Current Frontend Route Map

The frontend already includes these routes in src/App.tsx:

### Public
- /
- /doctors
- /doctors/:id
- /blogs
- /login
- /register

### Patient
- /patient/dashboard
- /patient/vitals
- /patient/trends
- /patient/doctors
- /patient/appointments
- /patient/prescriptions
- /patient/messages

### Doctor
- /doctor/dashboard
- /doctor/patients
- /doctor/patients/:id
- /doctor/blogs
- /doctor/prescriptions
- /doctor/appointments
- /doctor/messages
- /doctor/profile
- /doctor/pending-approval

### Admin
- /admin/login
- /admin/dashboard
- /admin/doctors
- /admin/blogs
- /admin/analytics

Backend APIs must support all the data and actions required by these screens.

---

## 3. Backend Status (Current)

Backend scaffold currently exists under backend/src with:
- routes for auth, patients, doctors, vitals, blogs, admin, chat
- server bootstrapping with Express + Socket.io
- Mongo connection utility
- middleware placeholders
- service placeholders
- model placeholders

Important: routes and models are currently placeholders and must be fully implemented.

---

## 4. Local MongoDB Setup (Windows)

### 4.1 Install MongoDB Community Server
1. Download MongoDB Community Server.
2. Install as Windows Service (recommended).
3. Confirm service is running.

### 4.2 Verify local connection
Use:

```powershell
mongosh "mongodb://127.0.0.1:27017"
```

If connected, create/use database:

```javascript
use healthmonitorpro
```

### 4.3 Backend env for local MongoDB
In backend/.env use:

```env
NODE_ENV=development
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/healthmonitorpro
JWT_ACCESS_PRIVATE_KEY=
JWT_ACCESS_PUBLIC_KEY=
JWT_REFRESH_PRIVATE_KEY=
JWT_REFRESH_PUBLIC_KEY=
```

Notes:
- For initial development, local MongoDB is enough.
- Keep JWT keys in .env only.

---

## 5. Recommended Backend Architecture

### 5.1 Stack
- Node.js + Express
- MongoDB + Mongoose
- JWT (access + refresh)
- Socket.io (chat + notifications)

### 5.2 Folder layout

```text
backend/src
  config/
  controllers/
  middleware/
  models/
  routes/
  services/
  sockets/
  utils/
  server.js
```

### 5.3 Layer responsibilities
- routes: path and middleware wiring
- controllers: request/response orchestration
- services: business logic and reusable domain actions
- models: schema + indexes + statics/methods
- middleware: auth, validation, role checks, error handling

---

## 6. Role and Access Model

Roles:
- patient
- doctor
- admin

Doctor account statuses:
- pending
- approved
- rejected
- suspended

Rules:
- patient sees only own data
- doctor sees assigned/connected patients
- admin has full platform management access

---

## 7. Data Model Design (MongoDB)

### 7.1 users
Core identity for all roles.

Fields:
- _id
- role: patient | doctor | admin
- fullName
- email (unique)
- phone
- passwordHash
- isActive
- createdAt
- updatedAt

Indexes:
- unique(email)
- role + isActive

### 7.2 patientProfiles
Fields:
- userId (ref users, unique)
- dob
- gender
- bloodGroup
- heightCm
- weightKg
- allergies: string[]
- medications: string[]
- medicalHistory
- emergencyContact { name, relationship, phone }
- connectedDoctorIds: ObjectId[]

Indexes:
- unique(userId)
- connectedDoctorIds

### 7.3 doctorProfiles
Fields:
- userId (ref users, unique)
- specialization
- licenseNumber
- qualifications: string[]
- experienceYears
- hospital
- fee
- bio
- availability
- approvalStatus: pending | approved | rejected | suspended
- approvalNote
- approvedBy
- approvedAt

Indexes:
- unique(userId)
- unique(licenseNumber)
- approvalStatus
- specialization

### 7.4 vitalRecords
Fields:
- patientId (userId)
- datetime
- bloodPressure { systolic, diastolic }
- heartRate
- spo2
- temperatureC
- glucose { value, mode }
- weightKg
- notes
- riskLevel: normal | medium | high
- riskReasons: string[]

Indexes:
- patientId + datetime(desc)
- patientId + riskLevel

### 7.5 appointments
Fields:
- patientId
- doctorId
- type: in_person | teleconsult
- date
- time
- status: pending | confirmed | completed | cancelled
- notes
- createdBy

Indexes:
- patientId + date
- doctorId + date
- status

### 7.6 prescriptions
Fields:
- patientId
- doctorId
- diagnosis
- medications: [{ name, dosage, frequency, duration }]
- instructions
- followUpDate
- issuedAt
- pdfUrl

Indexes:
- patientId + issuedAt(desc)
- doctorId + issuedAt(desc)

### 7.7 blogs
Fields:
- authorId
- authorRole: doctor | admin
- title
- excerpt
- content
- coverImageUrl
- category
- tags: string[]
- status: draft | pending_review | published | rejected | unpublished
- rejectionReason
- submittedAt
- publishedAt
- views
- likes

Indexes:
- status + submittedAt
- status + publishedAt
- category
- tags

### 7.8 conversations and messages
conversations:
- participantIds: ObjectId[]
- lastMessageAt

messages:
- conversationId
- senderId
- messageType: text | file | prescription
- text
- fileUrl
- readBy: ObjectId[]
- createdAt

Indexes:
- conversationId + createdAt
- participantIds (conversation)

### 7.9 notifications
Fields:
- userId
- type
- title
- body
- isRead
- metadata
- createdAt

Indexes:
- userId + isRead
- userId + createdAt(desc)

### 7.10 auditLogs (admin actions)
Fields:
- actorId
- actorRole
- action
- entityType
- entityId
- details
- createdAt

Indexes:
- actorId + createdAt(desc)
- entityType + entityId

---

## 8. API Contract (Required)

Base: /api

### 8.1 Auth
- POST /auth/register/patient
- POST /auth/register/doctor
- POST /auth/login
- POST /auth/admin/login
- POST /auth/refresh
- POST /auth/logout
- GET /auth/me

### 8.2 Public
- GET /doctors
- GET /doctors/:doctorId/public
- GET /blogs/public
- GET /blogs/public/:blogId

### 8.3 Patient
- GET /patients/me/dashboard
- GET /patients/me/profile
- PATCH /patients/me/profile
- GET /vitals/me
- POST /vitals/me
- PATCH /vitals/me/:vitalId
- DELETE /vitals/me/:vitalId
- GET /vitals/me/trends
- GET /patients/me/doctors
- POST /patients/me/doctors/:doctorId/connect
- DELETE /patients/me/doctors/:doctorId/disconnect
- GET /appointments/me
- POST /appointments/me
- PATCH /appointments/me/:appointmentId
- POST /appointments/me/:appointmentId/cancel
- GET /prescriptions/me
- GET /prescriptions/me/:prescriptionId/pdf
- GET /chat/me/conversations
- GET /chat/me/conversations/:conversationId/messages
- POST /chat/me/conversations/:conversationId/messages

### 8.4 Doctor
- GET /doctors/me/dashboard
- GET /doctors/me/patients
- GET /doctors/me/patients/:patientId
- GET /doctors/me/patients/:patientId/trends
- POST /doctors/me/patients/:patientId/notes
- GET /doctors/me/prescriptions
- POST /doctors/me/patients/:patientId/prescriptions
- GET /doctors/me/appointments
- PATCH /doctors/me/appointments/:appointmentId
- GET /doctors/me/blogs
- POST /doctors/me/blogs
- PATCH /doctors/me/blogs/:blogId
- POST /doctors/me/blogs/:blogId/submit
- GET /doctors/me/profile
- PATCH /doctors/me/profile

### 8.5 Admin
- GET /admin/dashboard
- GET /admin/doctors
- GET /admin/doctors/pending
- POST /admin/doctors/:doctorId/approve
- POST /admin/doctors/:doctorId/reject
- POST /admin/doctors/:doctorId/suspend
- GET /admin/blogs
- GET /admin/blogs/pending
- POST /admin/blogs/:blogId/publish
- POST /admin/blogs/:blogId/reject
- POST /admin/blogs
- PATCH /admin/blogs/:blogId
- GET /admin/analytics/overview
- GET /admin/analytics/growth
- GET /admin/analytics/blogs

---

## 9. Risk Engine Rules (Vitals)

Initial deterministic rules:
- blood pressure >= 150/95 => high
- blood pressure 135-149 or 85-94 => medium
- glucose fasting >= 126 => high
- glucose post_meal >= 180 => high
- spo2 < 94 => high
- heartRate > 110 or < 50 => medium/high by threshold

Save riskLevel and riskReasons with each vital record.
Trigger notifications for medium/high.

---

## 10. Realtime (Socket.io)

Namespaces/rooms strategy:
- room:user:<userId>
- room:conversation:<conversationId>

Core events:
- chat:message:send
- chat:message:new
- chat:message:read
- notification:new
- notification:read

---

## 11. Validation and Security Requirements

- Use schema validation on all write APIs (zod/joi/express-validator)
- Hash password with bcrypt
- Access token short-lived, refresh token rotation
- Role checks on every protected route
- Rate limit login/admin login routes
- Never trust role from frontend payload
- Return standardized errors:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "Invalid email" }]
}
```

---

## 12. Implementation Phases (Recommended)

Phase 1: Foundation
- finalize Mongoose schemas
- seed admin user
- auth and me endpoints

Phase 2: Patient core
- vitals CRUD + trends
- doctors connect list
- appointments and prescriptions read

Phase 3: Doctor core
- patient list/detail
- prescriptions create
- blog draft/submit flow

Phase 4: Admin core
- doctor approvals
- blog moderation
- analytics endpoints

Phase 5: Realtime and hardening
- chat sockets
- notification sockets
- audit logs, rate limits, error normalization

---

## 13. Local Development Commands

From backend:

```powershell
npm install
npm run dev
```

Health check:

```text
GET http://localhost:5000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "healthmonitorpro-backend"
}
```

---

## 14. Definition of Done for Backend v1

Backend v1 is done when:
- all routes used by existing frontend screens return real data
- auth and role guards are fully enforced
- doctor approval lifecycle works end-to-end
- blog submission and admin publish/reject flow works end-to-end
- patient vitals create + trend + risk flags work
- prescriptions and appointments support patient and doctor dashboards
- local MongoDB setup works from a fresh clone with documented steps

---

## 15. Next Immediate Task List

1. Implement real Mongoose schemas for all placeholder models.
2. Implement auth controller with register/login/refresh/logout/me.
3. Add doctor status enforcement (pending doctor cannot access doctor dashboard APIs).
4. Implement vitals endpoints and risk engine integration.
5. Implement admin doctor/blog review endpoints.

This is the source-of-truth backend plan for the current frontend state.
