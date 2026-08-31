# HealthMonitor Pro - System Architecture

## Overview

HealthMonitor Pro is a three-role health monitoring platform (Patient, Doctor, Admin) with real-time capabilities built on a modern Node.js/React stack.

```mermaid
graph TB
    subgraph "Client Layer"
        FE[Frontend<br/>React 18 + TypeScript + Vite]
    end

    subgraph "API Gateway"
        LB[Load Balancer / Reverse Proxy]
    end

    subgraph "Backend Services"
        API[Express.js API Server<br/>Port 5000]
        WS[Socket.io Server<br/>Real-time Communication]
    end

    subgraph "Data Layer"
        MONGO[(MongoDB<br/>Primary Database)]
        REDIS[(Redis<br/>Session/Cache - Future)]
    end

    subgraph "External Services"
        S3[S3 Compatible Storage<br/>File Uploads]
        EMAIL[Email Service<br/>SendGrid/SMTP]
        ML[ML Service<br/>Health Risk Prediction]
    end

    FE -->|HTTPS/REST| LB
    FE -->|WebSocket| LB
    LB --> API
    LB --> WS
    API --> MONGO
    WS --> MONGO
    API --> S3
    API --> EMAIL
    API --> ML
    WS -.-> ML
```

## High-Level Data Flow

```mermaid
sequenceDiagram
    participant P as Patient
    participant D as Doctor
    participant A as Admin
    participant FE as Frontend
    participant API as Backend API
    participant WS as Socket.io
    participant DB as MongoDB
    participant ML as ML Service

    Note over P,A: Authentication Flow
    P->>FE: Login/Register
    FE->>API: POST /api/auth/login
    API->>DB: Validate credentials
    DB-->>API: User + Role
    API-->>FE: Access + Refresh Tokens
    FE->>FE: Store tokens, set role context

    Note over P,A: Vitals Submission (Patient)
    P->>FE: Submit vitals
    FE->>API: POST /api/vitals/me
    API->>DB: Save vital record
    API->>API: Run Risk Engine (deterministic)
    API->>ML: Async: Predict risk (ML model)
    ML-->>API: Risk score + factors
    API->>DB: Update riskLevel, riskReasons
    API->>WS: Emit notification (if medium/high)
    WS->>FE: Real-time alert
    API-->>FE: Vital record + risk info

    Note over P,A: Doctor-Patient Interaction
    D->>FE: View patient detail
    FE->>API: GET /api/doctors/me/patients/:id
    API->>DB: Fetch patient + vitals + prescriptions
    DB-->>API: Aggregated data
    API-->>FE: Patient dashboard data
    D->>FE: Create prescription
    FE->>API: POST /api/doctors/me/patients/:id/prescriptions
    API->>DB: Save prescription
    API->>WS: Notify patient
    WS->>FE: Real-time prescription notification

    Note over P,A: Admin Actions
    A->>FE: Approve doctor
    FE->>API: POST /api/admin/doctors/:id/approve
    API->>DB: Update doctor status
    API->>DB: Create audit log
    API->>WS: Notify doctor
    WS->>FE: Real-time status update
```

## Role-Based Access Control

