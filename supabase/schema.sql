-- PCFRA Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sites table: Construction site master data
CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  postcode VARCHAR(10),
  building_height_m DECIMAL(6,2),
  number_of_floors INTEGER,
  building_use VARCHAR(100),
  construction_phase VARCHAR(50),
  dutyholder_name VARCHAR(255),
  dutyholder_email VARCHAR(255),
  dutyholder_phone VARCHAR(20),
  principal_contractor VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessments table: Fire risk assessment records
-- FIXED: Removed the invalid GENERATED column that caused the error
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_number VARCHAR(50),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'signed_off')),
  current_section INTEGER DEFAULT 1,
  overall_risk_level VARCHAR(20),
  overall_risk_score INTEGER,
  is_high_rise BOOLEAN DEFAULT FALSE, -- Changed from GENERATED to standard BOOLEAN
  assessor_name VARCHAR(255),
  assessment_date DATE DEFAULT CURRENT_DATE,
  next_review_date DATE,
  signature_data TEXT,
  signed_at TIMESTAMPTZ,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment sections: Track completion of each wizard section
CREATE TABLE IF NOT EXISTS assessment_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  section_number INTEGER NOT NULL CHECK (section_number BETWEEN 1 AND 10),
  section_name VARCHAR(100) NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  is_applicable BOOLEAN DEFAULT TRUE,
  notes TEXT,
  data JSONB DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assessment_id, section_number)
);

-- Hazards table: Identified hazards with risk scoring
CREATE TABLE IF NOT EXISTS hazards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  location VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  hazard_type VARCHAR(100),
  severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 5),
  likelihood INTEGER NOT NULL CHECK (likelihood BETWEEN 1 AND 5),
  risk_score INTEGER GENERATED ALWAYS AS (severity * likelihood) STORED,
  risk_level VARCHAR(20) GENERATED ALWAYS AS (
    CASE 
      WHEN severity * likelihood >= 15 THEN 'critical'
      WHEN severity * likelihood >= 10 THEN 'high'
      WHEN severity * likelihood >= 5 THEN 'medium'
      ELSE 'low'
    END
  ) STORED,
  control_measures TEXT,
  photo_urls TEXT[] DEFAULT '{}',
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Actions table: Action items with assignments
CREATE TABLE IF NOT EXISTS actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  hazard_id UUID REFERENCES hazards(id) ON DELETE SET NULL,
  action_description TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  assigned_to VARCHAR(255),
  assigned_role VARCHAR(100),
  target_date DATE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  completion_notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table: Full audit trail for compliance
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'sign', 'export')),
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sites_user_id ON sites(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_site_id ON assessments(site_id);
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_hazards_assessment_id ON hazards(assessment_id);
CREATE INDEX IF NOT EXISTS idx_hazards_risk_level ON hazards(risk_level);
CREATE INDEX IF NOT EXISTS idx_actions_assessment_id ON actions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_actions_status ON actions(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE hazards ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Sites policies
CREATE POLICY "Users can view their own sites" ON sites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sites" ON sites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sites" ON sites
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sites" ON sites
  FOR DELETE USING (auth.uid() = user_id);

-- Assessments policies
CREATE POLICY "Users can view their own assessments" ON assessments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own assessments" ON assessments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assessments" ON assessments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assessments" ON assessments
  FOR DELETE USING (auth.uid() = user_id);

-- Assessment sections policies (access through assessment ownership)
CREATE POLICY "Users can manage sections of their assessments" ON assessment_sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM assessments 
      WHERE assessments.id = assessment_sections.assessment_id 
      AND assessments.user_id = auth.uid()
    )
  );

-- Hazards policies
CREATE POLICY "Users can manage hazards of their assessments" ON hazards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM assessments 
      WHERE assessments.id = hazards.assessment_id 
      AND assessments.user_id = auth.uid()
    )
  );

-- Actions policies
CREATE POLICY "Users can manage actions of their assessments" ON actions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM assessments 
      WHERE assessments.id = actions.assessment_id 
      AND assessments.user_id = auth.uid()
    )
  );

-- Audit logs policies
CREATE POLICY "Users can view their own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create audit logs" ON audit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_sites_updated_at
  BEFORE UPDATE ON sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_sections_updated_at
  BEFORE UPDATE ON assessment_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hazards_updated_at
  BEFORE UPDATE ON hazards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_actions_updated_at
  BEFORE UPDATE ON actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for hazard photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('hazard-photos', 'hazard-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for hazard photos
CREATE POLICY "Users can upload hazard photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'hazard-photos' AND 
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Anyone can view hazard photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'hazard-photos');

CREATE POLICY "Users can delete their hazard photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'hazard-photos' AND 
    auth.uid() IS NOT NULL
  );

-- ============================================
-- Tenants Table: Apartment occupant information for QR codes
-- ============================================

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  apartment_number VARCHAR(20) NOT NULL,
  floor_number INTEGER NOT NULL,
  tenant_name VARCHAR(255) NOT NULL,
  -- Disability and mobility information
  has_mobility_issues BOOLEAN DEFAULT FALSE,
  uses_wheelchair BOOLEAN DEFAULT FALSE,
  has_visual_impairment BOOLEAN DEFAULT FALSE,
  has_hearing_impairment BOOLEAN DEFAULT FALSE,
  has_cognitive_impairment BOOLEAN DEFAULT FALSE,
  requires_assistance_evacuation BOOLEAN DEFAULT FALSE,
  other_disabilities TEXT,
  -- Medical information
  blood_type VARCHAR(10),
  allergies TEXT,
  medical_conditions TEXT,
  oxygen_dependent BOOLEAN DEFAULT FALSE,
  -- Emergency contact
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  -- Additional info
  notes TEXT,
  number_of_occupants INTEGER DEFAULT 1,
  -- Auto-calculated risk level based on conditions
  risk_level VARCHAR(20) GENERATED ALWAYS AS (
    CASE 
      WHEN (uses_wheelchair OR oxygen_dependent) AND floor_number >= 3 THEN 'critical'
      WHEN (has_mobility_issues OR requires_assistance_evacuation) AND floor_number >= 2 THEN 'high'
      WHEN uses_wheelchair OR oxygen_dependent THEN 'high'
      WHEN has_mobility_issues OR requires_assistance_evacuation THEN 'medium'
      WHEN has_visual_impairment OR has_hearing_impairment OR has_cognitive_impairment THEN 'medium'
      ELSE 'low'
    END
  ) STORED,
  qr_code_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, apartment_number)
);

-- Indexes for tenants
CREATE INDEX IF NOT EXISTS idx_tenants_site_id ON tenants(site_id);
CREATE INDEX IF NOT EXISTS idx_tenants_user_id ON tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_risk_level ON tenants(risk_level);
CREATE INDEX IF NOT EXISTS idx_tenants_floor ON tenants(floor_number);

-- RLS for tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tenants" ON tenants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tenants" ON tenants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tenants" ON tenants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tenants" ON tenants
  FOR DELETE USING (auth.uid() = user_id);

-- Public access for QR code scanning (first responders)
CREATE POLICY "Anyone can view tenant by id for QR scan" ON tenants
  FOR SELECT USING (true);

-- Updated_at trigger for tenants
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();