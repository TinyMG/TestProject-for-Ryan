# Learnings — what past runs learned

Feedback deposit box. Every run reads this first and appends at the end
(Step 4). Keep entries terse. Format per entry:

```
### YYYY-MM-DD — sample URL
Worked: ...
Avoid: ...
Owner engaged with: ...
```

## Entries

### 2026-11-12 — https://www.hellocashflow.com/
Worked: Playwright MCP for ALL online research (sample pages, live pricing,
5 benchmark sites) per the new rule - browser_navigate + browser_evaluate
text extraction was fast and reliable; the sample is a SaaS *product* page,
and harvesting its feature anatomy (health-check verdicts, five questions,
scenario levers, targets) made an excellent decision-dashboard blueprint.
"Sample decides structure, school decides numbers" held perfectly.
Avoid: trusting search-aggregator figures before opening the page in the
browser (all 5 benchmark pages were then verified directly - they matched);
the Miralles live pricing page currently shows NO tier price table (verified
in rendered DOM), so tier prices must come from school-profile.md and be
flagged for owner confirmation at Checkpoint 1.
Environment: Playwright MCP blocks file:// URLs - serve the project folder
over localhost (tiny node static server) before Step 3 verification.
Owner engaged with: approved the brief (incl. pricing-page gap and open
questions) at Checkpoint 1; approved all three screenshots without
corrections at Checkpoint 2. Verdict strip and safe/tight/wait banner landed
well - keep both in future runs.

### 2026-11-16 — widget system (update run, hellocashflow.com board)
Worked: the Business Plan page became a customizable widget board (3-col
grid, sizes XS/S/M/L/XL with height-normalized sub-rows: S+S = M height,
XSx3 = M height exactly via grid-auto-rows 56px + dense flow); customize
mode (pencil button) with iOS-style wiggle, size-cycle and remove chrome,
top/bottom add strips opening a picker with FULL-SIZE LIVE previews
(modal width measured from the real board + scrollbar-gutter), and
shape/category/visual filter chips. The teacher roster became the source
of truth for the L1/L2 pricing split. KPI cards everywhere: icon +
sparkline + red/green delta vs last period; overdue card turns bright red
when there is an amount.
Avoid: PowerShell Get-Content/WriteAllLines round-trips on UTF8 files
(mangles multi-byte chars - use Node scripts for file surgery); stale
browser cache of app.js (server now sends Cache-Control: no-store);
verification queries racing async view transitions (wait between steps).
Owner engaged with: many rapid correction rounds (13 in one session) -
each verified with Playwright before presenting; the full-size picker
previews and the height-normalized sizes landed after visual references.
Keep: verdict strip, safe/tight/wait banner, sensitivity curve, MTD
month-to-date marking, previous-year modeled comparison line.

