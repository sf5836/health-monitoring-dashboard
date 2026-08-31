# HealthMonitor Pro

A comprehensive health monitoring platform connecting patients, doctors, and administrators with real-time vital tracking, appointment management, prescriptions, and telehealth capabilities.

## Features

### Patient Portal
- **Dashboard** - Overview of health metrics, upcoming appointments, and recent activity
- **Vitals Tracking** - Record and monitor blood pressure, heart rate, SpO2, temperature, glucose, weight
- **Trends & Analytics** - Visual charts and trend analysis with risk level indicators
- **Doctor Management** - Connect with approved doctors, view profiles and specializations
- **Appointments** - Book, manage, and cancel in-person or teleconsultation appointments
- **Prescriptions** - View prescribed medications with PDF download capability
- **Messages** - Real-time chat with connected doctors
- **Notifications** - Real-time alerts for appointments, prescriptions, and health risks

### Doctor Portal
- **Dashboard** - Patient overview, upcoming appointments, recent activity
- **Patient Management** - View connected patients, detailed health records, vital trends
- **Clinical Notes** - Add and manage patient notes
- **Prescription Management** - Create and issue prescriptions with PDF generation
- **Appointment Management** - Confirm, complete, or cancel appointments
- **Blog System** - Write and submit health articles for admin review
- **Profile Management** - Manage professional profile, availability, and credentials

### Admin Portal
- **Dashboard** - Platform analytics and key metrics
- **Doctor Management** - Approve, reject, or suspend doctor accounts with audit logging
- **Patient Management** - View and manage patient accounts
- **Blog Moderation** - Review, publish, or reject doctor-submitted articles
- **Analytics** - Growth metrics, engagement statistics, and platform insights
- **Notifications** - System-wide notification management
- **Settings** - Platform configuration

## Tech Stack

### Backend
- **Runtime**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT (Access + Refresh tokens with rotation)
- **Real-time**: Socket.io
- **Validation**: Zod
- **Security**: Helmet, CORS, Rate Limiting, bcryptjs

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Real-time**: Socket.io Client
- **Styling**: CSS Modules + Custom Design System

## Project Structure

```
health-monitoring-dashboard/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuration (DB, env, S3)
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Auth, validation, role checks, error handling
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API route definitions
│   │   ├── schemas/        # Zod validation schemas
│   │   ├── scripts/        # Database seeding scripts
│   │   ├── services/       # Business logic (auth, risk engine, notifications, etc.)
│   │   ├── sockets/        # Socket.io handlers
│   │   └── server.js       # Entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── config/         # Environment configuration
│   │   ├── data/           # Static data
│   │   ├── pages/          # Page components (public, patient, doctor, admin)
│   │   ├── routes/         # Routing configuration
│   │   ├── services/       # API clients and utilities
│   │   ├── styles/         # Global styles and design tokens
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
└── docs/
    ├── ARCHITECTURE.md     # System architecture with Mermaid diagrams
    ├── PHASES.md           # Implementation phases and progress
    ├── ML_MODEL.md         # ML model specification
    ├── API.md              # API contract documentation
    └── DEVELOPMENT.md      # Development setup guide
```

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+ (local or Atlas)
- npm or yarn

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
npm install
npm run dev
```

### Frontend Setup

```bash
cd frontend
cp .env.example .env  # if exists
npm install
npm run dev
```

### Environment Variables

**Backend (.env)**
```env
NODE_ENV=development
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/healthmonitorpro
JWT_ACCESS_PRIVATE_KEY=your-access-secret
JWT_REFRESH_PRIVATE_KEY=your-refresh-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=SecurePass123!
ADMIN_FULL_NAME=Super Admin
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Seed Admin User

```bash
cd backend
npm run db:seed:admin
```

## Documentation

- [Architecture & Workflow](docs/ARCHITECTURE.md) - System architecture with Mermaid diagrams
- [Implementation Phases](docs/PHASES.md) - Detailed phase breakdown and progress tracking
- [ML Model Specification](docs/ML_MODEL.md) - Machine learning model for health monitoring
- [API Reference](docs/API.md) - Complete API contract
- [Development Guide](docs/DEVELOPMENT.md) - Local development setup and workflows

## Implementation Status

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 0 | ✅ Complete | Baseline lock - DB init, seeding, Postman collection |
| Phase 1 | ✅ Complete | Auth & access finalization |
| Phase 2 | ✅ Complete | Patient portal completion |
| Phase 3 | ✅ Complete | Doctor portal completion |
| Phase 4 | ✅ Complete | Admin portal completion |
| Phase 5 | ✅ Complete | Realtime & notifications |
| Phase 6 | ✅ Complete | Testing & release readiness |
| **ML Enhancement** | 🔄 Planned | ML-based health risk prediction |

## Key Features Implemented

- ✅ Role-based authentication (Patient, Doctor, Admin)
- ✅ JWT with refresh token rotation
- ✅ Doctor approval workflow (pending → approved/rejected/suspended)
- ✅ Vitals CRUD with deterministic risk engine
- ✅ Real-time chat via Socket.io
- ✅ Real-time notifications
- ✅ Appointment booking & management
- ✅ Prescription management with PDF generation
- ✅ Blog system with moderation workflow
- ✅ Admin analytics dashboard
- ✅ Audit logging for admin actions

## ML Enhancement (Planned)

See [ML Model Documentation](docs/ML_MODEL.md) for details on:
- Health risk prediction model
- Anomaly detection in vital trends
- Personalized health recommendations
- Training data requirements and pipeline

## License

MIT License - see LICENSE file for details.