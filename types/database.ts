// ============================================================
// ENUM CONSTANTS — single source of truth for all status/type values.
// Reference these constants; never write the raw string literals inline.
// NOTE: pnpm gen:types overwrites this file. Re-add this block after regenerating.
// ============================================================

export const PLAN_TYPES = [
  "personal_monthly",
  "personal_annual",
  "team_monthly",
  "team_annual",
] as const;
export type PlanType = (typeof PLAN_TYPES)[number];

export const SUBSCRIPTION_STATUS = [
  "pending",
  "active",
  "past_due",
  "cancelled",
  "expired",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS)[number];

export const RESOURCE_STATUS = ["draft", "published", "archived"] as const;
export type ResourceStatus = (typeof RESOURCE_STATUS)[number];

export const REVIEW_STATUS = ["draft", "submitted", "approved", "rejected"] as const;
export type ReviewStatus = (typeof REVIEW_STATUS)[number];

export const USER_ROLE = ["user", "admin", "creator"] as const;
export type UserRole = (typeof USER_ROLE)[number];

export const CREATOR_PROFILE_STATUS = ["pending", "approved", "suspended"] as const;
export type CreatorProfileStatus = (typeof CREATOR_PROFILE_STATUS)[number];

export const ONBOARDING_ROLES = ["consumer", "creator"] as const;
export type OnboardingRole = (typeof ONBOARDING_ROLES)[number];

export const PAYMENT_REFERENCE_STATUS = ["pending", "success", "failed"] as const;
export type PaymentReferenceStatus = (typeof PAYMENT_REFERENCE_STATUS)[number];

