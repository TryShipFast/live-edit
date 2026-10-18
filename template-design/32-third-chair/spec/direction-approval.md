# 32 Third Chair — plan (rev1, 18 Oct 2026)
Fictional barbershop, Market Quarter (fictional), est. 2017. Kind = salon (checks.json 05-beauty-wellness).

## Rules applied
- [x] DESIGN-GUIDELINES §1–10 read; CATEGORY-GUIDE + briefs/05-beauty-wellness.md (barbers: ink + one strong accent, crisp).
- [x] Branding first: logo kit (assets/32), tokens.json, type-scale.md, brand-voice.md.
- [x] Not country-specific: fictional place, "qualified" not real bodies, one editable currency ($ default).
- [x] ≤1 real table per site (none planned); prices = cards/columns; varied card shapes.
- [x] No eyebrows, step numerals, stats rows, logo walls, dot pills, glass nav, bento hero.
- [x] Heroes display-only (no forms in hero). Real photo in every hero, inside first screen at 1440 and 1536×730.
- [x] Sample on every price/rating/qualification/address; footer names business as fictional; emails .example.
- [x] Lucide icons; text ≥12px; focus rings currentColor; even rows; 320–3840.
- [x] No section reused across the 3 homes; no structure copied from 31 Maren (31: level re-price cards, colour timeline, voucher picker, filmstrip, owner note, book-your-usual, late hours).
- [x] Booking one tap from every page (header + sticky phone bar); booking = request form / hands off to booking system.
- [x] checks.json salon: services, team, gallery, gift-vouchers, about, contact, policies, privacy, 404; header services/team/contact; footer policies + privacy; terms min, cancellation, consultation, opening hours, deposit/late arrival.

## Who visits and why
1. **Walk-in passer-by** (phone, now): is anyone free right now, how long is the wait, how much is a cut.
2. **New client booking ahead**: which barber suits my hair, what does a fade vs scissor cut cost, can I pick a time.
3. **Regular** (every 3–4 weeks): book my barber fast; is a membership worth it.
4. **Gift buyer**: voucher for a cut + shave.

## Business needs → measures (for Phase 2)
- Fill the chairs in quiet hours → walk-ins on the chair board (measure: board → "walk over" taps).
- Steer to the right barber/service → fewer redo cuts and no-shows (service → book clicks per barber).
- Recurring revenue → Cut Club membership sign-ups.
- Fewer phone calls → prices, wait and hours visible (calls/visit).
- Deposit + late-arrival policy shown before booking → fewer no-shows.

## Signature tool
**Chair board**: each barber's next free slots today, a walk-in wait estimate for chair three, and a "hold my spot" request (name + phone, Sample; hands off to the shop's booking system).

## Homes (heroes from category-plan row 32; sections all different)
- **Home 1 — walk-in passer-by.** Hero: full-bleed shop photo with a slow crossfade between 3 shop shots (no video available), headline "Walk in. Chair three is kept free." → Chair board (SIG) → Price columns (PC) → Work filmstrip (GF) → Barber rail (TR) → Hours + map band (HM).
- **Home 2 — new client.** Hero: statement over full-width photo band. → Founder note (ST) → Rating line (RT) → Barber portraits with "book with" (TM) → Price menu grouped cuts / beard / shave (PM) → Market Quarter local guide (LT, incl. hours).
- **Home 3 — regular.** Hero: split, image left. → Gallery mosaic (GM) → Cut Club membership plans (MP) → Two client quotes (RV) → Product shelf (PR) → FAQ (FQ).

## Pages
home ×3, services (+ 4 service pages: skin fade, scissor cut, hot towel shave, beard), team + 4 barber pages, gallery (filter; "Colour" = empty state; lightbox), gift-vouchers (form error/sending/done), book (request: service → barber → time → details; deposit note), cut-club, about, contact (form), policies, journal + 3 posts (one long title, no image), privacy, 404.

## Risks
- Only 7 photos → crossfade + gallery would repeat. Max 2 uses per photo per page; Phase 2 replaces (manifest flags).
- "Live" board is sample data → label "Sample times — the shop's booking system fills this in".
- Not tested with real users (README states it).
