# Payten Payment Integration

Complete payment system for Baba Mara fortune telling platform with credit purchases and subscriptions.

## Overview

Payten integration enables users to purchase reading credits through three payment options:
- **Single Reading**: $1.99 (1 credit)
- **Monthly Subscription**: $9.99/month (12 credits)
- **Top-Up Package**: $9.99 (10 credits)

## Features

### ✅ Implemented

- Secure payment processing through Payten gateway
- Three purchase options (single, subscription, top-up)
- Webhook handling for payment status updates
- Transaction history and tracking
- Automatic credit allocation
- Subscription management
- Payment success/cancel pages
- Guest mode prevention (must create account to purchase)
- Full multi-language support (EN, TR, SR)
- Database transaction logging

### 🚧 Future Enhancements

- Subscription cancellation flow
- Payment method management
- Refund processing UI
- Invoice generation and download
- Payment analytics dashboard
- Promotional codes and discounts
- Gift credits functionality

## Architecture

```
User selects plan
    ↓
POST /api/payment/create
    ↓
Create transaction record (status: pending)
    ↓
Call Payten API to create payment session
    ↓
Redirect user to Payten payment page
    ↓
User completes payment
    ↓
Payten sends webhook to /api/payment/webhook
    ↓
Verify signature + Update transaction status
    ↓
Add credits to user account (via database function)
    ↓
Update subscription status (if applicable)
    ↓
Redirect user to success page
```

## Setup

### 1. Payten Account

Sign up for Payten account:
1. Visit https://payten.com (or regional equivalent)
2. Create merchant account
3. Complete KYC verification
4. Get API credentials:
   - API Key
   - Merchant ID

### 2. Environment Variables

Add to `.env.local`:

```bash
PAYTEN_API_KEY=your-api-key-here
PAYTEN_MERCHANT_ID=your-merchant-id-here
PAYTEN_ENVIRONMENT=sandbox # or 'production'
```

### 3. Webhook Configuration

Configure webhook in Payten dashboard:
- **Webhook URL**: `https://your-domain.com/api/payment/webhook`
- **Events**: `payment.completed`, `payment.failed`, `payment.refunded`
- **Method**: POST
- **Signature**: HMAC-SHA256 (using API key as secret)

**Important**: Use HTTPS in production for webhook security.

### 4. Test Mode

Use sandbox environment for testing:
- Set `PAYTEN_ENVIRONMENT=sandbox`
- Use Payten test cards
- Verify webhooks work locally with ngrok/localtunnel

## Components

### Core Payment Module (`lib/payten/client.ts`)

**Functions:**

**`createPayment(request: PaymentRequest)`**
- Creates payment session with Payten
- Returns payment URL for user redirect
- Handles API errors gracefully

**`verifyPayment(paymentId: string)`**
- Checks payment status with Payten
- Used for manual verification if webhook fails

**`verifyWebhookSignature(payload: string, signature: string)`**
- Validates webhook authenticity
- Uses HMAC-SHA256 with API key as secret
- Prevents webhook spoofing attacks

**`refundPayment(paymentId: string, amount?, reason?)`**
- Processes full or partial refunds
- Updates transaction status to 'refunded'
- Deducts credits from user account

**`PRICING` Configuration**:
```typescript
{
  single: { amount: 199, credits: 1, currency: 'USD' },
  subscription: { amount: 999, credits: 12, currency: 'USD', interval: 'month' },
  topup: { amount: 999, credits: 10, currency: 'USD' }
}
```

### API Endpoints

#### `POST /api/payment/create`

Create payment session.

**Request:**
```json
{
  "type": "single" | "subscription" | "topup"
}
```

**Response:**
```json
{
  "success": true,
  "paymentUrl": "https://payten.com/checkout/...",
  "transactionId": "uuid",
  "paymentId": "payten_payment_id"
}
```

**Flow:**
1. Authenticate user
2. Validate payment type
3. Create transaction record in database (status: pending)
4. Call Payten API to create payment
5. Return payment URL for redirect

#### `POST /api/payment/webhook`

Handle Payten webhook events.

**Headers:**
- `x-payten-signature`: HMAC signature for verification

**Payload:**
```json
{
  "eventType": "payment.completed",
  "paymentId": "payten_payment_id",
  "orderId": "transaction_id",
  "amount": 199,
  "currency": "USD",
  "status": "completed",
  "timestamp": "2025-01-09T12:00:00Z",
  "signature": "hmac_signature"
}
```

