-- Create sectors table for admin-managed sectors
CREATE TABLE public.sectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;

-- Everyone can read active sectors
CREATE POLICY "Anyone can view active sectors" ON public.sectors
  FOR SELECT USING (is_active = true);

-- Only admins can manage sectors
CREATE POLICY "Admins can manage sectors" ON public.sectors
  FOR ALL USING (is_chairman_or_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_sectors_updated_at
  BEFORE UPDATE ON public.sectors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert existing sectors as seed data
INSERT INTO public.sectors (name, display_name, description) VALUES
  ('technology', 'Technology', 'Technology and software companies'),
  ('healthcare', 'Healthcare', 'Healthcare, biotech, and life sciences'),
  ('financial_services', 'Financial Services', 'Banking, insurance, and financial technology'),
  ('consumer_retail', 'Consumer & Retail', 'Consumer goods and retail companies'),
  ('industrials', 'Industrials', 'Manufacturing and industrial companies'),
  ('energy', 'Energy', 'Oil, gas, and renewable energy'),
  ('real_estate', 'Real Estate', 'Real estate and property development'),
  ('media_entertainment', 'Media & Entertainment', 'Media, entertainment, and gaming'),
  ('infrastructure', 'Infrastructure', 'Infrastructure and utilities');

-- Create IC stage enum
CREATE TYPE public.ic_stage AS ENUM ('ic1', 'ic2', 'ic3', 'ic4', 'ic_final', 'approved', 'rejected');

-- Add ic_stage to deals table
ALTER TABLE public.deals ADD COLUMN ic_stage public.ic_stage DEFAULT 'ic1';

-- Add new detailed fields to ic_drafts
ALTER TABLE public.ic_drafts 
  ADD COLUMN management_summary text,
  ADD COLUMN firm_summary text,
  ADD COLUMN product_offering text,
  ADD COLUMN comp_analysis text,
  ADD COLUMN financial_snapshot text;

-- Add expense tracking and more detailed fields to meeting_notes
ALTER TABLE public.meeting_notes 
  ADD COLUMN ic_expenses_covered boolean DEFAULT false,
  ADD COLUMN ic_expenses_amount decimal(15,2),
  ADD COLUMN ic_expenses_notes text,
  ADD COLUMN key_takeaways jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN further_investigation text,
  ADD COLUMN thesis_progress text,
  ADD COLUMN ic_stage public.ic_stage;

-- Add year column to documents for repository organization
ALTER TABLE public.documents ADD COLUMN year integer;

-- Create index for document repository queries
CREATE INDEX idx_documents_year ON public.documents(year);
CREATE INDEX idx_documents_sector_year ON public.documents(sector, year);

-- Update existing documents to set year from created_at
UPDATE public.documents SET year = EXTRACT(YEAR FROM created_at)::integer WHERE year IS NULL;