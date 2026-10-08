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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      assistant_conversations: {
        Row: {
          created_at: string
          id: string
          messages: Json
          updated_at: string
          user_id: string | null
          visitor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          updated_at?: string
          user_id?: string | null
          visitor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          updated_at?: string
          user_id?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      assistant_turn_logs: {
        Row: {
          channel: string
          conversation_id: string | null
          created_at: string
          error: string | null
          first_token_ms: number | null
          id: string
          input_tokens: number | null
          model: string
          ok: boolean
          output_tokens: number | null
          steps: number | null
          total_ms: number
        }
        Insert: {
          channel: string
          conversation_id?: string | null
          created_at?: string
          error?: string | null
          first_token_ms?: number | null
          id?: string
          input_tokens?: number | null
          model: string
          ok?: boolean
          output_tokens?: number | null
          steps?: number | null
          total_ms: number
        }
        Update: {
          channel?: string
          conversation_id?: string | null
          created_at?: string
          error?: string | null
          first_token_ms?: number | null
          id?: string
          input_tokens?: number | null
          model?: string
          ok?: boolean
          output_tokens?: number | null
          steps?: number | null
          total_ms?: number
        }
        Relationships: [
          {
            foreignKeyName: "assistant_turn_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "assistant_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_appointment_requests: {
        Row: {
          channel: string
          clinic_id: string
          created_at: string
          doctor: string
          id: string
          patient_name: string
          phone: string
          preferred_time: string
          reason: string
          status: string
        }
        Insert: {
          channel?: string
          clinic_id: string
          created_at?: string
          doctor?: string
          id?: string
          patient_name: string
          phone?: string
          preferred_time?: string
          reason?: string
          status?: string
        }
        Update: {
          channel?: string
          clinic_id?: string
          created_at?: string
          doctor?: string
          id?: string
          patient_name?: string
          phone?: string
          preferred_time?: string
          reason?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_appointment_requests_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_whatsapp_sessions: {
        Row: {
          clinic_id: string
          phone: string
          started_at: string
        }
        Insert: {
          clinic_id: string
          phone: string
          started_at?: string
        }
        Update: {
          clinic_id?: string
          phone?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_whatsapp_sessions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string
          created_at: string
          doctors: Json
          email: string
          emergency_phone: string
          hours: Json
          id: string
          insurance: string
          kb_id: string | null
          map_url: string
          name: string
          notes: string
          owner_id: string
          phone: string
          portal_token: string
          scenario_id: string | null
          test_code: string
          updated_at: string
        }
        Insert: {
          address?: string
          created_at?: string
          doctors?: Json
          email?: string
          emergency_phone?: string
          hours?: Json
          id?: string
          insurance?: string
          kb_id?: string | null
          map_url?: string
          name: string
          notes?: string
          owner_id: string
          phone?: string
          portal_token?: string
          scenario_id?: string | null
          test_code?: string
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          doctors?: Json
          email?: string
          emergency_phone?: string
          hours?: Json
          id?: string
          insurance?: string
          kb_id?: string | null
          map_url?: string
          name?: string
          notes?: string
          owner_id?: string
          phone?: string
          portal_token?: string
          scenario_id?: string | null
          test_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          agents: Json
          clinic_id: string | null
          compare: boolean
          created_at: string
          id: string
          mode: string
          title: string
          user_id: string
        }
        Insert: {
          agents?: Json
          clinic_id?: string | null
          compare?: boolean
          created_at?: string
          id?: string
          mode?: string
          title?: string
          user_id: string
        }
        Update: {
          agents?: Json
          clinic_id?: string | null
          compare?: boolean
          created_at?: string
          id?: string
          mode?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_scenarios: {
        Row: {
          created_at: string
          id: string
          kb_ids: string[]
          label: string
          prompt: string
          sample: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kb_ids?: string[]
          label: string
          prompt?: string
          sample?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kb_ids?: string[]
          label?: string
          prompt?: string
          sample?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_bases: {
        Row: {
          content: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          company: string | null
          conversation_id: string | null
          created_at: string
          email: string
          id: string
          interest: string | null
          name: string
          phone: string | null
          status: string
        }
        Insert: {
          company?: string | null
          conversation_id?: string | null
          created_at?: string
          email: string
          id?: string
          interest?: string | null
          name: string
          phone?: string | null
          status?: string
        }
        Update: {
          company?: string | null
          conversation_id?: string | null
          created_at?: string
          email?: string
          id?: string
          interest?: string | null
          name?: string
          phone?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "assistant_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          preferences: Json
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          preferences?: Json
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          preferences?: Json
          user_id?: string
        }
        Relationships: []
      }
      turns: {
        Row: {
          agent: string
          assistant_text: string
          conversation_id: string
          created_at: string
          id: string
          metrics: Json
          user_id: string
          user_text: string
        }
        Insert: {
          agent?: string
          assistant_text?: string
          conversation_id: string
          created_at?: string
          id?: string
          metrics?: Json
          user_id: string
          user_text?: string
        }
        Update: {
          agent?: string
          assistant_text?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metrics?: Json
          user_id?: string
          user_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "turns_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          body: string
          conversation_id: string | null
          created_at: string
          direction: string
          errors: Json | null
          id: string
          in_reply_to: string | null
          phone: string
          provider_ts: string | null
          reply_attempts: number
          reply_claimed_at: string | null
          reply_error: string | null
          reply_state: string | null
          status: string
          status_times: Json
          updated_at: string
          wa_message_id: string | null
        }
        Insert: {
          body?: string
          conversation_id?: string | null
          created_at?: string
          direction: string
          errors?: Json | null
          id?: string
          in_reply_to?: string | null
          phone: string
          provider_ts?: string | null
          reply_attempts?: number
          reply_claimed_at?: string | null
          reply_error?: string | null
          reply_state?: string | null
          status?: string
          status_times?: Json
          updated_at?: string
          wa_message_id?: string | null
        }
        Update: {
          body?: string
          conversation_id?: string | null
          created_at?: string
          direction?: string
          errors?: Json | null
          id?: string
          in_reply_to?: string | null
          phone?: string
          provider_ts?: string | null
          reply_attempts?: number
          reply_claimed_at?: string | null
          reply_error?: string | null
          reply_state?: string | null
          status?: string
          status_times?: Json
          updated_at?: string
          wa_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "assistant_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_in_reply_to_fkey"
            columns: ["in_reply_to"]
            isOneToOne: false
            referencedRelation: "whatsapp_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_webhook_events: {
        Row: {
          attempts: number
          delivery_id: string
          event: string
          id: string
          next_attempt_at: string
          payload: Json
          processed_at: string | null
          processing_error: string | null
          received_at: string
        }
        Insert: {
          attempts?: number
          delivery_id: string
          event: string
          id?: string
          next_attempt_at?: string
          payload: Json
          processed_at?: string | null
          processing_error?: string | null
          received_at?: string
        }
        Update: {
          attempts?: number
          delivery_id?: string
          event?: string
          id?: string
          next_attempt_at?: string
          payload?: Json
          processed_at?: string | null
          processing_error?: string | null
          received_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
