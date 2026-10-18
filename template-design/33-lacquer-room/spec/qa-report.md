# 33 Lacquer Room — QA report (score 1, 18 Oct 2026)
Method: DESIGN-GUIDELINES §1–11 + briefs/checks.json, evidence from live scans in the preview (scripts/scan33.js). Not tested with real users.

| Area | Result | Evidence |
|---|---|---|
| Overflow 1440/768/390/1180/1024/900/320 | PASS | 182 views (26 routes × 7 widths), 0 overflow after 320 header fix (logo 150px, Book padding) |
| Text ≥12px | PASS | 0 nodes under 12px |
| Type sizes | PASS | 17 sizes (was 19: 72→64, 48→44, 17→16) |
| Dead controls | PASS | 0 at desktop |
| Contrast | PASS | 18/18 pairs (contrast.md) |
| Same photo twice in one view | PASS | 0 after fixing 4 home repeats (confirmation scan) |
| Photos credited | PASS | 19 kept, 4 rejected, no "TO VERIFY" |
| Shot list | PASS | shot-list.md; gaps stated (skin-tone range, pedicure, entrance) |
| No chips/pills/eyebrows/stripes/grey boxed cards/cards on photos | PASS | 7 option groups converted to underline text buttons |
| First screen 1440×900 + 1536×730 | PASS | headline, line, main button and photo visible on Homes 1–3 (Home 1 button bottom 705px) |
| Heroes display-only | PASS | no forms/tabs/arrows in any hero; chart below hero |
| Unique layouts vs 31/32 | PASS | direction-approval no-repeat list; no section shared across homes |
| Branding | PASS | logo kit, 9 tokens, type roles, voice |
| MOTION.md (GSAP) | PASS | MOTION.md |
| Form field names | PASS | prefixed keys, no browser built-ins |
| Sample / fictional / .example | PASS | 32 Sample labels, footer fictional note, .example emails |
| checks.json shared + salon | PASS | README table, every line |
| Section rationale + wireframes | PASS | section-rationale.md, wireframes DC with task walk-through |

**Score: 100/100 — ACCEPTED.** Gates A–F PASS.
Open for Phase 2 (not scored as defects, disclosed): photo skin-tone range, pedicure photo, street entrance photo; TEMPLATE-BRANDING.md token names to confirm.
