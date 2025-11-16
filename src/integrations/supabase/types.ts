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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_insights: {
        Row: {
          based_on_runs: string[] | null
          content: string
          created_at: string | null
          id: string
          insight_type: string
          is_read: boolean | null
          user_id: string
        }
        Insert: {
          based_on_runs?: string[] | null
          content: string
          created_at?: string | null
          id?: string
          insight_type: string
          is_read?: boolean | null
          user_id: string
        }
        Update: {
          based_on_runs?: string[] | null
          content?: string
          created_at?: string | null
          id?: string
          insight_type?: string
          is_read?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string | null
          environment_mode: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          scopes: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          environment_mode?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          scopes?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          environment_mode?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          scopes?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      api_rate_limits: {
        Row: {
          calls_count: number | null
          created_at: string | null
          endpoint_name: string
          environment_mode: string
          id: string
          user_id: string
          window_start: string | null
        }
        Insert: {
          calls_count?: number | null
          created_at?: string | null
          endpoint_name: string
          environment_mode: string
          id?: string
          user_id: string
          window_start?: string | null
        }
        Update: {
          calls_count?: number | null
          created_at?: string | null
          endpoint_name?: string
          environment_mode?: string
          id?: string
          user_id?: string
          window_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_rate_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_prompts: {
        Row: {
          created_at: string
          description: string | null
          id: string
          models: string[] | null
          name: string
          prompt_text: string
          team_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          models?: string[] | null
          name: string
          prompt_text: string
          team_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          models?: string[] | null
          name?: string
          prompt_text?: string
          team_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_prompts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_prompts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      model_test_runs: {
        Row: {
          created_at: string
          id: string
          is_public: boolean | null
          models: string[]
          parent_test_id: string | null
          prompt_id: string | null
          prompt_text: string
          responses: Json
          share_token: string | null
          team_id: string | null
          test_type: string | null
          total_cost: number | null
          total_latency_ms: number | null
          user_id: string
          variation_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean | null
          models: string[]
          parent_test_id?: string | null
          prompt_id?: string | null
          prompt_text: string
          responses: Json
          share_token?: string | null
          team_id?: string | null
          test_type?: string | null
          total_cost?: number | null
          total_latency_ms?: number | null
          user_id: string
          variation_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean | null
          models?: string[]
          parent_test_id?: string | null
          prompt_id?: string | null
          prompt_text?: string
          responses?: Json
          share_token?: string | null
          team_id?: string | null
          test_type?: string | null
          total_cost?: number | null
          total_latency_ms?: number | null
          user_id?: string
          variation_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "model_test_runs_parent_test_id_fkey"
            columns: ["parent_test_id"]
            isOneToOne: false
            referencedRelation: "model_test_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_test_runs_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_test_runs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_test_runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          environment_mode: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          environment_mode?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          environment_mode?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      prompt_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      prompt_templates: {
        Row: {
          category_id: string | null
          created_at: string | null
          created_by: string | null
          description: string
          difficulty_level: string | null
          example_output: string | null
          id: string
          is_system: boolean | null
          name: string
          tags: string[] | null
          team_id: string | null
          template_content: string
          updated_at: string | null
          use_count: number | null
          variables: Json | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          difficulty_level?: string | null
          example_output?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          tags?: string[] | null
          team_id?: string | null
          template_content: string
          updated_at?: string | null
          use_count?: number | null
          variables?: Json | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          difficulty_level?: string | null
          example_output?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          tags?: string[] | null
          team_id?: string | null
          template_content?: string
          updated_at?: string | null
          use_count?: number | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "prompt_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_templates_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_usage: {
        Row: {
          id: string
          prompt_id: string
          used_at: string
          user_id: string
        }
        Insert: {
          id?: string
          prompt_id: string
          used_at?: string
          user_id: string
        }
        Update: {
          id?: string
          prompt_id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_usage_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_versions: {
        Row: {
          created_at: string
          created_by: string
          generated_prompt: string
          id: string
          prompt_id: string
          quality_scores: Json | null
          spec: Json
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by: string
          generated_prompt: string
          id?: string
          prompt_id: string
          quality_scores?: Json | null
          spec: Json
          version_number: number
        }
        Update: {
          created_at?: string
          created_by?: string
          generated_prompt?: string
          id?: string
          prompt_id?: string
          quality_scores?: Json | null
          spec?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "prompt_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_versions_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts: {
        Row: {
          abstract_template: Json | null
          category_id: string | null
          constraints: string | null
          created_at: string | null
          created_by: string
          depth: string | null
          description: string | null
          fork_count: number | null
          fork_of: string | null
          format: string
          generated_prompt: string
          goal_type: string
          id: string
          is_featured: boolean | null
          model_target: string
          name: string
          precision: string
          problem: string
          quality_scores: Json | null
          success_criteria: string | null
          tags: string[] | null
          team_id: string | null
          tech_env: string | null
          updated_at: string | null
          use_count: number | null
          visibility: string | null
          voice_style: string | null
        }
        Insert: {
          abstract_template?: Json | null
          category_id?: string | null
          constraints?: string | null
          created_at?: string | null
          created_by: string
          depth?: string | null
          description?: string | null
          fork_count?: number | null
          fork_of?: string | null
          format: string
          generated_prompt: string
          goal_type: string
          id?: string
          is_featured?: boolean | null
          model_target: string
          name: string
          precision: string
          problem: string
          quality_scores?: Json | null
          success_criteria?: string | null
          tags?: string[] | null
          team_id?: string | null
          tech_env?: string | null
          updated_at?: string | null
          use_count?: number | null
          visibility?: string | null
          voice_style?: string | null
        }
        Update: {
          abstract_template?: Json | null
          category_id?: string | null
          constraints?: string | null
          created_at?: string | null
          created_by?: string
          depth?: string | null
          description?: string | null
          fork_count?: number | null
          fork_of?: string | null
          format?: string
          generated_prompt?: string
          goal_type?: string
          id?: string
          is_featured?: boolean | null
          model_target?: string
          name?: string
          precision?: string
          problem?: string
          quality_scores?: Json | null
          success_criteria?: string | null
          tags?: string[] | null
          team_id?: string | null
          tech_env?: string | null
          updated_at?: string | null
          use_count?: number | null
          visibility?: string | null
          voice_style?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "prompt_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompts_fork_of_fkey"
            columns: ["fork_of"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_test_results: {
        Row: {
          error_message: string | null
          executed_at: string | null
          id: string
          scheduled_test_id: string
          status: string
          test_run_id: string | null
        }
        Insert: {
          error_message?: string | null
          executed_at?: string | null
          id?: string
          scheduled_test_id: string
          status: string
          test_run_id?: string | null
        }
        Update: {
          error_message?: string | null
          executed_at?: string | null
          id?: string
          scheduled_test_id?: string
          status?: string
          test_run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_test_results_scheduled_test_id_fkey"
            columns: ["scheduled_test_id"]
            isOneToOne: false
            referencedRelation: "scheduled_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_test_results_test_run_id_fkey"
            columns: ["test_run_id"]
            isOneToOne: false
            referencedRelation: "model_test_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_tests: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          last_run_at: string | null
          models: string[]
          name: string
          next_run_at: string
          notification_email: string | null
          notification_enabled: boolean | null
          prompt_id: string | null
          prompt_text: string | null
          schedule_config: Json | null
          schedule_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          models: string[]
          name: string
          next_run_at: string
          notification_email?: string | null
          notification_enabled?: boolean | null
          prompt_id?: string | null
          prompt_text?: string | null
          schedule_config?: Json | null
          schedule_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          models?: string[]
          name?: string
          next_run_at?: string
          notification_email?: string | null
          notification_enabled?: boolean | null
          prompt_id?: string | null
          prompt_text?: string | null
          schedule_config?: Json | null
          schedule_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_tests_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string | null
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          role: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_shared_resources: {
        Row: {
          access_level: string
          id: string
          resource_id: string
          resource_type: string
          shared_at: string | null
          shared_by: string
          team_id: string
        }
        Insert: {
          access_level: string
          id?: string
          resource_id: string
          resource_type: string
          shared_at?: string | null
          shared_by: string
          team_id: string
        }
        Update: {
          access_level?: string
          id?: string
          resource_id?: string
          resource_type?: string
          shared_at?: string | null
          shared_by?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_shared_resources_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_budgets: {
        Row: {
          alert_threshold: number | null
          created_at: string | null
          current_spending: number | null
          daily_limit: number | null
          email_notifications_enabled: boolean | null
          environment_mode: string | null
          id: string
          monthly_budget: number | null
          notification_email: string | null
          period_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_threshold?: number | null
          created_at?: string | null
          current_spending?: number | null
          daily_limit?: number | null
          email_notifications_enabled?: boolean | null
          environment_mode?: string | null
          id?: string
          monthly_budget?: number | null
          notification_email?: string | null
          period_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_threshold?: number | null
          created_at?: string | null
          current_spending?: number | null
          daily_limit?: number | null
          email_notifications_enabled?: boolean | null
          environment_mode?: string | null
          id?: string
          monthly_budget?: number | null
          notification_email?: string | null
          period_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_budgets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_api_usage: {
        Args: {
          _environment_mode: string
          _time_range?: unknown
          _user_id: string
        }
        Returns: {
          endpoint_name: string
          last_call: string
          total_calls: number
        }[]
      }
      get_model_leaderboard: {
        Args: { category_filter?: string; time_range_days?: number }
        Returns: {
          avg_cost: number
          avg_latency_ms: number
          cost_efficiency_score: number
          model_name: string
          success_rate: number
          total_usage: number
        }[]
      }
      get_rate_limit_config: {
        Args: { _environment_mode: string }
        Returns: {
          endpoint_name: string
          max_calls_per_day: number
          max_calls_per_hour: number
          max_calls_per_minute: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_rate_limit: {
        Args: {
          _endpoint_name: string
          _environment_mode: string
          _user_id: string
          _window_start: string
        }
        Returns: undefined
      }
      validate_api_key: {
        Args: { _endpoint_name: string; _key_hash: string }
        Returns: {
          environment_mode: string
          is_valid: boolean
          user_id: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
