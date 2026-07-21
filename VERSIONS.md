# MRCS Tracker — Version Log

**The live app is always `index.html`** (served by GitHub Pages). `v116.html` is a
redirect to it (kept so the existing bookmarked URL keeps working). Full source
history lives in git commits + tags. **Do not commit `vNNN.html` snapshot files** —
that pile is what buried the real build under V108 for months.

| Live since   | Tag       | Build | Notes |
|--------------|-----------|-------|-------|
| 2026-07-21   | `v117.0`  | v116.html lineage, v117 feature-complete | CSC blitz: Hit List, in-app Drill, New Attempt wizard, settings modal, drill desktop sidebar. `EXAM_DATE` = 9 Sep 2026. Internal `<title>` cosmetically still reads "V115" — fix in the next build. |
| (until 21 Jul '26) | — | **V108** | Old pre-April-2026 baseline that had been stuck live at the root URL while every v116/v117 build shipped only as a version *file*. |

Older builds v110–v116 remain retrievable from git history if ever needed (history not rewritten).

## Release ritual (going forward — one live file, no clutter)
1. Build/validate the new single file (jscheck PASS, headless boot 0 errors).
2. Copy it over `index.html`.
3. `git add -A && git commit -m "vX.Y: <summary>" && git tag vX.Y && git push --tags origin main`
4. Add a row here. No new `vNNN.html` file in the repo.
