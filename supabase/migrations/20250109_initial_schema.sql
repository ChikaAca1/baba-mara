-- Baba Mara Database Schema
-- Initial migration: Users, Readings, Transactions, Subscriptions

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  locale TEXT DEFAULT 'sr' CHECK (locale IN ('en', 'tr', 'sr')),

  -- Credit system
  available_credits INTEGER DEFAULT 0 CHECK (available_credits >= 0),
  total_credits_purchased INTEGER DEFAULT 0,

  -- User type
  is_guest BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,

  -- Subscription info
  subscription_id UUID,
  subscription_status TEXT CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'paused')),
  subscription_renews_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_reading_at TIMESTAMPTZ
);

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Subscription details
  plan_type TEXT NOT NULL DEFAULT 'monthly' CHECK (plan_type IN ('monthly')),
  price_paid DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',

  -- Billing cycle
  started_at TIMESTAMPTZ DEFAULT NOW(),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),

  -- Credits
  credits_per_month INTEGER DEFAULT 12,
  credits_remaining INTEGER DEFAULT 12,
  last_credit_reset TIMESTAMPTZ DEFAULT NOW(),

  -- Payment integration
  payten_subscription_id TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- READINGS TABLE
-- ============================================================================
CREATE TABLE public.readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Reading details
  reading_type TEXT NOT NULL CHECK (reading_type IN ('coffee', 'tarot')),
  question TEXT NOT NULL,
  locale TEXT NOT NULL CHECK (locale IN ('en', 'tr', 'sr')),

  -- AI Response
  response_text TEXT,
  response_audio_url TEXT,

  -- Voice call metadata (LiveKit)
  livekit_room_name TEXT,
  livekit_session_duration INTEGER, -- in seconds

  -- Cost tracking
  credits_used INTEGER DEFAULT 1,
  was_free_trial BOOLEAN DEFAULT false,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Metadata
  ip_address TEXT,
  user_agent TEXT
);

-- ============================================================================
-- TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Transaction type
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('single_reading', 'top_up', 'subscription')),

  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  credits_purchased INTEGER NOT NULL,

  -- Payten integration
  payten_transaction_id TEXT UNIQUE,
  payten_order_id TEXT,
  payten_status TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),

  -- Related entities
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  reading_id UUID REFERENCES public.readings(id) ON DELETE SET NULL,

  -- Metadata
  payment_method TEXT,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Audit
  ip_address TEXT,
  user_agent TEXT
);

-- ============================================================================
-- ERROR_LOGS TABLE (for admin monitoring)
-- ============================================================================
CREATE TABLE public.error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- Error details
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,

  -- Context
  endpoint TEXT,
  request_body JSONB,

  -- Severity
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),

  -- Status
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_subscription_id ON public.users(subscription_id);
CREATE INDEX idx_users_is_admin ON public.users(is_admin);

-- Subscriptions
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_current_period_end ON public.subscriptions(current_period_end);

-- Readings
CREATE INDEX idx_readings_user_id ON public.readings(user_id);
CREATE INDEX idx_readings_status ON public.readings(status);
CREATE INDEX idx_readings_created_at ON public.readings(created_at DESC);

-- Transactions
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_payten_transaction_id ON public.transactions(payten_transaction_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);

-- Error Logs
CREATE INDEX idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX idx_error_logs_resolved ON public.error_logs(resolved);
CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- USERS policies
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update all users"
  ON public.users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- SUBSCRIPTIONS policies
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "System can insert subscriptions"
  ON public.subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- READINGS policies
CREATE POLICY "Users can view own readings"
  ON public.readings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own readings"
  ON public.readings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all readings"
  ON public.readings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- TRANSACTIONS policies
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all transactions"
  ON public.transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "System can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ERROR_LOGS policies
CREATE POLICY "Only admins can view error logs"
  ON public.error_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "System can insert error logs"
  ON public.error_logs FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to reset monthly subscription credits
CREATE OR REPLACE FUNCTION reset_subscription_credits()
RETURNS void AS $$
BEGIN
  UPDATE public.subscriptions
  SET
    credits_remaining = credits_per_month,
    last_credit_reset = NOW(),
    current_period_start = current_period_end,
    current_period_end = current_period_end + INTERVAL '1 month'
  WHERE
    status = 'active'
    AND current_period_end <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to deduct credits from user
CREATE OR REPLACE FUNCTION deduct_user_credits(
  p_user_id UUID,
  p_credits INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_available_credits INTEGER;
BEGIN
  -- Get current credits
  SELECT available_credits INTO v_available_credits
  FROM public.users
  WHERE id = p_user_id;

  -- Check if user has enough credits
  IF v_available_credits < p_credits THEN
    RETURN FALSE;
  END IF;

  -- Deduct credits
  UPDATE public.users
  SET
    available_credits = available_credits - p_credits,
    last_reading_at = NOW()
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to add credits to user
CREATE OR REPLACE FUNCTION add_user_credits(
  p_user_id UUID,
  p_credits INTEGER
)
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET
    available_credits = available_credits + p_credits,
    total_credits_purchased = total_credits_purchased + p_credits
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- This will be populated when first user signs up
-- Admin users should be manually promoted via Supabase dashboard or SQL
