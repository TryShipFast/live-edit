# 33 Lacquer Room — Phase 2 handoff (nail studio · 05 Beauty & Wellness · kind: salon)
Fictional business. All prices, ratings, durations shown as offers, qualifications and the address are Sample. **Not tested with real users** — section choices are reasoned (spec/section-rationale.md); measure colour chart → Book clicks per finish, rebook submits (Home 3) and gift requests (Home 1) once live.

## Files
- `designs/33 Lacquer Room.dc.html` + `33-lacquer-data.js` (all content in `window.LR33`) + `support.js`, `assets/33/` (logo kit + 19 photos, credits in spec/asset-manifest.csv — none "TO VERIFY")
- `spec/`: direction-approval.md (Rules applied, visitors, measures, no-repeat), brand-voice.md, tokens.json, type-scale.md, logo-system.md, section-rationale.md, shot-list.md, MOTION.md (GSAP + ScrollTrigger), wireframes (`33 Lacquer Room Wireframes.dc.html`), contrast.md, qa-report.md
- No screenshots (handoff rule 18 Oct). Props: `currency` (default `$`); home demo + device switch via demo bar.

## Brand tokens (nine, declared as CSS vars on the frame)
`--ink #2B2230` · `--accent #3F5E4E` · `--accent-deep #2F4A3D` · `--paper #EEF1EC` · `--surface #FFFFFF` · `--muted #5A5560` · `--line #C9CEC6` · `--accent-soft #DCE5DE` · `--on-ink #EEF1EC`. Fixed: error #B3261E, success #2E6B3A. *TEMPLATE-BRANDING.md was not in this project — Phase 2: rename to its nine token names if they differ; values map 1:1.*

## Route map → static export (folder/index.html)
| Route | Export path |
|---|---|
| home (Home 1/2/3 demo) | `/index.html` |
| services, treatment ×4 | `/services/`, `/services/<gel\|biab\|chrome\|pedicure>/` |
| team, person ×4 | `/team/`, `/team/<id>/` |
| gallery | `/gallery/` |
| book | `/book/` |
| vouchers | `/gift-vouchers/` |
| about · contact · policies · careers | `/about/` · `/contact/` · `/policies/` · `/careers/` |
| journal, post ×3 | `/journal/`, `/journal/<id>/` |
| privacy | `/privacy/` |
| notfound | `/404.html` |

## briefs/checks.json compliance (shared + 05-beauty-wellness › salon)
| Check | Requirement | Status | Evidence |
|---|---|---|---|
| shared.pages | privacy\|legal\|privacy-policy | PASS | `/privacy/` |
| shared.files | `404.html` | PASS | notfound → `/404.html` |
| shared.footerLinks | privacy/ | PASS | footer bottom row "Privacy" |
| shared.terms | "fictional" | PASS | footer: "Lacquer Room is a fictional business" |
| shared.terms | "Sample" | PASS | prices, ratings, slots, address, result labelled Sample |
| shared.fonts.bodyTabular | tabular figures in body | PASS | frame `font-variant-numeric: tabular-nums` |
| shared.fonts.coverage | glyph coverage | PASS | Albert Sans + Gloock (Latin, Latin Ext) |
| salon.pages | services\|treatments\|price-list | PASS | `/services/` |
| salon.pages | team | PASS | `/team/` |
| salon.pages | gallery | PASS | `/gallery/` |
| salon.pages | gift-vouchers\|gift-cards\|vouchers | PASS | `/gift-vouchers/` |
| salon.pages | about | PASS | `/about/` |
| salon.pages | contact\|find-us | PASS | `/contact/` |
| salon.pages | policies | PASS | `/policies/` |
| salon.headerLinks | services/, team/, contact/ | PASS | desktop nav + mobile menu |
| salon.footerLinks | policies/ | PASS | footer bottom row "Policies" |
| salon.terms | `\d+ ?min` | PASS | every treatment ("45 min") |
| salon.terms | cancellation | PASS | policies + booking step 4 |
| salon.terms | patch test\|consultation | PASS | BIAB/extensions note + policies |
| salon.terms | opening hours | PASS | footer + Home 2 hours band |
| salon.terms | deposit\|late arrival | PASS | booking deposit note + policies |

## Build-ready notes (build team, 18 Oct)
- Shot list written first-pass; gaps listed honestly (skin-tone range, pedicure, street entrance) in spec/shot-list.md.
- No pill tags/chips, eyebrows, left stripes, grey boxed cards, cards on photos: options are text buttons with an underline + weight.
- First screen checked at 1440×900 and 1536×730 on all three homes: headline, line, main button and a real-size photo visible.
- Heroes display-only (photo, headline, one line, 1–2 buttons); the colour chart sits below the hero.
- Form field keys are prefixed (`bk_`, `gf_`, `ct_`, `ap_`) — no `name`, `id`, `action`, `method`, `length`, `submit`, `children`.
- Country-neutral (fictional Mill District), one currency prop, emails `.example`, no real regulators.

## Done criteria
Layouts unique vs 31/32 and earlier · branding defined · QA 100/100 (spec/qa-report.md).
