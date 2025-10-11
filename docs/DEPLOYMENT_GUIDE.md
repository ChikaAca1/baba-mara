# Vercel Deployment Guide - Baba Mara

Complete step-by-step guide for deploying Baba Mara platform to Vercel production.

## Pre-Deployment Status

✅ **Build Status:** PASSING
✅ **Tests:** 4/4 passing
✅ **TypeScript:** No errors
✅ **ESLint:** All checks passing
✅ **Performance:** Optimized (106 KB average)

## Prerequisites

1. **GitHub Account** - Kod mora biti u GitHub repository
2. **Vercel Account** - Besplatan account na vercel.com
3. **Supabase Production Instance** - Production database
4. **Domain Names** (opciono):
   - `babamara.com` (main)
   - `mysticcup.baba-mara.com` (English)
   - `fal.baba-mara.com` (Turkish)

## Step 1: Push Code to GitHub

```bash
# Proveri status
git status

# Add all files
git add .

# Commit
git commit -m "Production ready - Phase 8 complete"

# Push to main
git push origin main
```

## Step 2: Create Vercel Account

1. Idi na https://vercel.com
2. Klikni "Sign Up"
3. Odaberi "Continue with GitHub"
4. Autorizuj Vercel pristup GitHub-u

## Step 3: Import GitHub Repository

1. Na Vercel Dashboard, klikni "Add New Project"
2. Odaberi "Import Git Repository"
3. Nađi `baba-mara.com` repository
4. Klikni "Import"

## Step 4: Configure Project Settings

### Framework Preset
- **Framework:** Next.js
- **Auto-detect:** ✅ (Vercel će automatski detektovati)

### Root Directory
- Leave as: `/` (root)

### Build & Output Settings
```
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Development Command: npm run dev
```

## Step 5: Environment Variables

**CRITICAL:** Dodaj sve env variables pre deploya!

### Required Variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App URL
NEXT_PUBLIC_APP_URL=https://babamara.com

# LiveKit (ako imaš production LiveKit)
LIVEKIT_API_KEY=your-livekit-key
LIVEKIT_API_SECRET=your-livekit-secret
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-server

# Payten
PAYTEN_MERCHANT_ID=your-merchant-id
PAYTEN_API_KEY=your-payten-key
PAYTEN_SECRET_KEY=your-payten-secret

# OpenAI (or other AI provider)
OPENAI_API_KEY=your-openai-key
# ili
ANTHROPIC_API_KEY=your-anthropic-key
```

### How to Add:

1. U Vercel project settings
2. Go to "Environment Variables"
3. Dodaj svaki key-value par
4. Odaberi okruženje: Production, Preview, Development
5. Klikni "Add"

## Step 6: Deploy!

1. Klikni "Deploy"
2. Čekaj 2-5 minuta
3. Vercel će:
   - Install dependencies
   - Run build
   - Deploy
   - Assign temporary URL

## Step 7: Verify Deployment

1. Otvori assigned URL (npr. `baba-mara.vercel.app`)
2. Proveri:
   - ✅ Homepage se učitava
   - ✅ Auth pages rade
   - ✅ Dashboard funkcioniše
   - ✅ Admin panel zahteva autentifikaciju
   - ✅ Nema console errors

## Step 8: Configure Custom Domains (Optional)

### Main Domain (babamara.com)

1. U Vercel project settings → Domains
2. Klikni "Add Domain"
3. Unesi: `babamara.com`
4. Vercel će dati DNS records koje treba dodati:

```
A Record: @ → 76.76.21.21
CNAME: www → cname.vercel-dns.com
```

5. Idi u domain registrar (GoDaddy, Namecheap, itd.)
6. Dodaj DNS records
7. Čekaj propagaciju (5min - 24h)

### English Subdomain (mysticcup.baba-mara.com)

1. Add Domain: `mysticcup.baba-mara.com`
2. DNS Record:
```
CNAME: mysticcup → cname.vercel-dns.com
```

### Turkish Subdomain (fal.baba-mara.com)

1. Add Domain: `fal.baba-mara.com`
2. DNS Record:
```
CNAME: fal → cname.vercel-dns.com
```

## Step 9: Configure Redirects

Kreiraj `vercel.json` u root:

```json
{
  "redirects": [
    {
      "source": "/",
      "has": [
        {
          "type": "host",
          "value": "mysticcup.baba-mara.com"
        }
      ],
      "destination": "/en",
      "permanent": true
    },
    {
      "source": "/",
      "has": [
        {
          "type": "host",
          "value": "fal.baba-mara.com"
        }
      ],
      "destination": "/tr",
      "permanent": true
    },
    {
      "source": "/",
      "destination": "/sr",
      "permanent": false
    }
  ]
}
```

## Step 10: Set Up Monitoring

### Vercel Analytics (Free)

1. Project Settings → Analytics
2. Enable "Vercel Analytics"
3. Automatically tracks:
   - Page views
   - Core Web Vitals
   - Top pages
   - Audience insights

### Error Tracking (Optional - Sentry)

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Follow wizard to configure.

## Step 11: Production Database Setup

### Supabase Production

1. Create new Supabase project (Production)
2. Run migrations:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  full_name TEXT,
  is_admin BOOLEAN DEFAULT false,
  is_guest BOOLEAN DEFAULT false,
  credits INTEGER DEFAULT 0,
  subscription_status TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  amount DECIMAL,
  credits_purchased INTEGER,
  transaction_type TEXT,
  status TEXT,
  payment_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Readings table
CREATE TABLE readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  reading_type TEXT,
  question TEXT,
  ai_response TEXT,
  status TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Error logs table
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  error_type TEXT,
  error_message TEXT,
  severity TEXT,
  endpoint TEXT,
  stack_trace TEXT,
  component_stack TEXT,
  user_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_readings_user_id ON readings(user_id);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at);

-- RPC Functions
CREATE OR REPLACE FUNCTION add_user_credits(p_user_id UUID, p_credits INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE users SET credits = credits + p_credits WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION deduct_user_credits(p_user_id UUID, p_credits INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE users SET credits = credits - p_credits WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;
```

