# 31 Maren — Phase 2 handoff (hair salon · 05 Beauty & Wellness · kind: salon)
Fictional business. All prices, ratings, qualifications and reviews are Sample. **Not tested with real users** — section choices are reasoned (see section-rationale.md); measure Book clicks per home once live.

## Files
- `designs/31 Maren.dc.html` + `31-maren-data.js` (all content in `window.MR31`) + `support.js`, `assets/31/` (logo kit + 15 photos — Phase 2 replaces photos, see asset-manifest.csv)
- `spec/`: brand.md, tokens.json, logo-system.md, section-rationale.md, wireframes (`31 Maren Wireframes.dc.html`), contrast.md, page-state-register.md, qa-report.md
- No screenshots (handoff rule 18 Oct).

## Route map → static export (folder/index.html)
| Route | Export path |
|---|---|
| home (Home 1/2/3 demo) | `/index.html` |
| services | `/services/` |
| treatment ×4 | `/services/<id>/` |
| team, person ×5 | `/team/`, `/team/<id>/` |
| gallery | `/gallery/` |
| vouchers | `/gift-vouchers/` |
| book | `/book/` |
| about | `/about/` |
| contact | `/contact/` |
| policies | `/policies/` |
| careers | `/careers/` |
| journal, post ×3 | `/journal/`, `/journal/<id>/` |
| privacy | `/privacy/` |
| notfound | `/404.html` |

## briefs/checks.json compliance (shared + 05-beauty-wellness › salon)
| Check | Requirement | Status | Evidence |
|---|---|---|---|
| shared.pages | privacy\|legal\|privacy-policy | PASS | `/privacy/` |
| shared.files | `404.html` | PASS | notfound route → `/404.html` |
| shared.footerLinks | privacy/ | PASS | footer column B "Privacy" |
| shared.terms | "fictional" | PASS | footer: "Maren is a fictional salon" |
| shared.terms | "Sample" | PASS | prices, reviews, address, ratings labelled Sample |
| shared.fonts.bodyTabular | tabular figures in body | PASS | frame `font-variant-numeric: tabular-nums` |
| shared.fonts.coverage | glyph coverage | PASS | Figtree + Bodoni Moda (Latin, Latin Ext) |
| salon.pages | services\|treatments\|price-list | PASS | `/services/` |
| salon.pages | team | PASS | `/team/` |
| salon.pages | gallery | PASS | `/gallery/` |
| salon.pages | gift-vouchers\|gift-cards\|vouchers | PASS | `/gift-vouchers/` |
| salon.pages | about | PASS | `/about/` |
| salon.pages | contact\|find-us | PASS | `/contact/` |
| salon.pages | policies | PASS | `/policies/` |
| salon.headerLinks | services/, team/, contact/ | PASS | desktop nav + mobile menu |
| salon.footerLinks | policies/ | PASS | footer column B |
| salon.terms | `\d+ ?min` | PASS | durations on every service ("45 min") |
| salon.terms | cancellation | PASS | policies + services teaser |
| salon.terms | patch test\|consultation | PASS | Home 1 first visit, Home 2 band, booking check |
| salon.terms | opening hours | PASS | Home 3 hours band, footer, contact |
| salon.terms | deposit\|late arrival | PASS | policies |
| House | emails `.example`, no real places/regulators, one currency (`$`) | PASS | grep: only *.example addresses |

## States
Booking (4 steps, field errors, sending, request sent), vouchers (error/sending/done), contact, careers apply, rebook reminder (Home 3: error/sending/done), gallery filter (Bridal = empty) + lightbox, services level re-price, mobile menu (Esc closes), sticky Book/Call bar on mobile.

## Editing for buyers
Brand colours and fonts = CSS vars on `[data-v31="frame"]`; logo = `logo-lockup-*.svg`; content = `31-maren-data.js`; currency symbol = one setting in data.


## Build-ready rules (DESIGN-GUIDELINES §11) — applied 18 Oct 2026
| Rule | Status | Evidence |
|---|---|---|
| Shot list first | PASS | spec/shot-list.md (gaps listed for Phase 2) |
| No chips/pills, grey boxed cards, coloured box per item, eyebrows, left stripes, cards on photos | PASS | option groups converted to underline text buttons |
| First screen 1440×900 + 1536×730 | PASS | headline + primary Book CTA above 730px on all 3 homes (Home 1 text column moved to top of hero: CTA 870 → 594px) |
| Heroes display-only | PASS | no forms/tools in any hero |
| MOTION.md for GSAP (ScrollTrigger, prefers-reduced-motion off-switch) | PASS | spec/MOTION.md |
| Safe form field names | PASS | every input/select/textarea has a plain `name` (name, email, phone, message, service…) |
| Credits filled | PASS | spec/asset-manifest.csv |
| 9 brand tokens | PASS | CSS vars on the frame, spec/tokens.json |
| No screenshots in package | PASS | — |
