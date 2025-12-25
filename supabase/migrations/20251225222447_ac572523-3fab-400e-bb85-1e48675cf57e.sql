-- Enable pgvector extension for vector storage
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table for storing uploaded files
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  content TEXT, -- Extracted text content
  metadata JSONB DEFAULT '{}',
  deal_name TEXT,
  ic_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Document chunks for RAG
CREATE TABLE public.document_chunks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(768), -- Gemini embedding dimension
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat sessions for short-term memory
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  context JSONB DEFAULT '{}', -- Active deal context, recent queries
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat messages within sessions
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  sources JSONB DEFAULT '[]', -- Referenced document chunks
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Feedback table for learning loop
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  document_chunk_id UUID REFERENCES public.document_chunks(id) ON DELETE SET NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('helpful', 'not_helpful', 'correction', 'error_report')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  correction_text TEXT, -- For user corrections
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- IC meetings for historical tracking
CREATE TABLE public.ic_meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_name TEXT NOT NULL,
  meeting_date DATE NOT NULL,
  sector TEXT,
  deal_size TEXT,
  outcome TEXT CHECK (outcome IN ('approved', 'rejected', 'deferred', 'pending')),
  key_concerns JSONB DEFAULT '[]',
  questions_asked JSONB DEFAULT '[]',
  attendees JSONB DEFAULT '[]',
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Question patterns derived from past ICs
CREATE TABLE public.question_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text TEXT NOT NULL,
  category TEXT NOT NULL,
  frequency INTEGER DEFAULT 1,
  sectors JSONB DEFAULT '[]', -- Which sectors this question is common in
  asker_type TEXT CHECK (asker_type IN ('ic_member', 'deal_team', 'both')),
  importance_score FLOAT DEFAULT 0.5,
  example_context TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Usage analytics for learning
CREATE TABLE public.usage_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for vector similarity search
CREATE INDEX ON public.document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create indexes for common queries
CREATE INDEX idx_documents_status ON public.documents(status);
CREATE INDEX idx_documents_deal ON public.documents(deal_name);
CREATE INDEX idx_chat_messages_session ON public.chat_messages(session_id);
CREATE INDEX idx_feedback_type ON public.feedback(feedback_type);
CREATE INDEX idx_ic_meetings_date ON public.ic_meetings(meeting_date);
CREATE INDEX idx_question_patterns_category ON public.question_patterns(category);

-- Enable Row Level Security (public access for now - can add auth later)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ic_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_analytics ENABLE ROW LEVEL SECURITY;

-- Create public access policies (can be restricted later with auth)
CREATE POLICY "Allow public read access to documents" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Allow public insert to documents" ON public.documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to documents" ON public.documents FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to documents" ON public.documents FOR DELETE USING (true);

CREATE POLICY "Allow public read access to document_chunks" ON public.document_chunks FOR SELECT USING (true);
CREATE POLICY "Allow public insert to document_chunks" ON public.document_chunks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to document_chunks" ON public.document_chunks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to document_chunks" ON public.document_chunks FOR DELETE USING (true);

CREATE POLICY "Allow public read access to chat_sessions" ON public.chat_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert to chat_sessions" ON public.chat_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to chat_sessions" ON public.chat_sessions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to chat_sessions" ON public.chat_sessions FOR DELETE USING (true);

CREATE POLICY "Allow public read access to chat_messages" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert to chat_messages" ON public.chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to chat_messages" ON public.chat_messages FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to chat_messages" ON public.chat_messages FOR DELETE USING (true);

CREATE POLICY "Allow public read access to feedback" ON public.feedback FOR SELECT USING (true);
CREATE POLICY "Allow public insert to feedback" ON public.feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to feedback" ON public.feedback FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to feedback" ON public.feedback FOR DELETE USING (true);

CREATE POLICY "Allow public read access to ic_meetings" ON public.ic_meetings FOR SELECT USING (true);
CREATE POLICY "Allow public insert to ic_meetings" ON public.ic_meetings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to ic_meetings" ON public.ic_meetings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to ic_meetings" ON public.ic_meetings FOR DELETE USING (true);

CREATE POLICY "Allow public read access to question_patterns" ON public.question_patterns FOR SELECT USING (true);
CREATE POLICY "Allow public insert to question_patterns" ON public.question_patterns FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to question_patterns" ON public.question_patterns FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to question_patterns" ON public.question_patterns FOR DELETE USING (true);

CREATE POLICY "Allow public read access to usage_analytics" ON public.usage_analytics FOR SELECT USING (true);
CREATE POLICY "Allow public insert to usage_analytics" ON public.usage_analytics FOR INSERT WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ic_meetings_updated_at BEFORE UPDATE ON public.ic_meetings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_question_patterns_updated_at BEFORE UPDATE ON public.question_patterns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function for semantic search
CREATE OR REPLACE FUNCTION public.search_documents(
  query_embedding vector(768),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity,
    dc.metadata
  FROM public.document_chunks dc
  WHERE dc.embedding IS NOT NULL
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;