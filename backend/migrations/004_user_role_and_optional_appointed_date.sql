-- CEB Tender Management System — User Role and Optional Committee Appointed Date Schema
-- Migration File: 004_user_role_and_optional_appointed_date.sql

-- 1. Expand users.role CHECK constraint to include 'User'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('Super Admin', 'Admin', 'Procurement', 'Clerk', 'CECOM', 'User'));

-- 2. Make committees.appointed_date nullable
ALTER TABLE committees ALTER COLUMN appointed_date DROP NOT NULL;
