-- ============================================================
-- THE CROPPERS - SUPABASE DATABASE SETUP / SEED SCRIPT
-- ============================================================
-- Safe to run multiple times.
-- Existing records are updated; missing records are inserted.
-- ============================================================

BEGIN;


-- ============================================================
-- 1. COMPATIBILITY COLUMNS
-- ============================================================

-- salons
ALTER TABLE public.salons
    ADD COLUMN IF NOT EXISTS slug TEXT,
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS timezone TEXT,
    ADD COLUMN IF NOT EXISTS currency TEXT;

-- service_categories
ALTER TABLE public.service_categories
    ADD COLUMN IF NOT EXISTS salon_id UUID,
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS display_order INT;

-- services
ALTER TABLE public.services
    ADD COLUMN IF NOT EXISTS salon_id UUID,
    ADD COLUMN IF NOT EXISTS category_id UUID,
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS price NUMERIC,
    ADD COLUMN IF NOT EXISTS duration_minutes INT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN;

-- staff
ALTER TABLE public.staff
    ADD COLUMN IF NOT EXISTS salon_id UUID,
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS full_name TEXT,
    ADD COLUMN IF NOT EXISTS role TEXT,
    ADD COLUMN IF NOT EXISTS specialization TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN,
    ADD COLUMN IF NOT EXISTS base_salary NUMERIC,
    ADD COLUMN IF NOT EXISTS incentive_percentage NUMERIC;

-- customers
ALTER TABLE public.customers
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS full_name TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT;

-- appointments
ALTER TABLE public.appointments
    ADD COLUMN IF NOT EXISTS reference_number TEXT,
    ADD COLUMN IF NOT EXISTS date DATE,
    ADD COLUMN IF NOT EXISTS total_price NUMERIC,
    ADD COLUMN IF NOT EXISTS payment_method TEXT,
    ADD COLUMN IF NOT EXISTS booking_source TEXT,
    ADD COLUMN IF NOT EXISTS owner_approval_status TEXT,
    ADD COLUMN IF NOT EXISTS custom_price_note TEXT,
    ADD COLUMN IF NOT EXISTS booked_by_staff_name TEXT,
    ADD COLUMN IF NOT EXISTS status_changed_by TEXT,
    ADD COLUMN IF NOT EXISTS notes TEXT;

-- salon_hours
ALTER TABLE public.salon_hours
    ADD COLUMN IF NOT EXISTS open_time TIME,
    ADD COLUMN IF NOT EXISTS close_time TIME,
    ADD COLUMN IF NOT EXISTS opens_at TIME,
    ADD COLUMN IF NOT EXISTS closes_at TIME;

-- attendance
ALTER TABLE public.attendance
    ADD COLUMN IF NOT EXISTS date DATE;


-- ============================================================
-- 2. RELAX NULL CONSTRAINTS ON COMPATIBILITY COLUMNS
-- ============================================================

ALTER TABLE public.staff
    ALTER COLUMN full_name DROP NOT NULL;

ALTER TABLE public.staff
    ALTER COLUMN name DROP NOT NULL;

ALTER TABLE public.customers
    ALTER COLUMN full_name DROP NOT NULL;

ALTER TABLE public.customers
    ALTER COLUMN name DROP NOT NULL;


-- ============================================================
-- 3. KEEP COMPATIBILITY COLUMNS IN SYNC
-- ============================================================

-- salons
UPDATE public.salons
SET currency = currency_code
WHERE currency IS NULL
  AND currency_code IS NOT NULL;

UPDATE public.salons
SET timezone = 'Asia/Kolkata'
WHERE timezone IS NULL;


-- staff
UPDATE public.staff
SET name = full_name
WHERE name IS NULL
  AND full_name IS NOT NULL;

UPDATE public.staff
SET full_name = name
WHERE full_name IS NULL
  AND name IS NOT NULL;

UPDATE public.staff
SET is_active = (status::text = 'active')
WHERE is_active IS NULL;


-- customers
UPDATE public.customers
SET name = full_name
WHERE name IS NULL
  AND full_name IS NOT NULL;

