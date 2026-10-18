# 33 Lacquer Room — plan (rev1, 18 Oct 2026)
Fictional nail studio, Mill District (fictional), est. 2019. Kind = salon (checks.json 05-beauty-wellness).

## Rules applied
- [x] DESIGN-GUIDELINES §1–10 read; CATEGORY-GUIDE beauty + briefs/05-beauty-wellness.md + category-plan row 33 (Gloock / Albert Sans, #2B2230 / #3F5E4E oxide green / #EEF1EC; signature = colour chart).
- [x] Branding first: logo kit (assets/33, almond mark), tokens.json (9 tokens + fixed), type-scale.md, brand-voice.md.
- [x] Not country-specific: fictional place, "qualified" technicians, one editable currency ($ default).
- [x] Tables only where needed: none planned. Prices = cards (almond tiles, wide split cards, swatch rows) — no dotted leaders (§10 overrides the plan's PM wording).
- [x] Modern cards in varied shapes; never the same card shape twice on one page.
- [x] No eyebrows, step numerals, stats rows, logo walls, dot pills, glass nav, bento hero, testimonial carousel, left stripes, decorative gradients.
- [x] Heroes display-only; real photo in every hero inside the first screen at 1440 and 1536×730.
- [x] Sample on every price, rating, qualification and address; footer names the business as fictional; emails .example.
- [x] Lucide icons; text ≥12px; focus rings currentColor; 320–3840.
- [x] Booking one tap from every page (header + sticky phone bar); booking = request form handed to the studio's booking system.
- [x] checks.json salon: services, team, gallery, gift-vouchers, about, contact, policies + privacy, 404; header services/team/contact; footer policies + privacy; terms min, cancellation, patch test/consultation, opening hours, deposit/late arrival.
- [x] Section rationale written (section-rationale.md) with Business + UX table; untested with real users.

## Who visits and why
1. **Shade hunter** (phone, evenings): what colours and finishes do you do, what does gel vs BIAB cost, how long does it last.
2. **First-timer / nail-health worrier**: is it clean, do you damage nails, who will do mine, what happens on the first visit.
3. **Regular** (every 3–4 weeks): rebook infill fast, same shade again, buy cuticle oil.
4. **Gift buyer**: give a specific treatment, not an amount.

## Business needs → measures (Phase 2)
- Upsell finish (classic → gel → BIAB/chrome) → colour chart: chart → book clicks per finish.
- Fewer "how much / how long" messages → price + duration + wear time on every card.
- Retention every 3–4 weeks → "same shade again" rebook (H3), infill pricing.
- Trust for first-timers → hygiene/sterile tools section, first-visit sequence, technician cards.
- Gift revenue → treatment-gift chooser (H1).

## Signature tool — colour chart
Pick a finish (Classic, Gel, BIAB, Chrome, Press-on set) + a shade family (Sheers, Earth, Berry, Green, Blue, French) → swatch grid of Sample shades; selecting one shows the matching treatment, duration, wear time, price, and "Book this shade" (carries shade + treatment into booking). Empty state: Chrome × French = "not a combination we do — try Classic French".

## Homes (heroes from category-plan row 33; no section reused across homes; none copied from 31/32)
- **Home 1 — shade hunter.** Hero: photo mosaic (4 almond-cropped photos of work + space, headline left). → Colour chart (SIG, full tool) → Price menu as almond tiles per finish (PM) → Gallery mosaic with finish tags (GM) → 3 quotes as offset stack (RV) → Gift a treatment chooser (VC).
- **Home 2 — first-timer.** Hero: split, image right ("We file. We don't drill."). → Individual result, labelled (BA single) → Technician cards with "Book with" (TM) → First visit: consult, prep, colour, aftercare as a horizontal photo sequence, unnumbered (FV) → Hands / feet two editorial columns (PC) → Hours + map band (HM).
- **Home 3 — regular.** Hero: full-bleed image, centred headline. → Studio tour photo band (SP) → "Same shade again": your last shade (Sample) + 3 rebook times (SIG, compact form) → Aftercare shelf (PR) → Rating line (RT) → FAQ (FQ).

## No-repeat (vs 31 Maren, 32 Third Chair)
Banned from earlier: level re-price cards, colour timeline, amount voucher picker, filmstrip, owner note, book-your-usual, late hours (31); crossfade hero, chair board + hold queue, price columns, barber rail, founder note, Cut Club plans, product shelf as rail, local guide (32).
33 differs: almond-cropped mosaic hero, colour chart, almond price tiles, treatment-gift chooser (not amount), single labelled result, photo-sequence first visit, hands/feet editorial columns, shade-again rebook, aftercare shelf as 2×2 split cards.

## Pages
home ×3, services (all finishes; card groups), treatment ×4 (gel, BIAB, chrome, pedicure), team + 4 technician pages (one on leave), gallery (finish filter; "Press-on" empty; lightbox), gift-vouchers (treatment gift form error/sending/done), book (treatment → technician → day/slot → details; deposit + patch-test note for extensions/BIAB), about, contact (form, hours, access), policies (cancellation, late arrival, deposit, allergies/patch test, consultation), careers (desk rental + roles, apply form), journal + 3 posts (p3 long title, no image), privacy, 404.

## Risks
- 15 photos, all hands/space → good fit; identifiable faces none. Max 2 uses per page.
- Shades are Sample swatches (hex chips), not product names — no real brands.
- Not tested with real users (README states it).
