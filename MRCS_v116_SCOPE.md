# MRCS QBank Tracker Pro Max — v116 Build Scope

**Status:** ✅ BUILD COMPLETE & VALIDATED (monolith `v116.html` + safe split `v116/`). See [DEPLOY_v116.md](DEPLOY_v116.md).
> Build notes: 8 features integrated via the workflow's design specs (64 anchored edits, all syntax-checked); native CSC drill wired to the extracted 2,367-Q bank (CSC subset default). Headless-Chrome boot: 0 errors, all features render. **Granular many-small-JS-files was found UNSAFE** (single-script hoisting breaks across sequential `<script>` tags) — delivered the safe 4-file split (`index.html`+`styles.css`+`app.js`+`data/`) instead, byte-identical to the monolith.

**Original status:** Scoping complete
**Author:** Claude Code · **Date:** 2026-06-09
**For:** Suketu — MRCS Part A retake (April 2026: 174 vs 182 pass mark; CSC 17/45 = the whole gap)

---

## 0. TL;DR

Build `v116.html` by adding 8 CSC-focused features **on top of `v115.html`** (the true latest — *not* V108), then promote it to `index.html`. All 8 features are greenfield-additive: none exist in v115 yet. The six "sacred functions" are all present and must not be refactored. No build step, single HTML file, plain `fetch()` to Supabase PostgREST, Gemini already wired.

Three **pre-flight blockers** must be cleared by the user (not code): (1) restore the paused Supabase project, (2) the base is v115 not V108, (3) Supabase URL+key are entered in-app, not in-file.

---

## 1. Ground-Truth Current State (verified against live files, not assumptions)

| Claim in the build prompt | Reality (verified 2026-06-09) | Impact on scope |
|---|---|---|
| Live `index.html` is V108 | ✅ TRUE — 494 KB, 8,474 lines, `persistData`×48 | Confirmed |
| App developed to ~v115, never promoted | ✅ TRUE — repo has v110→v115 + ~30 `v114.x` iterations; `index.html` still V108 | **Base v116 on v115, not V108** |
| "Anon key already in index.html — don't change it" | ❌ Misleading — `SUPABASE_URL`/`SUPABASE_KEY` load from `localStorage` (`mrcs-supabase-url`, `mrcs-supabase-key`); pasted via the ☁️ Supabase panel | Nothing to preserve in-file; **re-enter URL+key in-app after restore** |
| Supabase project `focpimwvdhganadhgwid` paused | Cannot verify externally; v115 ships `https://xxxxx.supabase.co` placeholder | **User must restore + re-enter creds** |
| CSV format `Topic,Question_Text,Correct_Answer,Your_Answer,Explanation` | ❌ Actual columns are a **superset**: `Question_Number, Date_Attempted, Topic, Question_Text, Option_A..E, Correct_Answer, Your_Answer, Was_Wrong, Explanation` | **Step 8 parser maps the real schema** |
| Gemini 2.5 Flash cascade wired | ✅ TRUE — 90 references in v115 | Reuse as-is for Steps 6 |
| Exam countdown "0 days" | Driven by `daysToExam()` (7 refs) | **Step 1 resets its source var** |
| MRCS-VUE.html is the simulator | ✅ Separate 3.3 MB Vue artifact in `outputs/` — NOT the Tracker; has none of the sacred fns | Reference only for "simulator-style" session UI (Step 4) |

### Base file: `v115.html`
- 735,547 bytes · 13,247 lines · single file · GitHub Pages.
- Sacred functions present: `persistData`×58, `_dedupePool`×3, `injectInCardExpandContent`×3, `fetchImageCandidates`×4, `supabasePullEverything`×8, `supabaseFlushAllPending`×8.
- Sync architecture: debounced push queue (`_supabasePushQueue`, `SUPABASE_PUSH_DEBOUNCE_MS = 800`, `supabasePushItem(item)`), per-table queues (settings/tracker/session). **All new writes route through `persistData()`**, which already triggers `supabasePushItem`.
- Four tables referenced: `mrcs_cards`, `mrcs_tracker`, `mrcs_sessions`, `mrcs_settings`.
- **None** of the 8 v116 features exist (verified: 0 hits for `csc_hitlist`, `New Attempt`, `confidence_log`, `reclear_queue`, `Next Attempt`, `cycle_label`, `distractor_notes`, `Domain Breakdown`).

