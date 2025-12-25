export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
          sources: Json | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
          sources?: Json | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
          sources?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      deals: {
        Row: {
          company_name: string
          created_at: string
          created_by: string | null
          deal_name: string
          deal_size: string | null
          deal_team: Json | null
          description: string | null
          ic_date: string | null
          id: string
          lead_partner: string | null
          metadata: Json | null
          sector: Database["public"]["Enums"]["sector_type"]
          stage: Database["public"]["Enums"]["deal_stage"]
          target_close_date: string | null
          updated_at: string
        }
        Insert: {
          company_name: string
          created_at?: string
          created_by?: string | null
          deal_name: string
          deal_size?: string | null
          deal_team?: Json | null
          description?: string | null
          ic_date?: string | null
          id?: string
          lead_partner?: string | null
          metadata?: Json | null
          sector: Database["public"]["Enums"]["sector_type"]
          stage?: Database["public"]["Enums"]["deal_stage"]
          target_close_date?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          created_by?: string | null
          deal_name?: string
          deal_size?: string | null
          deal_team?: Json | null
          description?: string | null
          ic_date?: string | null
          id?: string
          lead_partner?: string | null
          metadata?: Json | null
          sector?: Database["public"]["Enums"]["sector_type"]
          stage?: Database["public"]["Enums"]["deal_stage"]
          target_close_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      document_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          document_id: string
          embedding: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          document_id: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          document_id?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string | null
          created_at: string
          deal_name: string | null
          file_size: number
          file_type: string
          filename: string
          ic_date: string | null
          id: string
          metadata: Json | null
          sector: Database["public"]["Enums"]["sector_type"] | null
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          deal_name?: string | null
          file_size: number
          file_type: string
          filename: string
          ic_date?: string | null
          id?: string
          metadata?: Json | null
          sector?: Database["public"]["Enums"]["sector_type"] | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          deal_name?: string | null
          file_size?: number
          file_type?: string
          filename?: string
          ic_date?: string | null
          id?: string
          metadata?: Json | null
          sector?: Database["public"]["Enums"]["sector_type"] | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          comment: string | null
          correction_text: string | null
          created_at: string
          document_chunk_id: string | null
          feedback_type: string
          id: string
          message_id: string | null
          metadata: Json | null
          rating: number | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          correction_text?: string | null
          created_at?: string
          document_chunk_id?: string | null
          feedback_type: string
          id?: string
          message_id?: string | null
          metadata?: Json | null
          rating?: number | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          correction_text?: string | null
          created_at?: string
          document_chunk_id?: string | null
          feedback_type?: string
          id?: string
          message_id?: string | null
          metadata?: Json | null
          rating?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_document_chunk_id_fkey"
            columns: ["document_chunk_id"]
            isOneToOne: false
            referencedRelation: "document_chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_drafts: {
        Row: {
          company_overview: string | null
          created_at: string
          deal_name: string
          deal_terms: string | null
          financial_highlights: string | null
          generated_document: string | null
          ic_date: string | null
          id: string
          investment_thesis: string | null
          key_risks: string | null
          market_analysis: string | null
          raw_notes: string | null
          sector: Database["public"]["Enums"]["sector_type"]
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_overview?: string | null
          created_at?: string
          deal_name: string
          deal_terms?: string | null
          financial_highlights?: string | null
          generated_document?: string | null
          ic_date?: string | null
          id?: string
          investment_thesis?: string | null
          key_risks?: string | null
          market_analysis?: string | null
          raw_notes?: string | null
          sector: Database["public"]["Enums"]["sector_type"]
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_overview?: string | null
          created_at?: string
          deal_name?: string
          deal_terms?: string | null
          financial_highlights?: string | null
          generated_document?: string | null
          ic_date?: string | null
          id?: string
          investment_thesis?: string | null
          key_risks?: string | null
          market_analysis?: string | null
          raw_notes?: string | null
          sector?: Database["public"]["Enums"]["sector_type"]
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ic_meetings: {
        Row: {
          attendees: Json | null
          created_at: string
          deal_name: string
          deal_size: string | null
          id: string
          key_concerns: Json | null
          meeting_date: string
          outcome: string | null
          questions_asked: Json | null
          sector: string | null
          summary: string | null
          updated_at: string
        }
        Insert: {
          attendees?: Json | null
          created_at?: string
          deal_name: string
          deal_size?: string | null
          id?: string
          key_concerns?: Json | null
          meeting_date: string
          outcome?: string | null
          questions_asked?: Json | null
          sector?: string | null
          summary?: string | null
          updated_at?: string
        }
        Update: {
          attendees?: Json | null
          created_at?: string
          deal_name?: string
          deal_size?: string | null
          id?: string
          key_concerns?: Json | null
          meeting_date?: string
          outcome?: string | null
          questions_asked?: Json | null
          sector?: string | null
          summary?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      meeting_notes: {
        Row: {
          action_items: Json | null
          ai_generated_summary: string | null
          attendees: Json | null
          chairman_id: string | null
          created_at: string
          deal_name: string
          decision: string | null
          decision_rationale: string | null
          discussion_points: Json | null
          follow_up_required: boolean | null
          ic_meeting_id: string | null
          id: string
          key_concerns: Json | null
          meeting_date: string
          next_steps: string | null
          raw_notes: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          action_items?: Json | null
          ai_generated_summary?: string | null
          attendees?: Json | null
          chairman_id?: string | null
          created_at?: string
          deal_name: string
          decision?: string | null
          decision_rationale?: string | null
          discussion_points?: Json | null
          follow_up_required?: boolean | null
          ic_meeting_id?: string | null
          id?: string
          key_concerns?: Json | null
          meeting_date: string
          next_steps?: string | null
          raw_notes?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          action_items?: Json | null
          ai_generated_summary?: string | null
          attendees?: Json | null
          chairman_id?: string | null
          created_at?: string
          deal_name?: string
          decision?: string | null
          decision_rationale?: string | null
          discussion_points?: Json | null
          follow_up_required?: boolean | null
          ic_meeting_id?: string | null
          id?: string
          key_concerns?: Json | null
          meeting_date?: string
          next_steps?: string | null
          raw_notes?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_notes_ic_meeting_id_fkey"
            columns: ["ic_meeting_id"]
            isOneToOne: false
            referencedRelation: "ic_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          full_name: string | null
          id: string
          primary_sector: Database["public"]["Enums"]["sector_type"] | null
          role: string | null
          team: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          full_name?: string | null
          id: string
          primary_sector?: Database["public"]["Enums"]["sector_type"] | null
          role?: string | null
          team?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          full_name?: string | null
          id?: string
          primary_sector?: Database["public"]["Enums"]["sector_type"] | null
          role?: string | null
          team?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      question_patterns: {
        Row: {
          asker_type: string | null
          category: string
          created_at: string
          example_context: string | null
          frequency: number | null
          id: string
          importance_score: number | null
          question_text: string
          sectors: Json | null
          updated_at: string
        }
        Insert: {
          asker_type?: string | null
          category: string
          created_at?: string
          example_context?: string | null
          frequency?: number | null
          id?: string
          importance_score?: number | null
          question_text: string
          sectors?: Json | null
          updated_at?: string
        }
        Update: {
          asker_type?: string | null
          category?: string
          created_at?: string
          example_context?: string | null
          frequency?: number | null
          id?: string
          importance_score?: number | null
          question_text?: string
          sectors?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      usage_analytics: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          session_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          session_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_analytics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sectors: {
        Row: {
          created_at: string
          id: string
          sector: Database["public"]["Enums"]["sector_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          sector: Database["public"]["Enums"]["sector_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          sector?: Database["public"]["Enums"]["sector_type"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_sector_access: {
        Args: {
          _sector: Database["public"]["Enums"]["sector_type"]
          _user_id: string
        }
        Returns: boolean
      }
      is_chairman_or_admin: { Args: { _user_id: string }; Returns: boolean }
      search_documents: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          document_id: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
    }
    Enums: {
      app_role: "deal_team" | "ic_member" | "ic_chairman" | "admin"
      deal_stage:
        | "sourcing"
        | "initial_review"
        | "due_diligence"
        | "ic_scheduled"
        | "ic_complete"
        | "approved"
        | "closed"
        | "passed"
      sector_type:
        | "technology"
        | "healthcare"
        | "financial_services"
        | "consumer_retail"
        | "industrials"
        | "energy"
        | "real_estate"
        | "media_entertainment"
        | "infrastructure"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["deal_team", "ic_member", "ic_chairman", "admin"],
      deal_stage: [
        "sourcing",
        "initial_review",
        "due_diligence",
        "ic_scheduled",
        "ic_complete",
        "approved",
        "closed",
        "passed",
      ],
      sector_type: [
        "technology",
        "healthcare",
        "financial_services",
        "consumer_retail",
        "industrials",
        "energy",
        "real_estate",
        "media_entertainment",
        "infrastructure",
      ],
    },
  },
} as const
