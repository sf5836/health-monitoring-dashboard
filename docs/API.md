# HealthMonitor Pro - API Reference

## Base URL
```
Development: http://localhost:5000/api
Production:  https://api.healthmonitorpro.com/api
```

## Authentication

All protected endpoints require a valid JWT access token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### Token Lifecycle
- **Access Token**: 15 minutes, JWT signed with RS256
- **Refresh Token**: 7 days, stored in DB with rotation
- **Rotation**: New refresh token issued on each refresh

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

### Success Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

---

## Auth Endpoints

### Register Patient
```http
POST /auth/register/patient
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "patient@example.com",
  "phone": "+1234567890",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```
**Response**: 201 Created
```json
{
  "success": true,
  "data": {
    "user": { "id", "fullName", "email", "role": "patient", "isActive" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### Register Doctor
```http
POST /auth/register/doctor
Content-Type: application/json

{
  "fullName": "Dr. Jane Smith",
  "email": "doctor@example.com",
  "phone": "+1234567890",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "specialization": "Cardiology",
  "licenseNumber": "MD123456",
  "qualifications": ["MD", "FACC"],
  "experienceYears": 10,
  "hospital": "City General Hospital",
  "fee": 150,
  "bio": "Experienced cardiologist..."
}
```
**Response**: 201 Created (doctor status: pending)

### Login (Patient/Doctor)
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```
**Response**: 200 OK
```json
{
  "success": true,
  "data": {
    "user": { "id", "fullName", "email", "role", "isActive" },
    "doctorProfile": { "approvalStatus" }, // if doctor
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### Admin Login
```http
POST /auth/admin/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "AdminPass123!"
}
```

### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json
Authorization: Bearer <refresh_token>

{
  "refreshToken": "eyJ..."
}
```

### Logout
```http
POST /auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refreshToken": "eyJ..."
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <access_token>
```
**Response**: 200 OK
```json
{
  "success": true,
  "data": {
    "user": { "id", "fullName", "email", "role", "phone", "isActive", "createdAt" },
    "patientProfile": { ... }, // if patient
    "doctorProfile": { ... }   // if doctor
  }
}
```

---

## Public Endpoints

### List Doctors
```http
GET /doctors?page=1&limit=10&specialization=Cardiology&search=heart
```
**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| page | integer | Page number (default: 1) |
| limit | integer | Items per page (default: 10, max: 50) |
| specialization | string | Filter by specialization |
| search | string | Search in name, bio, hospital |
| sortBy | string | Sort field: fee, experienceYears, createdAt |
| sortOrder | string | asc or desc |

**Response**: 200 OK
```json
{
  "success": true,
  "data": {
    "doctors": [
      {
        "id", "fullName", "specialization", "hospital",
        "fee", "experienceYears", "bio", "avgRating", "reviewCount"
      }
    ],
    "pagination": { "page", "limit", "total", "totalPages" }
  }
}
```

### Get Doctor Public Profile
```http
GET /doctors/:doctorId/public
```

### List Public Blogs
```http
GET /blogs/public?page=1&limit=10&category=nutrition&tag=heart-health
```

### Get Public Blog
```http
GET /blogs/public/:blogId
```

---

## Patient Endpoints

### Dashboard
```http
GET /patients/me/dashboard
Authorization: Bearer <patient_token>
```
**Response**: 200 OK
```json
{
  "success": true,
  "data": {
    "vitalsSummary": { "latest": {...}, "riskLevel": "normal" },
    "upcomingAppointments": [...],
    "recentPrescriptions": [...],
    "connectedDoctors": [...],
    "unreadNotifications": 3,
    "unreadMessages": 1
  }
}
```

### Profile
```http
GET /patients/me/profile
PATCH /patients/me/profile
Authorization: Bearer <patient_token>
```
**PATCH Body**:
```json
{
  "fullName": "John Doe",
  "phone": "+1234567890",
  "dob": "1990-01-15",
  "gender": "male",
  "bloodGroup": "O+",
  "heightCm": 175,
  "weightKg": 70,
  "allergies": ["Penicillin"],
  "medications": ["Metformin 500mg"],
  "medicalHistory": "Type 2 Diabetes",
  "emergencyContact": {
    "name": "Jane Doe",
    "relationship": "Spouse",
    "phone": "+1987654321"
  }
}
```

