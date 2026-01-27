# FrameRanker

> A Farcaster Mini App for boosting visibility and ranking.

---

## 📁 Project Structure

This repository contains the source code for **FrameRanker**.

| Feature | Files to Check |
|---------|----------------|
| Mini App SDK setup | `lib/miniapp.ts`, `components/providers/FrameProvider.tsx` |
| Wallet integration | `lib/wagmi.ts`, `components/providers/RainbowKitProvider.tsx` |
| RPC configuration | `lib/rpc.ts` |
| Local caching | `lib/cache.ts` |
| Notification system | `lib/notification.server.ts`, `app/api/farcaster/webhook/route.ts` |
| Prisma schema | `prisma/schema.prisma` |
| Farcaster manifest | `public/.well-known/farcaster.json` |
| API routes | `app/api/` directory |

## Quick Start

```bash
# Clone and install
git clone <this-repo>
cd frame-ranker
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your values

# Setup database
npx prisma generate
npx prisma migrate dev

# Run development server
npm run dev
```

## Deployment

Deployed on Vercel. Ensure all environment variables are set in the Vercel dashboard.
