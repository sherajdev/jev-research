# Coordinator architecture

## Event flow

```text
request / webhook / operator
        |
        v
state snapshot (task + repo + policy + available agents)
        |
        v
Jev: route + risk score + approval judgment
        |
        +--> low confidence / approval required --> human review
        |
        v
coordinator policy checks
        |
        v
Herdr agent prompt (Claude | Codex | Hermes)
        |
        v
Herdr lifecycle + output + diff/test evidence
        |
        v
Jev: review judgment and next route
```

## State contract

Keep observed facts separate from inferred answers. A useful state object is:

```json
{
  "task": { "text": "...", "source": "operator", "id": "task-123" },
  "repository": { "path": "/path/to/project", "branch": "...", "diff": "..." },
  "agents": [
    { "name": "claude", "kind": "claude", "status": "idle", "cwd": "..." },
    { "name": "codex", "kind": "codex", "status": "working", "cwd": "..." },
    { "name": "hermes", "kind": "hermes", "status": "idle", "cwd": "..." }
  ],
  "policy": {
    "allow_destructive_actions": false,
    "require_human_for_merge": true
  }
}
```

The state should contain enough evidence for the question but should exclude API
keys, tokens, cookies, and unrelated private data. Jev accepts JSON state, but its
current model is text-only in the sense that it evaluates text/JSON rather than
images, audio, or video.

## Questions and policy

Ask independent questions together so one request can provide reusable signals:

- `route`: Choice among `claude`, `codex`, `hermes`, `deterministic`, `human`.
- `risk`: Score with concrete levels such as read-only, reversible edit, risky
  change, destructive or production-affecting.
- `needs_human`: Noul for approval requirements.
- `ready`: Noul for whether the task has enough context to dispatch.

The coordinator owns thresholds. A low-confidence route should go to a human or
request more context. A high-risk action should require stronger evidence than a
read-only investigation. Confidence is a signal about the answer distribution,
not proof that the whole workflow is safe or correct.

## Herdr adapter

The adapter should be a narrow module with no model logic:

1. Call `herdr agent list` and parse live names, pane IDs, status, cwd, and kind.
2. Resolve the Jev route to a unique live name. Do not derive IDs from pane order.
3. Send a bounded prompt with `herdr agent prompt <name> ... --wait`.
4. On `blocked`, inspect `herdr agent get` and `herdr agent read` before deciding
   whether a human should answer.
5. Read the output and collect diff/test evidence.

Herdr recognizes the installed kinds `claude`, `codex`, and `hermes`, so the same
adapter can target all three. It also exposes panes for ordinary commands, which
is useful for deterministic tests and builds.

## Suggested rollout

1. Run the dry-run router on a labeled set of real tasks and record Jev answers,
   confidence, chosen route, and the outcome.
2. Add a read-only Herdr integration that only prompts an idle agent and writes an
   audit record.
3. Add review routing after measuring false routes and confidence thresholds.
4. Add guarded write actions last; keep merge, deployment, secret access, and
   destructive commands behind explicit policy and human approval.

## Operational boundaries

- Keep `TYPESAFE_API_KEY` in the coordinator environment, never in prompts or
  repository files.
- Log request IDs, question definitions, raw answers, selected thresholds, and
  resulting actions so decisions can be audited.
- Treat Jev output as typed input to policy code, not as authorization.
- Retry network failures with bounded backoff; do not blindly retry actions after
  a successful Herdr prompt.
- Re-snapshot agent and repository state before acting on a delayed judgment.
