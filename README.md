# Jev + Herdr: Practical AI Agent Orchestration

A practical guide to using TypeSafe Jev with Herdr and coding agents such as
Claude, Codex, and Hermes.

## Who this is for

This guide is for founders, operators, developers, and AI platform builders who
want several AI workers to move a project forward without giving one model
unlimited control.

The central idea is simple: let Jev make small, typed judgments; let Herdr manage
where work runs; let coding agents do the work; and keep policy and irreversible
actions in ordinary code or with a human.

## The plain-language version

Imagine a small operations team:

1. **Jev is the triage desk.** It reads the task and recommends which kind of worker
   should handle it, how risky the next step looks, and whether the situation is clear.
2. **Herdr is the office manager.** It keeps Claude, Codex, Hermes, shells, tests,
   and browser workers in separate terminal spaces and reports their state.
3. **Coding agents are specialists.** They inspect files, write code, run tests, and
   explain results.
4. **The coordinator is the manager.** It applies rules, records decisions, and
   asks a person when confidence or risk is not acceptable.

A model can recommend an action without being allowed to execute arbitrary commands.
The coordinator dispatches only known operations to known workers.

## Findings

Jev is a typed decision service, not a chat agent. The current API is:

```text
POST https://api.typesafe.ai/v1/systemone
Authorization: Bearer $TYPESAFE_API_KEY
```

Requests contain one `state` value and one or more typed questions. Jev returns
`Choice`, `Score`, and `Noul` answers with probabilities; `Choice` and `Score`
also include confidence. Jev currently accepts text, JSON objects, and arrays of
text. It does not generate code or explanations, so application code must own
the workflow and the final action.

The best fit for this server is a small coordinator service:

1. Collect a task, repository snapshot, policy, and the current agent/pane state.
2. Ask Jev independent questions in one request: which agent should handle the
   task, how risky it is, whether a human review is required, and whether the
   task is ready to dispatch.
3. Keep deterministic rules in code. For example, never auto-merge, never expose
   credentials, and require human approval for destructive operations.
4. Use Herdr to prompt the selected agent and observe its lifecycle.
5. Re-evaluate the resulting diff or report with Jev, then route for review,
   another agent, or completion.

This separates responsibilities cleanly:

| Layer | Responsibility |
| --- | --- |
| Jev | Semantic judgments and calibrated probabilities |
| Coordinator | Policy, thresholds, state snapshots, retries, audit records |
| Herdr | Workspaces, tabs, panes, agent start/prompt/read/wait |
| Claude/Codex/Hermes | Code changes, investigation, tests, and explanations |

## Reference environment

The research was developed on a server with Herdr, Claude Code, Codex CLI, Hermes
Agent, Node.js, and Python available. Versions and pane IDs change over time; use
the installed CLI as the authority and discover live Herdr IDs with
herdr agent list.

## Recommended first use cases

- **Intent routing:** choose Claude, Codex, Hermes, deterministic tooling, or a
  human based on task shape and repository context.
- **Risk gating:** score a proposed change and use a Noul question for “does this
  require human approval?” before sending a prompt or applying an operation.
- **Review routing:** choose whether a result needs another coding agent, a human,
  or a test-only follow-up based on the diff and test output.
- **Evidence selection:** select the most relevant files, logs, or prior reports
  from a candidate list before passing context to an agent.

Start with routing and review gating. They add useful control without asking Jev
to write code or replace the agents.

## Files

- [architecture.md](architecture.md): proposed event flow, state shape, thresholds,
  and Herdr command mapping.
- [jev-router.ts](jev-router.ts): a minimal TypeScript entry point using the
  official TypeSafe JavaScript SDK. It only asks Jev for judgments and prints a
  dispatch decision; Herdr actions remain explicit coordinator code.
- [jev-ultrafast.md](jev-ultrafast.md): review of Browser Use's Jev browser worker,
  its guardrails, and how it fits beside coding agents.
- [sources.md](sources.md): live documentation and local CLI sources used for this
  research.

## First setup

```bash
cd /home/openclaw/jev-research
npm install @typesafe-ai/sdk
# Load TYPESAFE_API_KEY from your secret store or a mode-600 .env file
npx tsx jev-router.ts
```

The prototype is intentionally dry-run. After validating thresholds against real
tasks, connect its `dispatch` branch to a separately reviewed Herdr adapter using
commands such as:

```bash
herdr agent list
herdr agent prompt <unique-agent-name> "<bounded task>" --wait --timeout 120000
herdr agent get <unique-agent-name>
herdr agent read <unique-agent-name> --source recent-unwrapped --lines 120
```

Only use Herdr control commands from a Herdr-managed pane. Prefer unique agent
names or IDs returned by Herdr, and keep `--no-focus` for background layout work.


## Safety rules

- Keep API keys in a local secret store or a mode-600 environment file. Never commit
  .env, place keys in prompts, or include them in Jev state.
- Treat Jev output as input to policy code, never as authorization by itself.
- Allowlist agent names, commands, and destinations. Do not turn a model answer into
  arbitrary shell text.
- Require human approval for merging, deployment, production changes, secret access,
  purchases, deletion, and other irreversible operations.
- Record question definitions, raw typed answers, thresholds, selected worker, and
  outcome so decisions can be reviewed later.
