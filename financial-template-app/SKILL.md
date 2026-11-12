---
name: building-financial-template-app
description: Researches a sample financial-template URL online and regenerates a local static web app for Miralles Music Academy containing business-plan financials, an operating budget, and a one-page decision dashboard, pre-filled with the school's real numbers. Use when the user shares a sample financial template, business-plan, or pricing page URL; asks to research financial templates for a music school; or asks to rebuild or update the financial web app.
---

# Building the Financial Template Web App

Turn any sample financial template found online into a consistent, local,
double-click-to-open web app for Miralles Music Academy. One run = one sample
URL = one fully regenerated app.

## Run progress

```
Run progress:
- [ ] Step 0: Read inputs (profile, learnings, benchmarks)
- [ ] Step 1: Research the sample URL, write research-brief.md
- [ ] Checkpoint 1: brief approved by owner
- [ ] Step 2: Generate the web app from the brief
- [ ] Step 3: Verify in headless browser
- [ ] Checkpoint 2: screenshots + verification note approved
- [ ] Step 4: Update learnings and benchmarks
```

## Step 0: Read inputs

Read all three before anything else:

1. `school-profile.md` (project folder) - owner facts: 90 students/week, 6 teachers
   incl. owner, CAD/GST, programs, app purpose (personal business decisions).
2. `references/learnings.md` - what past runs learned. Apply it.
3. `references/benchmarks.md` - accumulated CAD music-school benchmark sources.

## Step 1: Research the sample URL

1. Open the sample URL with the headless browser tools. Extract its anatomy:
   sections, line items, metrics, layout patterns, what it repeats per period.
2. Re-verify live pricing at https://www.mirallesmusic.com/pricing (tuition
   tiers, registration fee, bi-annual/annual discounts, policies). Never trust
   remembered numbers - always pull them fresh this run.
3. Gather 2-4 CAD music-school benchmark figures (typical tuition ranges,
   teacher-pay ratios, expense ratios) to sanity-check assumptions. Add any
   good source to `references/benchmarks.md`.
4. Fill `assets/research-brief-template.md` completely and save it as
   `research-brief.md` in the project folder. Follow
   `references/research-brief-guide.md` for how to judge adopt vs. adapt.
   Mark every number as [LIVE] (from the school site this run) or
   [ASSUMPTION] (editable default).

-> STOP - Checkpoint 1: present the brief to the owner: sections found, the
adopt-vs-adapt table, proposed default numbers, and sources. Ask for approval
or corrections. Do not write any code before approval.

## Step 2: Generate the web app

1. Copy `assets/app-scaffold/` (index.html, styles.css, app.js) into the
   project folder.
2. Fill content ONLY from `research-brief.md` + `school-profile.md`. Never
   from memory of the scraped pages.
3. Single numbers model: every displayed number comes from `DEFAULTS` in
   app.js; totals, margin, and break-even are computed in one place. No
   hardcoded numbers in HTML, ever.
4. Replace the scaffold's DEFAULTS with the brief's numbers. Owner edits live
   only in localStorage - the regenerated files always start fresh.
5. Tab 3 is a decision dashboard: monthly revenue/expenses/net, break-even
   enrollment, students-per-teacher vs. profile capacity, and what-if levers
   (tuition %, enrollment %, expenses %).
6. All money CAD, tax-exclusive; label GST separately.

## Step 3: Verify

Run in this exact order using the headless browser tools:

1. Open the generated `index.html` (file:// URL).
2. Assert zero console errors (`browser_console_messages`).
3. Click all three tabs; each renders populated content.
4. Assert no blank number fields.
5. Recompute independently from the model: per-tier revenue, expense total,
   net, margin, break-even. Compare with displayed values; they must match.
6. Screenshot each tab.
7. Write `verification-note.md` in the project folder: each check, its
   result, and any discrepancy found and fixed.

-> STOP - Checkpoint 2: show the screenshots and the verification note. Owner
approves, or sends corrections back to Step 2 (then re-run Step 3 only).

## Step 4: Feedback

Append terse entries (a few lines each):

1. `references/learnings.md`: date, sample URL, what structure worked, which
   sources were reliable, which brief/app sections the owner engaged with.
2. `references/benchmarks.md`: any new benchmark source or range worth reusing.

## Guardrails

- The app is static: no build step, no server, no CDN links. Works offline.
- Every run regenerates the whole app; consistency across runs comes from the
  scaffold, so never redesign it mid-run.
- If the sample is a spreadsheet, reproduce its logic as model fields, not a
  picture of a spreadsheet.
- If the sample URL is unreachable or needs a login, ask the owner for a
  screenshot or a description instead of guessing.
