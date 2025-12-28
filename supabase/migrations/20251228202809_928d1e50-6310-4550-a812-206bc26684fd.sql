-- Create lookup tables for departments and locations (admin-managed dropdowns)
CREATE TABLE public.lookup_departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.lookup_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lookup_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lookup_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Anyone can view active lookups, only admins can manage
CREATE POLICY "Anyone can view active departments" ON public.lookup_departments
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage departments" ON public.lookup_departments
  FOR ALL USING (is_chairman_or_admin(auth.uid()));

CREATE POLICY "Anyone can view active locations" ON public.lookup_locations
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage locations" ON public.lookup_locations
  FOR ALL USING (is_chairman_or_admin(auth.uid()));

-- Insert some default values
INSERT INTO public.lookup_departments (name, display_name) VALUES
  ('investment_team', 'Investment Team'),
  ('operations', 'Operations'),
  ('legal', 'Legal'),
  ('finance', 'Finance'),
  ('technology', 'Technology'),
  ('investor_relations', 'Investor Relations');

INSERT INTO public.lookup_locations (name, display_name) VALUES
  ('new_york', 'New York, NY'),
  ('san_francisco', 'San Francisco, CA'),
  ('london', 'London, UK'),
  ('hong_kong', 'Hong Kong'),
  ('singapore', 'Singapore'),
  ('boston', 'Boston, MA'),
  ('chicago', 'Chicago, IL');

-- Create sessions tracking table for session management
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_token TEXT NOT NULL,
  device_info JSONB DEFAULT '{}',
  ip_address TEXT,
  last_active_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_current BOOLEAN DEFAULT false
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own sessions
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON public.user_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_last_active ON public.user_sessions(last_active_at DESC);