```mermaid
graph TD
    subgraph "Authentication"
        Login[Login / Register]
        JWT[JWT Token Generation]
        Roles[Role Assignment]
    end

    subgraph "Authorization Middleware"
        Verify[Verify Token]
        CheckRole[Check Role]
        CheckStatus[Check Doctor Status]
    end

    subgraph "Patient Routes"
        P1[/patient/dashboard]
        P2[/patient/vitals]
        P3[/patient/trends]
        P4[/patient/doctors]
        P5[/patient/appointments]
        P6[/patient/prescriptions]
        P7[/patient/messages]
        P8[/patient/profile]
    end

    subgraph "Doctor Routes"
        D1[/doctor/dashboard]
        D2[/doctor/patients]
        D3[/doctor/patients/:id]
        D4[/doctor/prescriptions]
        D5[/doctor/appointments]
        D6[/doctor/blogs]
        D7[/doctor/messages]
        D8[/doctor/profile]
        D9[/doctor/pending-approval]
        D10[/doctor/onboarding]
    end

    subgraph "Admin Routes"
        A1[/admin/dashboard]
        A2[/admin/doctors]
        A3[/admin/patients]
        A4[/admin/blogs]
        A5[/admin/analytics]
        A6[/admin/notifications]
        A7[/admin/settings]
    end

    Login --> JWT --> Roles
    Roles --> Verify --> CheckRole
    CheckRole -->|patient| CheckStatus
    CheckRole -->|doctor| CheckStatus
    CheckRole -->|admin| A1
    CheckStatus -->|approved| P1 & P2 & P3 & P4 & P5 & P6 & P7 & P8
    CheckStatus -->|approved| D1 & D2 & D3 & D4 & D5 & D6 & D7 & D8
    CheckStatus -->|pending| D9
    CheckStatus -->|onboarding| D10
    CheckStatus -->|rejected/suspended| D9
```

## Database Schema Relationships

```mermaid
erDiagram
    USER ||--o{ PATIENT_PROFILE : "has"
    USER ||--o{ DOCTOR_PROFILE : "has"
    USER ||--o{ VITAL_RECORD : "records"
    USER ||--o{ APPOINTMENT : "patient"
    USER ||--o{ APPOINTMENT : "doctor"
    USER ||--o{ PRESCRIPTION : "patient"
    USER ||--o{ PRESCRIPTION : "doctor"
    USER ||--o{ BLOG : "authors"
    USER ||--o{ CONVERSATION : "participates"
    USER ||--o{ MESSAGE : "sends"
    USER ||--o{ NOTIFICATION : "receives"
    USER ||--o{ AUDIT_LOG : "performs"
    USER ||--o{ REFRESH_TOKEN : "owns"

    PATIENT_PROFILE }|--o{ USER : "connected_doctors"
    DOCTOR_PROFILE }|--o{ USER : "connected_patients"

    CONVERSATION ||--o{ MESSAGE : "contains"
    VITAL_RECORD {
        ObjectId patientId
        Date datetime
        Object bloodPressure
        Number heartRate
        Number spo2
        Number temperatureC
        Object glucose
        Number weightKg
        String notes
        String riskLevel
        String[] riskReasons
    }
    APPOINTMENT {
        ObjectId patientId
        ObjectId doctorId
        String type
        Date date
        String time
        String status
        String notes
    }
    PRESCRIPTION {
        ObjectId patientId
        ObjectId doctorId
        String diagnosis
        Object[] medications
        String instructions
        Date followUpDate
        String pdfUrl
    }
    BLOG {
        ObjectId authorId
        String authorRole
        String title
        String content
        String status
        String category
        String[] tags
    }
```

## API Module Architecture