UPDATE public.customers
SET full_name = name
WHERE full_name IS NULL
  AND name IS NOT NULL;


-- appointments
UPDATE public.appointments
SET date = appointment_date
WHERE date IS NULL;


-- salon hours
UPDATE public.salon_hours
SET open_time = opening_time
WHERE open_time IS NULL;

UPDATE public.salon_hours
SET close_time = closing_time
WHERE close_time IS NULL;

UPDATE public.salon_hours
SET opens_at = opening_time
WHERE opens_at IS NULL;

UPDATE public.salon_hours
SET closes_at = closing_time
WHERE closes_at IS NULL;


-- attendance
UPDATE public.attendance
SET date = attendance_date
WHERE date IS NULL;


-- ============================================================
-- 4. ENABLE RLS
-- ============================================================

ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_service_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salon_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 5. RECREATE PUBLIC FULL ACCESS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Public full access"
ON public.salons;

CREATE POLICY "Public full access"
ON public.salons
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Public full access"
ON public.service_categories;

CREATE POLICY "Public full access"
ON public.service_categories
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Public full access"
ON public.services;

CREATE POLICY "Public full access"
ON public.services
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Public full access"
ON public.staff;

CREATE POLICY "Public full access"
ON public.staff
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Public full access"
ON public.customers;

CREATE POLICY "Public full access"
ON public.customers
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Public full access"
ON public.appointments;

CREATE POLICY "Public full access"
ON public.appointments
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Public full access"
ON public.appointment_services;

CREATE POLICY "Public full access"
ON public.appointment_services
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Public full access"
ON public.appointment_service_staff;

CREATE POLICY "Public full access"
ON public.appointment_service_staff
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Public full access"
ON public.salon_hours;

CREATE POLICY "Public full access"
ON public.salon_hours
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Public full access"
ON public.attendance;

CREATE POLICY "Public full access"
ON public.attendance
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);


-- ============================================================
-- 6. GRANTS
-- ============================================================

GRANT ALL ON TABLE public.salons
TO anon, authenticated, service_role;

GRANT ALL ON TABLE public.service_categories
TO anon, authenticated, service_role;

GRANT ALL ON TABLE public.services
TO anon, authenticated, service_role;

GRANT ALL ON TABLE public.staff
TO anon, authenticated, service_role;

GRANT ALL ON TABLE public.customers
TO anon, authenticated, service_role;

GRANT ALL ON TABLE public.appointments
TO anon, authenticated, service_role;

GRANT ALL ON TABLE public.appointment_services
TO anon, authenticated, service_role;

GRANT ALL ON TABLE public.appointment_service_staff
TO anon, authenticated, service_role;

GRANT ALL ON TABLE public.salon_hours
TO anon, authenticated, service_role;

GRANT ALL ON TABLE public.attendance
TO anon, authenticated, service_role;


-- ============================================================
-- 7. SALON
-- ============================================================

INSERT INTO public.salons (
    id,
    name,
    slug,
    city,
    phone,
    timezone,
    currency,
    currency_code,
    country,
    is_active
)
VALUES (
    'f8d3c307-37a2-465c-902f-e023974aa562',
    'The Croppers',
    'the-croppers',
    'Jabalpur',
    '+917848827245',
    'Asia/Kolkata',
    'INR',
    'INR',
    'India',
    true
)
ON CONFLICT (id)
DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    city = EXCLUDED.city,
    phone = EXCLUDED.phone,
    timezone = EXCLUDED.timezone,
    currency = EXCLUDED.currency,
    currency_code = EXCLUDED.currency_code,
    country = EXCLUDED.country,
    is_active = EXCLUDED.is_active,
    updated_at = now();


-- ============================================================
-- 8. SERVICE CATEGORIES
-- ============================================================

INSERT INTO public.service_categories (
    salon_id,
    name,
    description,
    display_order,
    is_active
)
VALUES
(
    'f8d3c307-37a2-465c-902f-e023974aa562',
    'Hair',
    'Hair cutting, washing, spa and colouring services',
    1,
    true
),
(
    'f8d3c307-37a2-465c-902f-e023974aa562',
    'Beard',
    'Beard trimming and shaving services',
    2,
    true
),
(
    'f8d3c307-37a2-465c-902f-e023974aa562',
    'Skin',
    'Facial and skin care services',
    3,
    true
)
ON CONFLICT (salon_id, name)
DO UPDATE SET
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active;


