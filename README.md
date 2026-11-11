# Pulse website starter
## What's included
- Vite frontend + Supabase JS client
- SQL tables for guest profiles, content, watch events, chat, presence
- Guest library listing, email/password admin sign-in, upload UI, realtime chat listener

## Setup
1. Install Node.js (18+).
2. Copy `.env.example` to `.env` and replace URL/key with your project's URL and publishable key.
3. In Supabase SQL Editor, run `supabase/schema.sql`.
4. Create Storage bucket named `videos`. Set policies deliberately (see security notes below).
5. In Supabase Authentication, create your admin user; only allow your own admin email.
6. Run `npm install`, then `npm run dev`. Deploy built `dist/` to Vercel/Netlify.

## Security limitations — before public launch
This is a starter scaffold, not production-ready:
- SQL intentionally does NOT grant public writes to guest/watch/chat/presence tables. Guest submissions need a Supabase Edge Function that validates a signed guest token and rate limits.
- Add admin-only RLS policies for content INSERT/UPDATE/DELETE and Storage uploads. Never expose service_role/secret key in browser or Git.
- Chat insert needs a validated guest token endpoint or authenticated user; realtime read policy must be designed (messages currently not readable by anon until policy added).
- Guest profiles/watch analytics require server-side signed session tokens. Don't trust a name or client-supplied guest ID.
- Public video files in a public bucket are accessible to anyone with URLs. For open guest viewing, use public bucket only for content intended to be shared; otherwise signed URLs.
- WebRTC calling needs a signaling service and peer consent; browser camera/mic permissions always remain user-controlled.
