# safe-drive-web — SafeDrive Sentinel Global

> Next.js 14 web dashboard for the SafeDrive Sentinel Global platform.
> Customer booking, provider portal, admin dashboard, live GPS map.
> Zero Google APIs. Free stack.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Framework  | Next.js 14 (App Router)             |
| Language   | TypeScript                          |
| Styling    | Tailwind CSS + shadcn/ui            |
| Database   | Supabase (PostgreSQL + Realtime)    |
| Auth       | Supabase Auth                       |
| Maps       | MapLibre GL JS + OpenStreetMap      |
| Routing    | OpenRouteService                    |
| GPS Live   | Socket.IO                           |
| Payments   | PayPal Commerce Platform            |
| Charts     | Recharts                            |
| Hosting    | Vercel (free tier)                  |

---

## Quick Start (5 steps)

### Step 1 — Clone & install

```bash
# Clone the repo
git clone https://github.com/YOUR_ORG/safe-drive-web.git
cd safe-drive-web

# Install dependencies
npm install
```

### Step 2 — Set up Supabase

1. Go to https://supabase.com and create a free project
2. In the project dashboard, go to **SQL Editor → New Query**
3. Paste the entire contents of `supabase-schema.sql` and run it
4. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### Step 3 — Set up PayPal

1. Go to https://developer.paypal.com
2. Create a **Sandbox** app (for development) or **Live** app (for production)
3. Copy:
   - `Client ID` → `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
   - `Secret` → `PAYPAL_CLIENT_SECRET`
4. In PayPal dashboard, add a webhook pointing to:
   `https://YOUR_DOMAIN/api/webhooks/paypal`
   Events: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.REFUNDED`, `BILLING.SUBSCRIPTION.ACTIVATED`
5. Copy the Webhook ID → `PAYPAL_WEBHOOK_ID`

### Step 4 — Configure environment

```bash
# Copy the example file
cp .env.local.example .env.local

# Edit .env.local with your values
nano .env.local
```

Fill in all values from steps 2 and 3.

### Step 5 — Run locally

```bash
npm run dev
# Open http://localhost:3000
```

---

## Deploy to Vercel (free)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard:
# Project → Settings → Environment Variables
# Copy all values from .env.local
```

Or connect directly via https://vercel.com/new — import the GitHub repo and Vercel auto-deploys on every push.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page (marketing)
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Global styles
│   ├── auth/
│   │   ├── login/page.tsx          # Login
│   │   └── register/page.tsx       # Registration (customer or provider)
│   ├── dashboard/
│   │   ├── layout.tsx              # Dashboard shell + sidebar
│   │   ├── page.tsx                # Overview with metrics
│   │   ├── bookings/page.tsx       # Bookings list + create form
│   │   ├── fleet/page.tsx          # Fleet management
│   │   ├── providers/page.tsx      # Providers + KYC
│   │   └── analytics/page.tsx      # Revenue charts
│   └── api/
│       ├── bookings/route.ts       # POST create / GET list
│       ├── gps/route.ts            # GPS location endpoints
│       └── webhooks/paypal/route.ts # PayPal webhook handler
├── components/
│   ├── maps/LiveMap.tsx            # MapLibre GL JS map
│   └── booking/BookingForm.tsx     # Full 4-step booking flow
├── lib/
│   ├── supabase/client.ts          # Browser Supabase client
│   ├── supabase/server.ts          # Server Supabase client
│   └── utils.ts                    # Helpers, fare calc, formatters
└── types/index.ts                  # All TypeScript types
```

---

## Key Features Built

- **Landing page** with services, stats, how-it-works
- **Auth** — login, register (customer or provider role)
- **Dashboard sidebar** with navigation
- **Command center** — live metrics, recent bookings
- **4-step booking form** — map location picker, service selection, vehicle details, PayPal payment
- **Fleet management** — view all flatbeds, status, assigned drivers
- **Providers page** — KYC status, subscription tier, rating
- **Analytics** — revenue charts (Recharts), booking volume by hour
- **API routes** — booking CRUD, PayPal order creation, webhook handler, GPS endpoint
- **Full database schema** — PostGIS, RLS policies, triggers

---

## Environment Variables Reference

| Variable                          | Description                               |
|-----------------------------------|-------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`        | Your Supabase project URL                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Supabase anonymous key (safe for browser) |
| `SUPABASE_SERVICE_ROLE_KEY`       | Service role key (server only, never expose) |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID`    | PayPal app client ID                      |
| `PAYPAL_CLIENT_SECRET`            | PayPal secret (server only)               |
| `PAYPAL_WEBHOOK_ID`               | PayPal webhook ID for verification        |
| `NEXT_PUBLIC_PAYPAL_ENV`          | `sandbox` or `live`                       |
| `NEXT_PUBLIC_SOCKET_URL`          | URL of your safe-drive-api Socket.IO server |
| `NEXT_PUBLIC_ORS_API_KEY`         | OpenRouteService API key (free at openrouteservice.org) |
| `ANTHROPIC_API_KEY`               | Claude API key for AI dispatch            |
| `COMMISSION_RATE`                 | Decimal e.g. `0.18` for 18%              |

---

## Next Steps

After getting this running:

1. **safe-drive-api** — Set up the Node.js/Socket.IO backend for real-time GPS
2. **safe-drive-mobile** — Build the React Native Expo driver + customer app
3. **safe-drive-admin** — KYC approval workflow and admin controls
4. **safe-drive-ai** — Claude-powered dispatch matching engine

---

## Support

Built with the SafeDrive Sentinel Global master architecture.
Stack: Next.js 14 · Supabase · MapLibre · PayPal · TypeScript
No Google APIs. 100% free infrastructure.
