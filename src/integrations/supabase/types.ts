export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      daily_logs: {
        Row: {
          created_at: string;
          id: string;
          log_date: string;
          logged_at: string;
          payload: Json;
          type: Database["public"]["Enums"]["log_type"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          log_date?: string;
          logged_at?: string;
          payload?: Json;
          type: Database["public"]["Enums"]["log_type"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          log_date?: string;
          logged_at?: string;
          payload?: Json;
          type?: Database["public"]["Enums"]["log_type"];
          user_id?: string;
        };
        Relationships: [];
      };
      device_sync: {
        Row: {
          id: string;
          metric: string;
          source: string;
          synced_at: string;
          user_id: string;
          value: Json;
        };
        Insert: {
          id?: string;
          metric: string;
          source: string;
          synced_at?: string;
          user_id: string;
          value?: Json;
        };
        Update: {
          id?: string;
          metric?: string;
          source?: string;
          synced_at?: string;
          user_id?: string;
          value?: Json;
        };
        Relationships: [];
      };
      friends: {
        Row: {
          created_at: string;
          friend_id: string;
          id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          friend_id: string;
          id?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          friend_id?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          active_modules: Json;
          avatar_id: number;
          biometrics: Json;
          coach_persona: string;
          created_at: string;
          display_name: string | null;
          friend_code: string | null;
          id: string;
          language: string;
          privacy: Json;
          updated_at: string;
        };
        Insert: {
          active_modules?: Json;
          avatar_id?: number;
          biometrics?: Json;
          coach_persona?: string;
          created_at?: string;
          display_name?: string | null;
          friend_code?: string | null;
          id: string;
          language?: string;
          privacy?: Json;
          updated_at?: string;
        };
        Update: {
          active_modules?: Json;
          avatar_id?: number;
          biometrics?: Json;
          coach_persona?: string;
          created_at?: string;
          display_name?: string | null;
          friend_code?: string | null;
          id?: string;
          language?: string;
          privacy?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_stats: {
        Row: {
          created_at: string;
          current_streak: number;
          last_activity_date: string | null;
          level: number;
          longest_streak: number;
          unlocked_badges: Json;
          updated_at: string;
          user_id: string;
          xp: number;
        };
        Insert: {
          created_at?: string;
          current_streak?: number;
          last_activity_date?: string | null;
          level?: number;
          longest_streak?: number;
          unlocked_badges?: Json;
          updated_at?: string;
          user_id: string;
          xp?: number;
        };
        Update: {
          created_at?: string;
          current_streak?: number;
          last_activity_date?: string | null;
          level?: number;
          longest_streak?: number;
          unlocked_badges?: Json;
          updated_at?: string;
          user_id?: string;
          xp?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      find_profile_by_code: {
        Args: { _code: string };
        Returns: {
          avatar_id: number;
          display_name: string;
          friend_code: string;
          id: string;
        }[];
      };
      friend_weekly_summary: {
        Args: { _user_ids: string[] };
        Returns: {
          avatar_id: number;
          cardio_min_week: number;
          current_streak: number;
          display_name: string;
          hide_cardio: boolean;
          hide_streak: boolean;
          user_id: string;
          xp_week: number;
        }[];
      };
      gen_friend_code: { Args: never; Returns: string };
    };
    Enums: {
      log_type: "weight" | "water" | "food" | "cardio" | "sleep" | "stress" | "study" | "note";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      log_type: ["weight", "water", "food", "cardio", "sleep", "stress", "study", "note"],
    },
  },
} as const;
