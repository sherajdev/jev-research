import { choice, noul, score, TypeSafeClient } from "@typesafe-ai/sdk";

const client = new TypeSafeClient();

const state = {
  task: {
    text:
      process.env.JEV_TASK ??
      "Review the current repository task and propose the safest next coding step.",
    source: "operator",
  },
  repository: {
    path: process.cwd(),
    diff: process.env.JEV_DIFF ?? "No diff supplied; treat this as an investigation.",
  },
  agents: [
    { kind: "claude", status: "available" },
    { kind: "codex", status: "available" },
    { kind: "hermes", status: "available" },
  ],
  policy: {
    destructive_actions_allowed: false,
    merge_requires_human: true,
  },
};

const response = await client.systemOne({
  state,
  questions: {
    route: choice("Which available worker is the best next handler for this task?", {
      claude: "Use Claude for a repository task where careful review or broad editing is useful.",
      codex: "Use Codex for an implementation or debugging task in the current workspace.",
      hermes: "Use Hermes for an autonomous investigation or multi-step coding task.",
      deterministic: "Use scripts, tests, or a build without an agent.",
      human: "Do not dispatch automatically; ask a human to decide.",
    }),
    risk: score("How risky is the requested next step?", [
      "Read-only inspection or a reversible local check.",
      "A reversible code or documentation edit with local validation.",
      "A change that could affect behavior, data, or an external system.",
      "A destructive, production-affecting, merge, deployment, or secret-handling action.",
    ]),
    needs_human: noul("Does this task require human approval before an agent is prompted or an action is taken?", {
      true: "Approval is required because the task is ambiguous, high-risk, destructive, or policy-sensitive.",
      false: "A bounded, reversible task can proceed under the coordinator policy.",
    }),
    ready: noul("Does the state contain enough context to dispatch a bounded next step?", {
      true: "The task, repository context, available workers, and policy are sufficient.",
      false: "Important context is missing; request clarification or gather more evidence.",
    }),
  },
});

const route = response.answers.route;
const risk = response.answers.risk;
const needsHuman = response.answers.needs_human.noul >= 0.5;
const ready = response.answers.ready.noul >= 0.5;

const dispatch = ready && !needsHuman && risk.score < 2 && route.choice !== "human";

console.log(
  JSON.stringify(
    {
      model: response.model,
      route: route.choice,
      route_confidence: route.confidence,
      risk: risk.score,
      risk_confidence: risk.confidence,
      needs_human_probability: response.answers.needs_human.noul,
      ready_probability: response.answers.ready.noul,
      dispatch,
      note: dispatch
        ? "Resolve the live Herdr agent and prompt it through a reviewed adapter."
        : "Hold for human review or additional context; do not invoke Herdr automatically.",
      usage: response.usage,
    },
    null,
    2,
  ),
);
