# 33 Lacquer Room — MOTION.md (GSAP 3 + ScrollTrigger)
Calm, exact, unhurried. Motion explains state; it never decorates. All motion off under `prefers-reduced-motion: reduce` (`gsap.matchMedia()`), content visible without JS.

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
- **Hero:** static on load (no intro sequence). Mosaic photos may scale 1.04 → 1 over dur-l once, on load only.
- **Section reveal:** `ScrollTrigger.batch('[data-rv]', {start:'top 85%', once:true})` → y 16 → 0, opacity 0 → 1, stagger. Never on the hero, header, forms or the colour chart controls.
- **Colour chart:** finish/family change → swatches crossfade (opacity, dur-m); result card height tween via `Flip`. Selected underline slides between options (`Flip`, dur-m).
- **Price tiles / gallery:** hover = image scale 1 → 1.03 (dur-s). No tilt, no parallax.
- **Booking steps:** step change = x 12 → 0 + fade (dur-m); focus moves to the step heading after the tween.
- **Lightbox:** open = fade + scale 0.98 → 1 (dur-m); arrows/Escape work during tweens.
- **Mobile menu:** slide down from header (yPercent −4 → 0 + fade, dur-m); body scroll locked.
- **Sticky Book bar (phone):** appears after the hero leaves view (ScrollTrigger toggle, y 100% → 0).
- **Banned:** scroll-jacking, pinned storytelling, marquee, number count-ups, parallax backgrounds, looping animations.