**Processing:**
1. Verify webhook signature
2. Find transaction by order ID
3. Handle event based on type:
   - `payment.completed`: Add credits, update subscription
   - `payment.failed`: Mark transaction as failed
   - `payment.refunded`: Deduct credits, update status

#### `POST /api/payment/verify`

Manually verify payment status (fallback).

**Request:**
```json
{
  "transactionId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "status": "completed",
  "transaction": { /* full transaction object */ }
}
```

### Payment Pages

#### `/[locale]/payment`

Payment selection page with pricing cards.

**Features:**
- Three pricing options displayed
- Guest mode warning (cannot purchase as guest)
- Current subscription status display
- Buy button for each option
- Loading states during payment creation
- Error handling with user-friendly messages

#### `/[locale]/payment/success`

Payment success confirmation page.

**Features:**
- Success animation
- Transaction details display
- Credits added confirmation
- Updated available credits
- Next steps guide (get reading, dashboard links)
- Email confirmation note

#### `/[locale]/payment/cancel`

Payment cancellation page.

**Features:**
- Cancellation explanation
- Common reasons for failure
- Retry button
- Return to dashboard link
- Guest mode alternative (free trial)
- Support contact information

#### `/[locale]/dashboard/transactions`

Transaction history page.

**Features:**
- Summary cards (total transactions, total spent, total credits)
- Full transaction table with filters
- Status indicators (completed, pending, failed, refunded)
- Transaction details (date, type, amount, credits, status)
- Buy more credits CTA
- Export functionality (future)

## Database Schema

### Transactions Table

Already defined in `supabase/migrations/20250109_initial_schema.sql`:

```sql
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- 'single', 'subscription', 'topup'
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  payment_id TEXT, -- Payten payment ID
  payment_method TEXT, -- 'payten', etc.
  credits_purchased INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT status_check CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))
);
```

### Database Functions

**`add_user_credits(p_user_id UUID, p_credits INTEGER)`**
- Adds credits to user account
- Used after successful payment

**`deduct_user_credits(p_user_id UUID, p_credits INTEGER)`**
- Deducts credits (used for refunds)
- Returns FALSE if insufficient credits

## Pricing & Economics

### Product Pricing

| Product | Price | Credits | Cost per Credit | Savings |
|---------|-------|---------|-----------------|---------|
| Single Reading | $1.99 | 1 | $1.99 | - |
| Subscription | $9.99/mo | 12 | $0.83 | 58% |
| Top-Up Package | $9.99 | 10 | $1.00 | 50% |

### Cost Structure

**Per Reading Costs:**
```
AI Generation (Claude):  $0.020
TTS (OpenAI):            $0.004
LiveKit Voice (optional): $0.050
Storage:                 $0.001
─────────────────────────────────
Text Reading:            $0.025
Voice Reading:           $0.075
```

**Profit Margins:**

| Product | Revenue | Cost (text) | Cost (voice) | Margin (text) | Margin (voice) |
|---------|---------|-------------|--------------|---------------|----------------|
| Single | $1.99 | $0.025 | $0.075 | 98.7% | 96.2% |
| Subscription | $9.99 | $0.300 | $0.900 | 97.0% | 91.0% |
| Top-Up | $9.99 | $0.250 | $0.750 | 97.5% | 92.5% |

**Monthly Revenue Estimate (1,000 users):**
```
Scenario: 40% single, 30% subscription, 30% top-up

Revenue:
- Single: 400 × $1.99 = $796
- Subscription: 300 × $9.99 = $2,997
- Top-Up: 300 × $9.99 = $2,997
TOTAL REVENUE: $6,790

Costs (assuming 50% text, 50% voice):
- Text readings: 2,500 × $0.025 = $62.50
- Voice readings: 2,500 × $0.075 = $187.50
TOTAL COSTS: $250

NET PROFIT: $6,540/month (96.3% margin)
```

### Payment Processing Fees

Payten typically charges:
- **Card payments**: 2.9% + $0.30 per transaction
- **Local payments**: 1.5% - 3.5% depending on method

**Example fees:**
- $1.99 transaction: $0.36 (18%)
- $9.99 transaction: $0.59 (5.9%)

**Adjusted margins:**
- Single: ~80%
- Subscription: ~91%
- Top-Up: ~92%

## Security

### Payment Security

- **PCI Compliance**: Payten handles all card data (we never store it)
- **HTTPS**: All payment pages and webhooks use HTTPS
- **Webhook Signature**: HMAC verification prevents spoofing
- **Server-side Validation**: All payment logic runs server-side
- **No Client Secrets**: API keys never exposed to client

### Fraud Prevention

