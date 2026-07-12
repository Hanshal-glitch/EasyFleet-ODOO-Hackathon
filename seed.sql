
BEGIN;

INSERT INTO roles (name, description) VALUES
    ('Admin',              'Full system access'),
    ('Fleet Manager',      'Oversees fleet assets, maintenance, vehicle lifecycle'),
    ('Driver',             'Creates trips, assigns vehicles/drivers, monitors deliveries'),
    ('Safety Officer',     'Tracks license validity, driver compliance, safety scores'),
    ('Financial Analyst',  'Reviews expenses, fuel cost, maintenance cost, profitability');

INSERT INTO permissions (code, description) VALUES
    ('vehicle:create', 'Register a new vehicle'),
    ('vehicle:update', 'Edit vehicle details'),
    ('vehicle:retire', 'Retire a vehicle'),
    ('driver:create',  'Register a new driver'),
    ('driver:update',  'Edit driver details'),
    ('driver:suspend', 'Suspend a driver'),
    ('trip:create',    'Create a draft trip'),
    ('trip:dispatch',  'Dispatch a trip'),
    ('trip:complete',  'Complete a trip'),
    ('trip:cancel',    'Cancel a trip'),
    ('maintenance:manage', 'Open/close maintenance records'),
    ('expense:manage', 'Record fuel logs and expenses'),
    ('reports:view',   'View reports and analytics');


INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'Admin';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'Fleet Manager'
  AND p.code IN ('vehicle:create','vehicle:update','vehicle:retire','driver:create','driver:update',
                 'trip:create','trip:dispatch','trip:complete','trip:cancel','maintenance:manage','reports:view');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'Driver'
  AND p.code IN ('trip:create','trip:dispatch','trip:complete');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'Safety Officer'
  AND p.code IN ('driver:update','driver:suspend','reports:view');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'Financial Analyst'
  AND p.code IN ('expense:manage','reports:view');

INSERT INTO vehicle_types (name) VALUES
    ('Truck'), ('Van'), ('Pickup'), ('Trailer'), ('Mini Truck');

INSERT INTO regions (name) VALUES
    ('North'), ('South'), ('East'), ('West'), ('Central');

INSERT INTO expense_categories (name) VALUES
    ('Toll'), ('Parking'), ('Fine'), ('Insurance'), ('Miscellaneous');

COMMIT;
