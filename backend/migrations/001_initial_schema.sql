-- CEB Tender Management System — Initial PostgreSQL / Supabase Relational Schema
-- Migration File: 001_initial_schema.sql

-- Enable pgcrypto extension for UUID generation (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TRIGGER FUNCTION FOR UPDATED_AT
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    epf_number TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Admin' CHECK (role IN ('Super Admin', 'Admin', 'Procurement', 'Clerk', 'CECOM')),
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. DEPARTMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    code TEXT,
    description TEXT,
    head_of_department TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_departments_updated_at
BEFORE UPDATE ON departments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. STAFF TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    area TEXT,
    designation TEXT,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_staff_updated_at
BEFORE UPDATE ON staff
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. BIDDERS / SUPPLIERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS bidders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    email TEXT,
    address TEXT,
    contact TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_bidders_updated_at
BEFORE UPDATE ON bidders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. COMMITTEES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS committees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    committee_number TEXT NOT NULL UNIQUE,
    member1 TEXT NOT NULL,
    member2 TEXT NOT NULL,
    member3 TEXT NOT NULL,
    additional_members TEXT[] DEFAULT '{}',
    appointed_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_committees_updated_at
BEFORE UPDATE ON committees
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. TENDER RECORDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tender_number TEXT NOT NULL UNIQUE,
    relevant_to TEXT,
    category TEXT,
    description TEXT,
    other TEXT,
    bid_start_date DATE,
    bid_open_date DATE,
    bid_closing_date DATE,
    approved_date DATE,
    file_sent_to_tec_date DATE,
    file_sent_to_tec_second_time DATE,
    bid_bond_number TEXT,
    bid_bond_bank TEXT,
    bid_validity_period DATE,
    remark TEXT,
    status TEXT,
    tec_committee_number TEXT,
    tec_chairman TEXT,
    tec_member1 TEXT,
    tec_member2 TEXT,
    awarded_to TEXT,
    service_agreement_start_date DATE,
    service_agreement_end_date DATE,
    performance_bond_number TEXT,
    performance_bond_bank TEXT,
    performance_bond_remark TEXT,
    delay INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_records_updated_at
BEFORE UPDATE ON records
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. RECORD DOCUMENTS TABLE (NORMALIZED FROM JSON ARRAY)
-- ============================================================================
CREATE TABLE IF NOT EXISTS record_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID NOT NULL REFERENCES records(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 10. AUDIT LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user" TEXT,
    type TEXT,
    message TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_audit_logs_updated_at
BEFORE UPDATE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 11. INDEXES FOR FAST QUERY PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_epf ON users(epf_number);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);
CREATE INDEX IF NOT EXISTS idx_staff_department_id ON staff(department_id);

CREATE INDEX IF NOT EXISTS idx_committees_number ON committees(committee_number);

CREATE INDEX IF NOT EXISTS idx_records_tender_number ON records(tender_number);
CREATE INDEX IF NOT EXISTS idx_records_status ON records(status);
CREATE INDEX IF NOT EXISTS idx_records_category ON records(category);
CREATE INDEX IF NOT EXISTS idx_records_relevant_to ON records(relevant_to);
CREATE INDEX IF NOT EXISTS idx_records_tec_committee ON records(tec_committee_number);

CREATE INDEX IF NOT EXISTS idx_record_documents_record_id ON record_documents(record_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs("user");

-- ============================================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- NOTE: Authorization is handled strictly at the Express API layer via JWT.
-- Permissive policies are defined here for the service role & application client.
-- FUTURE HARDENING ITEM: Tighten RLS policies if direct client access is introduced.
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE bidders ENABLE ROW LEVEL SECURITY;
ALTER TABLE committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow permissive access to users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow permissive access to categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow permissive access to departments" ON departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow permissive access to staff" ON staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow permissive access to bidders" ON bidders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow permissive access to committees" ON committees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow permissive access to records" ON records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow permissive access to record_documents" ON record_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow permissive access to audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