### Vitals

#### List Vitals
```http
GET /vitals/me?page=1&limit=20&startDate=2024-01-01&endDate=2024-12-31&riskLevel=high
```

#### Create Vital
```http
POST /vitals/me
Authorization: Bearer <patient_token>
Content-Type: application/json

{
  "datetime": "2024-01-15T10:30:00Z",
  "bloodPressure": { "systolic": 120, "diastolic": 80 },
  "heartRate": 72,
  "spo2": 98,
  "temperatureC": 36.6,
  "glucose": { "value": 95, "mode": "fasting" },
  "weightKg": 70.5,
  "notes": "Morning reading"
}
```

#### Update Vital
```http
PATCH /vitals/me/:vitalId
```

#### Delete Vital
```http
DELETE /vitals/me/:vitalId
```

#### Get Trends
```http
GET /vitals/me/trends?metric=bloodPressure&period=30d
```
**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| metric | string | bloodPressure, heartRate, spo2, temperature, glucose, weight |
| period | string | 7d, 30d, 90d, 1y |
| interval | string | hour, day, week (auto if omitted) |

**Response**:
```json
{
  "success": true,
  "data": {
    "metric": "bloodPressure",
    "period": "30d",
    "dataPoints": [
      { "datetime": "2024-01-01", "systolic": 120, "diastolic": 80, "riskLevel": "normal" },
      ...
    ],
    "statistics": { "avgSystolic": 122, "avgDiastolic": 81, "maxRiskLevel": "medium" }
  }
}
```

### Doctors

#### List Connected Doctors
```http
GET /patients/me/doctors
```

#### Connect to Doctor
```http
POST /patients/me/doctors/:doctorId/connect
```

#### Disconnect from Doctor
```http
DELETE /patients/me/doctors/:doctorId/disconnect
```

### Appointments

#### List Appointments
```http
GET /appointments/me?status=upcoming&page=1&limit=10
```

#### Create Appointment
```http
POST /appointments/me
Authorization: Bearer <patient_token>
Content-Type: application/json

{
  "doctorId": "ObjectId",
  "type": "in_person",
  "date": "2024-02-01",
  "time": "10:30",
  "notes": "Follow-up for blood pressure"
}
```

#### Update Appointment
```http
PATCH /appointments/me/:appointmentId
```
**Body**:
```json
{
  "date": "2024-02-02",
  "time": "11:00",
  "notes": "Rescheduled"
}
```

#### Cancel Appointment
```http
POST /appointments/me/:appointmentId/cancel
```

### Prescriptions

#### List Prescriptions
```http
GET /prescriptions/me?page=1&limit=10
```

#### Download Prescription PDF
```http
GET /prescriptions/me/:prescriptionId/pdf
```
**Response**: PDF file (Content-Type: application/pdf)

### Chat

#### List Conversations
```http
GET /chat/me/conversations
```

#### Get Messages
```http
GET /chat/me/conversations/:conversationId/messages?page=1&limit=50
```

#### Send Message
```http
POST /chat/me/conversations/:conversationId/messages
Authorization: Bearer <patient_token>
Content-Type: application/json

{
  "text": "Hello Doctor, I have a question...",
  "messageType": "text"
}
```

---

## Doctor Endpoints

### Dashboard
```http
GET /doctors/me/dashboard
Authorization: Bearer <doctor_token>
```
**Response**:
```json
{
  "success": true,
  "data": {
    "patientCount": 45,
    "upcomingAppointments": 8,
    "pendingPrescriptions": 3,
    "recentActivity": [...],
    "vitalsAlerts": 2
  }
}
```

### Patients

#### List Connected Patients
```http
GET /doctors/me/patients?page=1&limit=20&search=john
```

#### Get Patient Detail
```http
GET /doctors/me/patients/:patientId
```
**Response**: Full patient profile + recent vitals + prescriptions + appointments

#### Get Patient Trends
```http
GET /doctors/me/patients/:patientId/trends?metric=bloodPressure&period=90d
```

