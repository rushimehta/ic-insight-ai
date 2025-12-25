-- Create deal_stage enum
CREATE TYPE public.deal_stage AS ENUM ('sourcing', 'initial_review', 'due_diligence', 'ic_scheduled', 'ic_complete', 'approved', 'closed', 'passed');

-- Create deals table for pipeline management
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  sector public.sector_type NOT NULL,
  stage public.deal_stage NOT NULL DEFAULT 'sourcing',
  deal_size TEXT,
  description TEXT,
  lead_partner TEXT,
  deal_team JSONB DEFAULT '[]'::jsonb,
  ic_date DATE,
  target_close_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can see deals in their sectors, admins/chairmen see all
CREATE POLICY "Users can view deals in their sectors"
ON public.deals FOR SELECT
USING (
  is_chairman_or_admin(auth.uid()) OR 
  has_sector_access(auth.uid(), sector)
);

CREATE POLICY "Deal team can create deals"
ON public.deals FOR INSERT
WITH CHECK (
  auth.uid() = created_by OR
  has_role(auth.uid(), 'deal_team') OR
  is_chairman_or_admin(auth.uid())
);

CREATE POLICY "Deal team can update deals in their sectors"
ON public.deals FOR UPDATE
USING (
  is_chairman_or_admin(auth.uid()) OR
  (has_sector_access(auth.uid(), sector) AND has_role(auth.uid(), 'deal_team'))
);

CREATE POLICY "Admins can delete deals"
ON public.deals FOR DELETE
USING (is_chairman_or_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add outcome column to ic_meetings if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ic_meetings' AND column_name = 'outcome') THEN
    ALTER TABLE public.ic_meetings ADD COLUMN outcome TEXT;
  END IF;
END $$;