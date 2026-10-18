# 31 Maren — hair salon, Old Town (fictional, not country-specific), est. 2014 · direction approval (rev1)
Category 05 Beauty & Wellness · checks.json kind **salon** · slug `maren-salon`.
Approval: the user chose "all three directions as Home 1/2/3, no approval stop" (the same process as 14–22).

## Rules applied (DESIGN-GUIDELINES §1–10, CATEGORY-GUIDE Beauty, briefs/05, checks.json salon, templates/CLAUDE.md)
- [x] Category brief read: visitor jobs, pages, field expectations, words, heroes, section forms, type/colour, nothing misleading
- [x] **checks.json salon:**
  - pages: services, team, gallery, gift-vouchers, about, contact, policies, privacy, 404
  - header links: services, team, contact; footer links: policies, privacy
  - terms: "NN min", cancellation, patch test, opening hours, deposit, late arrival, fictional, Sample
- [x] Heroes display only, each with a real photo in the first screen at 1440 and 1536×730. No form or tool in a hero, nothing straddling its edge.
- [x] 3 different hero treatments, and no section appears on two homes
- [x] **Two faces only:**
  - Bodoni Moda (display): the fashion serif the brief asks for, for salons
  - Figtree (body): has tabular figures and covers $ £ € ₦
- [x] **9 brand tokens on `:root`:**
  - ink #1E1A17
  - accent #9A4A2C (clay)
  - surface #FFFFFF
  - raised #F4EEE8
  - body #3B3430
  - muted #6B625C
  - line #E2D9D1
  - `--fixed-error` #B42318
  - `--fixed-scrim` #000
- [x] **Banned and checked against:**
  - eyebrows
  - boxed cards
  - pills/badges
  - icon tiles
  - step numerals
  - stat rows
  - logo walls
  - carousels
  - left stripes
  - decorative gradients and shadows
  - cards on photos
  - spreadsheet pages
  - uniform rhythm
- [x] Even rows 3/2/1. Responsive 320–3840. Text 12px or larger. Focus rings use currentColor. Touch targets 44px.
- [x] Book in the header on every width + sticky bar on phones. The booking request flow says it hands off to the salon's booking system.
- [x] Prices in full with duration and "from", in a single currency setting (default $, Sample), shown as a menu list, not a table. Hours + address + map link in every footer.
- [x] Not country-specific: neutral fictional address, no real city or regulator; "certified" / "qualified" instead of NVQ / City & Guilds
- [x] At most one table on the whole site (none planned); sections are media-led
- [x] Stylist qualifications shown as "Certified colourist · 9 years" (Sample)
- [x] Patch test 48h before any colour; consultation for colour corrections; deposit and late-arrival policy
- [x] Before/after only as a consented pair, labelled "individual result"; otherwise a single result
- [x] Fictional notice in the footer. Sample labels on every price, rating, qualification and address. Emails use `@maren-salon.example`.
- [x] Photos: at least 14 distinct, credited, zoom-checked (no product bottle brands, shop signs or logo tees); faces flagged demo
- [x] Logo kit: mark, mono, light/dark lockups, favicon, logo-system.md. Logo is an `<img>` in the header, menu, footer and 404.
- [x] Every card opens its own record; filters show count, reset and empty; stress records (long name, no photo)
- [x] Score only after the evidence checklist; spec download only at 100; no screenshots in the package

## Homes (from category-plan.md)
| | Hero | After the hero | Main visitor job |
|---|---|---|---|
| **Home 1** | Oversized Bodoni headline + inset photo (a real-size photo panel, not a thumbnail) | SIG price list by stylist level → gallery mosaic → team with "book with" → 2 reviews + rating line → hours + map | New client: prices → book |
| **Home 2** | Asymmetric split with a tall portrait (stylist at work) | Treatment feature (balayage) → dotted price menu → before/after (consented) → team rail → voucher chooser | Choosing a colour service |
| **Home 3** | Filmstrip of the work (5 photos) | Founder note → SIG → qualifications line → dated journal → hours + map | Regular client: book again, see what's new |

**Signature tool:** price list with a stylist-level switch (Stylist / Senior / Creative director). Every line re-prices, and "Book this" carries the service and level into `book/`.
