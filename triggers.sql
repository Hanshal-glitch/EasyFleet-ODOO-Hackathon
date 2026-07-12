
BEGIN;

CREATE OR REPLACE FUNCTION log_vehicle_status_change(
    p_vehicle_id INTEGER, p_old vehicle_status, p_new vehicle_status,
    p_reason VARCHAR, p_changed_by INTEGER
) RETURNS VOID AS $$
BEGIN
    INSERT INTO vehicle_status_history(vehicle_id, old_status, new_status, reason, changed_by)
    VALUES (p_vehicle_id, p_old, p_new, p_reason, p_changed_by);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_driver_status_change(
    p_driver_id INTEGER, p_old driver_status, p_new driver_status,
    p_reason VARCHAR, p_changed_by INTEGER
) RETURNS VOID AS $$
BEGIN
    INSERT INTO driver_status_history(driver_id, old_status, new_status, reason, changed_by)
    VALUES (p_driver_id, p_old, p_new, p_reason, p_changed_by);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_trip_business_rules() RETURNS TRIGGER AS $$
DECLARE
    v_vehicle vehicles%ROWTYPE;
    v_driver  drivers%ROWTYPE;
BEGIN
    SELECT * INTO v_vehicle FROM vehicles WHERE id = NEW.vehicle_id FOR UPDATE;
    SELECT * INTO v_driver  FROM drivers  WHERE id = NEW.driver_id  FOR UPDATE;

    IF NEW.cargo_weight_kg > v_vehicle.max_load_capacity_kg THEN
        RAISE EXCEPTION 'Cargo weight (%) exceeds vehicle % max load capacity (%)',
            NEW.cargo_weight_kg, v_vehicle.registration_number, v_vehicle.max_load_capacity_kg;
    END IF;

    IF TG_OP = 'INSERT' THEN
        IF v_vehicle.status IN ('Retired', 'In Shop', 'On Trip') THEN
            RAISE EXCEPTION 'Vehicle % is % and cannot be selected for a trip', v_vehicle.registration_number, v_vehicle.status;
        END IF;
        IF v_driver.status IN ('Suspended', 'On Trip') THEN
            RAISE EXCEPTION 'Driver % is % and cannot be assigned to a trip', v_driver.name, v_driver.status;
        END IF;
        IF v_driver.license_expiry_date < CURRENT_DATE THEN
            RAISE EXCEPTION 'Driver % license expired on %', v_driver.name, v_driver.license_expiry_date;
        END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' AND NEW.status = 'Dispatched' AND OLD.status = 'Draft' THEN
        IF v_vehicle.status <> 'Available' THEN
            RAISE EXCEPTION 'Vehicle % is not Available (currently %)', v_vehicle.registration_number, v_vehicle.status;
        END IF;
        IF v_driver.status <> 'Available' THEN
            RAISE EXCEPTION 'Driver % is not Available (currently %)', v_driver.name, v_driver.status;
        END IF;
        IF v_driver.license_expiry_date < CURRENT_DATE THEN
            RAISE EXCEPTION 'Driver % license expired on %', v_driver.name, v_driver.license_expiry_date;
        END IF;

        UPDATE vehicles SET status = 'On Trip', updated_at = now() WHERE id = v_vehicle.id;
        UPDATE drivers  SET status = 'On Trip', updated_at = now() WHERE id = v_driver.id;
        PERFORM log_vehicle_status_change(v_vehicle.id, v_vehicle.status, 'On Trip', 'Trip #' || NEW.id || ' dispatched', NEW.created_by);
        PERFORM log_driver_status_change(v_driver.id, v_driver.status, 'On Trip', 'Trip #' || NEW.id || ' dispatched', NEW.created_by);

        NEW.dispatched_at := now();
        RETURN NEW;
    END IF;


    IF TG_OP = 'UPDATE' AND NEW.status = 'Completed' AND OLD.status = 'Dispatched' THEN
        UPDATE vehicles SET status = 'Available',
                             odometer_km = odometer_km + COALESCE(NEW.actual_distance_km, 0),
                             updated_at = now()
               WHERE id = v_vehicle.id;
        UPDATE drivers SET status = 'Available', updated_at = now() WHERE id = v_driver.id;
        PERFORM log_vehicle_status_change(v_vehicle.id, 'On Trip', 'Available', 'Trip #' || NEW.id || ' completed', NEW.created_by);
        PERFORM log_driver_status_change(v_driver.id, 'On Trip', 'Available', 'Trip #' || NEW.id || ' completed', NEW.created_by);

        NEW.completed_at := now();
        RETURN NEW;
    END IF;


    IF TG_OP = 'UPDATE' AND NEW.status = 'Cancelled' AND OLD.status IN ('Draft', 'Dispatched') THEN
        IF OLD.status = 'Dispatched' THEN
            UPDATE vehicles SET status = 'Available', updated_at = now() WHERE id = v_vehicle.id;
            UPDATE drivers  SET status = 'Available', updated_at = now() WHERE id = v_driver.id;
            PERFORM log_vehicle_status_change(v_vehicle.id, 'On Trip', 'Available', 'Trip #' || NEW.id || ' cancelled', NEW.created_by);
            PERFORM log_driver_status_change(v_driver.id, 'On Trip', 'Available', 'Trip #' || NEW.id || ' cancelled', NEW.created_by);
        END IF;
        NEW.cancelled_at := now();
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
        RAISE EXCEPTION 'Invalid trip status transition: % -> %', OLD.status, NEW.status;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_trip_business_rules
    BEFORE INSERT OR UPDATE ON trips
    FOR EACH ROW EXECUTE FUNCTION fn_trip_business_rules();

CREATE OR REPLACE FUNCTION fn_maintenance_business_rules() RETURNS TRIGGER AS $$
DECLARE
    v_vehicle vehicles%ROWTYPE;
BEGIN
    SELECT * INTO v_vehicle FROM vehicles WHERE id = NEW.vehicle_id FOR UPDATE;

    IF TG_OP = 'INSERT' AND NEW.status = 'Active' THEN
        IF v_vehicle.status = 'On Trip' THEN
            RAISE EXCEPTION 'Vehicle % is currently On Trip and cannot enter maintenance', v_vehicle.registration_number;
        END IF;
        IF v_vehicle.status = 'Retired' THEN
            RAISE EXCEPTION 'Vehicle % is Retired and cannot enter maintenance', v_vehicle.registration_number;
        END IF;
        UPDATE vehicles SET status = 'In Shop', updated_at = now() WHERE id = v_vehicle.id;
        PERFORM log_vehicle_status_change(v_vehicle.id, v_vehicle.status, 'In Shop', 'Maintenance #' || NEW.id || ' opened', NEW.created_by);
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' AND NEW.status = 'Closed' AND OLD.status = 'Active' THEN
        NEW.closed_at := now();
        IF v_vehicle.status <> 'Retired' THEN
            UPDATE vehicles SET status = 'Available', updated_at = now() WHERE id = v_vehicle.id;
            PERFORM log_vehicle_status_change(v_vehicle.id, 'In Shop', 'Available', 'Maintenance #' || NEW.id || ' closed', NEW.created_by);
        END IF;
        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_maintenance_business_rules
    BEFORE INSERT OR UPDATE ON maintenance_logs
    FOR EACH ROW EXECUTE FUNCTION fn_maintenance_business_rules();


CREATE OR REPLACE FUNCTION fn_touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_touch_vehicles BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();
CREATE TRIGGER trg_touch_drivers  BEFORE UPDATE ON drivers  FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();
CREATE TRIGGER trg_touch_users    BEFORE UPDATE ON users    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

COMMIT;
