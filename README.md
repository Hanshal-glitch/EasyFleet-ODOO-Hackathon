# Transport Operations Platform

A comprehensive fleet management platform built with modern technologies.

## Tech Stack

### Backend
- **Runtime**: Node.js 20 + Express.js
- **Database**: PostgreSQL 16 with Prisma ORM
- **Authentication**: Session-based with express-session + PostgreSQL store
- **Real-time**: Socket.io for live updates
- **Validation**: Zod schemas
- **PDF Generation**: pdfkit
- **CSV Export**: csv-stringify
- **Email**: Nodemailer with Handlebars templates
- **Scheduling**: node-cron for license expiry reminders

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query) + React Context
- **Forms**: React Hook Form + Zod validation
- **UI Components**: Custom components with Tailwind CSS + Radix UI primitives
- **Charts**: Recharts
- **Tables**: TanStack Table v8
- **Real-time**: Socket.io-client
- **Date Handling**: date-fns

### Database
- **PostgreSQL 16** with Prisma migrations
- **Enums**: Role, VehicleType, VehicleStatus, DriverStatus, TripStatus, LicenseCategory, MaintenanceStatus, ExpenseType, DocumentType

## Project Structure

```
transport-ops-platform/
├── docker-compose.yml
├── packages/
│   ├── shared/           # Shared Zod schemas, types, constants
│   ├── backend/          # Express.js API
│   │   ├── prisma/       # Prisma schema & migrations
│   │   ├── src/
│   │   │   ├── config/   # Database, session, socket, env config
│   │   │   ├── controllers/  # Route handlers
│   │   │   ├── middleware/   # Auth, RBAC, validation, error handling
│   │   │   ├── routes/       # API route definitions
│   │   │   ├── services/     # Business logic, business rules
│   │   │   ├── utils/        # Logger, CSV/PDF export
│   │   │   ├── types/        # Express type extensions
│   │   │   ├── app.ts        # Express app setup
│   │   │   └── server.ts     # Server entry point
│   │   └── prisma/seed.ts    # Database seeding
│   └── frontend/
      │   ├── src/
      │   │   ├── components/   # UI components (ui/, layout/, forms/, charts/, tables/)
      │   │   ├── pages/        # Page components by feature
      │   │   ├── context/      # React contexts (Auth, Theme, Socket)
      │   │   ├── hooks/        # Custom hooks (useAuth, useVehicles, etc.)
      │   │   ├── services/     # API client, endpoints
      │   │   ├── utils/        # cn helper, formatters
      │   │   ├── types/        # TypeScript types
      │   │   ├── App.tsx       # Main app with routing
      │   │   ├── main.tsx      # Entry point
      │   │   └── index.css     # Tailwind + design system
      │   └── index.html
```

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)
- npm or yarn

### Quick Start with Docker (Production)

To run the application in a production-like environment (optimized builds, no hot-reloading):

```bash
# Clone and navigate
cd transport-ops-platform

# Start all services
npm run docker:prod:up
# Or use docker-compose directly: docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# The database is automatically migrated on startup.
# To seed the database (optional):
docker-compose exec backend npm run db:seed
```

### Quick Start with Docker (Development)

To run the application for local development with hot-reloading:

```bash
# Start all services in dev mode
npm run docker:up
# Or use docker-compose directly: docker-compose -f docker-compose.dev.yml up -d

# The dev environment mounts your local folders, so changes will hot-reload.
# Initialize database
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate deploy
docker-compose -f docker-compose.dev.yml exec backend npm run db:seed
```

### Local Development

```bash
# Install dependencies
cd packages/backend && npm install
cd packages/frontend && npm install
cd packages/shared && npm install

# Start PostgreSQL
docker-compose up -d postgres

# Backend
cd packages/backend
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
npm run dev

# Frontend (new terminal)
cd packages/frontend
npm run dev
```

### Access Points
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health
- **Prisma Studio**: `npx prisma studio` (from backend directory)

### Default Login Credentials
- **Admin**: admin@transport-ops.com / Admin@123
- **Manager**: manager@transport-ops.com / Manager@123

## Features Implemented

### Core Features
- ✅ Authentication (login/logout/session) with RBAC
- ✅ Vehicle Registry (CRUD, unique registration, status management)
- ✅ Driver Management (CRUD, license tracking, expiry alerts)
- ✅ Trip Management (create → dispatch → complete → cancel with validation)
- ✅ Maintenance Workflow (open → in-progress → complete with odometer validation)
- ✅ Fuel Logging (auto-calculate total cost, update odometer)
- ✅ Expense Tracking (categorized expenses, operational cost reports)
- ✅ Document Management (upload, expiry tracking, expiry alerts)
- ✅ Dashboard with KPIs (7 KPIs + real-time charts)
- ✅ Reports (Fuel Efficiency, Fleet Utilization, Operational Cost, Vehicle ROI)
- ✅ CSV/PDF Export for all reports
- ✅ Real-time updates via Socket.io
- ✅ Dark/Light theme with system preference detection
- ✅ Email reminders for expiring licenses (30/14/7/1 days)

