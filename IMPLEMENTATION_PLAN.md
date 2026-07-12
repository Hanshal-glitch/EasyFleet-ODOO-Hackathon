# Transport Operations Platform - Implementation Plan

## Tech Stack
- **Frontend**: React 18 + Vite + React Router v6 + TanStack Query + React Hook Form + Zod
- **Backend**: Node.js + Express.js + Prisma ORM + PostgreSQL
- **Auth**: express-session + bcrypt + connect-pg-simple (PostgreSQL session store)
- **Auth RBAC**: Role-based middleware + React context
- **Charts**: Recharts (lightweight, React-native)
- **PDF Export**: pdfkit or @react-pdf/renderer
- **CSV Export**: PapaParse
- **Email**: Nodemailer (SMTP)
- **Charts/Dark Mode**: Tailwind CSS + Recharts (dark mode support)
- **Forms/Validation**: React Hook Form + Zod

---

## Project Structure

```
transport-ops-platform/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── session.ts
│   │   │   └── env.ts
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── vehicleController.ts
│   │   │   ├── driverController.ts
│   │   │   ├── tripController.ts
│   │   │   ├── maintenanceController.ts
│   │   │   ├── fuelController.ts
│   │   │   ├── expenseController.ts
│   │   │   ├── dashboardController.ts
│   │   │   ├── reportController.ts
│   │   │   └── documentController.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── rbac.ts
│   │   │   ├── validation.ts
│   │   │   └── errorHandler.ts
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   ├── vehicleService.ts
│   │   │   ├── driverService.ts
│   │   │   ├── tripService.ts
│   │   │   ├── maintenanceService.ts
│   │   │   ├── fuelService.ts
│   │   │   ├── expenseService.ts
│   │   │   ├── dashboardService.ts
│   │   │   ├── reportService.ts
│   │   │   ├── emailService.ts
│   │   │   └── documentService.ts
│   │   ├── utils/
│   │   │   ├── validators.ts
│   │   │   ├── businessRules.ts
│   │   │   ├── csvExport.ts
│   │   │   └── pdfExport.ts
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   ├── vehicleRoutes.ts
│   │   │   ├── driverRoutes.ts
│   │   │   ├── tripRoutes.ts
│   │   │   ├── maintenanceRoutes.ts
│   │   │   ├── fuelRoutes.ts
│   │   │   ├── expenseRoutes.ts
│   │   │   ├── dashboardRoutes.ts
│   │   │   ├── reportRoutes.ts
│   │   │   └── documentRoutes.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/ (reusable components)
│   │   │   ├── layout/
│   │   │   ├── forms/
│   │   │   ├── charts/
│   │   │   └── tables/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── vehicles/
│   │   │   ├── drivers/
│   │   │   ├── trips/
│   │   │   ├── maintenance/
│   │   │   ├── fuel/
│   │   │   ├── expenses/
│   │   │   ├── reports/
│   │   │   ├── documents/
│   │   │   └── settings/
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useVehicles.ts
│   │   │   ├── useDrivers.ts
│   │   │   ├── useTrips.ts
│   │   │   └── useTheme.ts
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── endpoints.ts
│   │   ├── utils/
│   │   │   ├── validators.ts
│   │   │   ├── formatters.ts
│   │   │   └── export.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── docker-compose.yml
└── README.md
```

---

## Phase 1: Database Schema (Prisma)

### Prisma Schema Design

