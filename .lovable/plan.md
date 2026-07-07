## Aura OS — Phase 2

Extends the Phase 1 shell with cloud auth, a full daily-log system, mock device sync, and a history/calendar view.

### 1. Enable Lovable Cloud + Schema

Enable Cloud, then create migrations for:

- `profiles` — `id (uuid, FK auth.users)`, `display_name`, `avatar_id (int 1-12)`, `language ('en'|'fa')`, `active_modules jsonb`, `biometrics jsonb` (weight/height/age/sex/activity + computed BMI/BMR/TDEE/BF%), timestamps. RLS: user reads/writes own row. Trigger auto-creates row on signup.
- `daily_logs` — `id`, `user_id`, `log_date (date)`, `type` (enum: weight, water, food, cardio, sleep, stress, study, note), `payload jsonb` (shape depends on type), `logged_at timestamptz`. RLS: user CRUD own rows. Index on `(user_id, log_date)`.
- `device_sync` — `id`, `user_id`, `source ('apple'|'google'|'mock')`, `metric ('steps'|'floors'|'sleep')`, `value jsonb`, `synced_at`. RLS same.
- GRANTs to `authenticated` + `service_role` on all three.

### 2. Auth (Email/Password + Google)

- Configure Google via `supabase--configure_social_auth`.
- New `/auth` route: animated tab transitions (sign-in ↔ sign-up) with framer-motion. Google button + email/password form. Zod validation.
- Managed `_authenticated/route.tsx` gates `/profile`, `/settings`, `/logs`, `/coach`, `/` dashboard (move existing routes under `_authenticated/`). Public routes: `/auth`, `/reset-password`.
- Header sign-in/avatar state driven by `onAuthStateChange` in `__root.tsx`.
- **Merge logic:** on first sign-in, if `localStorage` holds anonymous logs/profile, bulk-insert into Supabase then clear local keys.

### 3. Profile Manager + Avatar Picker

- Profile page: existing wizard now writes to `profiles` via server fn.
- Avatar popover: grid of 12 CSS-gradient tiles (indigo→emerald, obsidian→violet, etc.). Click updates `profiles.avatar_id` instantly via optimistic mutation.

### 4. Daily Log FAB + Modal

- Persistent bottom-right `+` FAB (fixed, glass, indigo glow). Hidden on `/auth`.
- Modal: 8 tabs (weight, water, food, cardio, sleep, stress, study, note) each optimized for ≤3 taps:
  - Water: preset chips (250/500/750ml) + custom.
  - Cardio: type radios (Stairs / Run / Walk) + minutes.
  - Sleep: slider 4–12h.
  - Stress: 5 emoji buttons.
  - Study: minutes stepper.
  - Note: textarea (+ voice via `webkitSpeechRecognition` where available).
- Submit → `insertLog` server fn → invalidate today's logs query.

### 5. Device Sync (mock adapter)

- `lib/sync/health-adapter.ts` — interface with `mock` implementation returning plausible steps/floors/sleep for today. Real HealthKit/Health Connect impls stubbed for later.
- Sync button on dashboard: spinning icon while running, "Synced 2m ago" / "۲ دقیقه پیش" via `Intl.RelativeTimeFormat`. Writes to `device_sync`, invalidates rings.

### 6. Dashboard Rings (dynamic)

- Rings compute from today's `daily_logs` + `device_sync` vs profile targets (water 2.5L, steps 10k, sleep 8h, study 120min or module-driven). Stroke transitions indigo → emerald at 100%.

### 7. `/logs` — History & Calendar

- Modular month calendar (custom, glass cells). Dot indicator per day = logs exist.
- Click date → panel with day's logs grouped by type; edit (opens same modal prefilled) / delete / add-missed.
- Filter chips per active module (hide unrelated log types).

### 8. Technical

- Server fns in `src/lib/logs.functions.ts`, `src/lib/profile.functions.ts`, `src/lib/sync.functions.ts` — all `.middleware([requireSupabaseAuth])`.
- Zustand stores kept for UI state + offline drafts; source of truth for logs/profile moves to Supabase via TanStack Query.
- Bilingual strings extended in `lib/i18n.ts`.

### Out of scope

Real HealthKit/Health Connect native bridges (mock only), push notifications, sharing, weekly/monthly analytics graphs.
