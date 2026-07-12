
\set ON_ERROR_STOP off

\echo '--- Setup: vehicle type + region already seeded. Register Van-05 ---'
INSERT INTO vehicles (registration_number, name, vehicle_type_id, max_load_capacity_kg, odometer_km, acquisition_cost, region_id, status)
VALUES ('REG-VAN05', 'Van-05', (SELECT id FROM vehicle_types WHERE name='Van'), 500, 10000, 25000, (SELECT id FROM regions WHERE name='North'), 'Available')
RETURNING id, registration_number, status;

\echo '--- Register driver Alex, valid license ---'
INSERT INTO drivers (name, license_number, license_category, license_expiry_date, contact_number, status)
VALUES ('Alex', 'DL-ALEX-01', 'LMV', CURRENT_DATE + INTERVAL '2 years', '555-0100', 'Available')
RETURNING id, name, status;

\echo '--- Step 3-4: Create trip, cargo 450kg (<=500) — should succeed as Draft ---'
INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, status)
VALUES ('Warehouse A', 'Warehouse B',
        (SELECT id FROM vehicles WHERE registration_number='REG-VAN05'),
        (SELECT id FROM drivers WHERE license_number='DL-ALEX-01'),
        450, 120, 'Draft')
RETURNING id, status;

\echo '--- Step 5: Dispatch the trip -> vehicle & driver should become On Trip ---'
UPDATE trips SET status='Dispatched' WHERE source='Warehouse A' AND destination='Warehouse B';
SELECT registration_number, status FROM vehicles WHERE registration_number='REG-VAN05';
SELECT name, status FROM drivers WHERE license_number='DL-ALEX-01';

\echo '--- TEST: try to dispatch Van-05 again on a second trip while On Trip -> must FAIL ---'
INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, status)
VALUES ('X', 'Y', (SELECT id FROM vehicles WHERE registration_number='REG-VAN05'),
        (SELECT id FROM drivers WHERE license_number='DL-ALEX-01'), 100, 10, 'Draft');

\echo '--- Step 6-7: Complete the trip with actual distance + fuel -> both back to Available, odometer updates ---'
UPDATE trips SET status='Completed', actual_distance_km=118, fuel_consumed_l=14, revenue=3000
WHERE source='Warehouse A' AND destination='Warehouse B';
SELECT registration_number, status, odometer_km FROM vehicles WHERE registration_number='REG-VAN05';
SELECT name, status FROM drivers WHERE license_number='DL-ALEX-01';

\echo '--- Step 8: Create maintenance record -> vehicle becomes In Shop ---'
INSERT INTO maintenance_logs (vehicle_id, description, maintenance_type, cost, status)
VALUES ((SELECT id FROM vehicles WHERE registration_number='REG-VAN05'), 'Oil Change', 'Routine', 80, 'Active')
RETURNING id, status;
SELECT registration_number, status FROM vehicles WHERE registration_number='REG-VAN05';

\echo '--- TEST: try to dispatch a trip for Van-05 while In Shop -> must FAIL ---'
INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, status)
VALUES ('X', 'Y', (SELECT id FROM vehicles WHERE registration_number='REG-VAN05'),
        (SELECT id FROM drivers WHERE license_number='DL-ALEX-01'), 100, 10, 'Draft');

\echo '--- Close maintenance -> vehicle back to Available ---'
UPDATE maintenance_logs SET status='Closed' WHERE description='Oil Change';
SELECT registration_number, status FROM vehicles WHERE registration_number='REG-VAN05';

\echo '--- TEST: cargo weight over capacity -> must FAIL ---'
INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, status)
VALUES ('X', 'Y', (SELECT id FROM vehicles WHERE registration_number='REG-VAN05'),
        (SELECT id FROM drivers WHERE license_number='DL-ALEX-01'), 999, 10, 'Draft');

\echo '--- TEST: suspended driver cannot be assigned -> must FAIL ---'
INSERT INTO drivers (name, license_number, license_category, license_expiry_date, contact_number, status)
VALUES ('Suspended Sam', 'DL-SAM-01', 'LMV', CURRENT_DATE + INTERVAL '1 year', '555-0101', 'Suspended');
INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, status)
VALUES ('X', 'Y', (SELECT id FROM vehicles WHERE registration_number='REG-VAN05'),
        (SELECT id FROM drivers WHERE license_number='DL-SAM-01'), 100, 10, 'Draft');

\echo '--- TEST: expired license cannot be assigned -> must FAIL ---'
INSERT INTO drivers (name, license_number, license_category, license_expiry_date, contact_number, status)
VALUES ('Expired Eve', 'DL-EVE-01', 'LMV', CURRENT_DATE - INTERVAL '10 days', '555-0102', 'Available');
INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, status)
VALUES ('X', 'Y', (SELECT id FROM vehicles WHERE registration_number='REG-VAN05'),
        (SELECT id FROM drivers WHERE license_number='DL-EVE-01'), 100, 10, 'Draft');

\echo '--- TEST: duplicate registration number -> must FAIL ---'
INSERT INTO vehicles (registration_number, name, vehicle_type_id, max_load_capacity_kg, acquisition_cost, status)
VALUES ('REG-VAN05', 'Duplicate Van', (SELECT id FROM vehicle_types WHERE name='Van'), 300, 10000, 'Available');

\echo '--- Reports: dashboard KPIs, fuel efficiency, ROI, operational cost ---'
SELECT * FROM vw_dashboard_kpis;
SELECT * FROM vw_vehicle_fuel_efficiency WHERE registration_number='REG-VAN05';
SELECT * FROM vw_vehicle_operational_cost WHERE registration_number='REG-VAN05';
SELECT * FROM vw_vehicle_roi WHERE registration_number='REG-VAN05';

\echo '--- Status history audit trail for Van-05 ---'
SELECT old_status, new_status, reason, changed_at FROM vehicle_status_history
  WHERE vehicle_id=(SELECT id FROM vehicles WHERE registration_number='REG-VAN05') ORDER BY changed_at;