#### Add Clinical Note
```http
POST /doctors/me/patients/:patientId/notes
Content-Type: application/json

{
  "note": "Patient responding well to medication. Increase dosage at next visit.",
  "vitalIds": ["ObjectId1", "ObjectId2"]
}
```

### Prescriptions

#### List Prescriptions
```http
GET /doctors/me/prescriptions?page=1&limit=20&patientId=ObjectId
```

#### Create Prescription
```http
POST /doctors/me/patients/:patientId/prescriptions
Content-Type: application/json

{
  "diagnosis": "Hypertension",
  "medications": [
    { "name": "Lisinopril", "dosage": "10mg", "frequency": "Once daily", "duration": "30 days" },
    { "name": "Amlodipine", "dosage": "5mg", "frequency": "Once daily", "duration": "30 days" }
  ],
  "instructions": "Take in morning. Monitor BP daily.",
  "followUpDate": "2024-02-15"
}
```

### Appointments

#### List Appointments
```http
GET /doctors/me/appointments?status=pending&date=2024-01-15
```

#### Update Appointment Status
```http
PATCH /doctors/me/appointments/:appointmentId
Content-Type: application/json

{
  "status": "confirmed", // pending, confirmed, completed, cancelled
  "notes": "Confirmed for 10:30 AM"
}
```

### Blogs

#### List My Blogs
```http
GET /doctors/me/blogs?status=draft&page=1&limit=10
```

#### Create Blog Draft
```http
POST /doctors/me/blogs
Content-Type: application/json

{
  "title": "Managing Hypertension Naturally",
  "excerpt": "Lifestyle changes that can help lower blood pressure...",
  "content": "Full article content in HTML/Markdown...",
  "coverImageUrl": "https://...",
  "category": "Cardiology",
  "tags": ["hypertension", "lifestyle", "nutrition"]
}
```

#### Update Blog
```http
PATCH /doctors/me/blogs/:blogId
```

#### Submit for Review
```http
POST /doctors/me/blogs/:blogId/submit
```

### Profile

#### Get Profile
```http
GET /doctors/me/profile
```

#### Update Profile
```http
PATCH /doctors/me/profile
Content-Type: application/json

{
  "specialization": "Cardiology",
  "hospital": "City General Hospital",
  "fee": 200,
  "bio": "Updated bio...",
  "availability": [
    { "day": "monday", "slots": ["09:00-12:00", "14:00-17:00"] },
    { "day": "wednesday", "slots": ["09:00-12:00"] },
    { "day": "friday", "slots": ["14:00-17:00"] }
  ]
}
```

---

## Admin Endpoints

### Dashboard
```http
GET /admin/dashboard
Authorization: Bearer <admin_token>
```
**Response**:
```json
{
  "success": true,
  "data": {
    "totalUsers": 1250,
    "totalPatients": 980,
    "totalDoctors": 250,
    "pendingDoctors": 12,
    "totalAppointments": 3420,
    "totalPrescriptions": 1890,
    "totalBlogs": 156,
    "pendingBlogs": 8,
    "recentActivity": [...]
  }
}
```

### Doctor Management

#### List All Doctors
```http
GET /admin/doctors?page=1&limit=20&status=pending&search=smith
```

#### Get Pending Doctors
```http
GET /admin/doctors/pending
```

#### Approve Doctor
```http
POST /admin/doctors/:doctorId/approve
Content-Type: application/json

{
  "note": "Credentials verified"
}
```

#### Reject Doctor
```http
POST /admin/doctors/:doctorId/reject
Content-Type: application/json

{
  "note": "License verification failed"
}
```

#### Suspend Doctor
```http
POST /admin/doctors/:doctorId/suspend
Content-Type: application/json

{
  "note": "Policy violation"
}
```

### Blog Management

#### List All Blogs
```http
GET /admin/blogs?page=1&limit=20&status=pending_review
```

#### Get Pending Blogs
```http
GET /admin/blogs/pending
```

#### Publish Blog
```http
POST /admin/blogs/:blogId/publish
```

#### Reject Blog
```http
POST /admin/blogs/:blogId/reject
Content-Type: application/json

{
  "rejectionReason": "Content violates medical accuracy guidelines"
}
```

