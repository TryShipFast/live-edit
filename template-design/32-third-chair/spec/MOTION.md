# 32 Third Chair — MOTION.md (GSAP 3 + ScrollTrigger)
Quick, confident, barber-shop pace. Motion explains state; it never decorates. All motion off under `prefers-reduced-motion: reduce` (`gsap.matchMedia()`); the Home 1 crossfade becomes a single static photo. Content visible without JS.

## Tokens
| Token | Value |
|---|---|
| dur-s | 0.18s (hover, press) |
| dur-m | 0.32s (state changes) |
| dur-l | 0.6s (section reveal) |
| ease | `power2.out`; exits `power2.in` |
| stagger | 0.06s, max 6 items |
| reveal distance | y: 16px, opacity 0 → 1 |

## Rules
- **Hero (Home 1):** photo crossfade, 3 photos, 6s hold, 1s fade (opacity only). Pauses on hover/focus and when tab hidden; pause button visible. Homes 2/3 static.
- **Chair board + hold-my-spot:** queue count change → number crossfade (dur-m), no count-up.
- **Section reveal:** `ScrollTrigger.batch('[data-rv]', {start:'top 85%', once:true})` → y 16 → 0 + fade. Never on hero, header, forms, price columns.
- **Filmstrip / barber rail:** user-scrolled only (scroll-snap); arrow buttons tween scrollLeft (dur-m).
- **Booking steps:** x 12 → 0 + fade (dur-m); focus to step heading.
- **Lightbox:** fade + scale 0.98 → 1 (dur-m).
- **Mobile menu:** opens below header (yPercent −4 → 0 + fade); body scroll locked.
- **Sticky Book/Call bar (phone):** shows after hero leaves view.
- **Banned:** scroll-jacking, pinned storytelling, marquee, count-ups, parallax, autoplay video.
