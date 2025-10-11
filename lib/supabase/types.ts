// Supabase Database Types
// Auto-generated types based on database schema

export type Locale = 'en' | 'tr' | 'sr';

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'paused';

export type ReadingType = 'coffee' | 'tarot';

export type ReadingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type TransactionType = 'single_reading' | 'top_up' | 'subscription';

export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// ============================================================================
// TABLE TYPES
// ============================================================================

export interface User {
  id: string; // UUID
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  locale: Locale;

  // Credit system
  available_credits: number;
  total_credits_purchased: number;

  // User type
  is_guest: boolean;
  is_admin: boolean;

  // Subscription info
  subscription_id: string | null;
  subscription_status: SubscriptionStatus | null;
  subscription_renews_at: string | null; // ISO timestamp

  // Metadata
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  last_reading_at: string | null; // ISO timestamp
}

export interface Subscription {
  id: string; // UUID
  user_id: string; // UUID

  // Subscription details
  plan_type: 'monthly';
  price_paid: number;
  currency: string;

  // Billing cycle
  started_at: string; // ISO timestamp
  current_period_start: string; // ISO timestamp
  current_period_end: string; // ISO timestamp
  cancelled_at: string | null; // ISO timestamp

  // Status
  status: SubscriptionStatus;

  // Credits
  credits_per_month: number;
  credits_remaining: number;
  last_credit_reset: string; // ISO timestamp

  // Payment integration
  payten_subscription_id: string | null;

  // Metadata
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface Reading {
  id: string; // UUID
  user_id: string; // UUID

  // Reading details
  reading_type: ReadingType;
  question: string;
  locale: Locale;

  // AI Response
  response_text: string | null;
  response_audio_url: string | null;

  // Voice call metadata (LiveKit)
  livekit_room_name: string | null;
  livekit_session_duration: number | null; // in seconds

  // Cost tracking
  credits_used: number;
  was_free_trial: boolean;

  // Status
  status: ReadingStatus;
  error_message: string | null;

  // Timestamps
  created_at: string; // ISO timestamp
  completed_at: string | null; // ISO timestamp

  // Metadata
  ip_address: string | null;
  user_agent: string | null;
}

export interface Transaction {
  id: string; // UUID
  user_id: string; // UUID

  // Transaction type
  transaction_type: TransactionType;

  // Payment details
  amount: number;
  currency: string;
  credits_purchased: number;

  // Payten integration
  payten_transaction_id: string | null;
  payten_order_id: string | null;
  payten_status: string | null;

  // Status
  status: TransactionStatus;

  // Related entities
  subscription_id: string | null; // UUID
  reading_id: string | null; // UUID

  // Metadata
  payment_method: string | null;
  error_message: string | null;

  // Timestamps
  created_at: string; // ISO timestamp
  completed_at: string | null; // ISO timestamp

  // Audit
  ip_address: string | null;
  user_agent: string | null;
}

export interface ErrorLog {
  id: string; // UUID
  user_id: string | null; // UUID

  // Error details
  error_type: string;
  error_message: string;
  error_stack: string | null;

  // Context
  endpoint: string | null;
  request_body: Record<string, unknown> | null; // JSONB

  // Severity
  severity: ErrorSeverity;

  // Status
  resolved: boolean;
  resolved_at: string | null; // ISO timestamp
  resolved_by: string | null; // UUID

  // Metadata
  created_at: string; // ISO timestamp
  ip_address: string | null;
  user_agent: string | null;
}

// ============================================================================
// INSERT TYPES (for creating new records)
// ============================================================================

export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at'>;

export type SubscriptionInsert = Omit<Subscription, 'id' | 'created_at' | 'updated_at'>;

export type ReadingInsert = Omit<Reading, 'id' | 'created_at'>;

export type TransactionInsert = Omit<Transaction, 'id' | 'created_at'>;

export type ErrorLogInsert = Omit<ErrorLog, 'id' | 'created_at'>;

// ============================================================================
// UPDATE TYPES (for updating records - all fields optional)
// ============================================================================

export type UserUpdate = Partial<Omit<User, 'id' | 'created_at'>>;

export type SubscriptionUpdate = Partial<Omit<Subscription, 'id' | 'created_at'>>;

export type ReadingUpdate = Partial<Omit<Reading, 'id' | 'created_at'>>;

export type TransactionUpdate = Partial<Omit<Transaction, 'id' | 'created_at'>>;

export type ErrorLogUpdate = Partial<Omit<ErrorLog, 'id' | 'created_at'>>;

// ============================================================================
// DATABASE TYPE (for Supabase client)
// ============================================================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      subscriptions: {
        Row: Subscription;
        Insert: SubscriptionInsert;
        Update: SubscriptionUpdate;
      };
      readings: {
        Row: Reading;
        Insert: ReadingInsert;
        Update: ReadingUpdate;
      };
      transactions: {
        Row: Transaction;
        Insert: TransactionInsert;
        Update: TransactionUpdate;
      };
      error_logs: {
        Row: ErrorLog;
        Insert: ErrorLogInsert;
        Update: ErrorLogUpdate;
      };
    };
    Functions: {
      deduct_user_credits: {
        Args: { p_user_id: string; p_credits?: number };
        Returns: boolean;
      };
      add_user_credits: {
        Args: { p_user_id: string; p_credits: number };
        Returns: void;
      };
      reset_subscription_credits: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
  };
}
