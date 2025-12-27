-- Create table for document sync logs
CREATE TABLE public.document_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'scheduled', 'auto'
  source TEXT NOT NULL DEFAULT 'sharepoint', -- 'sharepoint', 'local'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
  files_synced INTEGER DEFAULT 0,
  files_failed INTEGER DEFAULT 0,
  total_size_bytes BIGINT DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  synced_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for individual file sync details
CREATE TABLE public.sync_file_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_log_id UUID NOT NULL REFERENCES public.document_sync_logs(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_path TEXT,
  file_size INTEGER,
  file_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'synced', 'failed', 'skipped'
  error_message TEXT,
  source_url TEXT,
  destination_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_file_details ENABLE ROW LEVEL SECURITY;

-- RLS policies for sync logs - admins can view all, users can view their own
CREATE POLICY "Admins can manage sync logs"
ON public.document_sync_logs
FOR ALL
USING (is_chairman_or_admin(auth.uid()));

CREATE POLICY "Users can view their own sync logs"
ON public.document_sync_logs
FOR SELECT
USING (auth.uid() = synced_by);

-- RLS policies for file details
CREATE POLICY "Admins can manage sync file details"
ON public.sync_file_details
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.document_sync_logs 
  WHERE id = sync_log_id AND is_chairman_or_admin(auth.uid())
));

CREATE POLICY "Users can view their own sync file details"
ON public.sync_file_details
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.document_sync_logs 
  WHERE id = sync_log_id AND synced_by = auth.uid()
));

-- Create indexes for performance
CREATE INDEX idx_sync_logs_synced_by ON public.document_sync_logs(synced_by);
CREATE INDEX idx_sync_logs_status ON public.document_sync_logs(status);
CREATE INDEX idx_sync_logs_started_at ON public.document_sync_logs(started_at DESC);
CREATE INDEX idx_sync_file_details_sync_log_id ON public.sync_file_details(sync_log_id);