```prisma
// Enums
enum Role {
  ADMIN
  MANAGER
  DRIVER
  VIEWER
}

enum VehicleType {
  VAN
  TRUCK
  TRAILER
  PICKUP
  OTHER
}

enum VehicleStatus {
  AVAILABLE
  ON_TRIP
  IN_SHOP
  RETIRED
}

enum DriverStatus {
  AVAILABLE
  ON_TRIP
  OFF_DUTY
  SUSPENDED
}

enum TripStatus {
  DRAFT
  DISPATCHED
  COMPLETED
  CANCELLED
}

enum LicenseCategory {
  A
  B
  C
  D
  E
  BE
  CE
  DE
}

enum MaintenanceStatus {
  OPEN
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum ExpenseType {
  FUEL
  MAINTENANCE
  TOLL
  PARKING
  INSURANCE
  PERMIT
  OTHER
}

enum DocumentType {
  REGISTRATION
  INSURANCE
  INSPECTION
  PERMIT
  DRIVER_LICENSE
  MEDICAL_CERT
  OTHER
}

// Models
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  firstName     String
  lastName      String
  role          Role      @default(VIEWER)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  sessions      Session[]
  driver        Driver?
  createdTrips  Trip[]    @relation("CreatedTrips")
  updatedTrips  Trip[]    @relation("UpdatedTrips")
  createdVehicles Vehicle[] @relation("CreatedVehicles")
  createdDrivers Driver[] @relation("CreatedDrivers")
  maintenanceLogs MaintenanceLog[] @relation("CreatedMaintenanceLogs")
  fuelLogs      FuelLog[] @relation("CreatedFuelLogs")
  expenses      Expense[] @relation("CreatedExpenses")
  documents     Document[] @relation("UploadedDocuments")
}

model Session {
  id        String   @id @default(cuid())
  sessionId String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expires   DateTime
  data      String?
  createdAt DateTime @default(now())
  @@index([userId])
  @@index([expires])
}

model Vehicle {
  id                  String            @id @default(cuid())
  registrationNumber  String            @unique
  name                String
  model               String?
  type                VehicleType
  maxLoadCapacityKg   Float
  odometerKm          Float             @default(0)
  acquisitionCost     Float
  status              VehicleStatus     @default(AVAILABLE)
  region              String?
  createdById         String
  createdBy           User              @relation("CreatedVehicles", fields: [createdById], references: [id])
  updatedById         String?
  updatedBy           User?             @relation("UpdatedVehicles", fields: [updatedById], references: [id])
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt
  trips               Trip[]
  maintenanceLogs     MaintenanceLog[]
  fuelLogs            FuelLog[]
  expenses            Expense[]
  documents           Document[]
}

model Driver {
  id                  String          @id @default(cuid())
  userId              String?         @unique
  user                User?           @relation(fields: [userId], references: [id], onDelete: SetNull)
  name                String
  licenseNumber       String          @unique
  licenseCategory     LicenseCategory
  licenseExpiryDate   DateTime
  contactNumber       String
  safetyScore         Float           @default(100)
  status              DriverStatus    @default(AVAILABLE)
  createdById         String
  createdBy           User            @relation("CreatedDrivers", fields: [createdById], references: [id])
  updatedById         String?
  updatedBy           User?           @relation("UpdatedDrivers", fields: [updatedById], references: [id])
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt
  trips               Trip[]
  @@index([licenseExpiryDate])
  @@index([status])
}

model Trip {
  id                    String       @id @default(cuid())
  source                String
  destination           String
  vehicleId             String
  vehicle               Vehicle      @relation(fields: [vehicleId], references: [id])
  driverId              String
  driver                Driver       @relation(fields: [driverId], references: [id])
  cargoWeightKg         Float
  plannedDistanceKm     Float
  actualDistanceKm      Float?
  fuelConsumedLiters    Float?
  startOdometerKm       Float?
  endOdometerKm         Float?
  status                TripStatus   @default(DRAFT)
  revenue               Float?
  dispatchedAt          DateTime?
  completedAt           DateTime?
  cancelledAt           DateTime?
  cancellationReason    String?
  createdById           String
  createdBy             User         @relation("CreatedTrips", fields: [createdById], references: [id])
  updatedById           String?
  updatedBy             User?        @relation("UpdatedTrips", fields: [updatedById], references: [id])
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt
  @@index([vehicleId, status])
  @@index([driverId, status])
  @@index([status])
}

model MaintenanceLog {
  id                String            @id @default(cuid())
  vehicleId         String
  vehicle           Vehicle           @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  description       String
  status            MaintenanceStatus @default(OPEN)
  cost              Float             @default(0)
  startedAt         DateTime          @default(now())
  completedAt       DateTime?
  odometerAtStart   Float
  odometerAtEnd     Float?
  createdById       String
  createdBy         User              @relation("CreatedMaintenanceLogs", fields: [createdById], references: [id])
  updatedById       String?
  updatedBy         User?             @relation("UpdatedMaintenanceLogs", fields: [updatedById], references: [id])
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  @@index([vehicleId, status])
}

model FuelLog {
  id              String   @id @default(cuid())
  vehicleId       String
  vehicle         Vehicle  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  liters          Float
  costPerLiter    Float
  totalCost       Float
  date            DateTime @default(now())
  odometerKm      Float
  stationName     String?
  receiptNumber   String?
  createdById     String
  createdBy       User     @relation("CreatedFuelLogs", fields: [createdById], references: [id])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  @@index([vehicleId, date])
}

model Expense {
  id          String       @id @default(cuid())
  vehicleId   String
  vehicle     Vehicle      @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  type        ExpenseType
  description String
  amount      Float
  date        DateTime     @default(now())
  receiptUrl  String?
  createdById String
  createdBy   User         @relation("CreatedExpenses", fields: [createdById], references: [id])
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  @@index([vehicleId, date])
  @@index([type])
}

model Document {
  id          String        @id @default(cuid())
  vehicleId   String?
  vehicle     Vehicle?      @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  driverId    String?
  driver      Driver?       @relation(fields: [driverId], references: [id], onDelete: Cascade)
  type        DocumentType
  title       String
  fileUrl     String
  fileName    String
  fileSize    Int
  mimeType    String
  expiryDate  DateTime?
  uploadedById String
  uploadedBy  User          @relation("UploadedDocuments", fields: [uploadedById], references: [id])
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  @@index([vehicleId])
  @@index([driverId])
  @@index([expiryDate])
}
```

