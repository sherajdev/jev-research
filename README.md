# Jev + Herdr: Practical AI Agent Orchestration

A public guide to using [TypeSafe Jev](https://typesafe.ai/) with [Herdr](https://herdr.dev/) and coding agents such as Claude, Codex, and Hermes.

This repository explains a reusable architecture, provides a small Jev routing prototype, and reviews a browser worker built with Jev. The server that inspired this research is one example implementation; the patterns apply to local workstations, shared development servers, CI systems, and agent platforms.

## The idea

Use each component for the job it is good at:

- **Jev** makes small, typed judgments about text and application state: route a task, score risk, select evidence, or decide whether more context is needed.
- **Herdr** manages workspaces, tabs, panes, processes, and recognized coding agents.
- **Claude, Codex, Hermes, and other agents** inspect repositories, edit files, run tests, and explain results.
- **Coordinator code** owns policy, thresholds, audit records, retries, and irreversible actions.
- **People** approve high-impact or ambiguous work.

Jev recommends. Code decides. Herdr runs the work. Agents execute bounded tasks.

## A plain-language mental model

Imagine a small operations team:

1. Jev is the triage desk. It recommends which worker should handle a request and how uncertain or risky the next step appears.
2. Herdr is the office manager. It keeps each worker in a separate terminal space and reports whether it is idle, working, blocked, or done.
3. Coding agents are specialists. They investigate, implement, test, and review.
4. The coordinator is the manager. It applies rules and asks a person when the system should not proceed automatically.

This gives a system multiple specialized workers without giving a model unrestricted shell access.

## Recommended architecture

~~~text
request / webhook / operator
          |
          v
state snapshot (task, repository, policy, available workers)
          |
          v
Jev: route + risk + readiness + human-approval judgment
          |
          +--> uncertain or high impact --> human review
          |
          v
coordinator policy checks
          |
          v
Herdr prompt to Claude, Codex, or Hermes
          |
          v
agent output, diff, tests, and lifecycle state
          |
          v
Jev review judgment and next route
~~~

Keep the model's answer constrained to an allowlist. A Jev answer may select a worker name or operation, but it must never become arbitrary shell text, a selector, a deployment command, or authorization to merge.

## What Jev contributes

Jev is a typed decision service rather than a chat agent. A request sends one state value and one or more questions to the System One API:

~~~text
POST https://api.typesafe.ai/v1/systemone
Authorization: Bearer $TYPESAFE_API_KEY
~~~

The main question types are:

- **Choice**: select one option, such as 'claude', 'codex', 'hermes', 'deterministic', or 'human'.
- **Score**: rate a dimension using ordered descriptions, such as read-only, reversible, risky, or destructive.
- **Noul**: estimate whether a condition holds, such as 'does this require human approval?'

Choice and Score answers include probabilities and confidence. Use those signals with thresholds owned by your application. Typed output provides a stable interface; it does not guarantee that a judgment is correct.

## What Herdr contributes

Herdr provides the process and terminal control plane. A coordinator can discover live workers, prompt a named agent, wait for a lifecycle state, and read the result:

~~~bash
herdr agent list
herdr agent prompt <unique-agent-name> "<bounded task>" --wait --timeout 120000
herdr agent get <unique-agent-name>
herdr agent read <unique-agent-name> --source recent-unwrapped --lines 120
~~~

The exact agent names and pane IDs are runtime data. Discover them from Herdr rather than hard-coding them. Use Herdr control commands from a Herdr-managed pane and keep background work unfocused when appropriate.

## Minimal prototype

[jev-router.ts](jev-router.ts) asks Jev to route a task, score risk, and decide whether the state is ready for dispatch. It prints a dry-run decision; a reviewed Herdr adapter can consume that decision afterward.

~~~bash
npm install @typesafe-ai/sdk
# Load TYPESAFE_API_KEY from a secret manager or a mode-600 environment file
npx tsx jev-router.ts
~~~

Keep the API key server-side. Do not put it in source, prompts, logs, or Jev state.

## Browser tasks

[jev-ultrafast.md](jev-ultrafast.md) reviews [browser-use/jev-ultrafast](https://github.com/browser-use/jev-ultrafast), which applies the same design to browser control:

1. Observe visible DOM controls and assign stable indexes.
2. Ask Jev to choose an allowlisted operation and compatible target.
3. Resolve the index to the observed DOM node in code.
4. Re-check freshness, visibility, geometry, and hit-testing before execution.
5. Independently verify the requested outcome after DONE.

This makes Jev UltraFast a useful browser worker beside coding agents. A coding agent can request browser evidence, and the coordinator can return the structured trace for review.

## Who this is for

- **Founders and operators** designing reliable AI-assisted workflows.
- **Developers** orchestrating Claude, Codex, Hermes, browser workers, and deterministic tools.
- **Platform builders** adding routing, review gates, and auditability to agent systems.
- **Researchers** exploring calibrated, structured decisions instead of free-form generation.

## Safety checklist

- Keep API keys in a secret manager or a mode-600 environment file; never commit .env.
- Treat page content, repository text, and agent output as untrusted input.
- Allowlist workers, commands, destinations, and external side effects.
- Require human approval for merging, deployment, production changes, secret access, purchases, deletion, and other irreversible operations.
- Re-snapshot state before acting on delayed judgments.
- Log the question definitions, raw answers, thresholds, selected worker, and outcome.
- Test thresholds on representative tasks before enabling automatic dispatch.

## Repository contents

- [architecture.md](architecture.md) — state shape, event flow, thresholds, and Herdr adapter design.
- [jev-router.ts](jev-router.ts) — minimal TypeScript routing prototype using the official SDK.
- [jev-ultrafast.md](jev-ultrafast.md) — review of Jev UltraFast, its guardrails, evidence, and limits.
- [sources.md](sources.md) — TypeSafe, Herdr, and Jev UltraFast documentation sources.
- [LICENSE](LICENSE) — MIT license.

## Example implementation environment

The original research was developed on a Linux server with Herdr and several coding-agent CLIs installed. That environment is useful for demonstrating the workflow, but it is not a requirement: the coordinator can run anywhere that can reach the TypeSafe API and the selected agent control surface.