-- ============================================================
-- 9. SERVICES
-- ============================================================

-- Haircut
UPDATE public.services
SET
    category_id = (
        SELECT id
        FROM public.service_categories
        WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
          AND name = 'Hair'
        LIMIT 1
    ),
    price = 200,
    duration_minutes = 30,
    description = 'Classic haircut',
    is_active = true
WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
  AND name = 'Haircut';

INSERT INTO public.services (
    salon_id,
    category_id,
    name,
    price,
    duration_minutes,
    description,
    is_active
)
SELECT
    'f8d3c307-37a2-465c-902f-e023974aa562',
    id,
    'Haircut',
    200,
    30,
    'Classic haircut',
    true
FROM public.service_categories
WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
  AND name = 'Hair'
  AND NOT EXISTS (
      SELECT 1
      FROM public.services
      WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
        AND name = 'Haircut'
  );


-- Hair Wash
UPDATE public.services
SET
    category_id = (
        SELECT id FROM public.service_categories
        WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
        AND name = 'Hair'
        LIMIT 1
    ),
    price = 100,
    duration_minutes = 20,
    description = 'Hair wash',
    is_active = true
WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
  AND name = 'Hair Wash';

INSERT INTO public.services (
    salon_id, category_id, name, price,
    duration_minutes, description, is_active
)
SELECT
    'f8d3c307-37a2-465c-902f-e023974aa562',
    id,
    'Hair Wash',
    100,
    20,
    'Hair wash',
    true
FROM public.service_categories
WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
  AND name = 'Hair'
  AND NOT EXISTS (
      SELECT 1 FROM public.services
      WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
      AND name = 'Hair Wash'
  );


-- Hair Spa
UPDATE public.services
SET
    category_id = (
        SELECT id FROM public.service_categories
        WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
        AND name = 'Hair'
        LIMIT 1
    ),
    price = 500,
    duration_minutes = 60,
    description = 'Hair spa treatment',
    is_active = true
WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
  AND name = 'Hair Spa';

INSERT INTO public.services (
    salon_id, category_id, name, price,
    duration_minutes, description, is_active
)
SELECT
    'f8d3c307-37a2-465c-902f-e023974aa562',
    id,
    'Hair Spa',
    500,
    60,
    'Hair spa treatment',
    true
FROM public.service_categories
WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
  AND name = 'Hair'
  AND NOT EXISTS (
      SELECT 1 FROM public.services
      WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
      AND name = 'Hair Spa'
  );


-- Hair Colour
UPDATE public.services
SET
    category_id = (
        SELECT id FROM public.service_categories
        WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
        AND name = 'Hair'
        LIMIT 1
    ),
    price = 800,
    duration_minutes = 90,
    description = 'Hair colouring service',
    is_active = true
WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
  AND name = 'Hair Colour';

INSERT INTO public.services (
    salon_id, category_id, name, price,
    duration_minutes, description, is_active
)
SELECT
    'f8d3c307-37a2-465c-902f-e023974aa562',
    id,
    'Hair Colour',
    800,
    90,
    'Hair colouring service',
    true
FROM public.service_categories
WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
  AND name = 'Hair'
  AND NOT EXISTS (
      SELECT 1 FROM public.services
      WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
      AND name = 'Hair Colour'
  );


-- Beard Trim
UPDATE public.services
SET
    category_id = (
        SELECT id FROM public.service_categories
        WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
        AND name = 'Beard'
        LIMIT 1
    ),
    price = 100,
    duration_minutes = 15,
    description = 'Beard trimming',
    is_active = true
WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
  AND name = 'Beard Trim';

INSERT INTO public.services (
    salon_id, category_id, name, price,
    duration_minutes, description, is_active
)
SELECT
    'f8d3c307-37a2-465c-902f-e023974aa562',
    id,
    'Beard Trim',
    100,
    15,
    'Beard trimming',
    true