### Key Indexes for Performance
- Vehicle: `registrationNumber` (unique), `status`, `region`
- Driver: `licenseNumber` (unique), `licenseExpiryDate`, `status`
- Trip: `vehicleId + status`, `driverId + status`, `status`
- MaintenanceLog: `vehicleId + status`
- FuelLog: `vehicleId + date`
- Expense: `vehicleId + date`, `type`
- Document: `vehicleId`, `driverId`, `expiryDate`

---

## Phase 2: Backend Implementation

### 2.1 Authentication & RBAC

**Session Configuration** (`config/session.ts`):
```typescript
// express-session with connect-pg-simple
// Secure cookies in production, httpOnly, sameSite: 'lax'
// Session TTL: 24 hours, rolling: true
```

**Roles & Permissions Matrix**:
| Permission | ADMIN | MANAGER | DRIVER | VIEWER |
|------------|-------|---------|--------|--------|
| Dashboard | ✓ | ✓ | ✓ | ✓ |
| Vehicles CRUD | ✓ | ✓ | ✗ | R |
| Drivers CRUD | ✓ | ✓ | ✗ | R |
| Trips Create/Dispatch | ✓ | ✓ | R | R |
| Trips Complete/Cancel | ✓ | ✓ | Own | R |
| Maintenance CRUD | ✓ | ✓ | R | R |
| Fuel/Expense Log | ✓ | ✓ | Own | R |
| Reports/Export | ✓ | ✓ | R | R |
| Documents | ✓ | ✓ | Own | R |
| User Management | ✓ | ✗ | ✗ | ✗ |

**Auth Middleware** (`middleware/auth.ts`):
- `requireAuth` - validates session
- `requireRole(...roles)` - RBAC guard
- `requireOwnershipOrRole(resource, role)` - for driver-scoped access

### 2.2 Business Rules Service (`services/businessRules.ts`)

Centralized enforcement of all mandatory business rules:

```typescript
class BusinessRulesService {
  // Vehicle Rules
  static async validateVehicleForDispatch(vehicleId: string): Promise<void>
  static async setVehicleStatus(vehicleId: string, status: VehicleStatus): Promise<void>
  static async assertVehicleAvailable(vehicleId: string): Promise<void>
  static assertCargoWeightValid(vehicle: Vehicle, cargoWeightKg: number): void
  
  // Driver Rules
  static async validateDriverForDispatch(driverId: string): Promise<void>
  static async setDriverStatus(driverId: string, status: DriverStatus): Promise<void>
  static assertDriverEligible(driver: Driver): void
  
  // Trip Lifecycle (automatic status transitions)
  static async dispatchTrip(tripId: string, userId: string): Promise<Trip>
  static async completeTrip(tripId: string, data: CompleteTripInput, userId: string): Promise<Trip>
  static async cancelTrip(tripId: string, reason: string, userId: string): Promise<Trip>
  
  // Maintenance Rules
  static async openMaintenance(data: CreateMaintenanceInput, userId: string): Promise<MaintenanceLog>
  static async closeMaintenance(maintenanceId: string, data: CloseMaintenanceInput, userId: string): Promise<MaintenanceLog>
}
```

