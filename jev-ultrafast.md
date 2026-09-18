# Review: browser-use/jev-ultrafast

Repository: https://github.com/browser-use/jev-ultrafast

Jev UltraFast is a focused browser agent, not a general coding-agent orchestrator. It demonstrates a strong Jev pattern: reduce a live page to a bounded, indexed action space, then ask Jev to choose an operation and a compatible target.

## How it works

Each observation creates an indexed table of visible controls. Supported operations include CLICK, TYPE_TEXT, SELECT, scrolling, WAIT, DONE, and BLOCKED. One Jev request asks for the next operation and speculative target choices. Code uses only the target head selected by the operation, so unused answers cannot execute an action. A separate small OpenAI-compatible model supplies text only when TYPE_TEXT is selected.

The implementation uses the HTTP API directly with httpx and defaults to jev-latest. It requires TYPESAFE_API_KEY and, for typed fields, TEXT_MODEL_API_KEY.

## Guardrails worth reusing

- Model output becomes an index into an observed allowlist, never a selector, coordinate, shell command, or JavaScript snippet.
- Responses are validated: candidates match, probabilities are finite and bounded, sums are checked, and the selected option is the maximum.
- Page fingerprints, DOM identity, semantic guards, and freshness checks prevent stale clicks.
- The executor rechecks visibility, disabled/read-only state, geometry, and hit-testing immediately before execution.
- DONE still requires independent outcome verification.
- The loop has a bounded step budget and explicit BLOCKED behavior.
- Page text is treated as untrusted data, not instructions.

These patterns transfer directly to a Herdr coordinator: Jev can select a named agent or bounded command from an allowlist, while code validates the choice and Herdr performs the action.

## Relationship to Herdr

Treat UltraFast as an optional browser-worker beside Claude, Codex, and Hermes:

~~~text
Herdr coordinator
  |-- Claude / Codex / Hermes panes: code, tests, review
  |-- deterministic panes: builds and checks
  |-- Jev UltraFast worker: bounded browser navigation and evidence
~~~

A coding agent can request browser evidence; the coordinator runs a bounded browser goal and returns the structured trace for review. Keep the browser worker in a dedicated pane or process with an explicit working directory and isolated browser profile.

## Evidence and limits

The repository README reports a 7.073-second Google Flights run and a median reduction from 9.450 s to 7.092 s across six alternating runs. It explicitly limits the evidence to three repeats of one task. The MVP does not cover all accessible-name cases, shadow roots, frames, canvas, uploads, pop-up tabs, nested scrolling, or arbitrary keyboard widgets.

Run offline checks before live examples:

~~~bash
uv sync
uv run ruff check .
uv run pytest
uv run python scripts/check_guards.py
~~~

Live examples make paid API calls. Use a disposable browser profile and avoid real purchases, submissions, deletion, or other external side effects until the policy and outcome checks are reviewed.
