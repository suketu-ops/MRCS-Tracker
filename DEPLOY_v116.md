# MRCS Tracker v116 — Deployment Guide

## ⚠️ STEP 0 — RESTORE SUPABASE FIRST (do this before testing sync)
The project is auto-paused. Until you restore it, **all sync silently fails**.
1. Go to **https://app.supabase.com/project/focpimwvdhganadhgwid**
2. Click **"Restore project"** → wait ~2 minutes.
3. After opening v116, open the **☁️ Supabase panel** and **re-enter your Project URL + anon key** (they live in `localStorage`, not in the file — they are not baked in).

---

## What v116 adds (8 features + native CSC drill)
1. **New Attempt 🎯 wizard** — set new exam date, reset counters, cycle label, auto CSC daily target.
2. **CSC Hit-List** — collapsible top-15 fail-topic checklist on home.
3. **Domain-tagged sessions** — CSC / Anatomy / ABS / PoSG / Full; Domain Breakdown + CSC progress.
4. **Confidence gate** — 🟢/🟡/🔴 before reveal (flashcards + drill); hypercorrection SRS penalty; Confident-Wrong flag.
5. **Post-session error debrief** — Knowledge/Retrieval/Reasoning + note; Error-Pattern trend.
6. **Distractor analysis** — "Why the others are wrong" (AI-generated, red cards) in card expand.
7. **Next Attempt 📊 dashboard** — new tab: status, score-projection gauge, topic priority queue.
8. **Re-Clear / CSC Drill 🔁** — serves real questions from the bundled bank (or CSV import):
   question → confidence → reveal correct + explanation → grade → SRS.

**Question bank:** extracted from MRCS-VUE.html. `data/questions_csc.json` (547 CSC Qs) loads by
default; `data/questions_full.json` (2,367 Qs, all domains incl. 652 Anatomy) via "All domains".
Loaded transiently (fetched, **not** persisted) so it never bloats sync.

---

## TWO WAYS TO DEPLOY — pick one

### Option A — Single file (simplest, proven) ✅ recommended to start
This is the validated artifact. One file, plus the data folder for the drill.
1. In GitHub repo `suketu-ops/MRCS-Tracker`, click **Add file → Upload files**.
2. Upload **`v116.html`**.
3. Create a **`data`** folder: Add file → Create new file → type `data/questions_csc.json` then paste
   that file's contents (and repeat for `data/questions_full.json`). Or use Upload files and drag both
   into a `data/` path.
4. Commit. Test at **`suketu-ops.github.io/MRCS-Tracker/v116.html`**.
5. When happy, open `index.html` → **Edit** → replace its entire contents with `v116.html`'s contents → commit.
   (The drill expects `data/` to sit next to `index.html` at the repo root — already true from step 3.)

### Option B — Multi-file folder (easier to edit going forward)
Cleanly separates HTML / CSS / JS / data. **Behaviour-identical** to Option A (the JS is the same
single `app.js`, byte-for-byte; a single external script ≡ the inline one).
1. Upload the whole **`v116/`** folder (index.html, styles.css, app.js, data/) to the repo.
2. Test at **`suketu-ops.github.io/MRCS-Tracker/v116/`**.
3. To go live: copy `v116/`'s files to the repo root (index.html, styles.css, app.js, data/).

> **Note on "many small JS files":** this was explored but is **not safe without a build step**.
> The app relies on single-script hoisting (top-level code calls functions defined later); splitting
> the logic into multiple sequential `<script>` files breaks that (the app renders only partially).
> A runtime loader could reassemble them, but it's fragile (deprecated sync-XHR + eval) and not worth
> risking a tool you depend on. The safe granular unit is **one `app.js`** (Option B).

---

## After deploy
1. Tap **New Attempt 🎯** → set your next exam date + cycle label → counters reset, countdown updates.
2. Re-enter Supabase creds (Step 0) → **Pull All**.
3. Open **Re-Clear 🔁 → 📚 CSC bank (547)** → pick topics (optional) → Start.

---

## New jsonb fields (all ride EXISTING columns — no schema migration)
| Table | Field | Notes |
|---|---|---|
| `mrcs_settings` | `rev_goals._attempt` `{examDate,cycleLabel,cycleStartDate,cscDaily}` | New Attempt wizard |
| `mrcs_settings` | `csc_hitlist` (top-level, like `morning_quiz_map`) | Hit-list cleared map |
| `mrcs_settings` | `exam_mode_map.__reclear__` | CSV re-clear queue (bank drill is NOT persisted) |
| `mrcs_sessions` | `extra.domain` | 'csc'/'anatomy'/'abs'/'posg'/'full' |
| `mrcs_sessions` | `extra.confidence_log` | per-question 🟢/🟡/🔴 |
| `mrcs_sessions` | `errors.note` | debrief free-text (know/retrieval/reasoning unchanged) |
| `mrcs_sessions` | `extra.reclearRate/reclearAnswered/reclearFlagged/sessionType` | re-clear/drill stats |
| `mrcs_cards` | `extra.distractor_notes` + `extra.distractor_ai` | AI "why others wrong" |
| localStorage | `mrcs-csc-hitlist`, `mrcs-reclear-queue`, `mrcs-cycle-start` | client mirrors |

---

## Verification done
- JS syntax: **PASS** (JavaScriptCore `new Function` compile-check — Node isn't installed here).
- Sacred functions: all 6 present, 1 definition each, unrenamed.
- 19 new UI handlers → all defined; 75 new functions, 0 collisions; no global redeclarations.
- Headless-Chrome boot of the monolith: **0 errors**, all 8 features render, data files serve.
- Split: `app.js`/`styles.css` byte-identical to the validated monolith.
- **Still needs YOUR on-device testing:** live Supabase sync, Gemini distractor generation, the
  interactive drill/confidence/debrief flows, and the 390px iPhone layout.