**Automatic Status Transitions** (triggered in service methods):
| Action | Vehicle Status | Driver Status |
|--------|---------------|---------------|
| Dispatch Trip | AVAILABLE → ON_TRIP | AVAILABLE → ON_TRIP |
| Complete Trip | ON_TRIP → AVAILABLE | ON_TRIP → AVAILABLE |
| Cancel Trip (dispatched) | ON_TRIP → AVAILABLE | ON_TRIP → AVAILABLE |
| Open Maintenance | AVAILABLE/ON_TRIP → IN_SHOP | (if ON_TRIP: ON_TRIP → AVAILABLE) |
| Close Maintenance | IN_SHOP → AVAILABLE* | N/A |

*Unless vehicle is RETIRED

### 2.3 API Controllers Structure

Each controller follows pattern:
- `GET /api/resource` - List with filters, pagination, sorting
- `GET /api/resource/:id` - Get by ID
- `POST /api/resource` - Create (with validation)
- `PATCH /api/resource/:id` - Update
- `DELETE /api/resource/:id` - Delete (soft delete where appropriate)

**Key Endpoints**:
```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/register (admin only)

GET    /api/vehicles?status=&type=&region=&page=&limit=&sort=
POST   /api/vehicles
PATCH  /api/vehicles/:id
DELETE /api/vehicles/:id (soft delete → RETIRED)

GET    /api/drivers?status=&licenseExpiring=&page=&limit=
POST   /api/drivers
PATCH  /api/drivers/:id
DELETE /api/drivers/:id

GET    /api/trips?status=&vehicleId=&driverId=&dateFrom=&dateTo=&page=&limit=
POST   /api/trips (create draft)
POST   /api/trips/:id/dispatch
POST   /api/trips/:id/complete
POST   /api/trips/:id/cancel
GET    /api/trips/available-vehicles
GET    /api/trips/available-drivers

GET    /api/maintenance?vehicleId=&status=&page=&limit=
POST   /api/maintenance
POST   /api/maintenance/:id/close

GET    /api/fuel?vehicleId=&dateFrom=&dateTo=&page=&limit=
POST   /api/fuel

GET    /api/expenses?vehicleId=&type=&dateFrom=&dateTo=&page=&limit=
POST   /api/expenses

GET    /api/dashboard/kpis?vehicleType=&region=&dateFrom=&dateTo=
GET    /api/dashboard/charts?metric=&period=

GET    /api/reports/fuel-efficiency?vehicleId=&dateFrom=&dateTo=
GET    /api/reports/fleet-utilization?dateFrom=&dateTo=
GET    /api/reports/operational-cost?vehicleId=&dateFrom=&dateTo=
GET    /api/reports/vehicle-roi?vehicleId=&dateFrom=&dateTo=
GET    /api/reports/export/csv?reportType=&filters=
GET    /api/reports/export/pdf?reportType=&filters=

GET    /api/documents?vehicleId=&driverId=&type=&expiring=
POST   /api/documents
DELETE /api/documents/:id

GET    /api/users (admin)
POST   /api/users (admin)
PATCH  /api/users/:id (admin)
```

### 2.4 Services Layer Details

**VehicleService**:
- CRUD + validation (unique registration number)
- `getAvailableForDispatch(filters)` - excludes IN_SHOP, RETIRED, ON_TRIP
- `getUtilizationMetrics(filters)` - for dashboard KPI

**DriverService**:
- CRUD + license validation
- `getAvailableForDispatch()` - excludes SUSPENDED, OFF_DUTY, ON_TRIP, expired license
- `getExpiringLicenses(days)` - for email reminders

**TripService**:
- `createDraft(data)` - validates vehicle/driver availability, cargo weight
- `dispatch(id)` - atomic status transition + vehicle/driver status update
- `complete(id, data)` - validates odometer/fuel, calculates efficiency
- `cancel(id, reason)` - restores vehicle/driver status
- `getDashboardStats()` - KPIs for dashboard