```mermaid
graph TB
    subgraph "Express App"
        Server[server.js]
    end

    subgraph "Route Modules"
        AuthRoutes[/api/auth]
        PatientRoutes[/api/patients]
        DoctorRoutes[/api/doctors]
        VitalRoutes[/api/vitals]
        BlogRoutes[/api/blogs]
        AdminRoutes[/api/admin]
        ChatRoutes[/api/chat]
        ApptRoutes[/api/appointments]
        RxRoutes[/api/prescriptions]
        NotifRoutes[/api/notifications]
    end

    subgraph "Controller Layer"
        AuthCtrl[authController]
        PatientCtrl[patientController]
        DoctorCtrl[doctorController]
        VitalCtrl[vitalController]
        BlogCtrl[blogController]
        AdminCtrl[adminController]
        ChatCtrl[chatController]
        ApptCtrl[appointmentController]
        RxCtrl[prescriptionController]
        NotifCtrl[notificationController]
    end

    subgraph "Service Layer"
        AuthSvc[authService]
        RiskEngine[riskEngine]
        NotifSvc[notificationService]
        EmailSvc[emailService]
        AuditSvc[auditService]
        PdfSvc[pdfService]
        S3Svc[s3Service]
    end

    subgraph "Middleware"
        VerifyToken[verifyToken]
        CheckRole[checkRole]
        RequireDocApproved[requireDoctorApproved]
        Validate[validate]
        RateLimit[rateLimiter]
        ErrorHandler[errorHandler]
    end

    subgraph "Socket Layer"
        AuthSocket[authenticateSocket]
        ChatHandler[chatHandler]
        NotifHandler[notificationHandler]
    end

    Server --> AuthRoutes
    Server --> PatientRoutes
    Server --> DoctorRoutes
    Server --> VitalRoutes
    Server --> BlogRoutes
    Server --> AdminRoutes
    Server --> ChatRoutes
    Server --> ApptRoutes
    Server --> RxRoutes
    Server --> NotifRoutes

    AuthRoutes --> AuthCtrl
    PatientRoutes --> PatientCtrl
    DoctorRoutes --> DoctorCtrl
    VitalRoutes --> VitalCtrl
    BlogRoutes --> BlogCtrl
    AdminRoutes --> AdminCtrl
    ChatRoutes --> ChatCtrl
    ApptRoutes --> ApptCtrl
    RxRoutes --> RxCtrl
    NotifRoutes --> NotifCtrl

    AuthCtrl --> AuthSvc
    VitalCtrl --> RiskEngine
    VitalCtrl --> NotifSvc
    PatientCtrl --> NotifSvc
    DoctorCtrl --> NotifSvc
    AdminCtrl --> AuditSvc
    RxCtrl --> PdfSvc
    BlogCtrl --> S3Svc
    ChatCtrl --> NotifSvc

    AuthRoutes --> VerifyToken
    PatientRoutes --> VerifyToken
    PatientRoutes --> CheckRole
    DoctorRoutes --> VerifyToken
    DoctorRoutes --> CheckRole
    DoctorRoutes --> RequireDocApproved
    AdminRoutes --> VerifyToken
    AdminRoutes --> CheckRole
    AllRoutes --> Validate
    AuthRoutes --> RateLimit
    Server --> ErrorHandler

    Server --> AuthSocket
    AuthSocket --> ChatHandler
    AuthSocket --> NotifHandler
```

## Real-time Communication Flow

```mermaid
sequenceDiagram
    participant Client as Frontend Client
    participant Socket as Socket.io Server
    participant API as REST API
    participant DB as MongoDB
    participant Other as Other Clients

    Note over Client,Other: Connection Establishment
    Client->>Socket: Connect with JWT token
    Socket->>Socket: authenticateSocket middleware
    Socket->>DB: Validate token, get user
    Socket-->>Client: Connected + join rooms
    Note over Client,Socket: Rooms joined: user:{userId}, conversation:{ids}

    Note over Client,Other: Chat Message Flow
    Client->>Socket: chat:message:send {conversationId, text}
    Socket->>DB: Save message
    Socket->>DB: Update conversation.lastMessageAt
    Socket->>Other: chat:message:new (to conversation room)
    Socket->>Other: notification:new (to user rooms)
    Other->>Client: UI updates in real-time

    Note over Client,Other: Notification Flow
    API->>DB: Create notification (e.g., new prescription)
    API->>Socket: notificationService.send()
    Socket->>Client: notification:new (to user:{userId} room)
    Client->>Client: Show toast, update badge

    Note over Client,Other: Vitals Risk Alert
    Client->>API: POST /api/vitals/me
    API->>DB: Save vital
    API->>API: Run risk engine
    alt Risk Level Medium/High
        API->>Socket: notificationService.sendRiskAlert()
        Socket->>Client: notification:new (risk alert)
        Socket->>Doctor: notification:new (if connected)
    end
```

## Frontend Route Architecture

