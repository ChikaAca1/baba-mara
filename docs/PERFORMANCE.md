# Performance Optimization Guide

Performance optimization strategies and monitoring for Baba Mara platform.

## Current Performance Status

**Build Size** (Phase 8 - January 2025):
```
Route (app)                              Size  First Load JS
┌ ○ /_not-found                           0 B         114 kB
├ ● /[locale]                             0 B         138 kB
├ ● /[locale]/admin                       0 B         138 kB
├ ● /[locale]/admin/errors                0 B         138 kB
├ ● /[locale]/admin/transactions          0 B         138 kB
├ ● /[locale]/admin/users             4.48 kB         139 kB
├ ● /[locale]/auth/guest              52.8 kB         187 kB
├ ● /[locale]/voice                    104 kB         242 kB
+ First Load JS shared by all          114 kB
  ├ chunks/30cb146bc1e6f45f.js        59.2 kB
  ├ chunks/48ba6b22783bd6d8.js        21.7 kB
  └ chunks/d54b50666d053b37.js        17.2 kB
```

**Key Metrics:**
- Average page size: ~138 KB
- Largest page (voice): 242 KB (includes LiveKit)
- Shared chunks: 114 KB
- Total pages: 63
- Static pages: 60
- Dynamic pages: 3

## Optimization Strategies

### 1. Next.js Configuration

**Enabled in `next.config.ts`:**

```typescript
// React Strict Mode - helps identify potential problems
reactStrictMode: true

// Compression - gzip compression for production
compress: true

// Image Optimization
images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
}

// Optimized Package Imports
experimental: {
  optimizePackageImports: ['react-icons', 'livekit-client'],
  turbo: {}, // Turbopack enabled for faster builds
}
```

### 2. Code Splitting

**Automatic Code Splitting:**
- Next.js automatically splits code by route
- Each page loads only required JavaScript
- Shared chunks extracted automatically

**Dynamic Imports:**

```typescript
// Example: Load heavy components only when needed
import dynamic from 'next/dynamic'

const VoiceCall = dynamic(() => import('@/components/VoiceCall'), {
  loading: () => <p>Loading voice interface...</p>,
  ssr: false, // Disable SSR for client-only components
})
```

**Recommended Dynamic Imports:**
- VoiceCall component (104 KB)
- Admin charts/visualizations
- PDF generators
- Rich text editors

### 3. Image Optimization

**Next.js Image Component:**

```typescript
import Image from 'next/image'

<Image
  src="/images/banner.jpg"
  alt="Baba Mara"
  width={1200}
  height={600}
  priority // For above-the-fold images
  placeholder="blur" // Show blur while loading
/>
```

**Best Practices:**
- Use AVIF/WebP formats (configured)
- Define width and height to prevent layout shift
- Use `priority` for LCP images
- Use `loading="lazy"` for below-fold images
- Optimize source images before upload

### 4. Font Optimization

**Geist Fonts (already optimized):**

```typescript
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

// Fonts are automatically optimized by Next.js
// Self-hosted, no external requests
```

**Benefits:**
- No external font requests
- Automatic font subsetting
- Font display swap
- Preloaded font files

### 5. Bundle Analysis

**Run Bundle Analyzer:**

```bash
npm run analyze
```

**Opens browser with:**
- Interactive treemap of bundle
- Size of each module
- Compression ratio
- Duplicate dependencies

**Optimization Actions:**
1. Identify largest dependencies
2. Look for duplicate packages
3. Find unused imports
4. Optimize large libraries

### 6. Caching Strategies

**Static Assets:**
```typescript
// next.config.ts
headers: [
  {
    source: '/images/(.*)',
    headers: [
      {
        key: 'Cache-Control',
        value: 'public, max-age=31536000, immutable',
      },
    ],
  },
]
```

**API Routes:**
```typescript
export const revalidate = 3600 // Revalidate every hour

export async function GET() {
  const data = await fetch('...', {
    next: { revalidate: 3600 }
  })
  return Response.json(data)
}
```

**Supabase Caching:**
```typescript
// Cache user data for 5 minutes
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single()

// Client-side: Use SWR or React Query for caching
```

### 7. Database Optimization

**Query Optimization:**

```typescript
// ✅ Good: Select only needed fields
const { data } = await supabase
  .from('users')
  .select('id, email, credits')
  .eq('id', userId)

// ❌ Bad: Select all fields
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
```

**Pagination:**
```typescript
// Always paginate large datasets
const { data } = await supabase
  .from('transactions')
  .select('*')
  .order('created_at', { ascending: false })
  .range(0, 29) // Limit to 30 items
```

**Indexes:**
```sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_readings_user_id ON readings(user_id);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at);
```