**MaintenanceService**:
- `create(data)` - sets vehicle to IN_SHOP, removes from dispatch pool
- `close(id, data)` - restores to AVAILABLE (unless RETIRED)
- `getVehicleHistory(vehicleId)`

**FuelService / ExpenseService**:
- CRUD + automatic total cost computation per vehicle
- `getVehicleOperationalCost(vehicleId, dateRange)`

**DashboardService**:
- `getKPIs(filters)` - returns all 7 KPIs + fleet utilization %
- `getChartData(metric, period)` - time series for charts

**ReportService**:
- `getFuelEfficiency(filters)` - Distance/Fuel per vehicle
- `getFleetUtilization(filters)` - Trip days / Total days
- `getOperationalCost(filters)` - Fuel + Maintenance per vehicle
- `getVehicleROI(filters)` - (Revenue - (Fuel + Maintenance)) / Acquisition Cost
- `exportCSV(reportType, filters)` - stream CSV
- `exportPDF(reportType, filters)` - generate PDF

**EmailService**:
- `sendLicenseExpiryReminder(driver, daysUntilExpiry)`
- Scheduled job (daily cron) to check expiring licenses (30, 14, 7, 1 days)

**DocumentService**:
- File upload (multer + cloud storage/local)
- Type validation, expiry tracking
- `getExpiringDocuments(days)`

### 2.5 Validation Schemas (Zod)

All inputs validated with Zod schemas matching business rules:
- Vehicle: unique registration, positive capacity/cost
- Driver: valid license categories, future expiry date
- Trip: cargoWeight ≤ vehicle.maxLoadCapacity, available vehicle/driver
- Maintenance: valid vehicle, odometer progression
- Fuel/Expense: positive amounts, valid dates

---

## Phase 3: Frontend Implementation

### 3.1 Tech Choices
- **State Management**: TanStack Query (server state) + React Context (auth, theme)
- **Forms**: React Hook Form + Zod resolvers
- **UI Components**: Custom components with Tailwind CSS + Headless UI primitives
- **Charts**: Recharts (responsive, dark mode support)
- **Tables**: TanStack Table v8 (sorting, filtering, pagination, column visibility)
- **Routing**: React Router v6 with protected routes
- **Date**: date-fns

### 3.2 Page Structure

```
/login                    → Login page
/dashboard                → KPI cards + charts + filters
/vehicles                 → Vehicle list (table) + CRUD modal
/vehicles/:id             → Vehicle detail (tabs: info, trips, maintenance, fuel, expenses, documents)
/drivers                  → Driver list + CRUD modal
/drivers/:id              → Driver detail (tabs: profile, trips, license, documents)
/trips                    → Trip list + filters
/trips/new                → Create trip wizard (source/dest → vehicle → driver → cargo → review)
/trips/:id                → Trip detail + actions (dispatch/complete/cancel)
/maintenance              → Maintenance log list
/maintenance/new          → Create maintenance record
/maintenance/:id          → Maintenance detail + close action
/fuel                     → Fuel logs list + CRUD
/expenses                 → Expense list + CRUD
/reports                  → Report dashboard with tabs (efficiency, utilization, cost, ROI)
/reports/export           → Export modal (CSV/PDF)
/documents                → Document management
/documents/upload         → Upload modal
/settings/users           → User management (admin only)
/settings/profile         → User profile + password change
```

### 3.3 Key Components

**Dashboard** (`/dashboard`):
- Filter bar: vehicle type, status, region, date range
- KPI Grid (7 cards): Fleet Utilization %, Available Vehicles, On Trip, In Shop, Retired, Drivers On Duty, Available Drivers
- Charts: Fleet Utilization Trend, Fuel Efficiency Trend, Operational Cost Trend
- Real-time updates via TanStack Query refetching

**Vehicle Table** (`/vehicles`):
- Columns: Registration, Name/Model, Type, Capacity, Odometer, Status, Region, Actions
- Filters: Type, Status, Region
- Actions: View, Edit, Retire, Maintenance, Documents
- Create/Edit modal with Zod validation

**Trip Wizard** (`/trips/new`):
1. Source/Destination + Planned Distance
2. Vehicle Selection (filtered: AVAILABLE only, capacity ≥ planned cargo)
3. Driver Selection (filtered: AVAILABLE, valid license)
4. Cargo Weight + Validation (≤ vehicle capacity)
5. Review & Create Draft

