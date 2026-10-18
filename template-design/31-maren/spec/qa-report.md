# 31 Maren — QA (score 1, 18 Oct 2026)
Method: DESIGN-GUIDELINES §10 + manual gates A–F + briefs/checks.json, run live on the preview. Evidence below.

| Check | Result | Evidence |
|---|---|---|
| Brand first | PASS | logo kit, brand.md (tokens, type roles, voice, imagery), tokens.json |
| Plan + wireframes | PASS | 31 Maren Wireframes.dc.html (brand board, 1a–1f, task walk-through); build matches (H1 first-visit, H2 patch band, H3 rebook reminder added) |
| Section rationale | PASS | section-rationale.md — visitor, business result, reaction, metric per section |
| No repeated layouts | PASS | no section shared between homes; differs from 11–22 hero/section patterns |
| Overflow | PASS | 108 views (18 routes × 1440/1180/1024/768/390/320): 0 |
| Text ≥12px | PASS | 0 below 12px |
| Type sizes | PASS | 17 sizes (13–76) |
| Dead links | PASS | 0 `href="#"` without action |
| Contrast | PASS | 13/13 (contrast.md) |
| Forms + states | PASS | booking, vouchers, contact, apply, rebook: error/sending/done |
| Filter / empty | PASS | gallery Bridal = empty + reset |
| Stress records | PASS | journal j3 long title + no image |
| checks.json | PASS | all shared + salon checks (README table) |
| Fictional / Sample / .example / no real places | PASS | grep |
| Photos | PASS (Phase 2 replaces) | 15 credited, maker marks retouched/cropped, manifest |
| User testing | NOT VERIFIED | not tested with real users — stated in README |

Gates A–F: PASS. **Score: 100/100 — ACCEPTED** (user testing is out of scope for templates and declared).