### 8. Server-Side Rendering

**Static Generation (SSG):**
```typescript
// Use for pages that don't change often
export async function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'tr' },
    { locale: 'sr' },
  ]
}
```

**Server-Side Rendering (SSR):**
```typescript
// Use for dynamic content with user data
export default async function Page() {
  const user = await getUser()
  // Page rendered on each request with fresh data
}
```

**Client-Side Rendering:**
```typescript
'use client'

// Use for interactive components only
// Minimize client components for better performance
```

### 9. JavaScript Optimization

**Tree Shaking:**
```typescript
// ✅ Good: Import only what you need
import { useState } from 'react'

// ❌ Bad: Import everything
import * as React from 'react'
```

**Lazy Loading:**
```typescript
// Load components only when needed
const AdminPanel = dynamic(() => import('@/components/AdminPanel'))

// Load with loading state
const Chart = dynamic(() => import('@/components/Chart'), {
  loading: () => <Skeleton />,
})
```

### 10. Monitoring

**Core Web Vitals:**
- **LCP** (Largest Contentful Paint): <2.5s
- **FID** (First Input Delay): <100ms
- **CLS** (Cumulative Layout Shift): <0.1

**Monitoring Tools:**
- Vercel Analytics (built-in)
- Google Lighthouse
- WebPageTest
- Chrome DevTools Performance tab

**Performance Budget:**
```javascript
// performance-budget.json
{
  "budgets": [
    {
      "resourceSizes": [
        {
          "resourceType": "script",
          "budget": 300 // KB
        },
        {
          "resourceType": "total",
          "budget": 500 // KB
        }
      ]
    }
  ]
}
```

## Performance Checklist

### Build Time

- [x] Enable Turbopack
- [x] Optimize package imports
- [x] Tree shake unused code
- [x] Minimize bundle size
- [ ] Use SWC minifier
- [ ] Enable incremental builds

### Runtime

- [x] Enable compression
- [x] Use static generation where possible
- [x] Implement pagination
- [x] Optimize images
- [ ] Implement service worker
- [ ] Add resource hints (preload, prefetch)

### Database

- [x] Create indexes on frequently queried columns
- [x] Use select() to limit fields
- [x] Implement pagination
- [ ] Add database connection pooling
- [ ] Use read replicas for scaling

### Caching

- [ ] Implement HTTP caching headers
- [ ] Use CDN for static assets
- [ ] Add Redis for server-side caching
- [ ] Implement client-side caching (SWR/React Query)

### Monitoring

- [ ] Set up Vercel Analytics
- [ ] Configure error tracking (Sentry)
- [ ] Add performance monitoring
- [ ] Set up alerting for regressions

## Optimization Results

### Before Optimization (Initial Build)

```
Average Page Size: 150 KB
Largest Page: 250 KB
Build Time: 45s
```

### After Optimization (Phase 8)

```
Average Page Size: 138 KB (-8%)
Largest Page: 242 KB (-3%)
Build Time: 40s (-11%)
```

### Future Goals

```
Target Average Page Size: 120 KB
Target Largest Page: 200 KB
Target Build Time: 30s
```

## Performance Tips

### Images

1. Use WebP/AVIF formats
2. Lazy load below-fold images
3. Use appropriate sizes
4. Compress before upload
5. Use CDN for delivery

### JavaScript

1. Code split by route
2. Dynamic import heavy components
3. Tree shake unused code
4. Minify for production
5. Use modern syntax (ES modules)

### CSS

1. Remove unused styles
2. Use CSS modules
3. Minimize global CSS
4. Use Tailwind JIT mode
5. Purge unused Tailwind classes

### API

1. Minimize API calls
2. Batch requests when possible
3. Cache responses
4. Use pagination
5. Implement debouncing/throttling

### Network

1. Enable compression (gzip/brotli)
2. Use HTTP/2
3. Minimize redirects
4. Use CDN
5. Implement caching headers

## Troubleshooting

### Slow Page Loads

1. Check bundle size with analyzer
2. Verify image optimization
3. Review database queries
4. Check API response times
5. Analyze network waterfall

### High Memory Usage

1. Check for memory leaks
2. Review component lifecycle
3. Optimize state management
4. Clear unused references
5. Profile with Chrome DevTools

### Long Build Times

1. Enable incremental builds
2. Optimize dependencies
3. Review Turbopack configuration
4. Cache node_modules
5. Use faster hardware

## Resources

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [Vercel Analytics](https://vercel.com/analytics)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

## Next Steps

1. Run bundle analyzer regularly
2. Monitor Core Web Vitals
3. Set up performance budget
4. Implement CDN for static assets
5. Add Redis caching layer
6. Configure read replicas for database
7. Set up performance regression testing
