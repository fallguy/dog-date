Connecting to db 5432
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
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dogs: {
        Row: {
          ai_video_prompt: string | null
          ai_video_scenario: string | null
          ai_video_status: Database["public"]["Enums"]["ai_video_status"]
          ai_video_url: string | null
          birthdate: string | null
          breed: string
          created_at: string
          energy: Database["public"]["Enums"]["dog_energy"]
          id: string
          name: string
          notes: string | null
          owner_id: string
          photos: string[]
          primary_photo_url: string | null
          size: Database["public"]["Enums"]["dog_size"]
          tags: string[]
          updated_at: string
          vaccinated: boolean
        }
        Insert: {
          ai_video_prompt?: string | null
          ai_video_scenario?: string | null
          ai_video_status?: Database["public"]["Enums"]["ai_video_status"]
          ai_video_url?: string | null
          birthdate?: string | null
          breed: string
          created_at?: string
          energy: Database["public"]["Enums"]["dog_energy"]
          id?: string
          name: string
          notes?: string | null
          owner_id: string
          photos?: string[]
          primary_photo_url?: string | null
          size: Database["public"]["Enums"]["dog_size"]
          tags?: string[]
          updated_at?: string
          vaccinated?: boolean
        }
        Update: {
          ai_video_prompt?: string | null
          ai_video_scenario?: string | null
          ai_video_status?: Database["public"]["Enums"]["ai_video_status"]
          ai_video_url?: string | null
          birthdate?: string | null
          breed?: string
          created_at?: string
          energy?: Database["public"]["Enums"]["dog_energy"]
          id?: string
          name?: string
          notes?: string | null
          owner_id?: string
          photos?: string[]
          primary_photo_url?: string | null
          size?: Database["public"]["Enums"]["dog_size"]
          tags?: string[]
          updated_at?: string
          vaccinated?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "dogs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          dog_a_id: string
          dog_b_id: string
          id: string
        }
        Insert: {
          created_at?: string
          dog_a_id: string
          dog_b_id: string
          id?: string
        }
        Update: {
          created_at?: string
          dog_a_id?: string
          dog_b_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_dog_a_id_fkey"
            columns: ["dog_a_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_dog_b_id_fkey"
            columns: ["dog_b_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          match_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          match_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          match_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          display_name: string
          id: string
          lat: number | null
          lng: number | null
          photo_url: string | null
          search_radius_miles: number
          tags: string[]
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          display_name: string
          id: string
          lat?: number | null
          lng?: number | null
          photo_url?: string | null
          search_radius_miles?: number
          tags?: string[]
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          lat?: number | null
          lng?: number | null
          photo_url?: string | null
          search_radius_miles?: number
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string
          device_label: string | null
          expo_token: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_label?: string | null
          expo_token: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_label?: string | null
          expo_token?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          reason: string
          reporter_id: string
          status: string
          target_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          reason: string
          reporter_id: string
          status?: string
          target_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          reason?: string
          reporter_id?: string
          status?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      swipes: {
        Row: {
          created_at: string
          direction: Database["public"]["Enums"]["swipe_direction"]
          id: string
          swiper_dog_id: string
          target_dog_id: string
        }
        Insert: {
          created_at?: string
          direction: Database["public"]["Enums"]["swipe_direction"]
          id?: string
          swiper_dog_id: string
          target_dog_id: string
        }
        Update: {
          created_at?: string
          direction?: Database["public"]["Enums"]["swipe_direction"]
          id?: string
          swiper_dog_id?: string
          target_dog_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swipes_swiper_dog_id_fkey"
            columns: ["swiper_dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swipes_target_dog_id_fkey"
            columns: ["target_dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
        ]
      }
      video_jobs: {
        Row: {
          completed_at: string | null
          cost_cents: number | null
          dog_id: string
          error: string | null
          fal_request_id: string | null
          id: string
          prompt: string
          provider: string
          scenario: string
          started_at: string
          status: Database["public"]["Enums"]["video_job_status"]
        }
        Insert: {
          completed_at?: string | null
          cost_cents?: number | null
          dog_id: string
          error?: string | null
          fal_request_id?: string | null
          id?: string
          prompt: string
          provider?: string
          scenario: string
          started_at?: string
          status?: Database["public"]["Enums"]["video_job_status"]
        }
        Update: {
          completed_at?: string | null
          cost_cents?: number | null
          dog_id?: string
          error?: string | null
          fal_request_id?: string | null
          id?: string
          prompt?: string
          provider?: string
          scenario?: string
          started_at?: string
          status?: Database["public"]["Enums"]["video_job_status"]
        }
        Relationships: [
          {
            foreignKeyName: "video_jobs_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      moderation_queue: {
        Row: {
          created_at: string | null
          notes: string | null
          reason: string | null
          report_id: string | null
          reporter_id: string | null
          reporter_name: string | null
          status: string | null
          target_id: string | null
          target_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      haversine_miles: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
    }
    Enums: {
      ai_video_status: "idle" | "pending" | "ready" | "failed"
      dog_energy: "Chill" | "Medium" | "High"
      dog_size: "Small" | "Medium" | "Large"
      swipe_direction: "like" | "pass"
      video_job_status: "pending" | "ready" | "failed" | "cancelled"
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
    Enums: {
      ai_video_status: ["idle", "pending", "ready", "failed"],
      dog_energy: ["Chill", "Medium", "High"],
      dog_size: ["Small", "Medium", "Large"],
      swipe_direction: ["like", "pass"],
      video_job_status: ["pending", "ready", "failed", "cancelled"],
    },
  },
} as const

