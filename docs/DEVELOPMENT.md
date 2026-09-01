# HealthMonitor Pro - Development Guide

## Prerequisites

### Required Software
| Tool | Version | Installation |
|------|---------|--------------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| npm | 9+ | Included with Node.js |
| MongoDB | 6+ | [mongodb.com](https://www.mongodb.com/try/download/community) |
| Git | 2.30+ | [git-scm.com](https://git-scm.com/) |
| VS Code | Latest | [code.visualstudio.com](https://code.visualstudio.com/) |

### Recommended VS Code Extensions
- ESLint
- Prettier
- TypeScript Hero
- MongoDB for VS Code
- REST Client (for API testing)
- Thunder Client (alternative)

---

## Project Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-org/health-monitoring-dashboard.git
cd health-monitoring-dashboard
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Required: MONGO_URI, JWT secrets, ADMIN credentials
nano .env
```

**Backend .env Configuration**
```env
# Server
NODE_ENV=development
PORT=5000
CLIENT_ORIGIN=http://localhost:5173

# Database
MONGO_URI=mongodb://127.0.0.1:27017/healthmonitorpro?directConnection=true

# JWT Secrets (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_ACCESS_PRIVATE_KEY=your-super-secret-access-key-min-32-chars
JWT_REFRESH_PRIVATE_KEY=your-super-secret-refresh-key-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Admin Seed
ADMIN_EMAIL=admin@healthmonitorpro.com
ADMIN_PASSWORD=SecureAdminPass123!
ADMIN_FULL_NAME=Super Admin
ADMIN_PHONE=

# Optional: File Storage (S3)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=

# Optional: Email (SendGrid)
SENDGRID_API_KEY=
FROM_EMAIL=no-reply@healthmonitorpro.com
```

### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Copy environment template (if exists)
cp .env.example .env 2>/dev/null || echo "VITE_API_URL=http://localhost:5000/api" > .env
echo "VITE_SOCKET_URL=http://localhost:5000" >> .env
```

**Frontend .env Configuration**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 4. Start MongoDB
```bash
# Option A: Local MongoDB (if installed as service)
sudo systemctl start mongod

# Option B: Docker
docker run -d -p 27017:27017 --name mongodb mongo:6

# Option C: MongoDB Atlas (cloud)
# Use connection string in MONGO_URI
```

### 5. Seed Admin User
```bash
cd backend
npm run db:seed:admin
```

### 6. Start Development Servers

**Terminal 1 - Backend**
```bash
cd backend
npm run dev
```
Output: `[server] running on http://localhost:5000`

**Terminal 2 - Frontend**
```bash
cd frontend
npm run dev
```
Output: `Local: http://localhost:5173`

### 7. Verify Installation
- Frontend: http://localhost:5173
- Backend Health: http://localhost:5000/api/health
- Admin Login: http://localhost:5173/admin/login (use seeded credentials)

---

## Development Workflow

### Git Branching Strategy
```
main
  ├── develop (integration branch)
  │     ├── feature/patient-vitals-trends
  │     ├── feature/doctor-prescription-pdf
  │     ├── bugfix/auth-refresh-token
  │     └── chore/update-dependencies
  ├── release/v1.1.0
  └── hotfix/critical-security-patch
```

### Commit Convention
Follow [Conventional Commits](https://www.conventionalcommits.org/):
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**: feat, fix, docs, style, refactor, perf, test, chore, build, ci

**Examples**:
```
feat(vitals): add trend chart with 7d/30d views
fix(auth): handle expired refresh token gracefully
docs(api): update prescription endpoints
refactor(risk-engine): extract glucose validation
test(patient): add integration tests for vitals CRUD
chore(deps): update mongoose to 8.10
```

### Pull Request Process
1. Create feature branch from `develop`
2. Implement changes with tests
3. Run linting and tests locally
4. Push and create PR to `develop`
5. Code review (min 1 approval)
6. CI checks pass
7. Squash and merge

### Code Style

#### Backend (JavaScript)
- ESLint with Airbnb base config
- Prettier for formatting
- JSDoc for functions
- Async/await over promises

```bash
cd backend
npm run lint        # Check
npm run lint:fix    # Auto-fix
```

#### Frontend (TypeScript/React)
- ESLint with React/TypeScript recommended
- Prettier for formatting
- Functional components with hooks
- Strict TypeScript config

```bash
cd frontend
npm run lint        # Check
npm run lint:fix    # Auto-fix
npm run typecheck   # TypeScript check
```

---

## Database Management

### MongoDB Commands
```bash
# Connect to shell
mongosh "mongodb://127.0.0.1:27017/healthmonitorpro"

# Useful queries
use healthmonitorpro

# View collections
show collections

# Count documents
db.users.countDocuments()
db.vitalRecords.countDocuments()

# Find recent vitals
db.vitalRecords.find().sort({datetime: -1}).limit(5).pretty()

# Find by risk level
db.vitalRecords.find({riskLevel: "high"}).pretty()

# Indexes
db.vitalRecords.getIndexes()
```

### Seeding Data
```bash
cd backend

# Seed admin (required)
npm run db:seed:admin

# Seed reviews (optional)
npm run db:seed:reviews

# Custom seed script
node src/scripts/customSeed.js
```

### Database Reset
```bash
# Drop database and reseed
mongosh "mongodb://127.0.0.1:27017/healthmonitorpro" --eval "db.dropDatabase()"
cd backend && npm run db:seed:admin
```

---

## Testing

### Backend Tests
```bash
cd backend

# Unit tests
npm run test:unit

# Integration tests (requires test DB)
npm run test:integration

# All tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

**Test Structure**
```
backend/tests/
├── unit/
│   ├── services/
│   │   ├── authService.test.js
│   │   ├── riskEngine.test.js
│   │   └── notificationService.test.js
│   └── utils/
├── integration/
│   ├── auth.test.js
│   ├── patients.test.js
│   ├── doctors.test.js
│   ├── vitals.test.js
│   ├── appointments.test.js
│   ├── prescriptions.test.js
│   ├── blogs.test.js
│   ├── chat.test.js
│   └── admin.test.js
├── fixtures/
│   ├── users.js
│   ├── vitals.js
│   └── appointments.js
└── setup.js
```

### Frontend Tests
```bash
cd frontend

# Unit tests (Vitest)
npm run test

# E2E tests (Playwright)
npm run test:e2e

# Coverage
npm run test:coverage
```

### Test Database
```bash
# Use separate test database
MONGO_URI=mongodb://127.0.0.1:27017/healthmonitorpro_test npm run test:integration
```

---

## Debugging

### Backend Debugging (VS Code)
Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npx",
      "runtimeArgs": ["nodemon", "src/server.js"],
      "cwd": "${workspaceFolder}/backend",
      "envFile": "${workspaceFolder}/backend/.env",
      "console": "integratedTerminal",
      "restart": true,
      "protocol": "inspector"
    }
  ]
}
```

### Frontend Debugging
- React Developer Tools browser extension
- VS Code Debugger for Chrome/Firefox
- Vite built-in source maps

### MongoDB Debugging
- MongoDB Compass (GUI)
- VS Code MongoDB extension
- `console.log` in controllers/services

### Socket.io Debugging
```javascript
// Enable debug logging
localStorage.debug = 'socket.io-client:socket*';
// or in backend
DEBUG=socket.io* npm run dev
```

---

## Common Tasks

### Add New API Endpoint

1. **Create validation schema** (`backend/src/schemas/featureSchemas.js`)
```javascript
import { z } from 'zod';

export const createFeatureSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    value: z.number().positive()
  })
});
```

2. **Create controller** (`backend/src/controllers/featureController.js`)
```javascript
export async function createFeature(req, res, next) {
  try {
    const feature = await featureService.create(req.user.id, req.body);
    res.status(201).json({ success: true, data: feature });
  } catch (error) {
    next(error);
  }
}
```

3. **Create service** (`backend/src/services/featureService.js`)
```javascript
export async function createFeature(userId, data) {
  // Business logic
  return await Feature.create({ ...data, userId });
}
```

4. **Create routes** (`backend/src/routes/features.js`)
```javascript
import express from 'express';
import { validate } from '../middleware/validate.js';
import { createFeatureSchema } from '../schemas/featureSchemas.js';
import * as featureController from '../controllers/featureController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();
router.use(verifyToken);

router.post('/', validate(createFeatureSchema), featureController.createFeature);

export default router;
```

5. **Register in server.js**
```javascript
import featureRoutes from './routes/features.js';
app.use('/api/features', featureRoutes);
```

6. **Add frontend service** (`frontend/src/services/featureService.ts`)
```typescript
export async function createFeature(data: FeatureInput) {
  return apiClient.post('/features', data);
}
```

### Add New Page (Frontend)

1. **Create page component** (`frontend/src/pages/patient/NewPage.tsx`)
```tsx
import { useQuery } from '@tanstack/react-query';
import { featureService } from '../../services/featureService';

export default function NewPage() {
  const { data } = useQuery({
    queryKey: ['features'],
    queryFn: featureService.list
  });

  return (
    <div className="screen-shell">
      <section className="screen-card">
        <h1>New Feature</h1>
        {/* UI */}
      </section>
    </div>
  );
}
```

2. **Add route** (`frontend/src/routes/routePaths.ts`)
```typescript
export const ROUTE_PATHS = {
  // ...
  patient: {
    // ...
    newFeature: '/patient/new-feature'
  }
} as const;
```

3. **Register in AppRouter** (`frontend/src/routes/AppRouter.tsx`)
```tsx
import NewPage from '../pages/patient/NewPage';
// ...
<Route path={ROUTE_PATHS.patient.newFeature} element={<NewPage />} />
```

4. **Add navigation** (in PatientLayout sidebar)

### Modify Database Schema

1. **Update Mongoose model** (`backend/src/models/Feature.js`)
```javascript
const featureSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  value: { type: Number, required: true }
}, { timestamps: true });

featureSchema.index({ userId: 1, createdAt: -1 });
```

2. **Create migration script** (if needed)
```javascript
// backend/src/scripts/migrate-add-feature-field.js
async function migrate() {
  await Feature.updateMany(
    { newField: { $exists: false } },
    { $set: { newField: 'default' } }
  );
}
```

3. **Run migration**
```bash
node src/scripts/migrate-add-feature-field.js
```

---

## Environment-Specific Configs

### Development
- Hot reload enabled (nodemon, Vite HMR)
- Verbose logging (morgan dev)
- CORS open for localhost
- No rate limiting on dev endpoints

### Staging
- Production-like config
- Separate MongoDB database
- Reduced log verbosity
- Rate limiting enabled
- SSL/TLS termination

### Production
- Minimal logging (morgan combined)
- Strict CORS origins
- Rate limiting enforced
- Helmet security headers
- Compression enabled
- PM2 or Kubernetes deployment

---

## Deployment

### Docker (Development)
```dockerfile
# backend/Dockerfile.dev
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]
```

```bash
# Build and run
docker-compose -f docker-compose.dev.yml up --build
```

### Docker (Production)
```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
USER node
EXPOSE 5000
CMD ["npm", "start"]
```

### Kubernetes (Production)
```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: healthmonitor-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: healthmonitor-backend
  template:
    metadata:
      labels:
        app: healthmonitor-backend
    spec:
      containers:
      - name: backend
        image: healthmonitor/backend:latest
        ports:
        - containerPort: 5000
        envFrom:
        - secretRef:
            name: healthmonitor-secrets
        - configMapRef:
            name: healthmonitor-config
        readinessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 10
        livenessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 30
```

---

## Troubleshooting

### Common Issues

#### Backend won't start - MongoDB connection failed
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Fix**: Ensure MongoDB is running
```bash
sudo systemctl status mongod
# or
docker ps | grep mongo
```

#### CORS errors in browser
```
Access to fetch at 'http://localhost:5000/api/...' from origin 'http://localhost:5173' has been blocked by CORS policy
```
**Fix**: Check `CLIENT_ORIGIN` in backend `.env` matches frontend URL exactly

#### JWT token invalid
```
Error: jwt malformed
```
**Fix**: 
- Check JWT secrets match in `.env`
- Clear browser localStorage/cookies
- Re-login

#### Socket.io connection fails
```
WebSocket connection to 'ws://localhost:5000/socket.io/?EIO=4&transport=websocket' failed
```
**Fix**:
- Check `VITE_SOCKET_URL` in frontend `.env`
- Ensure backend allows WebSocket upgrade
- Check firewall/proxy settings

#### Port already in use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Fix**:
```bash
# Find and kill process
lsof -ti:5000 | xargs kill -9
# or change PORT in .env
```

### Logs

**Backend Logs**
```bash
# Development
npm run dev  # Console output

# Production (PM2)
pm2 logs healthmonitor-backend

# Docker
docker logs -f backend-container
```

**Frontend Logs**
- Browser DevTools Console
- Vite terminal output
- Network tab for API calls

**MongoDB Logs**
```bash
# Systemd
sudo journalctl -u mongod -f

# Docker
docker logs -f mongodb
```

---

## Performance Profiling

### Backend
```bash
# Node.js built-in profiler
node --prof src/server.js
# Then: node --prof-process isolate-*.log > profile.txt

# Clinic.js (flame graphs)
npm install -g clinic
clinic doctor -- node src/server.js
```

### Frontend
- Chrome DevTools Performance tab
- React Profiler
- Lighthouse CI

### Database
```javascript
// Enable slow query logging in MongoDB
db.setProfilingLevel(2, { slowms: 100 })
// View: db.system.profile.find().sort({ts: -1}).limit(5).pretty()
```

---

## Security Checklist

### Pre-commit
- [ ] No secrets in code (use `.env`)
- [ ] No console.log in production code
- [ ] Input validation on all endpoints
- [ ] Authentication on protected routes
- [ ] Authorization checks (role, ownership)
- [ ] Rate limiting on auth endpoints

### Pre-deployment
- [ ] JWT secrets rotated
- [ ] MongoDB authentication enabled
- [ ] TLS/SSL configured
- [ ] Security headers (Helmet)
- [ ] CORS restricted to known origins
- [ ] Error messages don't leak stack traces
- [ ] Dependencies scanned (`npm audit`)

---

## Useful Scripts

### Package.json Scripts Reference

**Backend**
```json
{
  "dev": "nodemon src/server.js",
  "start": "node src/server.js",
  "db:dev": "mongod --dbpath ./.mongo-data --bind_ip localhost --port 27017",
  "db:seed:admin": "node src/scripts/seedAdmin.js",
  "db:seed:reviews": "node src/scripts/seedReviews.js",
  "lint": "eslint src/",
  "lint:fix": "eslint src/ --fix",
  "test": "jest",
  "test:unit": "jest tests/unit",
  "test:integration": "jest tests/integration",
  "test:coverage": "jest --coverage"
}
```

**Frontend**
```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "lint": "eslint src/",
  "lint:fix": "eslint src/ --fix",
  "typecheck": "tsc --noEmit",
  "test": "vitest",
  "test:e2e": "playwright test",
  "test:coverage": "vitest --coverage"
}
```

---

## Resources

### Documentation
- [Express.js](https://expressjs.com/)
- [Mongoose](https://mongoosejs.com/)
- [Socket.io](https://socket.io/docs/v4/)
- [React Router](https://reactrouter.com/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Zod](https://zod.dev/)

### API Testing
- [Postman Collection](backend/HealthMonitorPro_Phase0.postman_collection.json)
- [REST Client VS Code](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)

### Design System
- Frontend styles: `frontend/src/styles/`
- CSS Variables: `frontend/src/styles/globals.css`
- Tailwind Config: `frontend/src/styles/tailwind.config.ts`

---

## Support

### Internal
- Check existing issues on GitHub
- Review `docs/ARCHITECTURE.md` for system design
- Review `docs/PHASES.md` for implementation status

### External
- MongoDB: https://docs.mongodb.com/
- Node.js: https://nodejs.org/docs/latest/api/
- React: https://react.dev/
- JWT: https://jwt.io/introduction

---

*Last Updated: 2026-08-31*  
*Version: 1.0*