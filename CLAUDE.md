# Claude Code Instructions — Glitter Bar

## Read Before Writing Any Code
Always read these files at the start of every session, in this order:
1. SPEC.md — project specification and build order
2. .claude/skills/firebase.md — database and backend rules
3. .claude/skills/react-mobile.md — UI and component rules
4. .claude/skills/twilio-whatsapp.md — notification integration rules
5. .claude/skills/state-machine.md — queue logic and transitions

If a skill conflicts with a general best practice, the skill wins.

## Non-Negotiable Rules
- Mobile-first on every component — the admin panel runs on a phone one-handed
- Never hardcode credentials — always use environment variables
- Chair assignment logic always goes in Cloud Functions, never in React
- After each phase, show me how to manually test the feature
- No placeholder stubs or TODO comments unless explicitly flagged with // TODO(phase-N)
- All state transitions must be validated against the state machine in the skill

## Preferred Patterns
- Functional React components with hooks only (no class components)
- Real-time Firebase listeners in useEffect with cleanup return
- async/await over .then() chains
- Early returns over nested conditionals
- Named exports over default exports (except page-level components)

## Build Order (follow strictly — one phase at a time)
1. Firebase project structure and config
2. Public registration page + Firebase write
3. Admin panel shell with real-time listener
4. Chair state machine and button logic (Cloud Functions)
5. Twilio Cloud Function integration
6. Master event toggle (open/close)
7. Absent list and reactivation logic
8. PWA configuration
9. Security rules
10. QA and deployment

## When Stuck or Ambiguous
Ask before assuming. One clarifying question is better than building the wrong thing.
