# MRCS Tracker — Version Log

**The live app is always `index.html`** (served by GitHub Pages). `v116.html` is a
redirect to it (kept so the existing bookmarked URL keeps working). Full source
history lives in git commits + tags. **Do not commit `vNNN.html` snapshot files** —
that pile is what buried the real build under V108 for months.

| Live since   | Tag       | Build | Notes |
|--------------|-----------|-------|-------|
| 2026-07-23   | `v118.0`  | v117 + Simulator port + Supabase single source | (1) Simulator (`simulator.html`) now runs the Tracker's own timer panel as a left sidebar on desktop: break system, confidence tagging, scratchpad, checkpoints, auto-scored Surgeon's Report — the whole flow that used to require manual counter taps + score entry, now auto-fed from question events. (2) Simulator writes finished sessions straight into the Tracker's localStorage keys (`mrcs-sessions-v38` / `mrcs-review-bank-v38` / `mrcs-tracker-v38`) as a revision pass (PT→rpa, EM→rea) AND pushes them to Supabase — a Simulator session now shows up in the Tracker's Performance/Streak/Focused-Time/Heatmap the moment you reload it. (3) Question bank migrated to Supabase (`mrcs_questions`, 2367 rows, read-only RLS, `is_csc` flag for the 547-question CSC subset). Both apps now go through an IndexedDB-cached, cache-first loader sharing one on-disk copy same-origin — Tracker's CSC drill and Simulator's exam both read from it, `data/questions_*.json` demoted to last-resort fallback. Bug fix along the way: a Simulator break used to wipe the scratchpad, break tally, confidence log and error counts because `startTimer` re-initialised sidebar state on every resume; state now initialises once per session id and snapshots into the saved session, surviving both breaks and page refresh. Internal `<title>` cosmetic bug from v117 also fixed. |
| 2026-07-21   | `v117.0`  | v116.html lineage, v117 feature-complete | CSC blitz: Hit List, in-app Drill, New Attempt wizard, settings modal, drill desktop sidebar. `EXAM_DATE` = 9 Sep 2026. Internal `<title>` cosmetically still reads "V115" — fix in the next build. |
| (until 21 Jul '26) | — | **V108** | Old pre-April-2026 baseline that had been stuck live at the root URL while every v116/v117 build shipped only as a version *file*. |

Older builds v110–v116 remain retrievable from git history if ever needed (history not rewritten).

## Release ritual (going forward — one live file, no clutter)
1. Build/validate the new single file (jscheck PASS, headless boot 0 errors).
2. Copy it over `index.html`.
3. `git add -A && git commit -m "vX.Y: <summary>" && git tag vX.Y && git push --tags origin main`
4. Add a row here. No new `vNNN.html` file in the repo.