FROM public.service_categories
WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
  AND name = 'Beard'
  AND NOT EXISTS (
      SELECT 1 FROM public.services
      WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
      AND name = 'Beard Trim'
  );


-- Shave
UPDATE public.services
SET
    category_id = (
        SELECT id FROM public.service_categories
        WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
        AND name = 'Beard'
        LIMIT 1
    ),
    price = 100,
    duration_minutes = 15,
    description = 'Classic shave',
    is_active = true
WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
  AND name = 'Shave';

INSERT INTO public.services (
    salon_id, category_id, name, price,
    duration_minutes, description, is_active
)
SELECT
    'f8d3c307-37a2-465c-902f-e023974aa562',
    id,
    'Shave',
    100,
    15,
    'Classic shave',
    true
FROM public.service_categories
WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
  AND name = 'Beard'
  AND NOT EXISTS (
      SELECT 1 FROM public.services
      WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
      AND name = 'Shave'
  );


-- Facial
UPDATE public.services
SET
    category_id = (
        SELECT id FROM public.service_categories
        WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
        AND name = 'Skin'
        LIMIT 1
    ),
    price = 700,
    duration_minutes = 60,
    description = 'Facial treatment',
    is_active = true
WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
  AND name = 'Facial';

INSERT INTO public.services (
    salon_id, category_id, name, price,
    duration_minutes, description, is_active
)
SELECT
    'f8d3c307-37a2-465c-902f-e023974aa562',
    id,
    'Facial',
    700,
    60,
    'Facial treatment',
    true
FROM public.service_categories
WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
  AND name = 'Skin'
  AND NOT EXISTS (
      SELECT 1 FROM public.services
      WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
      AND name = 'Facial'
  );


-- Cleanup
UPDATE public.services
SET
    category_id = (
        SELECT id FROM public.service_categories
        WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
        AND name = 'Skin'
        LIMIT 1
    ),
    price = 400,
    duration_minutes = 45,
    description = 'Skin cleanup treatment',
    is_active = true
WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
  AND name = 'Cleanup';

INSERT INTO public.services (
    salon_id, category_id, name, price,
    duration_minutes, description, is_active
)
SELECT
    'f8d3c307-37a2-465c-902f-e023974aa562',
    id,
    'Cleanup',
    400,
    45,
    'Skin cleanup treatment',
    true
FROM public.service_categories
WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
  AND name = 'Skin'
  AND NOT EXISTS (
      SELECT 1 FROM public.services
      WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
      AND name = 'Cleanup'
  );


-- ============================================================
-- 10. STAFF
-- ============================================================

-- Rahul
UPDATE public.staff
SET
    full_name = 'Rahul',
    name = 'Rahul',
    employee_code = COALESCE(employee_code, 'RAHUL'),
    designation = 'Hair Stylist',
    phone = NULL,
    status = 'active'::staff_status,
    is_active = true
WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
  AND (
      full_name = 'Rahul'
      OR name = 'Rahul'
      OR employee_code = 'RAHUL'
  );

INSERT INTO public.staff (
    salon_id,
    employee_code,
    full_name,
    name,
    designation,
    status,
    is_active
)
SELECT
    'f8d3c307-37a2-465c-902f-e023974aa562',
    'RAHUL',
    'Rahul',
    'Rahul',
    'Hair Stylist',
    'active'::staff_status,
    true
WHERE NOT EXISTS (
    SELECT 1
    FROM public.staff
    WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
      AND (
          full_name = 'Rahul'
          OR name = 'Rahul'
          OR employee_code = 'RAHUL'
      )
);


-- Amit
UPDATE public.staff
SET
    full_name = 'Amit',
    name = 'Amit',
    employee_code = COALESCE(employee_code, 'AMIT'),
    designation = 'Senior Barber',
    phone = NULL,
    status = 'active'::staff_status,
    is_active = true
WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
  AND (
      full_name = 'Amit'
      OR name = 'Amit'
      OR employee_code = 'AMIT'
  );

