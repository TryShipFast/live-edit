# 32 Third Chair — Phase 2 handoff (barbers · 05 Beauty & Wellness · kind: salon)
Fictional business. All prices, ratings, qualifications and the address are Sample. **Not tested with real users** — section choices are reasoned (see spec/section-rationale.md); measure Book clicks and hold-my-spot submits per home once live.

## Files
- `designs/32 Third Chair.dc.html` + `32-third-chair-data.js` (all content in `window.TC32`) + `support.js`, `assets/32/` (logo kit + 7 photos — Phase 2 replaces photos, see asset-manifest.csv)
- `spec/`: brand-voice.md, tokens.json, type-scale.md, logo-system.md, direction-approval.md, section-rationale.md, wireframes (`32 Third Chair Wireframes.dc.html`), contrast.md, page-state-register.md, qa-report.md
- No screenshots (handoff rule 18 Oct).
- Props: `currency` (default `$`), home demo + device switch via demo bar.

## Route map → static export (folder/index.html)
| Route | Export path |
|---|---|
| home (Home 1/2/3 demo) | `/index.html` |
| services, service ×4 | `/services/`, `/services/<id>/` |
| team, barber ×4 | `/team/`, `/team/<id>/` |
| gallery | `/gallery/` |
| book | `/book/` |
| vouchers | `/gift-vouchers/` |
| club | `/cut-club/` |
| about | `/about/` |
| contact | `/contact/` |
| policies | `/policies/` |
| journal, post ×3 | `/journal/`, `/journal/<id>/` |
| privacy | `/privacy/` |
| notfound | `/404.html` |

## briefs/checks.json compliance (shared + 05-beauty-wellness › salon)
| Check | Requirement | Status | Evidence |
|---|---|---|---|
| shared.pages | privacy\|legal\|privacy-policy | PASS | `/privacy/` |
| shared.files | `404.html` | PASS | notfound route → `/404.html` |
| shared.footerLinks | privacy/ | PASS | footer bottom row "Privacy" |
| shared.terms | "fictional" | PASS | footer: "Third Chair is a fictional business" |
| shared.terms | "Sample" | PASS | prices, ratings, slots, address labelled Sample |
| shared.fonts.bodyTabular | tabular figures in body | PASS | frame `font-variant-numeric: tabular-nums` |
| shared.fonts.coverage | glyph coverage | PASS | Red Hat Text + Big Shoulders Display (Latin, Latin Ext) |
| salon.pages | services\|treatments\|price-list | PASS | `/services/` |
| salon.pages | team | PASS | `/team/` |
| salon.pages | gallery | PASS | `/gallery/` |
| salon.pages | gift-vouchers\|gift-cards\|vouchers | PASS | `/gift-vouchers/` |
| salon.pages | about | PASS | `/about/` |
| salon.pages | contact\|find-us | PASS | `/contact/` |
| salon.pages | policies | PASS | `/policies/` |
| salon.headerLinks | services/, team/, contact/ | PASS | desktop nav + mobile menu |
| salon.footerLinks | policies/ | PASS | footer bottom row "Policies" |
| salon.terms | `\d+ ?min` | PASS | durations on every service ("30 min") |
| salon.terms | cancellation | PASS | policies + booking step 4 |
| salon.terms | patch test\|consultation | PASS | colour service + policies (patch test 48h) |
| salon.terms | opening hours | PASS | footer "Opening hours" + Home 1 hours |
| salon.terms | deposit\|late arrival | PASS | booking deposit note + policies |

## Also met (project rules)
Country-neutral (fictional "Market Quarter"), one currency prop, no comparison table (prices as columns/cards), emails `.example`, no real regulators, heroes display-only (hold-my-spot sits in the section after the hero), Lucide-style icons, Sample on every claim.

## Done criteria
Layouts unique vs 31 and earlier · branding defined · QA 100/100 (spec/qa-report.md).

## Build-ready rules (DESIGN-GUIDELINES §11) — applied 18 Oct 2026
| Rule | Status | Evidence |
|---|---|---|
| Shot list first | PASS | spec/shot-list.md (gaps listed for Phase 2) |
| No chips/pills, grey boxed cards, coloured box per item, eyebrows, left stripes, cards on photos | PASS | option groups converted to underline text buttons |
| First screen 1440×900 + 1536×730 | PASS | headline + primary Book CTA above 730px on all 3 homes |
| Heroes display-only | PASS | no forms/tools in any hero |
| MOTION.md for GSAP (ScrollTrigger, prefers-reduced-motion off-switch) | PASS | spec/MOTION.md |
| Safe form field names | PASS | every input/select/textarea has a plain `name` (name, email, phone, message, service…) |
| Credits filled | PASS | spec/asset-manifest.csv |
| 9 brand tokens | PASS | CSS vars on the frame, spec/tokens.json |
| No screenshots in package | PASS | — |