3. Configure Row Level Security (RLS)
4. Update environment variables sa production credentials

## Step 12: Create First Admin User

```sql
-- U Supabase SQL Editor
UPDATE users
SET is_admin = true
WHERE email = 'your-admin-email@example.com';
```

## Step 13: Test Production

### Critical Flows to Test:

1. **Authentication**
   - ✅ Sign up new user
   - ✅ Sign in existing user
   - ✅ Google OAuth
   - ✅ Guest mode

2. **Payments**
   - ✅ Select package
   - ✅ Payment flow
   - ✅ Credits added after payment

3. **Readings**
   - ✅ Create reading
   - ✅ AI response generated
   - ✅ Reading saved to history

4. **Admin Panel**
   - ✅ Admin login
   - ✅ View users
   - ✅ View transactions
   - ✅ View errors

## Step 14: Continuous Deployment

**Automatic Deploys:**
- Every push to `main` → Vercel redeploys
- Pull requests → Preview deployments
- Branches → Separate preview URLs

**Recommended Workflow:**
1. Work on feature branch
2. Test with preview deployment
3. Merge to main when ready
4. Production auto-deploys

## Troubleshooting

### Build Fails

**Check:**
1. Environment variables set correctly
2. package.json dependencies complete
3. TypeScript errors resolved
4. ESLint passing

**View Logs:**
- Vercel Dashboard → Deployments → View logs

### 500 Internal Server Error

**Likely Causes:**
1. Missing environment variables
2. Database connection issues
3. Supabase credentials incorrect

**Fix:**
1. Check Vercel logs
2. Verify env variables
3. Test Supabase connection

### Slow Performance

**Optimize:**
1. Enable Vercel Analytics
2. Check bundle size
3. Use Image Optimization
4. Enable caching headers

## Post-Deployment Checklist

- [ ] All pages load correctly
- [ ] Authentication works
- [ ] Payments process successfully
- [ ] Readings generate properly
- [ ] Admin panel accessible
- [ ] Error tracking configured
- [ ] Analytics enabled
- [ ] Custom domains configured
- [ ] SSL certificates active
- [ ] Create first admin user
- [ ] Test all critical flows
- [ ] Monitor for errors (first 24h)

## Maintenance

### Weekly
- Review error logs
- Check analytics
- Monitor performance

### Monthly
- Review and update dependencies
- Security patches
- Performance optimization
- User feedback review

## Support & Resources

- Vercel Documentation: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- Supabase Production: https://supabase.com/docs/guides/platform/going-into-prod

## Emergency Rollback

If something goes wrong:

1. Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"
4. Instant rollback completed!

---

**🎉 Congratulations! Baba Mara is now LIVE on Vercel!** 🚀
