export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string
          email: string
          stripe_customer_id: string | null
          plan: 'free' | 'plus'
          created_at: string
        }
        Insert: {
          user_id: string
          email: string
          stripe_customer_id?: string | null
          plan?: 'free' | 'plus'
          created_at?: string
        }
        Update: {
          user_id?: string
          email?: string
          stripe_customer_id?: string | null
          plan?: 'free' | 'plus'
          created_at?: string
        }
      }
      child_profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          age: number | null
          favorites: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          age?: number | null
          favorites?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          age?: number | null
          favorites?: Record<string, unknown>
          created_at?: string
        }
      }
      stories: {
        Row: {
          id: string
          user_id: string
          child_id: string | null
          title: string | null
          mode: string | null
          content: string | null
          metadata: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          child_id?: string | null
          title?: string | null
          mode?: string | null
          content?: string | null
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          child_id?: string | null
          title?: string | null
          mode?: string | null
          content?: string | null
          metadata?: Record<string, unknown>
          created_at?: string
        }
      }
      chat_sessions: {
        Row: {
          id: string
          user_id: string
          child_id: string | null
          mode: string | null
          messages: unknown[]
          token_usage: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          child_id?: string | null
          mode?: string | null
          messages?: unknown[]
          token_usage?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          child_id?: string | null
          mode?: string | null
          messages?: unknown[]
          token_usage?: number
          created_at?: string
        }
      }
      usage_counters: {
        Row: {
          id: string
          user_id: string
          date: string
          chat_count: number
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          chat_count?: number
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          chat_count?: number
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          plan: 'free' | 'plus'
          status: string
          current_period_end: string | null
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan?: 'free' | 'plus'
          status?: string
          current_period_end?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan?: 'free' | 'plus'
          status?: string
          current_period_end?: string | null
        }
      }
      settings: {
        Row: {
          user_id: string
          free_daily_chats_override: number | null
          plus_daily_chats_override: number | null
          bedtime_voice: string | null
          language: string
        }
        Insert: {
          user_id: string
          free_daily_chats_override?: number | null
          plus_daily_chats_override?: number | null
          bedtime_voice?: string | null
          language?: string
        }
        Update: {
          user_id?: string
          free_daily_chats_override?: number | null
          plus_daily_chats_override?: number | null
          bedtime_voice?: string | null
          language?: string
        }
      }
    }
  }
}

export type Plan = 'free' | 'plus'
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ChildProfile = Database['public']['Tables']['child_profiles']['Row']
export type Story = Database['public']['Tables']['stories']['Row']
export type ChatSession = Database['public']['Tables']['chat_sessions']['Row']
export type UsageCounter = Database['public']['Tables']['usage_counters']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type Settings = Database['public']['Tables']['settings']['Row']
