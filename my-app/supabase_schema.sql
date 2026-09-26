-- ==========================================
-- AmritCare AI — Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor
-- ==========================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users (Doctors / Staff) ───
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT,
  role TEXT NOT NULL CHECK (role IN ('doctor', 'patient')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Patients ───
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  age INTEGER,
  blood TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Doctor Profiles ───
CREATE TABLE IF NOT EXISTS doctor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  specialty TEXT NOT NULL,
  hospital TEXT NOT NULL,
  bio TEXT NOT NULL,
  photo TEXT,
  available_slots JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Appointments ───
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_info JSONB NOT NULL,
  slot JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Bookings ───
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL,
  facility_name TEXT NOT NULL,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  rating DOUBLE PRECISION,
  place_id TEXT,
  department TEXT DEFAULT 'General',
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled')),
  notes TEXT,
  scheduled_date TEXT,
  scheduled_slot TEXT,
  fee TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Reminders ───
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  medicine_name TEXT NOT NULL,
  medicine_type TEXT DEFAULT 'tablet' CHECK (medicine_type IN ('tablet', 'capsule', 'syrup')),
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('once_daily', 'twice_daily', 'thrice_daily', 'once_weekly', 'alternate_days')),
  times JSONB NOT NULL DEFAULT '[]',
  specific_days JSONB DEFAULT '[]',
  start_date TIMESTAMPTZ DEFAULT NOW(),
  total_quantity INTEGER NOT NULL,
  remaining_quantity INTEGER NOT NULL,
  tablets_per_dose INTEGER DEFAULT 1,
  refill_alert_days INTEGER DEFAULT 2,
  is_active BOOLEAN DEFAULT TRUE,
  taken_log JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Medicines (Inventory) ───
CREATE TABLE IF NOT EXISTS medicines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'tablet' CHECK (type IN ('tablet', 'capsule', 'syrup', 'injection')),
  stock INTEGER NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'units',
  expiry_date TIMESTAMPTZ,
  low_stock_threshold INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Triages ───
CREATE TABLE IF NOT EXISTS triages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL,
  title TEXT NOT NULL,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('critical', 'high', 'moderate', 'low', 'info')),
  symptoms JSONB DEFAULT '[]',
  transcript JSONB DEFAULT '[]',
  recommendation TEXT,
  lang TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Call Logs ───
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in-progress', 'completed', 'failed', 'cancelled')),
  call_sid TEXT,
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  context JSONB,
  greeting TEXT,
  transcript JSONB DEFAULT '[]',
  summary TEXT,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('critical', 'high', 'moderate', 'low', 'info')),
  notes TEXT DEFAULT '',
  recurrence TEXT DEFAULT 'one-time' CHECK (recurrence IN ('one-time', 'weekly', 'monthly')),
  override_phone TEXT,
  override_name TEXT,
  parent_call_id UUID REFERENCES call_logs(id),
  memory JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Chat Histories ───
CREATE TABLE IF NOT EXISTS chat_histories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id TEXT NOT NULL UNIQUE,
  messages JSONB DEFAULT '[]',
  reports JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes for performance ───
CREATE INDEX IF NOT EXISTS idx_patients_username ON patients(username);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_bookings_patient_id ON bookings(patient_id);
CREATE INDEX IF NOT EXISTS idx_reminders_patient_id ON reminders(patient_id);
CREATE INDEX IF NOT EXISTS idx_reminders_is_active ON reminders(is_active);
CREATE INDEX IF NOT EXISTS idx_triages_patient_id ON triages(patient_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_patient_id ON call_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_status ON call_logs(status);
CREATE INDEX IF NOT EXISTS idx_chat_histories_patient_id ON chat_histories(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_user_id ON doctor_profiles(user_id);