- **User Authentication**: Must be logged in to purchase
- **Guest Prevention**: Guest accounts cannot purchase (must create permanent account)
- **Rate Limiting**: Prevent rapid repeat purchases
- **Transaction Logging**: All attempts logged to database
- **Error Logging**: Failed payments logged for analysis

### Database Security

- **Row Level Security (RLS)**: Users can only see their own transactions
- **Prepared Statements**: All queries use parameterized statements
- **Service Role Key**: Sensitive operations use service role key
- **Audit Trail**: Complete transaction history maintained

## Testing

### Test Payment Flow

1. **Create Account**: Sign up with test email
2. **Navigate to Payment**: `/payment` page
3. **Select Plan**: Click buy button
4. **Redirect to Payten**: Complete payment with test card
5. **Webhook Trigger**: Payten sends webhook (use ngrok for local testing)
6. **Credits Added**: Verify credits appear in dashboard
7. **Transaction History**: Check `/dashboard/transactions`

### Test Cards (Payten Sandbox)

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Insufficient Funds**: 4000 0000 0000 9995
- **Expired**: 4000 0000 0000 0069

Use any future expiry date and any 3-digit CVV.

### Local Webhook Testing

Use ngrok or localtunnel for webhook testing:

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok tunnel
ngrok http 3000

# Copy HTTPS URL and configure in Payten dashboard
https://abc123.ngrok.io/api/payment/webhook
```

## Troubleshooting

### "Payment creation failed"
- Verify `PAYTEN_API_KEY` and `PAYTEN_MERCHANT_ID` are set
- Check API key is valid for environment (sandbox/production)
- Inspect network tab for API response errors
- Check Payten dashboard for account status

### "Webhook not received"
- Verify webhook URL is configured in Payten dashboard
- Ensure webhook URL is publicly accessible (use ngrok for local)
- Check webhook signature verification
- Review Payten webhook logs in dashboard
- Check your server logs for webhook receipt

### "Credits not added after payment"
- Check transaction status in database (`transactions` table)
- Verify webhook signature validation passed
- Check `add_user_credits` function executed successfully
- Review `error_logs` table for any errors
- Manually verify payment status with `/api/payment/verify`

### "Subscription not activated"
- Check `subscriptions` table for entry
- Verify `users.subscription_status` updated
- Check webhook handled `payment.completed` correctly
- Review database function execution logs

## Production Deployment

### Pre-deployment Checklist

- [ ] Payten production account created and verified
- [ ] Production API keys configured in environment variables
- [ ] Webhook URL configured in Payten dashboard (HTTPS only)
- [ ] Test all payment flows in sandbox
- [ ] Test webhook signature verification
- [ ] Verify credit allocation works correctly
- [ ] Test subscription flow end-to-end
- [ ] Configure rate limiting on payment endpoints
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Enable audit logging for all payment operations
- [ ] Review and confirm pricing in code matches business requirements
- [ ] Test refund flow (if implemented)

### Environment Variables

Production `.env`:
```bash
PAYTEN_API_KEY=pk_live_xxxxxxxxxxxxxx
PAYTEN_MERCHANT_ID=mer_xxxxxxxxxxxxxx
PAYTEN_ENVIRONMENT=production
```

### Monitoring

Monitor these metrics:
- **Conversion rate**: Payment page visits → successful purchases (target: >10%)
- **Abandonment rate**: Payment created → payment completed (target: <30%)
- **Failure rate**: Failed payments / total attempts (target: <5%)
- **Webhook success rate**: Webhooks received and processed (target: >99%)
- **Average transaction value**: Total revenue / transactions
- **Revenue by plan**: Single vs. subscription vs. top-up breakdown

### Alerts

Set up alerts for:
- Payment processing errors (>5 in 1 hour)
- Webhook failures (>1 in 1 hour)
- Database function failures
- Unusual payment patterns (fraud detection)
- High refund rate (>10%)

## Support

- **Payten Documentation**: https://docs.payten.com
- **Payten Support**: support@payten.com
- **Integration Issues**: Check Payten dashboard → Developers → Logs
- **Baba Mara Issues**: GitHub repository issues

## Next Steps

After completing Phase 6:
1. Test payment flow thoroughly in sandbox
2. Complete Payten verification for production
3. Configure production webhook URL
4. Test with real payment methods
5. Monitor first 100 transactions closely
6. Gather user feedback on payment UX
7. Optimize conversion funnel based on data
8. Consider implementing promotional codes
9. Add payment analytics dashboard
10. Implement subscription management UI