### Local data assets (working dir)
- `uploads/pastest_wrong_answers_FINAL -11.csv` — 14,673 rows (full multi-attempt log)
- `uploads/emrcs_wrong_questions.csv` — 1,016 rows
- `uploads/pastest_wrong_answers_ALL_598_rows.csv` — 598 rows (likely the de-duped set ≈ 549 CSC)
- `MRCS_Wrong_Answer_Revision_Compendium.md` — 1.8 MB
- `CSC_Revision_Plan.md` · `outputs/MRCS-VUE.html` (simulator)

---

## 2. The "ruflo" Question — Verdict

`ruvnet/ruflo` is a heavyweight **multi-agent orchestration meta-harness** for Claude (npm/TypeScript, MCP server, 27 hooks, swarm topologies, 100+ agents, AgentDB vector store, GOAP planning). Install: `npx ruflo init` or `/plugin install ruflo-core@ruflo`.

**It cannot be part of this app.** The hard constraints — single HTML file, no npm, no build step, no bundler — are fundamentally incompatible with ruflo as a *runtime dependency*. ruflo is a **dev-time orchestration tool**, not an app component.

**Do you even need it?** No — for *this* build I already have native equivalents:
- **Orchestration** → the built-in `Workflow` tool (deterministic multi-agent fan-out, the native analogue of ruflo's swarms).
- **QA / verification** → `code-review`, `security-review`, `verify`, `run` skills.
- **Live mobile testing** → `Claude_Preview` / `Claude in Chrome` MCP (render v116 at 390px, click through wizards).

**Recommendation:** Do **not** install ruflo for this build (it adds env-modifying hooks + an MCP server for zero benefit on a single-file app). Reserve it only if you later want a persistent autonomous agent fleet across many projects. Installing it is an environment-modifying action I'll only take on explicit say-so.

---

## 3. Pre-Flight Blockers (user action, before any sync test)

1. **Restore Supabase** → https://app.supabase.com/project/focpimwvdhganadhgwid → "Restore project" → wait ~2 min.
2. **Re-enter creds in-app** → open v116 → ☁️ Supabase panel → paste Project URL + anon key → Pull All. (They live in localStorage, not the file.)
3. **Confirm base = v115** (done — confirmed by you).

---

## 4. Feature Scope — 8 Steps

Each step: *what · where it hooks · data written · acceptance criteria*. Build order = dependency order. All persistence flows through `persistData()`; all new fields ride existing `extra` / `errors` jsonb columns (no schema migration required — see §5).

### STEP 1 — New Attempt Setup Wizard  `[foundation — build first]`
- **What:** "New Attempt 🎯" button on Settings → modal: new exam date (picker), reset-counters toggle (default ON), cycle label text, auto-calculated CSC daily target (weeks-to-exam ÷ 549 CSC items).
- **Hooks:** writes `daysToExam()` source var; resets `pastest_done`/`emrcs_done`; **preserves** SRS cards, history, heatmap, flashcard bank.
- **Writes:** `mrcs_settings`: `exam_date`, `cycle_label`, `cycle_start_date`; zeroed counters.
- **AC:** countdown updates everywhere; toast "Attempt 2 armed. CSC blitz begins now."; SRS/history untouched.

### STEP 2 — CSC Hit-List Widget  `[depends on settings]`
- **What:** collapsible panel above session launcher; top-15 most-failed CSC topics as a checklist (Malignant Breast 12 … Sarcomas 5); tick = cleared (strikethrough + green tick); "X / 15 cleared".
- **Writes:** `mrcs_settings.extra.csc_hitlist` (map topic→bool).
- **AC:** persists across reload + sync; collapsed by default on 390px.

### STEP 3 — Domain-Tagged Sessions
- **What:** domain selector in launcher `[CSC 🔴][Anatomy][ABS Mixed][PoSG Mixed][Full Mixed]` (default Full Mixed = unchanged). Performance screen gains "Domain Breakdown"; home gains "CSC sessions this cycle: X | Avg Y%".
- **Writes:** `mrcs_sessions.extra.domain`.
- **AC:** default path byte-for-byte unchanged; CSC sessions counted only from `cycle_start_date`.

### STEP 4 — Confidence Gate (pre-answer)  `[touches session + flashcard engines]`
- **What:** 3-button gate `[🟢 Sure][🟡 Unsure][🔴 Guess]` before reveal, in both simulator session view and flashcard grader. SRS: Sure+Again ⇒ +1 interval penalty (hypercorrection). Post-session flags "Confident-Wrong" with ⚠️.
- **Writes:** `mrcs_sessions.extra.confidence_log` (array).
- **AC:** answer un-revealable until tapped; Confident-Wrong surfaces top of review.

### STEP 5 — Post-Session Error Modal
- **What:** mandatory 60s debrief — `[🧠 Knowledge][🔁 Retrieval][⚡ Reasoning]` (multi-select) + optional note. No selection ⇒ default Knowledge. Performance screen: stacked-bar trend over last 10 sessions.
- **Writes:** `mrcs_sessions.errors` jsonb `{knowledge, retrieval, reasoning, note}`.
- **AC:** fires on every session end before nav-away.

### STEP 6 — Distractor Analysis in card expand  `[uses Gemini]`
- **What:** collapsible "❓ Why the others are wrong" in `injectInCardExpandContent()`; **red-risk cards only**. If empty → "🤖 Generate via AI" → Gemini(q,a) → 2–3 sentence why-each-wrong → save via `persistData()` → "AI-generated" badge.
- **Writes:** `mrcs_cards.extra.distractor_notes` (string) + `distractor_ai` flag.
- **AC:** `injectInCardExpandContent` extended (not rewritten); Gemini cascade reused; gated to red cards to limit calls.

### STEP 7 — Next Attempt Dashboard (new nav tab)  `[read-only — build after 1-5]`
- **What:** new tab. Status (cycle label, days-to-exam, hit-list X/15, CSC sessions+avg). Projection gauge: `projectedCSCMarks = 17 + (avgCSCScore/100 × 45)`; April baseline 174 / gap −8.6. Ranked 15-topic priority queue; tap → filtered red-risk flashcard review for that topic.
- **Writes:** none (derives from Steps 1–5 data).
- **AC:** all four nav siblings still work; gauge math correct.

### STEP 8 — Re-Clear / CSC Drill Mode  `[heaviest — build last]`  **[UPGRADED: native question bank]**
- **DECISION (user):** Import the question DATA from MRCS-VUE.html (React qbank) into the Tracker's own vanilla question-server — do NOT merge the React app. See §12.
- **Data source:** `outputs/questions_csc.json` — 547 CSC questions extracted from `EMBEDDED_BANK` (of 2,367 total). Schema: `{id, qhash, stem, options:[{letter,text}], correctLetter, explanation, topic, topicCanon, source}`. 620 KB → **inlined** into v116 as a JS const (one runtime, no React, no fetch). Maps to all 15 hit-list topics.
- **What:** "CSC Drill 🔁 / Re-Clear" session type. Topic filter (hit-list themes) → serve `stem` + `options` → confidence gate (Step 4) → reveal `correctLetter` + `explanation` → grade (right/wrong) → flag still-wrong → push answered cards into SRS. Tracks "drill rate / re-clear rate".
- **CSV path retained (optional):** still accept a .csv upload to add your own wrong-answer stubs (real header `Question_Number,Date_Attempted,Topic,Question_Text,Option_A..E,Correct_Answer,Your_Answer,Was_Wrong,Explanation`; filter `Was_Wrong`).
- **Writes:** `mrcs_sessions.extra.domain='CSC'`, `extra.confidence_log`, `extra.drill_rate`; optional `mrcs_settings.extra.reclear_queue` (CSV adds, ≤200).
- **AC:** drill serves real CSC Qs from the inlined bank; confidence gate works; reveal shows correct+explanation; results log to sessions/SRS; size keeps index.html < ~1.4 MB.

---

## 5. Schema Additions (all on existing jsonb — no migration)

| Table | Field | Type | Step |
|---|---|---|---|
| `mrcs_settings` | `exam_date`, `cycle_label`, `cycle_start_date` | string | 1 |
| `mrcs_settings` | `extra.csc_hitlist` | obj `{topic:bool}` | 2 |
| `mrcs_settings` | `extra.reclear_queue` | array (≤200) | 8 |
| `mrcs_sessions` | `extra.domain` | string | 3 |
| `mrcs_sessions` | `extra.confidence_log` | array | 4 |
| `mrcs_sessions` | `errors` | obj `{knowledge,retrieval,reasoning,note}` | 5 |
| `mrcs_sessions` | `extra.reclear_rate` | number | 8 |
| `mrcs_cards` | `extra.distractor_notes`, `extra.distractor_ai` | string/bool | 6 |

No new tables, no PK changes. Everything keys on existing PKs (`word` for cards — never numeric id).

---

## 6. Sacred-Function Contract (do not refactor/rename)
`persistData()` · `_dedupePool()` · `injectInCardExpandContent()` · `fetchImageCandidates()` · `supabasePullEverything()` · `supabaseFlushAllPending()` — all confirmed present in v115. New code *calls into* them; never edits their signatures.

---

## 7. Build Sequence & Milestones
1. **M0** — Pull v115 → working copy; reset exam date var; smoke-test load.
2. **M1** — Steps 1→2→3 (settings + home widgets).
3. **M2** — Steps 4→5 (session engine: gate + debrief).
4. **M3** — Step 6 (Gemini distractor).
5. **M4** — Step 7 (dashboard, read-only).
6. **M5** — Step 8 (Re-Clear + CSV).
7. **M6** — QA pass → promote to `index.html`.

## 8. QA / Verification Plan
- `node --check` on extracted JS (gate to delivery).
- No Supabase SDK — `fetch` only (grep-verify).
- 390px render + wizard click-through via Preview/Chrome MCP.
- Sacred functions present + unrenamed (grep-verify post-build).
- `v116.html` ≡ `index.html` byte-identical.
- Default "Full Mixed" path regression-unchanged.

## 9. Delivery Artifacts
1. `v116.html` (deployable) · 2. `v116_full_code.txt` (text backup) · 3. numbered GitHub-web-editor deploy steps · 4. schema-additions list (§5) · 5. Supabase restore warning at top.

## 10. Open Questions / Risks
- **R1 (high):** v115 may itself have unmerged fixes scattered across `v114.x`/`v115`. Assumption: v115 is the canonical latest (you confirmed). If any later fix lives only in a `v114_x`, flag it.
- **R2 (med):** 735 KB single file is large to edit safely in one pass — favor surgical, additive insertion points; keep a v115 backup.
- **R3 (med):** Gemini key — is it user-entered (like Supabase) or embedded? Verify before relying on Step 6 in testing.
- **R4 (low):** "ABS Mixed / PoSG Mixed" domain labels — confirm these map to real question pools in v115's launcher.

## 10b. Architecture Reality Check (verified by reading v115 internals)
The build prompt assumed a question-serving simulator + 4 nav tabs. The real app differs — these reconciliations apply:
- **Main "session" = a study TIMER/pomodoro** (`_startSessionCore` @6122: countdown, checkpoints, break tally, scratchpad). You answer Qs in your external QBank; there is **no per-question answer-reveal** in the timer. ⇒ **Step 4** confidence gate attaches to the **flashcard grader** (which has reveal) + the new **Re-Clear** view, not the timer. A lightweight per-session confidence tally can still ride the timer if wanted.
- **Errors already exist** — `resetErrors()` + `scratch-input-know/-retrieval/-reasoning`. ⇒ **Step 5** extends existing error tracking; the 60s modal formalises/serialises it to `mrcs_sessions.errors`.
- **Only 2 nav tabs** — `tab-1st` (1st Pass Engine) / `tab-rev` (Revision Engine), `activeTab` switch @13194-13195 → `renderTrackerTab()`. ⇒ **Step 7** adds a 3rd `tab-btn` + onclick + render fn in that exact pattern (not 4 assumed tabs).
- **Step 8 Re-Clear** needs its **own** small question-serving view (Q → confidence gate → reveal correct+explanation), since the timer can't serve questions.
- Confirmed unique anchors: `</style>`@1198 · `function persistData()`@3415 · `function daysToExam()`@5082 · `function startSession()`@6122 · `function injectInCardExpandContent(item)`@7862 · tab onclicks @13194-13195.

## 11. Skills/Tooling Map
- **Workflow** (native) — parallelize the 8-step build / QA fan-out if desired.
- **code-review / security-review** — pre-promotion review of v116 diff.
- **verify / run** — behavioral check of wizards.
- **Claude_Preview / Claude in Chrome** — 390px live testing.
- **ruflo** — *not recommended* for this single-file build (see §2).

## 12. QBank Integration Decision (MRCS-VUE → Tracker)
- **MRCS-VUE.html** is a **React** app (3.3 MB, 83k lines, localStorage-only, no Supabase/fetch/URL-params). Its asset is `const EMBEDDED_BANK` @line 325 = **2,367 questions** `{id, qhash, stem, options:[{letter,text}], correctLetter, explanation, topic, topicCanon, source}` — strict-JSON parseable.
- **Decision:** import the **DATA, not the app**. Full-merging two runtimes into one ~4 MB file = too extreme (mobile perf, GitHub-editor strain, dual state). Rejected. Iframe/link options also rejected for now.
- **Extracted:** `outputs/_bank_full.json` (2,367 Qs, 2.7 MB) + `outputs/questions_csc.json` (**547 CSC Qs, 620 KB**) via `/tmp/extract_bank.py`. CSC subset covers all 15 hit-list topics.
- **Plan:** inline the 547-Q CSC subset into v116 as a JS const; Step 8 becomes a native CSC drill (see Step 8). Expandable to full bank later (or host as separate `questions.json` if size becomes an issue).
