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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      chat_history: {
        Row: {
          bot_index: number
          created_at: string | null
          id: string
          is_user: boolean
          message: string
          user_id: string
        }
        Insert: {
          bot_index: number
          created_at?: string | null
          id?: string
          is_user: boolean
          message: string
          user_id: string
        }
        Update: {
          bot_index?: number
          created_at?: string | null
          id?: string
          is_user?: boolean
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_teachers_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "class_students_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "chat_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_chat_messages_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "chat_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "student_chat_summary_view"
            referencedColumns: ["student_id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      teacher_classes: {
        Row: {
          class_id: string
          created_at: string | null
          id: string
          teacher_id: string
        }
        Insert: {
          class_id: string
          created_at?: string | null
          id?: string
          teacher_id: string
        }
        Update: {
          class_id?: string
          created_at?: string | null
          id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_classes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "admin_classes_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_classes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class_students_view"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "teacher_classes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_classes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "teacher_classes_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "admin_teachers_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "class_students_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "teacher_classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "student_chat_messages_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "teacher_classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "student_chat_summary_view"
            referencedColumns: ["student_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          class_id: string | null
          created_at: string | null
          display_name: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "admin_classes_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class_students_view"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "user_roles_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "teacher_classes_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "admin_teachers_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "class_students_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "student_chat_messages_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "student_chat_summary_view"
            referencedColumns: ["student_id"]
          },
        ]
      }
    }
    Views: {
      admin_classes_view: {
        Row: {
          id: string | null
          name: string | null
          student_count: number | null
        }
        Relationships: []
      }
      admin_teachers_view: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string | null
          role: string | null
        }
        Relationships: []
      }
      class_students_view: {
        Row: {
          class_id: string | null
          class_name: string | null
          display_name: string | null
          email: string | null
          student_id: string | null
        }
        Relationships: []
      }
      student_chat_messages_view: {
        Row: {
          bot_index: number | null
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string | null
          is_user: boolean | null
          message: string | null
          student_id: string | null
        }
        Relationships: []
      }
      student_chat_summary_view: {
        Row: {
          bot_index: number | null
          display_name: string | null
          email: string | null
          last_activity: string | null
          message_count: number | null
          student_id: string | null
        }
        Relationships: []
      }
      teacher_classes_view: {
        Row: {
          id: string | null
          name: string | null
          student_count: number | null
        }
        Relationships: []
      }
      teacher_student_relation: {
        Row: {
          class_id: string | null
          student_id: string | null
          teacher_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "admin_teachers_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "class_students_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "teacher_classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "student_chat_messages_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "teacher_classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "student_chat_summary_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "user_roles_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "admin_classes_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class_students_view"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "user_roles_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "teacher_classes_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "admin_teachers_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "class_students_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "student_chat_messages_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "student_chat_summary_view"
            referencedColumns: ["student_id"]
          },
        ]
      }
    }
    Functions: {
      add_user_role: {
        Args: {
          input_class_id?: string
          input_display_name?: string
          input_role_type: string
          input_user_id: string
        }
        Returns: undefined
      }
      get_bot_message_counts: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_chat_history: {
        Args: { bot_idx: number }
        Returns: {
          bot_index: number
          created_at: string | null
          id: string
          is_user: boolean
          message: string
          user_id: string
        }[]
      }
      get_class_students: {
        Args: { class_id_param: string }
        Returns: {
          display_name: string
          email: string
          role: string
          user_id: string
        }[]
      }
      get_favorite_bot: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_student_bot_messages: {
        Args: { bot_idx: number; student_id_param: string }
        Returns: {
          bot_index: number
          created_at: string | null
          id: string
          is_user: boolean
          message: string
          user_id: string
        }[]
      }
      get_student_bots: {
        Args: { student_id_param: string }
        Returns: {
          bot_index: number
        }[]
      }
      get_student_messages: {
        Args: { student_id_param: string }
        Returns: {
          bot_index: number
          created_at: string | null
          id: string
          is_user: boolean
          message: string
          user_id: string
        }[]
      }
      get_teacher_classes: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string | null
          id: string
          name: string
        }[]
      }
      get_total_message_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_user_class: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_display_name: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      save_chat_message: {
        Args: {
          bot_idx: number
          is_user_message: boolean
          message_text: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