```mermaid
graph TD
    App[App.tsx] --> Router[AppRouter.tsx]
    Router --> GuestOnly[GuestOnly Wrapper]
    Router --> RequireAuth[RequireAuth Wrapper]

    GuestOnly --> PublicRoutes[Public Routes]
    PublicRoutes --> Home[/]
    PublicRoutes --> Doctors[/doctors]
    PublicRoutes --> DoctorDetail[/doctors/:id]
    PublicRoutes --> Blogs[/blogs]
    PublicRoutes --> Login[/login]
    PublicRoutes --> AdminLogin[/admin/login]
    PublicRoutes --> Register[/register]

    RequireAuth -->|role: patient| PatientLayout[PatientLayout]
    PatientLayout --> PDash[/patient/dashboard]
    PatientLayout --> PVitals[/patient/vitals]
    PatientLayout --> PTrends[/patient/trends]
    PatientLayout --> PDocs[/patient/doctors]
    PatientLayout --> PAppts[/patient/appointments]
    PatientLayout --> PRx[/patient/prescriptions]
    PatientLayout --> PMsgs[/patient/messages]
    PatientLayout --> PNotif[/patient/notifications]
    PatientLayout --> PProfile[/patient/profile]

    RequireAuth -->|role: doctor| DoctorLayout[DoctorLayout]
    DoctorLayout --> DDash[/doctor/dashboard]
    DoctorLayout --> DPatients[/doctor/patients]
    DoctorLayout --> DPatientDetail[/doctor/patients/:id]
    DoctorLayout --> DRx[/doctor/prescriptions]
    DoctorLayout --> DAppts[/doctor/appointments]
    DoctorLayout --> DBlogs[/doctor/blogs]
    DoctorLayout --> DMsgs[/doctor/messages]
    DoctorLayout --> DProfile[/doctor/profile]
    DoctorLayout --> DOnboard[/doctor/onboarding]
    DoctorLayout --> DPending[/doctor/pending-approval]

    RequireAuth -->|role: admin| AdminLayout[AdminLayout]
    AdminLayout --> ADash[/admin/dashboard]
    AdminLayout --> ADoctors[/admin/doctors]
    AdminLayout --> APatients[/admin/patients]
    AdminLayout --> ABlogs[/admin/blogs]
    AdminLayout --> AAppts[/admin/appointments]
    AdminLayout --> AAnalytics[/admin/analytics]
    AdminLayout --> ANotif[/admin/notifications]
    AdminLayout --> ASettings[/admin/settings]
```

## Risk Engine Pipeline

```mermaid
flowchart TD
    Input[Vital Record Input] --> Parse[Parse & Validate]
    Parse --> Deterministic[Deterministic Rules Engine]
    Deterministic -->|BP >= 150/95| High1[High Risk]
    Deterministic -->|BP 135-149/85-94| Med1[Medium Risk]
    Deterministic -->|Glucose fasting >= 126| High2[High Risk]
    Deterministic -->|Glucose post_meal >= 180| High3[High Risk]
    Deterministic -->|SpO2 < 94| High4[High Risk]
    Deterministic -->|HR > 120 or < 45| High5[High Risk]
    Deterministic -->|HR 110-120 or 45-50| Med2[Medium Risk]

    Deterministic --> ML[ML Model Inference - Async]
    ML -->|Risk Score + Factors| Combine[Combine Results]
    Combine --> MaxRisk[Take Max Risk Level]
    MaxRisk --> Save[Save to DB with riskLevel + riskReasons]
    Save -->|Medium/High| Notify[Trigger Notifications]
    Save --> Response[Return to Client]
```

## ML Service Integration (Planned)

```mermaid
graph LR
    subgraph "Backend"
        API[API Server]
        Queue[Message Queue]
    end

    subgraph "ML Pipeline"
        Ingest[Data Ingestion]
        Feature[Feature Engineering]
        Model[ML Model]
        Predict[Prediction API]
    end

    subgraph "Training"
        Historical[Historical Vitals]
        Labels[Risk Labels]
        Train[Training Pipeline]
        Registry[Model Registry]
    end

    API -->|Vital Created| Queue
    Queue --> Ingest
    Ingest --> Feature
    Feature --> Predict
    Predict -->|Risk Score| API

    Historical --> Train
    Labels --> Train
    Train --> Registry
    Registry --> Predict
```