**Trip Detail** (`/trips/:id`):
- Status badge with workflow actions
- Dispatch button (validates rules, transitions status)
- Complete form: actual distance, end odometer, fuel consumed, revenue
- Cancel with reason
- Timeline/history of status changes

**Maintenance Workflow**:
- Create: selects vehicle (auto-sets to IN_SHOP), description, cost, odometer
- List shows: vehicle, status, dates, cost
- Close: completion date, end odometer, final cost → restores vehicle to AVAILABLE

**Reports Page**:
- Tabbed interface: Fuel Efficiency | Fleet Utilization | Operational Cost | Vehicle ROI
- Each tab: filters + table + chart + export buttons
- CSV export streams from backend
- PDF export generates formatted report

**Documents Page**:
- Table with filters: vehicle, driver, type, expiring soon
- Upload modal: drag-drop, type selection, expiry date
- Expiry badge indicators (red < 30 days, yellow < 90 days)

**Dark Mode**:
- Tailwind `dark:` classes throughout
- Theme context persists to localStorage
- Charts adapt to theme

---

## Phase 4: Bonus Features Implementation

### 4.1 Charts & Visual Analytics
- **Recharts components**: `LineChart` (trends), `BarChart` (comparisons), `PieChart` (utilization breakdown), `AreaChart` (cumulative costs)
- Responsive containers, custom tooltips, legend toggles
- Dark mode: CSS variables for chart colors

### 4.2 PDF Export
- `@react-pdf/renderer` for client-side OR `pdfkit` server-side
- Templates per report type with tables, charts (as images), summary stats
- Download via blob

### 4.3 Email Reminders
- **Nodemailer** with SMTP config
- **node-cron** job: daily at 9 AM
- Query drivers with license expiring in [30, 14, 7, 1] days
- Send templated emails to driver (if user linked) and managers/admins
- Log sent reminders to avoid duplicates

### 4.4 Vehicle Document Management
- File upload: `multer` + local storage (dev) / S3-compatible (prod)
- Max 10MB, allowed types: PDF, JPG, PNG
- Document table with expiry tracking
- Dashboard widget: "Expiring Documents (30 days)"

### 4.5 Search, Filters, Sorting
- **Backend**: Prisma `where` clauses with dynamic filter building
- **Frontend**: TanStack Table column filtering, global search, multi-sort
- URL-synced filter state (shareable URLs)

### 4.6 Dark Mode
- Tailwind `darkMode: 'class'`
- ThemeContext with localStorage persistence
- CSS variables for chart colors
- System preference detection on first load

---

## Phase 5: DevOps & Deployment

### Docker Setup
```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: transport_ops
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports: ["5432:5432"]

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/transport_ops
      SESSION_SECRET: ${SESSION_SECRET}
      FRONTEND_URL: ${FRONTEND_URL}
    ports: ["3001:3001"]
    depends_on: [postgres]

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    depends_on: [backend]
```

### Environment Variables
```env
# Backend
DATABASE_URL=postgresql://user:pass@localhost:5432/transport_ops
SESSION_SECRET=super-secret-key
SESSION_COOKIE_NAME=transport_ops_sid
FRONTEND_URL=http://localhost:3000
PORT=3001
NODE_ENV=development

# Email (for reminders)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=alerts@example.com
SMTP_PASS=password
EMAIL_FROM=Transport Ops <alerts@example.com>

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Frontend
VITE_API_URL=http://localhost:3001/api
```

### Scripts
```json
// backend/package.json
{
  "dev": "tsx watch src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev",
  "prisma:studio": "prisma studio",
  "db:seed": "tsx prisma/seed.ts",
  "test": "vitest",
  "lint": "eslint src --ext .ts"
}
```

```json
// frontend/package.json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "lint": "eslint src --ext .ts,.tsx",
  "test": "vitest"
}
```

---

## Phase 6: Testing Strategy

### Backend Tests (Vitest)
- Unit tests for `BusinessRulesService` (all mandatory rules)
- Integration tests for API endpoints (supertest)
- Service layer tests with mocked Prisma

