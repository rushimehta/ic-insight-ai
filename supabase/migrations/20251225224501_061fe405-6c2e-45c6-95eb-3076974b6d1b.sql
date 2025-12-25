-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('deal_team', 'ic_member', 'ic_chairman', 'admin');

-- Create enum for sectors
CREATE TYPE public.sector_type AS ENUM (
  'technology', 'healthcare', 'financial_services', 'consumer_retail',
  'industrials', 'energy', 'real_estate', 'media_entertainment', 'infrastructure'
);

-- Create user_roles table for role-based access
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create user_sectors table for sector-based access
CREATE TABLE public.user_sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sector sector_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, sector)
);

-- Create IC drafts table for document generation
CREATE TABLE public.ic_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  deal_name TEXT NOT NULL,
  sector sector_type NOT NULL,
  investment_thesis TEXT,
  company_overview TEXT,
  market_analysis TEXT,
  financial_highlights TEXT,
  key_risks TEXT,
  deal_terms TEXT,
  raw_notes TEXT,
  generated_document TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'review', 'final', 'presented')),
  ic_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meeting_notes table for IC chairman
CREATE TABLE public.meeting_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ic_meeting_id UUID REFERENCES public.ic_meetings(id) ON DELETE CASCADE,
  chairman_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deal_name TEXT NOT NULL,
  meeting_date DATE NOT NULL,
  attendees JSONB DEFAULT '[]',
  discussion_points JSONB DEFAULT '[]',
  key_concerns JSONB DEFAULT '[]',
  action_items JSONB DEFAULT '[]',
  decision TEXT,
  decision_rationale TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  next_steps TEXT,
  raw_notes TEXT,
  ai_generated_summary TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ic_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_notes ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Security definer function to check if user has access to a sector
CREATE OR REPLACE FUNCTION public.has_sector_access(_user_id UUID, _sector sector_type)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_sectors
    WHERE user_id = _user_id
      AND sector = _sector
  ) OR EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('ic_chairman', 'admin')
  )
$$;

-- Security definer function to check if user is IC chairman or admin
CREATE OR REPLACE FUNCTION public.is_chairman_or_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('ic_chairman', 'admin')
  )
$$;

-- Security definer function to get user's roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS app_role[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(role)
  FROM public.user_roles
  WHERE user_id = _user_id
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
FOR ALL USING (public.is_chairman_or_admin(auth.uid()));

-- RLS Policies for user_sectors
CREATE POLICY "Users can view their own sectors" ON public.user_sectors
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all sectors" ON public.user_sectors
FOR ALL USING (public.is_chairman_or_admin(auth.uid()));

-- RLS Policies for ic_drafts
CREATE POLICY "Users can view their own drafts" ON public.ic_drafts
FOR SELECT USING (auth.uid() = user_id OR public.is_chairman_or_admin(auth.uid()));

CREATE POLICY "Users can create their own drafts" ON public.ic_drafts
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts" ON public.ic_drafts
FOR UPDATE USING (auth.uid() = user_id OR public.is_chairman_or_admin(auth.uid()));

CREATE POLICY "Users can delete their own drafts" ON public.ic_drafts
FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for meeting_notes
CREATE POLICY "IC members can view meeting notes for their sectors" ON public.meeting_notes
FOR SELECT USING (
  public.is_chairman_or_admin(auth.uid()) OR 
  auth.uid() = chairman_id
);

CREATE POLICY "Chairman can create meeting notes" ON public.meeting_notes
FOR INSERT WITH CHECK (public.is_chairman_or_admin(auth.uid()));

CREATE POLICY "Chairman can update meeting notes" ON public.meeting_notes
FOR UPDATE USING (public.is_chairman_or_admin(auth.uid()) OR auth.uid() = chairman_id);

CREATE POLICY "Chairman can delete meeting notes" ON public.meeting_notes
FOR DELETE USING (public.is_chairman_or_admin(auth.uid()) OR auth.uid() = chairman_id);

-- Update documents table to include sector for access control
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS sector sector_type;

-- Update documents RLS to check sector access
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
CREATE POLICY "Users can view documents in their sectors" ON public.documents
FOR SELECT USING (
  auth.uid() = user_id OR 
  user_id IS NULL OR
  public.is_chairman_or_admin(auth.uid()) OR
  (sector IS NOT NULL AND public.has_sector_access(auth.uid(), sector))
);

-- Add triggers for updated_at
CREATE TRIGGER update_ic_drafts_updated_at
  BEFORE UPDATE ON public.ic_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meeting_notes_updated_at
  BEFORE UPDATE ON public.meeting_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add sector to ic_meetings table
ALTER TABLE public.ic_meetings ADD COLUMN IF NOT EXISTS sector sector_type;

-- Add column for sector assignments to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS primary_sector sector_type;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;