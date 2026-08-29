# Lyka One — The Scoreboard

A single source of truth for the Lyka Realty sales leaderboard, built to replace four disagreeing dashboards with one engine that can prove its own math.

## How to run it

```bash
npm install
npm run dev       # starts the app at http://localhost:5173
npm run test      # runs the engine test suite (13 tests)
npm run build     # type-checks and builds for production
```

No environment variables, no backend, no database — the ledger, roster, and point-value history are static data files under `src/data/`, loaded straight into the engine on load.

**Where to click Recompute:** the Recompute button sits in the top header.
Clicking it re-runs the entire scoring engine against the same 27-row ledger and re-renders the leaderboard. Because the ledger is immutable and the engine is a pure function of (ledger, roster, point-config, current time), the result is byte-identical every time — that's the determinism guarantee R3 asks for.

## The problem

Four dashboards inside Lyka's platform compute a different point total for the same sales agent on the same day, because each was built at a different time against different assumptions about which timestamp counts, whether the season window applies, and how manual entries should be weighted. Nobody trusts the leaderboard, so nobody uses it.

## The solution

One engine, derived from an append-only, immutable ledger — never a stored, updatable score. Every event is scored fresh, every time, against the point configuration that was actually in force, then reconciled explicitly against the three legacy dashboards so any disagreement has a stated, numeric reason instead of a shrug.

<img width="1570" height="1300" alt="lyka-one-architecture" src="https://github.com/user-attachments/assets/1b4dba3e-3d58-407b-90f0-39f7c37a4fc7" />

## Architecture

The engine has no dependency on React — `App.tsx` only ever calls `scoreEvents()`, `calculateAgentTotals()`, and `buildLeaderboard()` and renders
what comes back. Nothing in the UI layer computes a score.

# How Lyka One scores an event

Every one of the 27 ledger rows goes through the exact same five-stage pipeline. There are no exceptions and no manual overrides — the same code path decides everyone's score.

## The five stages

1. **Raw ledger event** — the 27 rows exactly as recorded. Immutable: nothing in the system ever edits or deletes an event, per R3.
2. **Rule engine** — every event is checked against R1–R9, in order, before anything is counted.
3. **Outcome bucket** — each event lands in exactly one of five buckets. The 27 buckets always sum to 27; if they don't, something was silently dropped, which is the specific failure this system exists to catch.
4. **Season total** — each agent's total is the sum of only their `counted` events, recomputed fresh from the ledger every time — never stored as a number that gets updated in place.
5. **Leaderboard** — totals are ranked, and ties are broken by a fixed, documented rule (never randomly).

## The conditions, in the order they're checked

| # | Rule | Condition | Result if it fails |
|---|---|---|---|
| R8 | Roster check | Is the agent one of the 5 on the roster? | **Rejected** — e.g. AG-06, who isn't on the roster |
| R1 / R2 | Season window | Did the event *occur* (not just get *recorded*) between Aug 1–31? | **Excluded** — e.g. a deal that happened in July but was typed in during August still doesn't count |
| R4 | Idempotency | Has this exact `event_id` already been processed? | **Rejected** — a redelivered/duplicate event is only counted once |
| R6 | Daily cap | Is this a 2nd+ same-day entry of a once-per-day activity (DATA_UPLOAD or TEAM_PLANNING)? | **Capped** — scores 0 points, stays in the ledger, and is flagged |
| R5 | Suspicion | Same agent + type + second as another entry, or a deal closed with no booking token before it? | **Flagged** — still earns points, but a manager is shown it |
| — | Passed everything above | | **Counted** — earns points normally |

Two more rules apply on top of whichever bucket an event lands in:

- **R7 — which point value applies.** Point values can change mid-season (DEAL_CLOSED went from 20 to 25 on Aug 15). A counted event earns whatever value was in force on the date it actually occurred — not today's value.
- **R9 — tie-breaking.** If two agents land on the exact same season total, whichever agent appears first in the roster ranks higher. Always the same
rule, never random, never based on the order events happened to load in.

## Why it's built this way

The four legacy dashboards at Lyka disagree because each one quietly picked a different answer to one of these questions — which timestamp counts,
whether the season window applies at all, whether manual entries are worth more. This system makes every one of those decisions explicit, in one place, so a coordinator can point at any number and say exactly which rule produced it — and exactly why a legacy dashboard says something different.

## Results

Running the engine against the 27-row ledger as of "now" = 2026-08-24 09:00 Asia/Dubai:

| Rank | Agent | Total |
|---|---|---|
| 1 | Ravi Kumar | 65 |
| 2 | Bikash Thapa | 60 |
| 3 | Priya Menon | 30 |
| 4 | Anand Raj | 30 |
| 5 | Deepa Reddy | 25 |

(Priya Menon and Anand Raj are tied at 30 — resolved by roster order, per R9.)

The 27 events resolve into exactly these buckets, summing to 27:

| Bucket | Count |
|---|---|
| Counted | 13 |
| Flagged | 11 |
| Excluded | 1 |
| Rejected | 2 |

**Note:** every CAPPED event (R6 — same-day duplicate of a once-per-day activity) is also flagged, and the display groups by flagged status first —
so capped events appear inside the Flagged count above rather than as a separate zero-sum bucket. The underlying `status` field still distinguishes
CAPPED from other flagged reasons; see the Event Ledger view for the per-row breakdown.
