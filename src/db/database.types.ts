export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      diagnostic_test_attempts: {
        Row: {
          id: string
          user_id: string
          diagnostic_test_id: string
          score: number
          completed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          diagnostic_test_id: string
          score: number
          completed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          diagnostic_test_id?: string
          score?: number
          completed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_test_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_test_attempts_diagnostic_test_id_fkey"
            columns: ["diagnostic_test_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_tests"
            referencedColumns: ["id"]
          }
        ]
      }
      diagnostic_test_learning_content: {
        Row: {
          test_id: string
          content_id: string
        }
        Insert: {
          test_id: string
          content_id: string
        }
        Update: {
          test_id?: string
          content_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_test_learning_content_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_test_learning_content_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "learning_content"
            referencedColumns: ["id"]
          }
        ]
      }
      diagnostic_tests: {
        Row: {
          id: string
          section_id: string
          title: string
          created_at: string
        }
        Insert: {
          id?: string
          section_id: string
          title: string
          created_at?: string
        }
        Update: {
          id?: string
          section_id?: string
          title?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_tests_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: true
            referencedRelation: "sections"
            referencedColumns: ["id"]
          }
        ]
      }
      learning_content: {
        Row: {
          id: string
          topic_id: string | null
          usage_type: Database["public"]["Enums"]["content_usage_type"]
          content: Json
          is_verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          topic_id?: string | null
          usage_type: Database["public"]["Enums"]["content_usage_type"]
          content: Json
          is_verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          topic_id?: string | null
          usage_type?: Database["public"]["Enums"]["content_usage_type"]
          content?: Json
          is_verified?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_content_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          login: string
          email: string
          has_completed_tutorial: boolean
          created_at: string
        }
        Insert: {
          id: string
          login: string
          email: string
          has_completed_tutorial?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          login?: string
          email?: string
          has_completed_tutorial?: boolean
          created_at?: string
        }
        Relationships: []
      }
      sections: {
        Row: {
          id: string
          title: string
          description: string | null
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          display_order: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          display_order?: number
          created_at?: string
        }
        Relationships: []
      }
      session_messages: {
        Row: {
          id: string
          session_id: string
          sender: Database["public"]["Enums"]["message_sender"]
          content: Json
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          sender: Database["public"]["Enums"]["message_sender"]
          content: Json
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          sender?: Database["public"]["Enums"]["message_sender"]
          content?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          topic_id: string | null
          started_at: string
          ended_at: string | null
          ai_summary: string | null
        }
        Insert: {
          id?: string
          user_id: string
          topic_id?: string | null
          started_at?: string
          ended_at?: string | null
          ai_summary?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          topic_id?: string | null
          started_at?: string
          ended_at?: string | null
          ai_summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          }
        ]
      }
      topic_dependencies: {
        Row: {
          topic_id: string
          dependency_id: string
        }
        Insert: {
          topic_id: string
          dependency_id: string
        }
        Update: {
          topic_id?: string
          dependency_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_dependencies_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_dependencies_dependency_id_fkey"
            columns: ["dependency_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          }
        ]
      }
      topics: {
        Row: {
          id: string
          section_id: string
          title: string
          description: string | null
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          section_id: string
          title: string
          description?: string | null
          display_order: number
          created_at?: string
        }
        Update: {
          id?: string
          section_id?: string
          title?: string
          description?: string | null
          display_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          }
        ]
      }
      user_answers: {
        Row: {
          id: string
          attempt_id: string
          content_id: string
          answer_content: Json
          is_correct: boolean
        }
        Insert: {
          id?: string
          attempt_id: string
          content_id: string
          answer_content: Json
          is_correct: boolean
        }
        Update: {
          id?: string
          attempt_id?: string
          content_id?: string
          answer_content?: Json
          is_correct?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "user_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_answers_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "learning_content"
            referencedColumns: ["id"]
          }
        ]
      }
      user_progress: {
        Row: {
          user_id: string
          topic_id: string
          status: Database["public"]["Enums"]["user_progress_status"]
          score: number | null
          updated_at: string
        }
        Insert: {
          user_id: string
          topic_id: string
          status?: Database["public"]["Enums"]["user_progress_status"]
          score?: number | null
          updated_at?: string
        }
        Update: {
          user_id?: string
          topic_id?: string
          status?: Database["public"]["Enums"]["user_progress_status"]
          score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      content_usage_type: 'explanation' | 'exercise' | 'diagnostic_question'
      user_progress_status: 'not_started' | 'in_progress' | 'completed'
      message_sender: 'user' | 'ai'
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