// ============================================================
// SUPABASE GENERATED TYPES (below — do not edit by hand)
// ============================================================

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
    PostgrestVersion: "14.5"
  }
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
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon_name: string | null
          id: string
          is_active: boolean
          level: number
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean
          level?: number
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean
          level?: number
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      category_follows: {
        Row: {
          category_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_follows_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_follows_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_profiles: {
        Row: {
          avatar_path: string | null
          banner_path: string | null
          bio: string | null
          created_at: string
          display_name: string
          handle: string
          location: string | null
          socials: Json
          status: string
          user_id: string
          website: string | null
        }
        Insert: {
          avatar_path?: string | null
          banner_path?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          handle: string
          location?: string | null
          socials?: Json
          status?: string
          user_id: string
          website?: string | null
        }
        Update: {
          avatar_path?: string | null
          banner_path?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          handle?: string
          location?: string | null
          socials?: Json
          status?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      creators: {
        Row: {
          avatar_path: string | null
          bio: string | null
          created_at: string
          id: string
          is_public: boolean
          is_verified: boolean
          name: string
          profile_id: string | null
          slug: string
          updated_at: string
          user_id: string | null
          website_url: string | null
        }
        Insert: {
          avatar_path?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          is_verified?: boolean
          name: string
          profile_id?: string | null
          slug: string
          updated_at?: string
          user_id?: string | null
          website_url?: string | null
        }
        Update: {
          avatar_path?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          is_verified?: boolean
          name?: string
          profile_id?: string | null
          slug?: string
          updated_at?: string
          user_id?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creators_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      downloads: {
        Row: {
          creator_id: string
          downloaded_at: string
          id: string
          plan_type: string | null
          resource_id: string
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          creator_id: string
          downloaded_at?: string
          id?: string
          plan_type?: string | null
          resource_id: string
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          creator_id?: string
          downloaded_at?: string
          id?: string
          plan_type?: string | null
          resource_id?: string
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "downloads_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "downloads_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "downloads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favourites: {
        Row: {
          created_at: string
          id: string
          resource_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          resource_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          resource_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favourites_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favourites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          email_new_resources: boolean
          email_new_resources_freq: string
          email_payment_failed: boolean
          email_renewal_reminders: boolean
          email_subscription_events: boolean
          email_team_events: boolean
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          email_new_resources?: boolean
          email_new_resources_freq?: string
          email_payment_failed?: boolean
          email_renewal_reminders?: boolean
          email_subscription_events?: boolean
          email_team_events?: boolean
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          email_new_resources?: boolean
          email_new_resources_freq?: string
          email_payment_failed?: boolean
          email_renewal_reminders?: boolean
          email_subscription_events?: boolean
          email_team_events?: boolean
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string
          created_at: string
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body: string
          created_at?: string
          id?: string
          is_read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          onboarded: boolean
          role: string
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          onboarded?: boolean
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          onboarded?: boolean
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          category_id: string
          compatible_software: string[]
          created_at: string
          creator_id: string
          description: string | null
          download_count: number
          file_name: string
          file_path: string
          file_size_bytes: number
          file_type: string
          fts: unknown
          id: string
          is_featured: boolean
          preview_image_path: string
          preview_images: string[]
          rejection_reason: string | null
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          slug: string
          status: string
          submitted_at: string | null
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          category_id: string
          compatible_software?: string[]
          created_at?: string
          creator_id: string
          description?: string | null
          download_count?: number
          file_name: string
          file_path: string
          file_size_bytes: number
          file_type: string
          fts?: unknown
          id?: string
          is_featured?: boolean
          preview_image_path: string
          preview_images?: string[]
          rejection_reason?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug: string
          status?: string
          submitted_at?: string | null
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          compatible_software?: string[]
          created_at?: string
          creator_id?: string
          description?: string | null
          download_count?: number
          file_name?: string
          file_path?: string
          file_size_bytes?: number
          file_type?: string
          fts?: unknown
          id?: string
          is_featured?: boolean
          preview_image_path?: string
          preview_images?: string[]
          rejection_reason?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug?: string
          status?: string
          submitted_at?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          id: string
          payload: Json | null
          paystack_event: string
          paystack_ref: string | null
          processed_at: string
          subscription_id: string | null
        }
        Insert: {
          id?: string
          payload?: Json | null
          paystack_event: string
          paystack_ref?: string | null
          processed_at?: string
          subscription_id?: string | null
        }
        Update: {
          id?: string
          payload?: Json | null
          paystack_event?: string
          paystack_ref?: string | null
          processed_at?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount_kobo: number
          cancelled_at: string | null
          created_at: string
          currency: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          max_seats: number
          owner_id: string
          paystack_customer_id: string | null
          paystack_plan_code: string | null
          paystack_sub_code: string | null
          plan_type: string
          status: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          amount_kobo: number
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          max_seats?: number
          owner_id: string
          paystack_customer_id?: string | null
          paystack_plan_code?: string | null
          paystack_sub_code?: string | null
          plan_type: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          amount_kobo?: number
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          max_seats?: number
          owner_id?: string
          paystack_customer_id?: string | null
          paystack_plan_code?: string | null
          paystack_sub_code?: string | null
          plan_type?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          accepted_at: string | null
          id: string
          invite_accepted: boolean
          invite_token: string | null
          invited_at: string
          invited_email: string | null
          profile_id: string
          role: string
          subscription_id: string
        }
        Insert: {
          accepted_at?: string | null
          id?: string
          invite_accepted?: boolean
          invite_token?: string | null
          invited_at?: string
          invited_email?: string | null
          profile_id: string
          role?: string
          subscription_id: string
        }
        Update: {
          accepted_at?: string | null
          id?: string
          invite_accepted?: boolean
          invite_token?: string | null
          invited_at?: string
          invited_email?: string | null
          profile_id?: string
          role?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_download_count: {
        Args: { p_resource_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_creator: { Args: never; Returns: boolean }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

// ============================================================
// NAMED TYPE ALIASES
// ============================================================

type DBRow<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Profile = DBRow<"profiles">;
export type Category = DBRow<"categories">;
export type Resource = DBRow<"resources">;
export type Subscription = DBRow<"subscriptions">;
export type SubscriptionEvent = DBRow<"subscription_events">;
export type TeamMember = DBRow<"team_members">;
export type Download = DBRow<"downloads">;
export type Favourite = DBRow<"favourites">;
export type Notification = DBRow<"notifications">;
export type NotificationPreference = DBRow<"notification_preferences">;
export type CategoryFollow = DBRow<"category_follows">;
export type Creator = DBRow<"creators">;
export type CreatorProfile = DBRow<"creator_profiles">;

// ============================================================
// PHASE 2 HAND-WRITTEN TYPES
// These tables were added in migration 20260624000000_payments.sql.
// Run `pnpm gen:types` after pushing that migration to replace with generated types.
// ============================================================

export type Plan = {
  id: string;       // 'solo_monthly' | 'solo_annual' | 'team_monthly' | 'team_annual'
  kobo: number;     // integer kobo — never float
  interval: "monthly" | "annual";
  seats: number;
  label: string;
  active: boolean;
};

export type PaymentReference = {
  reference: string;   // Paystack reference; primary key
  user_id: string;
  plan_id: string;
  kobo: number;        // integer kobo; verified vs plan.kobo in webhook
  status: PaymentReferenceStatus;
  created_at: string;
  settled_at: string | null;
};

export type Team = {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
};

export type TeamInvite = {
  id: string;
  team_id: string;
  email: string;
  token: string;
  invited_by: string;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
};