### Frontend Tests (Vitest + React Testing Library)
- Component tests for forms, tables, modals
- Hook tests for auth, queries
- Integration tests for critical flows (trip dispatch/complete)

### E2E Tests (Playwright)
- Login → Dashboard → Create Vehicle → Create Driver → Create Trip → Dispatch → Complete
- Maintenance workflow
- Report export

---

## Phase 7: Implementation Sequence

### Sprint 1: Foundation (Week 1)
- [ ] Project setup (monorepo or separate repos)
- [ ] Prisma schema + migrations
- [ ] Database seed script (roles, admin user, sample data)
- [ ] Express server + session auth + RBAC middleware
- [ ] Login/logout/me endpoints
- [ ] React app + routing + auth context + protected routes
- [ ] Login page + theme context + Tailwind setup

### Sprint 2: Core Entities (Week 2)
- [ ] Vehicle CRUD (backend + frontend)
- [ ] Driver CRUD (backend + frontend)
- [ ] List pages with filters, sorting, pagination
- [ ] Unique validation, status badges
- [ ] Unit tests for vehicle/driver services

### Sprint 3: Trip Management (Week 3)
- [ ] Trip CRUD + lifecycle endpoints
- [ ] Business rules service (all mandatory validations)
- [ ] Trip wizard (multi-step form)
- [ ] Trip detail with dispatch/complete/cancel actions
- [ ] Automatic status transitions
- [ ] Available vehicle/driver selectors
- [ ] Integration tests for trip workflows

### Sprint 4: Maintenance & Expenses (Week 4)
- [ ] Maintenance log CRUD + status transitions
- [ ] Fuel log CRUD
- [ ] Expense CRUD
- [ ] Vehicle detail page with tabs
- [ ] Operational cost computation

### Sprint 5: Dashboard & Reports (Week 5)
- [ ] Dashboard KPIs endpoint + frontend
- [ ] Filter bar (vehicle type, status, region, date range)
- [ ] Charts (Recharts) for trends
- [ ] Report endpoints (fuel efficiency, utilization, cost, ROI)
- [ ] CSV export endpoint + frontend
- [ ] PDF export endpoint + frontend

### Sprint 6: Bonus Features (Week 6)
- [ ] Document management (upload, list, expiry)
- [ ] Dark mode toggle
- [ ] Email reminders (cron job + nodemailer)
- [ ] Search/filters/sorting enhancements
- [ ] URL-synced filter state
- [ ] E2E tests for critical paths

### Sprint 7: Polish & Deploy (Week 7)
- [ ] Error boundaries + loading states
- [ ] Input validation feedback
- [ ] Accessibility audit (ARIA, keyboard nav)
- [ ] Performance optimization (query caching, pagination)
- [ ] Docker setup + docker-compose
- [ ] Production build verification
- [ ] Documentation (README, API docs)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Complex business rules | Centralized `BusinessRulesService` with comprehensive unit tests |
| Status transition bugs | Database transactions + service-layer atomic operations |
| Performance on reports | Database indexes, pagination, materialized views for heavy queries |
| File upload security | MIME validation, size limits, signed URLs for S3 |
| Session security | Secure cookies, CSRF protection (csurf), session rotation |
| Dark mode flicker | Inline script in `index.html` to set theme before paint |

---

## Clarifying Questions Before Implementation

1. **Deployment Target**: Docker on VPS, Kubernetes, Vercel/Render/Railway, or other?
2. **File Storage**: Local filesystem (dev) → S3/MinIO (prod), or keep local?
3. **Email Provider**: SMTP credentials available, or use service like SendGrid/Resend?
4. **Real-time Updates**: Need WebSocket/SSE for live dashboard updates, or polling OK?
5. **Multi-tenancy**: Single tenant now, but plan for multi-tenant later?
6. **Mobile App**: Future React Native? If so, API-first design critical.
7. **Audit Logging**: Required for compliance? (Trip status changes, user actions)

---

## Next Steps

Once you confirm the plan and answer clarifying questions, I'll:
1. Set up the monorepo structure
2. Create Prisma schema and run initial migration
3. Build backend foundation (Express + Prisma + Session Auth)
4. Build frontend foundation (React + Router + Auth Context + Theme)
5. Implement features sprint by sprint

**Estimated Timeline**: 7 weeks for full implementation with all bonus features.
