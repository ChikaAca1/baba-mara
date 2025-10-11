# Supabase Database Setup

This directory contains database migrations and configuration for the Baba Mara project.

## Database Schema

The database consists of five main tables:

### 1. **users** (extends auth.users)
- User profiles with credit management
- Guest and admin user support
- Subscription tracking
- Locale preferences (en, tr, sr)

### 2. **subscriptions**
- Monthly subscription management ($9.99/month)
- 12 credits per month
- Automatic credit reset functionality
- Payten payment integration

### 3. **readings**
- Coffee cup and tarot readings
- AI-generated responses (text + audio)
- LiveKit voice session metadata
- User question history

### 4. **transactions**
- Payment tracking (single reading, top-up, subscription)
- Payten integration fields
- Credit purchase records
- Status tracking (pending, completed, failed, refunded)

### 5. **error_logs**
- Application error monitoring
- Severity levels (low, medium, high, critical)
- Admin resolution tracking

## Setup Instructions

### Option 1: Using Supabase Dashboard (Recommended for Production)

1. **Create a new Supabase project** at https://supabase.com/dashboard

2. **Navigate to SQL Editor** in your Supabase dashboard

3. **Run the migration**:
   - Copy the contents of `migrations/20250109_initial_schema.sql`
   - Paste into the SQL Editor
   - Execute the query

4. **Verify setup**:
   - Check Tables section to see all 5 tables
   - Verify RLS policies are enabled
   - Check Functions section for helper functions

### Option 2: Using Supabase CLI (Recommended for Development)

1. **Install Supabase CLI**:
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link to your project**:
   ```bash
   supabase link --project-ref <your-project-ref>
   ```

4. **Push migration**:
   ```bash
   supabase db push
   ```

5. **Generate TypeScript types** (optional, already created):
   ```bash
   supabase gen types typescript --local > lib/supabase/types.ts
   ```

## Environment Variables

Add these to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

You can find these values in your Supabase project settings under **Settings > API**.

## Database Functions

### `deduct_user_credits(p_user_id, p_credits)`
Deducts credits from a user's account. Returns `false` if insufficient credits.

```sql
SELECT deduct_user_credits('user-uuid', 1);
```

### `add_user_credits(p_user_id, p_credits)`
Adds credits to a user's account and updates total credits purchased.

```sql
SELECT add_user_credits('user-uuid', 10);
```

### `reset_subscription_credits()`
Resets monthly credits for all active subscriptions. Should be run as a scheduled job.

```sql
SELECT reset_subscription_credits();
```

## Row Level Security (RLS)

All tables have RLS enabled with the following policies:

- **Users**: Can view/update own profile; admins can view/update all
- **Subscriptions**: Users can view own; system can insert; admins can view all
- **Readings**: Users can view/insert own; admins can view all
- **Transactions**: Users can view own; system can insert; admins can view all
- **Error Logs**: Only admins can view; system can insert

## Scheduled Jobs (TODO)

Set up these cron jobs in Supabase:

1. **Monthly Credit Reset** (runs at midnight on 1st of each month):
   ```sql
   SELECT reset_subscription_credits();
   ```

2. **Expire Old Subscriptions** (runs daily):
   ```sql
   UPDATE subscriptions
   SET status = 'expired'
   WHERE status = 'active'
   AND current_period_end < NOW();
   ```

To set up cron jobs:
1. Go to **Database > Extensions**
2. Enable `pg_cron` extension
3. Go to **SQL Editor** and create cron jobs using `cron.schedule()`

## Initial Admin Setup

To make a user an admin:

```sql
UPDATE public.users
SET is_admin = true
WHERE email = 'your-email@example.com';
```

## Testing the Schema

After setup, you can test with sample data:

```sql
-- Create a test user (manual insert after auth signup)
INSERT INTO public.users (id, email, locale, available_credits)
VALUES ('test-uuid', 'test@example.com', 'sr', 5);

-- Create a test reading
INSERT INTO public.readings (user_id, reading_type, question, locale, status)
VALUES ('test-uuid', 'coffee', 'What does my future hold?', 'sr', 'completed');

-- View user's readings
SELECT * FROM public.readings WHERE user_id = 'test-uuid';
```

## Troubleshooting

**Migration fails**:
- Ensure UUID extension is enabled
- Check for syntax errors in SQL
- Verify you have admin permissions

**RLS blocks queries**:
- Ensure user is authenticated (`auth.uid()` returns value)
- Check RLS policies match your use case
- Test with service role key for debugging (disable RLS temporarily)

**Functions not working**:
- Verify functions are created in `public` schema
- Check function permissions
- Review error logs in Supabase dashboard

## Next Steps

After database setup:
1. Implement authentication (email/password + Google OAuth)
2. Create auth middleware and protected routes
3. Build user dashboard with credit display
4. Implement payment integration with Payten
5. Set up LiveKit for voice calls
