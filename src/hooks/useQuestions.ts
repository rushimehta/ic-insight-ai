import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface QuestionPattern {
  id: string;
  question_text: string;
  category: string;
  frequency: number | null;
  sectors: unknown;
  asker_type: string | null;
  importance_score: number | null;
  example_context?: string | null;
}

export function useQuestions() {
  const [questions, setQuestions] = useState<QuestionPattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQuestions = async (askerType?: "ic_member" | "deal_team") => {
    setIsLoading(true);
    
    let query = supabase
      .from("question_patterns")
      .select("*")
      .order("frequency", { ascending: false })
      .limit(20);

    if (askerType) {
      query = query.or(`asker_type.eq.${askerType},asker_type.eq.both`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching questions:", error);
    } else {
      setQuestions(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  return {
    questions,
    isLoading,
    fetchQuestions,
  };
}
