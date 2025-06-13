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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
      authors: {
        Row: {
          post: string
          profile: string
        }
        Insert: {
          post: string
          profile: string
        }
        Update: {
          post?: string
          profile?: string
        }
        Relationships: [
          {
            foreignKeyName: "authored_post_fkey"
            columns: ["post"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authored_user_fkey"
            columns: ["profile"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      features: {
        Row: {
          featuree: string
          featurer: string
        }
        Insert: {
          featuree: string
          featurer: string
        }
        Update: {
          featuree?: string
          featurer?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_featuree_fkey"
            columns: ["featuree"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "featured_featurer_fkey"
            columns: ["featurer"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          followee: string
          follower: string
        }
        Insert: {
          followee: string
          follower: string
        }
        Update: {
          followee?: string
          follower?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_followee_fkey"
            columns: ["followee"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_fkey"
            columns: ["follower"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          post: string
          profile: string
        }
        Insert: {
          post: string
          profile: string
        }
        Update: {
          post?: string
          profile?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_fkey"
            columns: ["post"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_profile_fkey"
            columns: ["profile"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pendingAuthors: {
        Row: {
          from_profile: string
          post: string
          to_profile: string
        }
        Insert: {
          from_profile: string
          post: string
          to_profile: string
        }
        Update: {
          from_profile?: string
          post?: string
          to_profile?: string
        }
        Relationships: [
          {
            foreignKeyName: "pendingAuthors_from_fkey"
            columns: ["from_profile"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pendingAuthors_post_fkey"
            columns: ["post"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pendingAuthors_to_fkey"
            columns: ["to_profile"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          body: string | null
          created_at: string
          id: string
          parent_post: string | null
          rt_of: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          parent_post?: string | null
          rt_of?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          parent_post?: string | null
          rt_of?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_parent_post_fkey"
            columns: ["parent_post"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_rt_of_fkey"
            columns: ["rt_of"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      postsCategories: {
        Row: {
          category: string
          post: string
        }
        Insert: {
          category?: string
          post?: string
        }
        Update: {
          category?: string
          post?: string
        }
        Relationships: [
          {
            foreignKeyName: "postsCategory_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "postsCategory_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "estimated_categories_usage"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "postsCategory_post_fkey"
            columns: ["post"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          banner: string | null
          bio: string | null
          created_at: string
          handle: string
          id: string
          pinned_posts: string[] | null
          profile_pic: string | null
        }
        Insert: {
          banner?: string | null
          bio?: string | null
          created_at?: string
          handle: string
          id: string
          pinned_posts?: string[] | null
          profile_pic?: string | null
        }
        Update: {
          banner?: string | null
          bio?: string | null
          created_at?: string
          handle?: string
          id?: string
          pinned_posts?: string[] | null
          profile_pic?: string | null
        }
        Relationships: []
      }
      profilesCategories: {
        Row: {
          category: string
          profile: string
        }
        Insert: {
          category: string
          profile: string
        }
        Update: {
          category?: string
          profile?: string
        }
        Relationships: [
          {
            foreignKeyName: "profilesCategory_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profilesCategory_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "estimated_categories_usage"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profilesCategory_profile_fkey"
            columns: ["profile"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      estimated_categories_usage: {
        Row: {
          estimated_total: number | null
          id: string | null
          name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_co_authoring: {
        Args: { post_id: string }
        Returns: boolean
      }
      extreme_danger_truncate_all_tables_yes_i_am_sure: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_posts_feed: {
        Args: {
          has_text?: string[]
          has_authors?: string[]
          has_categories?: string[]
          liked_by?: string[]
          from_date?: string
          to_date?: string
          sort_by?: string
          sort_order?: string
          paging_limit?: number
          paging_offset?: number
        }
        Returns: {
          body: string | null
          created_at: string
          id: string
          parent_post: string | null
          rt_of: string | null
        }[]
      }
      get_profiles_feed: {
        Args: {
          has_handle?: string[]
          has_bio?: string[]
          has_categories?: string[]
          featured_by?: string[]
          features_user?: string[]
          author_of?: string[]
          likes_posts?: string[]
          from_date?: string
          to_date?: string
          sort_by?: string
          sort_order?: string
          paging_limit?: number
          paging_offset?: number
        }
        Returns: {
          banner: string | null
          bio: string | null
          created_at: string
          handle: string
          id: string
          pinned_posts: string[] | null
          profile_pic: string | null
        }[]
      }
      id_of_ensured_category: {
        Args: { request: string }
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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

