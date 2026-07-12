
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;


CREATE TYPE vehicle_status AS ENUM ('Available', 'On Trip', 'In Shop', 'Retired');
CREATE TYPE driver_status  AS ENUM ('Available', 'On Trip', 'Off Duty', 'Suspended');
CREATE TYPE trip_status    AS ENUM ('Draft', 'Dispatched', 'Completed', 'Cancelled');
CREATE TYPE maintenance_status AS ENUM ('Active', 'Closed');

CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE permissions (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE role_permissions (
    role_id       INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role_id       INTEGER NOT NULL REFERENCES roles(id),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role_id);

CREATE TABLE regions (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE vehicle_types (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE expense_categories (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE vehicles (
    id                   SERIAL PRIMARY KEY,
    registration_number  VARCHAR(50) NOT NULL UNIQUE,
    name                 VARCHAR(150) NOT NULL,          -- e.g. "Van-05"
    vehicle_type_id      INTEGER NOT NULL REFERENCES vehicle_types(id),
    max_load_capacity_kg NUMERIC(10,2) NOT NULL CHECK (max_load_capacity_kg > 0),
    odometer_km          NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (odometer_km >= 0),
    acquisition_cost     NUMERIC(14,2) NOT NULL CHECK (acquisition_cost >= 0),
    region_id            INTEGER REFERENCES regions(id),
    status               vehicle_status NOT NULL DEFAULT 'Available',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_type   ON vehicles(vehicle_type_id);
CREATE INDEX idx_vehicles_region ON vehicles(region_id);

CREATE TABLE vehicle_status_history (
    id           SERIAL PRIMARY KEY,
    vehicle_id   INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    old_status   vehicle_status,
    new_status   vehicle_status NOT NULL,
    reason       VARCHAR(255),
    changed_by   INTEGER REFERENCES users(id),
    changed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vsh_vehicle ON vehicle_status_history(vehicle_id, changed_at);


CREATE TABLE drivers (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(150) NOT NULL,
    license_number      VARCHAR(50) NOT NULL UNIQUE,
    license_category    VARCHAR(20) NOT NULL,
    license_expiry_date DATE NOT NULL,
    contact_number      VARCHAR(20) NOT NULL,
    safety_score        NUMERIC(5,2) NOT NULL DEFAULT 100 CHECK (safety_score BETWEEN 0 AND 100),
    status              driver_status NOT NULL DEFAULT 'Available',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_expiry ON drivers(license_expiry_date);

CREATE TABLE driver_status_history (
    id          SERIAL PRIMARY KEY,
    driver_id   INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    old_status  driver_status,
    new_status  driver_status NOT NULL,
    reason      VARCHAR(255),
    changed_by  INTEGER REFERENCES users(id),
    changed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_dsh_driver ON driver_status_history(driver_id, changed_at);


CREATE TABLE trips (
    id                SERIAL PRIMARY KEY,
    source             VARCHAR(255) NOT NULL,
    destination        VARCHAR(255) NOT NULL,
    vehicle_id         INTEGER NOT NULL REFERENCES vehicles(id),
    driver_id          INTEGER NOT NULL REFERENCES drivers(id),
    cargo_weight_kg    NUMERIC(10,2) NOT NULL CHECK (cargo_weight_kg > 0),
    planned_distance_km NUMERIC(10,2) NOT NULL CHECK (planned_distance_km > 0),
    actual_distance_km  NUMERIC(10,2) CHECK (actual_distance_km >= 0),
    fuel_consumed_l     NUMERIC(10,2) CHECK (fuel_consumed_l >= 0),
    revenue             NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (revenue >= 0),
    status              trip_status NOT NULL DEFAULT 'Draft',
    dispatched_at       TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    cancelled_at        TIMESTAMPTZ,
    created_by          INTEGER REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trips_status  ON trips(status);
CREATE INDEX idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX idx_trips_driver  ON trips(driver_id);
CREATE INDEX idx_trips_created ON trips(created_at);

CREATE TABLE maintenance_logs (
    id               SERIAL PRIMARY KEY,
    vehicle_id       INTEGER NOT NULL REFERENCES vehicles(id),
    description      VARCHAR(255) NOT NULL,
    maintenance_type VARCHAR(100),
    cost             NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
    status           maintenance_status NOT NULL DEFAULT 'Active',
    started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at        TIMESTAMPTZ,
    created_by       INTEGER REFERENCES users(id),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_maint_vehicle ON maintenance_logs(vehicle_id);
CREATE INDEX idx_maint_status  ON maintenance_logs(status);


CREATE TABLE fuel_logs (
    id               SERIAL PRIMARY KEY,
    vehicle_id       INTEGER NOT NULL REFERENCES vehicles(id),
    trip_id          INTEGER REFERENCES trips(id),
    liters           NUMERIC(10,2) NOT NULL CHECK (liters > 0),
    cost             NUMERIC(12,2) NOT NULL CHECK (cost >= 0),
    log_date         DATE NOT NULL DEFAULT CURRENT_DATE,
    odometer_reading NUMERIC(12,2) CHECK (odometer_reading >= 0),
    created_by       INTEGER REFERENCES users(id),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fuel_vehicle ON fuel_logs(vehicle_id);
CREATE INDEX idx_fuel_date    ON fuel_logs(log_date);

CREATE TABLE expenses (
    id           SERIAL PRIMARY KEY,
    vehicle_id   INTEGER NOT NULL REFERENCES vehicles(id),
    trip_id      INTEGER REFERENCES trips(id),
    category_id  INTEGER NOT NULL REFERENCES expense_categories(id),
    amount       NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description  VARCHAR(255),
    created_by   INTEGER REFERENCES users(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_expenses_vehicle ON expenses(vehicle_id);
CREATE INDEX idx_expenses_date    ON expenses(expense_date);

COMMIT;
