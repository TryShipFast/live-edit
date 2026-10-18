# 31 Maren — MOTION.md (GSAP 3 + ScrollTrigger)
Warm, considered, salon pace. Motion explains state; it never decorates. All motion off under `prefers-reduced-motion: reduce` (`gsap.matchMedia()`); content visible without JS.

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
- **Hero:** static on load. Home 1 large photo may scale 1.04 → 1 once (dur-l). Home 3 work strip scrolls only by user (no autoplay).
- **Section reveal:** `ScrollTrigger.batch('[data-rv]', {start:'top 85%', once:true})` → y 16 → 0 + fade, stagger. Never on hero, header, forms, price tiers.
- **Level pricing:** level change → prices crossfade (dur-m); selected level underline slides (`Flip`).
- **Colour timeline (Home 2):** steps reveal left→right once on enter (stagger 0.08, max 6).
- **Booking steps:** x 12 → 0 + fade (dur-m); focus moves to step heading after tween.
- **Gallery lightbox:** fade + scale 0.98 → 1 (dur-m); arrows/Escape work mid-tween.
- **Mobile menu:** slide from header (yPercent −4 → 0 + fade); body scroll locked.
- **Sticky Book/Call bar (phone):** shows after hero leaves view (y 100% → 0).
- **Banned:** scroll-jacking, pinned storytelling, marquee, count-ups, parallax, looping animation.