#### Create Admin Blog
```http
POST /admin/blogs
Content-Type: application/json

{
  "title": "Platform Update: New Features",
  "excerpt": "We're excited to announce...",
  "content": "...",
  "category": "Announcements",
  "tags": ["update", "features"]
}
```

#### Update Blog
```http
PATCH /admin/blogs/:blogId
```

### Patient Management
```http
GET /admin/patients?page=1&limit=20&search=john
```

### Analytics

#### Overview
```http
GET /admin/analytics/overview
```

#### Growth Metrics
```http
GET /admin/analytics/growth?period=30d
```

#### Blog Analytics
```http
GET /admin/analytics/blogs?period=30d
```

---

## Notification Endpoints

### List Notifications
```http
GET /notifications?page=1&limit=20&isRead=false
Authorization: Bearer <token>
```

### Mark as Read
```http
PATCH /notifications/:notificationId/read
```

### Mark All as Read
```http
POST /notifications/read-all
```

---

## Real-time Events (Socket.io)

### Connection
```javascript
const socket = io('http://localhost:5000', {
  auth: { token: 'access_token' }
});
```

### Rooms (Auto-joined on connect)
- `user:{userId}` - Personal notifications
- `conversation:{conversationId}` - Chat messages

### Events

#### Send Message (Client → Server)
```javascript
socket.emit('chat:message:send', {
  conversationId: 'ObjectId',
  text: 'Hello!',
  messageType: 'text' // text, file, prescription
});
```

#### New Message (Server → Client)
```javascript
socket.on('chat:message:new', (data) => {
  // data: { message, conversationId }
});
```

#### Mark Messages Read (Client → Server)
```javascript
socket.emit('chat:message:read', {
  conversationId: 'ObjectId',
  messageIds: ['ObjectId1', 'ObjectId2']
});
```

#### Messages Read (Server → Client)
```javascript
socket.on('chat:message:read', (data) => {
  // data: { conversationId, readBy, messageIds }
});
```

#### New Notification (Server → Client)
```javascript
socket.on('notification:new', (notification) => {
  // notification: { id, type, title, body, metadata, createdAt }
});
```

#### Mark Notification Read (Client → Server)
```javascript
socket.emit('notification:read', {
  notificationId: 'ObjectId'
});
```

#### Notification Read (Server → Client)
```javascript
socket.on('notification:read', (data) => {
  // data: { notificationId, readBy }
});
```

---

## Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | VALIDATION_ERROR | Request validation failed |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource conflict (duplicate) |
| 422 | UNPROCESSABLE_ENTITY | Business logic violation |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |
| 503 | SERVICE_UNAVAILABLE | Service temporarily unavailable |

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| /auth/login | 5 req | 15 min |
| /auth/admin/login | 3 req | 15 min |
| /auth/register/* | 3 req | 15 min |
| /auth/refresh | 10 req | 15 min |
| All other | 100 req | 15 min |

---

## Webhooks (Future)

### Vital Risk Alert
```http
POST /webhooks/vital-risk
Content-Type: application/json
X-Webhook-Signature: sha256=...

{
  "event": "vital.risk_alert",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "patientId": "ObjectId",
    "vitalId": "ObjectId",
    "riskLevel": "high",
    "riskReasons": [...],
    "deterministicRisk": "medium",
    "mlRisk": "high"
  }
}
```

---

## API Versioning

Current version: **v1** (implicit, no version in URL)

Future versions will use header-based versioning:
```
Accept: application/vnd.healthmonitor.v2+json
```

---

## SDKs & Client Libraries

### JavaScript/TypeScript
```bash
npm install @healthmonitor/api-client
```

```typescript
import { HealthMonitorClient } from '@healthmonitor/api-client';

const client = new HealthMonitorClient({
  baseUrl: 'https://api.healthmonitorpro.com/api',
  accessToken: '...'
});

const vitals = await client.vitals.list({ period: '30d' });
```

---

## Changelog

### v1.0.0 (2026-04-10)
- Initial API release
- Auth, Patient, Doctor, Admin endpoints
- Real-time chat and notifications
- Vitals with risk engine

### v1.1.0 (Planned)
- ML risk scores in vital responses
- Batch operations
- Webhook support
- FHIR compatibility layer