### Business Rules Enforced
- Unique vehicle registration numbers
- Cargo weight ≤ vehicle max capacity
- No double-booking vehicles/drivers
- License expiry validation
- Odometer progression validation
- Status transition rules (DRAFT→DISPATCHED→COMPLETED/CANCELLED)
- Automatic status transitions

### Security
- Session-based auth with secure cookies
- CSRF protection
- Rate limiting (100 req/15min)
- Helmet security headers
- Input validation with Zod
- SQL injection prevention via Prisma

## API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user
- `POST /api/auth/register` - Register (admin only)
- `POST /api/auth/change-password` - Change password

### Vehicles
- `GET /api/vehicles` - List with filters
- `GET /api/vehicles/:id` - Get vehicle
- `POST /api/vehicles` - Create (admin/manager)
- `PATCH /api/vehicles/:id` - Update (admin/manager)
- `DELETE /api/vehicles/:id` - Retire (admin/manager)
- `GET /api/vehicles/available-for-dispatch` - Available for trips

### Drivers
- `GET /api/drivers` - List with filters
- `GET /api/drivers/:id` - Get driver
- `POST /api/drivers` - Create (admin/manager)
- `PATCH /api/drivers/:id` - Update (admin/manager)
- `DELETE /api/drivers/:id` - Delete (admin/manager)
- `GET /api/drivers/available-for-dispatch` - Available drivers
- `GET /api/drivers/expiring-licenses` - Expiring licenses

### Trips
- `GET /api/trips` - List with filters
- `GET /api/trips/:id` - Get trip
- `POST /api/trips` - Create draft (admin/manager)
- `POST /api/trips/:id/dispatch` - Dispatch (admin/manager)
- `POST /api/trips/:id/complete` - Complete (admin/manager)
- `POST /api/trips/:id/cancel` - Cancel (admin/manager)
- `GET /api/trips/stats` - Trip statistics
- `GET /api/trips/available-vehicles` - Available for dispatch
- `GET /api/trips/available-drivers` - Available drivers

### Maintenance
- `GET /api/maintenance` - List with filters
- `GET /api/maintenance/:id` - Get record
- `POST /api/maintenance` - Create (admin/manager)
- `POST /api/maintenance/:id/close` - Close record (admin/manager)
- `GET /api/maintenance/vehicle/:vehicleId/history` - Vehicle history

### Fuel
- `GET /api/fuel` - List with filters
- `GET /api/fuel/:id` - Get log
- `POST /api/fuel` - Create log

### Expenses
- `GET /api/expenses` - List with filters
- `POST /api/expenses` - Create expense
- `GET /api/expenses/vehicle/:vehicleId/operational-cost` - Operational cost

### Dashboard
- `GET /api/dashboard/kpis` - KPI metrics
- `GET /api/dashboard/charts` - Chart data

### Reports
- `GET /api/reports/fuel-efficiency` - Fuel efficiency report
- `GET /api/reports/fleet-utilization` - Fleet utilization report
- `GET /api/reports/operational-cost` - Operational cost report
- `GET /api/reports/vehicle-roi` - Vehicle ROI report
- `GET /api/reports/export` - Export CSV/PDF

### Documents
- `GET /api/documents` - List with filters
- `POST /api/documents` - Upload document
- `DELETE /api/documents/:id` - Delete document
- `GET /api/documents/expiring` - Expiring documents

## Database Schema

Key models: User, Session, Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, Document

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/transport_ops
SESSION_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
PORT=3001

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user
SMTP_PASS=pass
EMAIL_FROM=Transport Ops <alerts@example.com>
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

## Scripts

### Backend
```bash
npm run dev          # Development with hot reload
npm run build        # TypeScript build
npm run start        # Production start
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
npm run db:seed
npm run lint
npm run test
```

### Frontend
```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview build
npm run lint     # ESLint
npm run test     # Vitest
```

## Deployment

### Production Build
```bash
docker-compose up -d
```
(This uses the default `docker-compose.yml` which is optimized for production).

### Database Migrations
Migrations run automatically on container start for the backend.

### Environment Variables
Set production values for:
- `SESSION_SECRET` (strong random string)
- `DATABASE_URL` (production PostgreSQL)
- `SMTP_*` (email credentials)
- `FRONTEND_URL` (production frontend URL)
- `VITE_API_URL` (production API URL for the frontend container)
- `VITE_SOCKET_URL` (production Socket URL for the frontend container)

## License

MIT License - feel free to use for your fleet management needs.