## Deployment Architecture (Production)

```mermaid
graph TB
    subgraph "CDN / Edge"
        CloudFlare[CloudFlare / CDN]
    end

    subgraph "Kubernetes Cluster"
        Ingress[Ingress Controller]
        
        subgraph "Backend Namespace"
            API_Pods[API Pods x3+]
            WS_Pods[Socket.io Pods x2+]
            Worker_Pods[Worker Pods<br/>Async Jobs]
        end
        
        subgraph "Frontend Namespace"
            FE_Pods[Frontend Pods<br/>Nginx + Static Files]
        end
        
        subgraph "Data Namespace"
            MongoDB[(MongoDB Replica Set)]
            Redis[(Redis Cluster)]
        end
        
        subgraph "Monitoring"
            Prometheus[Prometheus]
            Grafana[Grafana]
            Loki[Loki Logs]
        end
    end

    CloudFlare --> Ingress
    Ingress --> FE_Pods
    Ingress --> API_Pods
    Ingress --> WS_Pods
    API_Pods --> MongoDB
    WS_Pods --> MongoDB
    Worker_Pods --> MongoDB
    API_Pods --> Redis
    WS_Pods --> Redis
    Prometheus --> API_Pods
    Prometheus --> WS_Pods
    Grafana --> Prometheus
    Loki --> API_Pods
```

## Security Architecture

```mermaid
graph TB
    subgraph "Transport Security"
        TLS[TLS 1.3]
        HSTS[HSTS Headers]
    end

    subgraph "Application Security"
        Helmet[Helmet.js<br/>Security Headers]
        CORS[CORS Policy]
        RateLimit[Rate Limiting]
        Val[Input Validation<br/>Zod Schemas]
    end

    subgraph "Authentication"
        JWT[JWT Tokens]
        Access[Access Token<br/>15 min]
        Refresh[Refresh Token<br/>7 days + Rotation]
        Bcrypt[bcryptjs<br/>Password Hashing]
    end

    subgraph "Authorization"
        RBAC[Role-Based Access]
        DocStatus[Doctor Status Check]
        Ownership[Resource Ownership]
    end

    subgraph "Data Protection"
        Env[Environment Variables]
        Secrets[Secrets Management]
        Audit[Audit Logging]
    end

    TLS --> Helmet
    Helmet --> CORS
    CORS --> RateLimit
    RateLimit --> Val
    Val --> JWT
    JWT --> Access
    JWT --> Refresh
    Access --> Bcrypt
    Refresh --> Bcrypt
    Bcrypt --> RBAC
    RBAC --> DocStatus
    DocStatus --> Ownership
    Ownership --> Env
    Env --> Secrets
    Secrets --> Audit
```

## Key Design Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| **Auth** | JWT with refresh rotation | Stateless, scalable, secure token lifecycle |
| **Real-time** | Socket.io with rooms | Reliable fallback, auto-reconnection, room-based broadcasting |
| **Database** | MongoDB + Mongoose | Flexible schema for varied health data, rich querying |
| **Validation** | Zod | TypeScript-first, runtime + compile-time safety |
| **Risk Engine** | Deterministic + ML hybrid | Immediate rules for safety, ML for nuance |
| **File Storage** | S3-compatible | Scalable, decoupled from compute |
| **Error Handling** | Centralized middleware | Consistent error responses, proper logging |
| **Audit** | Immutable logs | Compliance, debugging, accountability |

## Scalability Considerations

1. **Horizontal Scaling**: Stateless API pods behind load balancer
2. **Socket.io Scaling**: Redis adapter for multi-node WebSocket support
3. **Database**: MongoDB replica set with read replicas for analytics
4. **Caching**: Redis for sessions, rate limits, frequent queries
5. **Async Processing**: Worker queue for ML inference, PDF generation, emails
6. **CDN**: Static assets served via CDN with cache headers