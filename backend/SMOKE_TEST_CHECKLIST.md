# Phase 0 Smoke Test Checklist

Run these checks after `npm run db:init`, `npm run db:seed`, and backend startup.

## Environment

- [ ] MongoDB is running locally.
- [ ] `backend/.env` has valid `MONGO_URI`.
- [ ] Backend is running on `http://localhost:5000`.

## Health and Public Routes

- [ ] `GET /api/health` returns 200 and `status: ok`.
- [ ] `GET /api/doctors` returns 200.
- [ ] `GET /api/blogs/public` returns 200.

## Auth Routes

- [ ] `POST /api/auth/login` (patient seed user) returns 200 and access/refresh tokens.
- [ ] `POST /api/auth/login` (doctor seed user) returns 200 and access/refresh tokens.
- [ ] `POST /api/auth/admin/login` (admin seed user) returns 200 and access/refresh tokens.
- [ ] `GET /api/auth/me` with access token returns 200.
- [ ] `POST /api/auth/refresh` with refresh token returns 200 and rotated tokens.
- [ ] `POST /api/auth/logout` with refresh token returns 200.

## Patient Routes

- [ ] `GET /api/patients/me/dashboard` with patient token returns 200.
- [ ] `GET /api/vitals/me` with patient token returns 200.
- [ ] `GET /api/appointments/me` with patient token returns 200.
- [ ] `GET /api/prescriptions/me` with patient token returns 200.

## Doctor Routes

- [ ] `GET /api/doctors/me/dashboard` with doctor token returns 200.
- [ ] `GET /api/doctors/me/patients` with doctor token returns 200.
- [ ] `GET /api/doctors/me/appointments` with doctor token returns 200.

## Admin Routes

- [ ] `GET /api/admin/dashboard` with admin token returns 200.
- [ ] `GET /api/admin/doctors/pending` with admin token returns 200.
- [ ] `GET /api/admin/analytics/overview` with admin token returns 200.

## Quick PowerShell Smoke Command

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/health" | ConvertTo-Json -Compress
```

## Notes

- Keep `backend/.env` local and never commit it.
- Use the collection file `backend/HealthMonitorPro_Phase0.postman_collection.json` for repeatable manual validation.