INSERT INTO public.staff (
    salon_id,
    employee_code,
    full_name,
    name,
    designation,
    status,
    is_active
)
SELECT
    'f8d3c307-37a2-465c-902f-e023974aa562',
    'AMIT',
    'Amit',
    'Amit',
    'Senior Barber',
    'active'::staff_status,
    true
WHERE NOT EXISTS (
    SELECT 1
    FROM public.staff
    WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
      AND (
          full_name = 'Amit'
          OR name = 'Amit'
          OR employee_code = 'AMIT'
      )
);


-- Priya
UPDATE public.staff
SET
    full_name = 'Priya',
    name = 'Priya',
    employee_code = COALESCE(employee_code, 'PRIYA'),
    designation = 'Skin Specialist',
    phone = NULL,
    status = 'active'::staff_status,
    is_active = true
WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
  AND (
      full_name = 'Priya'
      OR name = 'Priya'
      OR employee_code = 'PRIYA'
  );

INSERT INTO public.staff (
    salon_id,
    employee_code,
    full_name,
    name,
    designation,
    status,
    is_active
)
SELECT
    'f8d3c307-37a2-465c-902f-e023974aa562',
    'PRIYA',
    'Priya',
    'Priya',
    'Skin Specialist',
    'active'::staff_status,
    true
WHERE NOT EXISTS (
    SELECT 1
    FROM public.staff
    WHERE salon_id = 'f8d3c307-37a2-465c-902f-e023974aa562'
      AND (
          full_name = 'Priya'
          OR name = 'Priya'
          OR employee_code = 'PRIYA'
      )
);


-- ============================================================
-- SALON HOURS - CORRECTED DAY MAPPING
-- 0 = Sunday
-- 1 = Monday
-- 2 = Tuesday
-- 3 = Wednesday
-- 4 = Thursday
-- 5 = Friday
-- 6 = Saturday
-- ============================================================

-- Sunday: 10:00 - 18:00
INSERT INTO public.salon_hours (
    salon_id,
    day_of_week,
    opening_time,
    closing_time,
    is_closed,
    open_time,
    close_time,
    opens_at,
    closes_at
)
VALUES (
    'f8d3c307-37a2-465c-902f-e023974aa562',
    0,
    '10:00',
    '18:00',
    false,
    '10:00',
    '18:00',
    '10:00',
    '18:00'
)
ON CONFLICT (salon_id, day_of_week)
DO UPDATE SET
    opening_time = EXCLUDED.opening_time,
    closing_time = EXCLUDED.closing_time,
    is_closed = EXCLUDED.is_closed,
    open_time = EXCLUDED.open_time,
    close_time = EXCLUDED.close_time,
    opens_at = EXCLUDED.opens_at,
    closes_at = EXCLUDED.closes_at;


-- Monday: 10:00 - 20:00
INSERT INTO public.salon_hours (
    salon_id, day_of_week, opening_time, closing_time,
    is_closed, open_time, close_time, opens_at, closes_at
)
VALUES (
    'f8d3c307-37a2-465c-902f-e023974aa562',
    1,
    '10:00',
    '20:00',
    false,
    '10:00',
    '20:00',
    '10:00',
    '20:00'
)
ON CONFLICT (salon_id, day_of_week)
DO UPDATE SET
    opening_time = EXCLUDED.opening_time,
    closing_time = EXCLUDED.closing_time,
    is_closed = EXCLUDED.is_closed,
    open_time = EXCLUDED.open_time,
    close_time = EXCLUDED.close_time,
    opens_at = EXCLUDED.opens_at,
    closes_at = EXCLUDED.closes_at;


-- Tuesday: 10:00 - 20:00
INSERT INTO public.salon_hours (
    salon_id, day_of_week, opening_time, closing_time,
    is_closed, open_time, close_time, opens_at, closes_at
)
VALUES (
    'f8d3c307-37a2-465c-902f-e023974aa562',
    2,
    '10:00',
    '20:00',
    false,
    '10:00',
    '20:00',
    '10:00',
    '20:00'
)
ON CONFLICT (salon_id, day_of_week)
DO UPDATE SET
    opening_time = EXCLUDED.opening_time,
    closing_time = EXCLUDED.closing_time,
    is_closed = EXCLUDED.is_closed,
    open_time = EXCLUDED.open_time,
    close_time = EXCLUDED.close_time,
    opens_at = EXCLUDED.opens_at,
    closes_at = EXCLUDED.closes_at;


