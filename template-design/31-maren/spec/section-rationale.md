# 31 Maren — why each hero and section exists (rev1, 18 Oct 2026)
Source of every reason: `briefs/05-beauty-wellness.md` (visitor table, "done when"), `kastsbuild/CATEGORY-GUIDE.md` Beauty, `research-brief.md` Beauty. A section that can't name the visitor job it serves is cut.

## Organising idea: one home per visitor from the brief's table
| Home | Built for | Brief evidence | What the first two screens must answer |
|---|---|---|---|
| 1 | **New client** | "See the place and the results; check prices; find a time; book" | What is it like, what does it cost, who will do it |
| 2 | **Colour client** (highest ticket, longest visit) | "Hygiene and safety: patch tests, consultations"; research: "signature treatment pages explain technique, duration and price" | Is a 3-hour, $190 appointment worth it and what happens in it |
| 3 | **Regular client** | "Book again; check opening hours; change an appointment" | Rebook my usual in two taps; when are you open late |

So the three homes differ because their reader differs, not for variety's sake.

## Home 1 — new client
| Section | Job it serves | Why this form |
|---|---|---|
| Hero: oversized serif headline + real salon photo + Book / See prices | Decide "is this my kind of place" in 3 s | Brief type rule: salons are "editorial, a fashion serif"; brief: "Book always one tap away". Display only (repo rule: no tools in heroes) |
| Pricing table by stylist level (3 tier cards) | "Check prices" — the #1 new-client job | The real question salons get is *why does the same cut cost different amounts*; three tier cards answer it at a glance. The only table-like block on the site (user rule: tables only where needed). Full menu stays on Services |
| Recent work mosaic | "See the results" | Brief: "the space and real results"; mosaic hero is listed in the brief, used here as a section instead |
| Team rail | Trust from people | Research: "stylist profiles with credentials set the top sites apart"; each card links to the stylist page + "book with" |
| Reviews (3 quotes) | Reassurance before booking | Brief section form: "two or three quotes with first name and treatment" |
| Visit: map, hours, address | "Find a time / find us" | Brief: "opening hours and address… with a map" |

## Home 2 — colour client
| Section | Job | Why this form |
|---|---|---|
| Hero: tall photo of a stylist at work, split | Show the craft before the price | High-ticket buyers judge skill first; the photo is the proof |
| Balayage feature | Understand the signature service | Research: signature treatments need technique + duration + price |
| Colour menu (staggered shape cards) | Compare colour options and prices | Colour is the group this reader shops; cards in three shapes so the six options scan as distinct choices (user rule: varied card patterns) |
| Appointment timeline (0:00 → 3:00) | "What happens in 3 hours?" — the main colour anxiety | No other salon job needs this; a time axis is the honest form for a long visit |
| Team rail filtered to colourists | Choose who does it | Colour clients pick the person, not just the service |
| Gift-voucher picker | Gift buyer (brief visitor 4) | Colour is the most-gifted service; amount picker hands off to the voucher page |

## Home 3 — regular client
| Section | Job | Why this form |
|---|---|---|
| Hero: film strip of recent work + "Book your usual" | Rebook fast | Brief "done when": booking within two taps of home |
| Note from Ines (owner) | Relationship / what's new | Regulars come back for people; a signed note is the salon equivalent of a newsletter |
| Book your usual: next free times | "Book again" | Shows slots as text, links into the booking request — not a widget in the hero |
| What every appointment includes | Reconfirm the standard (consultation, patch test) | Brief: consultations and patch tests stated plainly |
| Journal | Aftercare and trend reading between visits | Gives regulars a reason to return to the site |
| Late Thursdays band | "Check opening hours" | The one hours change a regular needs to know |

## Inner pages
- **Services:** category cards with service tiles — the full menu (brief: "full price list grouped by category, each with duration and price"). Note: the brief suggests dotted-leader lists; the user's 18 Oct rule (modern cards, tables only where needed) overrides it.
- **Treatment ×4:** arch-top photo cards on Services lead in; detail pages carry steps, aftercare and the patch-test notice.
- **Team / person:** portrait, qualification (Sample), specialism, "book with".
- **Gallery:** filter + empty state (Bridal) + lightbox — "see the results".
- **Vouchers, Book, Policies, Contact, Careers, Journal, Privacy, 404:** each maps to a page in the brief's page list or checks.json salon kind.

## Business and UX check (does it earn money, how will a visitor react)
Salon revenue levers: **new bookings**, **average ticket** (colour, treatments, senior stylists), **rebooking rate**, **vouchers**, **fewer no-shows/phone calls**. Each section must move one.

| Section | Business lever | Expected visitor reaction (UX reasoning) | Risk / fix | Metric Phase 2 can track |
|---|---|---|---|---|
| H1 hero + Book | New bookings | Recognises the place, sees Book without scrolling (Fitts: big target, top-right + sticky on phone) | Hero has no proof of availability → add "Next free chair: Thu 4pm" line (present) | Book clicks from hero |
| H1 pricing tiers | Ticket mix (upsell to Senior) | Price anxiety drops; anchoring: middle tier highlighted, most choose it | Higher prices may scare some → "from" + Stylist tier first | Tier → Book clicks |
| H1 mosaic / reviews | Conversion (trust) | Social proof right after price, when doubt peaks | Photos must be the real salon (Phase 2) | Scroll depth |
| H2 colour cards + timeline | Highest-ticket service | Removes the "3 hours of what?" fear; patch-test rule stated before booking cuts failed visits | Long page on phone → timeline collapses to a vertical list | Colour bookings, patch-test no-shows |
| H2 voucher picker | Vouchers (cash up front) | Gift buyer finds it without hunting the nav | Must hand off to booking system → stated | Voucher clicks |
| H3 book your usual + slots | Rebooking rate | Regular rebooks in 2 taps (brief "done when") | Slots are Sample → labelled; live data comes from booking system | Rebook rate |
| H3 late Thursdays | Fill quiet hours | Converts after-work clients | — | Thu evening bookings |
| Footer hours/map | Fewer calls | Answers "are you open" on every page | — | Call volume |

**Honest limits:** this is reasoned from the brief, research patterns and standard UX heuristics (Hick, Fitts, anchoring, social proof, progressive disclosure). It has **not** been tested with real users. The buyer (or Phase 2) should check booking-click rates per home and keep the home that converts.

## Cut on purpose
Stats rows, logo walls, Instagram walls, carousels, announcement bars (research "avoid" list); booking widgets inside heroes (repo rule).
