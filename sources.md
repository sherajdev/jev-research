# Sources

## TypeSafe

- https://docs.typesafe.ai/llms.txt — documentation index.
- https://docs.typesafe.ai/introduction/quickstart.md — API request/response and SDK quick start.
- https://docs.typesafe.ai/concepts/system-one.md — Jev/System One behavior and limits.
- https://docs.typesafe.ai/concepts/state.md — state formats and context guidance.
- https://docs.typesafe.ai/primitives.md — Choice, Score, and Noul question model.
- https://docs.typesafe.ai/confidence.md — confidence and risk-dependent thresholds.
- https://docs.typesafe.ai/api.md — HTTP endpoint and request schema.
- https://docs.typesafe.ai/sdk/javascript.md — JavaScript SDK installation and usage.
- https://github.com/typesafe-ai/typesafe-sdk-js/tree/v0.6.0 — SDK source used to verify helper names.

## Local Herdr

- Herdr skill instructions — operating rules and command patterns for the installed Herdr CLI.
- `herdr --help`, `herdr agent`, `herdr pane`, `herdr workspace`, and `herdr tab` — installed CLI surface.
- `herdr workspace list`, `herdr pane current --current`, `herdr pane list`, and `herdr agent list` — live server snapshot.

## Local agent versions

- Herdr `0.8.2`
- Claude Code `2.1.274`
- Codex CLI `0.155.0`
- Hermes Agent `0.20.1`
- Node `v24.19.0`

## Jev UltraFast

- https://github.com/browser-use/jev-ultrafast — repository README, action space, setup, measurements, and limitations.
- jev_ultrafast/model.py — direct Jev HTTP request, speculative operation/target questions, response validation, and text-helper boundary.
- jev_ultrafast/agent.py — bounded loop, stale-page retry behavior, action history, and DONE/BLOCKED lifecycle.
- jev_ultrafast/browser.py and jev_ultrafast/snapshot.js — DOM observation, node identity, freshness guards, geometry checks, and execution.
