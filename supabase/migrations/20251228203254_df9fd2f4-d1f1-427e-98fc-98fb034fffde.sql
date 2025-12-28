-- Create custom attribute definitions table (admin-managed)
CREATE TABLE public.deal_attribute_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  attribute_type TEXT NOT NULL DEFAULT 'text', -- text, number, date, select, multi_select, boolean
  options JSONB DEFAULT '[]', -- for select/multi_select types
  is_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create deal custom attribute values table
CREATE TABLE public.deal_attributes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  attribute_id UUID NOT NULL REFERENCES public.deal_attribute_definitions(id) ON DELETE CASCADE,
  value_text TEXT,
  value_number NUMERIC,
  value_date DATE,
  value_boolean BOOLEAN,
  value_json JSONB, -- for multi_select
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(deal_id, attribute_id)
);

-- Enable RLS
ALTER TABLE public.deal_attribute_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_attributes ENABLE ROW LEVEL SECURITY;

-- RLS for attribute definitions - anyone can view, admins can manage
CREATE POLICY "Anyone can view active attribute definitions" 
  ON public.deal_attribute_definitions FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Admins can manage attribute definitions" 
  ON public.deal_attribute_definitions FOR ALL 
  USING (is_chairman_or_admin(auth.uid()));

-- RLS for deal attributes - based on deal's sector visibility
CREATE POLICY "Users can view deal attributes for accessible deals" 
  ON public.deal_attributes FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.deals d 
      WHERE d.id = deal_id 
      AND (is_chairman_or_admin(auth.uid()) OR has_sector_access(auth.uid(), d.sector))
    )
  );

CREATE POLICY "Deal team can manage deal attributes" 
  ON public.deal_attributes FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.deals d 
      WHERE d.id = deal_id 
      AND (
        is_chairman_or_admin(auth.uid()) 
        OR (has_sector_access(auth.uid(), d.sector) AND has_role(auth.uid(), 'deal_team'))
      )
    )
  );

-- Create indexes
CREATE INDEX idx_deal_attributes_deal ON public.deal_attributes(deal_id);
CREATE INDEX idx_deal_attributes_attr ON public.deal_attributes(attribute_id);

-- Add trigger for updated_at
CREATE TRIGGER update_deal_attribute_definitions_updated_at
  BEFORE UPDATE ON public.deal_attribute_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deal_attributes_updated_at
  BEFORE UPDATE ON public.deal_attributes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default attribute definitions
INSERT INTO public.deal_attribute_definitions (name, display_name, attribute_type, options, display_order) VALUES
  ('investment_type', 'Investment Type', 'select', '["Buyout", "Growth Equity", "Venture", "Recap", "Add-on"]', 1),
  ('ownership_target', 'Ownership Target (%)', 'number', '[]', 2),
  ('revenue', 'Annual Revenue ($M)', 'number', '[]', 3),
  ('ebitda', 'EBITDA ($M)', 'number', '[]', 4),
  ('ev_multiple', 'EV/EBITDA Multiple', 'number', '[]', 5),
  ('management_status', 'Management Status', 'select', '["Retained", "Replacing", "Augmenting", "TBD"]', 6),
  ('exclusivity', 'Exclusivity', 'boolean', '[]', 7),
  ('exclusivity_date', 'Exclusivity End Date', 'date', '[]', 8),
  ('deal_source', 'Deal Source', 'select', '["Proprietary", "Banker", "Network", "Cold Outreach"]', 9),
  ('co_investors', 'Co-Investors', 'text', '[]', 10);