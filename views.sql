
BEGIN;


CREATE OR REPLACE VIEW vw_vehicle_operational_cost AS
SELECT
    v.id AS vehicle_id,
    v.registration_number,
    COALESCE(f.total_fuel_cost, 0)         AS total_fuel_cost,
    COALESCE(m.total_maintenance_cost, 0)  AS total_maintenance_cost,
    COALESCE(f.total_fuel_cost, 0) + COALESCE(m.total_maintenance_cost, 0) AS total_operational_cost
FROM vehicles v
LEFT JOIN (
    SELECT vehicle_id, SUM(cost) AS total_fuel_cost
    FROM fuel_logs GROUP BY vehicle_id
) f ON f.vehicle_id = v.id
LEFT JOIN (
    SELECT vehicle_id, SUM(cost) AS total_maintenance_cost
    FROM maintenance_logs GROUP BY vehicle_id
) m ON m.vehicle_id = v.id;

CREATE OR REPLACE VIEW vw_vehicle_fuel_efficiency AS
SELECT
    v.id AS vehicle_id,
    v.registration_number,
    COALESCE(SUM(t.actual_distance_km), 0) AS total_distance_km,
    COALESCE(SUM(t.fuel_consumed_l), 0)    AS total_fuel_l,
    CASE WHEN COALESCE(SUM(t.fuel_consumed_l), 0) > 0
         THEN ROUND(SUM(t.actual_distance_km) / SUM(t.fuel_consumed_l), 2)
         ELSE NULL END AS km_per_liter
FROM vehicles v
LEFT JOIN trips t ON t.vehicle_id = v.id AND t.status = 'Completed'
GROUP BY v.id, v.registration_number;

CREATE OR REPLACE VIEW vw_vehicle_roi AS
SELECT
    v.id AS vehicle_id,
    v.registration_number,
    v.acquisition_cost,
    COALESCE(r.total_revenue, 0) AS total_revenue,
    oc.total_operational_cost,
    CASE WHEN v.acquisition_cost > 0
         THEN ROUND((COALESCE(r.total_revenue, 0) - oc.total_operational_cost) / v.acquisition_cost, 4)
         ELSE NULL END AS roi
FROM vehicles v
JOIN vw_vehicle_operational_cost oc ON oc.vehicle_id = v.id
LEFT JOIN (
    SELECT vehicle_id, SUM(revenue) AS total_revenue
    FROM trips WHERE status = 'Completed' GROUP BY vehicle_id
) r ON r.vehicle_id = v.id;


CREATE OR REPLACE VIEW vw_fleet_utilization AS
SELECT
    COUNT(*) FILTER (WHERE status <> 'Retired')          AS active_vehicles,
    COUNT(*) FILTER (WHERE status = 'Available')          AS available_vehicles,
    COUNT(*) FILTER (WHERE status = 'On Trip')             AS vehicles_on_trip,
    COUNT(*) FILTER (WHERE status = 'In Shop')             AS vehicles_in_maintenance,
    CASE WHEN COUNT(*) FILTER (WHERE status <> 'Retired') > 0
         THEN ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'On Trip')
              / COUNT(*) FILTER (WHERE status <> 'Retired'), 2)
         ELSE 0 END AS fleet_utilization_pct
FROM vehicles;


CREATE OR REPLACE VIEW vw_dashboard_kpis AS
SELECT
    (SELECT active_vehicles FROM vw_fleet_utilization)         AS active_vehicles,
    (SELECT available_vehicles FROM vw_fleet_utilization)      AS available_vehicles,
    (SELECT vehicles_in_maintenance FROM vw_fleet_utilization) AS vehicles_in_maintenance,
    (SELECT fleet_utilization_pct FROM vw_fleet_utilization)   AS fleet_utilization_pct,
    (SELECT COUNT(*) FROM trips WHERE status = 'Dispatched')   AS active_trips,
    (SELECT COUNT(*) FROM trips WHERE status = 'Draft')        AS pending_trips,
    (SELECT COUNT(*) FROM drivers WHERE status = 'On Trip')    AS drivers_on_duty;

COMMIT;