-- Wednesday: 10:00 - 20:00
INSERT INTO public.salon_hours (
    salon_id, day_of_week, opening_time, closing_time,
    is_closed, open_time, close_time, opens_at, closes_at
)
VALUES (
    'f8d3c307-37a2-465c-902f-e023974aa562',
    3,
    '10:00',
    '20:00',
    false,
    '10:00',
    '20:00',
    '10:00',
    '20:00'
)
ON CONFLICT (salon_id, day_of_week)
DO UPDATE SET
    opening_time = EXCLUDED.opening_time,
    closing_time = EXCLUDED.closing_time,
    is_closed = EXCLUDED.is_closed,
    open_time = EXCLUDED.open_time,
    close_time = EXCLUDED.close_time,
    opens_at = EXCLUDED.opens_at,
    closes_at = EXCLUDED.closes_at;


-- Thursday: 10:00 - 20:00
INSERT INTO public.salon_hours (
    salon_id, day_of_week, opening_time, closing_time,
    is_closed, open_time, close_time, opens_at, closes_at
)
VALUES (
    'f8d3c307-37a2-465c-902f-e023974aa562',
    4,
    '10:00',
    '20:00',
    false,
    '10:00',
    '20:00',
    '10:00',
    '20:00'
)
ON CONFLICT (salon_id, day_of_week)
DO UPDATE SET
    opening_time = EXCLUDED.opening_time,
    closing_time = EXCLUDED.closing_time,
    is_closed = EXCLUDED.is_closed,
    open_time = EXCLUDED.open_time,
    close_time = EXCLUDED.close_time,
    opens_at = EXCLUDED.opens_at,
    closes_at = EXCLUDED.closes_at;


-- Friday: 10:00 - 20:00
INSERT INTO public.salon_hours (
    salon_id, day_of_week, opening_time, closing_time,
    is_closed, open_time, close_time, opens_at, closes_at
)
VALUES (
    'f8d3c307-37a2-465c-902f-e023974aa562',
    5,
    '10:00',
    '20:00',
    false,
    '10:00',
    '20:00',
    '10:00',
    '20:00'
)
ON CONFLICT (salon_id, day_of_week)
DO UPDATE SET
    opening_time = EXCLUDED.opening_time,
    closing_time = EXCLUDED.closing_time,
    is_closed = EXCLUDED.is_closed,
    open_time = EXCLUDED.open_time,
    close_time = EXCLUDED.close_time,
    opens_at = EXCLUDED.opens_at,
    closes_at = EXCLUDED.closes_at;


-- Saturday: 10:00 - 20:00
INSERT INTO public.salon_hours (
    salon_id, day_of_week, opening_time, closing_time,
    is_closed, open_time, close_time, opens_at, closes_at
)
VALUES (
    'f8d3c307-37a2-465c-902f-e023974aa562',
    6,
    '10:00',
    '20:00',
    false,
    '10:00',
    '20:00',
    '10:00',
    '20:00'
)
ON CONFLICT (salon_id, day_of_week)
DO UPDATE SET
    opening_time = EXCLUDED.opening_time,
    closing_time = EXCLUDED.closing_time,
    is_closed = EXCLUDED.is_closed,
    open_time = EXCLUDED.open_time,
    close_time = EXCLUDED.close_time,
    opens_at = EXCLUDED.opens_at,
    closes_at = EXCLUDED.closes_at;


-- ============================================================
-- 12. SYNC EXISTING COMPATIBILITY DATA
-- ============================================================

UPDATE public.appointments
SET date = appointment_date
WHERE date IS NULL
  AND appointment_date IS NOT NULL;

UPDATE public.attendance
SET date = attendance_date
WHERE date IS NULL
  AND attendance_date IS NOT NULL;


-- ============================================================
-- 13. FINAL COMMIT
-- ============================================================

COMMIT;
