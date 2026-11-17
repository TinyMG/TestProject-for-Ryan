# Benchmarks — CAD music-school figures and sources

Accumulated by runs. Every run reads this before researching and appends
anything new worth reusing. Format per entry:

```
### YYYY-MM-DD — Source name (URL)
What it provides; the numbers worth reusing.
```

## Entries

### 2026-11-12 — Miralles Music Academy pricing (https://www.mirallesmusic.com/pricing)
Live source of truth for this school, re-verified every run. Tuition tiers:
L1 $160/$230/$300 and L2 $199/$285/$365 per month (30/45/60-min weekly);
$50 annual registration per new student (waived same day as free trial);
bi-annual billing -7%, annual -14%; flat monthly fee, 43 lessons/year;
GST not included; $10 late fee; no lessons in August on annual plans.

### 2026-11-12 — CAD music-school tuition survey (5 sources, verified in Playwright browser)
Tuition per month, 30/45/60-min weekly private lessons, CAD. All five pages
opened and figures extracted from rendered pages (browser_navigate +
browser_evaluate), 2026-11-12:
- Blue Note School of Music, Surrey BC (https://www.bluenotemusic.ca/rates): $117/$175.50/$234; premium named teacher $126/$189/$252
- Footprints Music, ON (https://footprintsmusic.ca/pricing/): $148/$222/$296; $35 registration fee
- Toronto Faculty of Music (https://www.torontofacultyofmusic.com/pricing-registration): $165/$245/$330
- Student of Music home studio (https://studentofmusic.ca/prices): $130/$195/$260
- Da Capo Academy, Toronto (https://www.dacapomusic.ca/rates): per-lesson $32.50/$44/$57.50 ≈ $140/$190/$248 monthly-equivalent
Takeaway: Miralles L1 ($160/$230/$300) is mid-to-upper market; L2 ($199/$285/$365) is premium-top. Registration fees ($35-$50) are common practice.

### 2026-11-12 — Teacher pay as share of tuition (industry sources)
- 45-55% of lesson revenue is the healthy band; outside it, "something in the model is off" (https://sevenconsulting.co/blog/how-to-pay-music-teachers, 2026-04)
- Working 200-student school targets: teachers ~50% of gross, admin 10-15%, marketing 10-15% (https://opus1.io/resources/podcast/the-music-school-flip/, 2026-06)
- Owner-practitioner reports 50-65% to teachers (r/pianoteachers, 2024-2026)
Takeaway: default teacher-pay assumption 50% of tuition revenue; treat ≥65% as a red flag worth surfacing in the dashboard.

## Placeholder guidance (delete as entries accumulate)

Useful benchmark types to collect over time:
- Typical tuition ranges for private music lessons in Canadian cities
- Teacher compensation as a share of tuition (common ranges: 40-60%)
- Fixed-cost ratios for small studios (rent as % of revenue)
- Enrollment-to-teacher ratios (students per teacher per week)
