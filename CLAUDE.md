# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This is the ai-agent-analytics project. The stack and scope are defined in `docs/PRD.md` and `docs/SPEC.md`. Always consult those before making architectural decisions.

---

## CRITICAL: Compliance with ARCHITECTURE.md

**ALL implementations MUST comply with `ARCHITECTURE.md`.** This is non-negotiable.

Before writing any code:
1. Read the relevant sections of `ARCHITECTURE.md`.
2. Verify the implementation matches every applicable rule (naming, component style, state management, testing, etc.).
3. Never ship code that violates `ARCHITECTURE.md` - not as a shortcut, not as a temporary measure.

---

## Running inside Docker (recommended)

All development — including Claude Code itself — should run inside the Docker container so that `claude --dangerously-skip-permissions` is safe. The container is pre-configured with Node.js, Chromium, and the Claude Code CLI.

### First-time setup

```bash
docker-compose build
docker-compose up -d
```

### Running Claude Code inside the container

```bash
docker exec -it $(docker-compose ps -q claude-dev) bash
# now inside the container:
claude --dangerously-skip-permissions
```

### Authentication

No API key needed. Claude Code authenticates via your browser subscription. The container mounts `~/.claude` and `~/.claude.json` from your Mac so your existing login carries over automatically. If you haven't logged in on the host yet, run `claude` once on your Mac first to complete the browser flow.

### Dev server ports

- `5173` - Vite dev server
- `4173` - Vite preview
- `3000` - fallback (Create React App or custom servers)

Vite must be started with `--host` (or `server.host: true` in `vite.config`) so it binds to `0.0.0.0` and is reachable from the host browser.

---

## Pre-granted Permissions

The following actions are automatically approved — no confirmation prompt needed:

### Package management

- `npm install`, `npm ci`, `npm run <script>`
- Installing any package listed in the PRD/SPEC stack

### Development servers

- Starting / stopping the Vite dev server (`npm run dev`)
- Starting / stopping any backend or API server defined in the SPEC

### Build & type-check

- `tsc --noEmit` (type-checking)
- `npm run build`
- `vite build`

### File operations

- Read, write, and edit any file inside the project or `docs/`
- Create new source files following the directory structure in `docs/SPEC.md`
- Delete generated artifacts (`dist/`, `node_modules/`, `.vite/`)

### Local network (loopback only)

- Binding to Vite's default port range (5173-5179)
- All communication stays on `localhost` — no external network calls

### Git

- `git status`, `git diff`, `git log` (read-only inspection)
- `git add` + `git commit` when explicitly asked

---

## Safety boundaries — always require confirmation

- Pushing to remote (`git push`) — confirm first.
- Force-pushing or resetting history — confirm first.
- Installing packages with known security advisories — flag and confirm.
- Any outbound HTTP/WebSocket connection to a non-localhost address — confirm first.
- Modifying `docs/PRD.md` or `docs/SPEC.md` — confirm first (these are the source of truth).
- Committing `.env` files or anything containing secrets/tokens — refuse entirely.

---

## Running the project

```bash
# Install dependencies
npm install

# Dev server — runs on http://localhost:5173
npm run dev

# Type-check
npx tsc --noEmit

# Run all tests
npm run test
```

---

## Architecture

Follow instructions in `ARCHITECTURE.md`. This is critical!

## Architecture invariants — never break these

Defined in `ARCHITECTURE.md`. If no architecture file exists yet, follow the stack and patterns in `docs/SPEC.md`.

---

## Code style

- React functional components only; no class components.
- Prefer named exports.
- Co-locate types with the module that owns them; shared types live in `src/types/`.
- TypeScript strict mode — zero `any` unless unavoidable and commented.

---

## Phase tracking

Development follows the phase plan in `docs/SPEC.md`. When starting a new phase, read the relevant section before writing any code. A phase is done when:

1. All deliverables exist and are wired up.
2. All acceptance criteria pass manually.
3. `tsc --noEmit` reports zero errors.
4. No `console.error` in normal operation.

## Task workflow

After implementing a task from a tasks markdown file (`docs/*-tasks.md`):

1. Stop. Do not commit automatically.
2. Wait for the developer to review the changes.
3. When the developer types `commit`, stage all modified and new files for that task and create a semantic commit following the existing commit message pattern in the repo (`git log --oneline` to check).
4. Never commit before receiving the explicit `commit` signal.

## Output

- Answer is always line 1. Reasoning comes after, never before.
- No preamble. No "Great question!", "Sure!", "Of course!", "Certainly!", "Absolutely!".
- No hollow closings. No "I hope this helps!", "Let me know if you need anything!".
- No restating the prompt. If the task is clear, execute immediately.
- No explaining what you are about to do. Just do it.
- No unsolicited suggestions. Do exactly what was asked, nothing more.
- Structured output only: bullets, tables, code blocks. Prose only when explicitly requested.

## Token Efficiency

- Compress responses. Every sentence must earn its place.
- No redundant context. Do not repeat information already established in the session.
- No long intros or transitions between sections.
- Short responses are correct unless depth is explicitly requested.
- Omit filler transitions ("Next,", "Now,", "Then,", "Finally,").
- No trailing summaries. Never restate what was just done.
- No meta-commentary about the response ("Here is...", "Below is...").
- When showing diffs or edits, show only changed lines plus minimal context - not the whole file.
- Prefer one-line explanations over multi-sentence paragraphs.
- Use inline code references (`file:line`) instead of quoting blocks of existing code.
- Skip acknowledgment of understood constraints. Execute silently.

## Typography - ASCII Only

- Do not use em dashes. Use hyphens instead.
- Do not use smart or curly quotes. Use straight quotes instead.
- Do not use the ellipsis character. Use three plain dots instead.
- Do not use Unicode bullets. Use hyphens or asterisks instead.
- Do not use non-breaking spaces.
- Do not modify content inside backticks. Treat it as a literal example.

## Sycophancy - Zero Tolerance

- Never validate the user before answering.
- Never say "You're absolutely right!" unless the user made a verifiable correct statement.
- Disagree when wrong. State the correction directly.
- Do not change a correct answer because the user pushes back.

## Accuracy and Speculation Control

- Never speculate about code, files, or APIs you have not read.
- If referencing a file or function: read it first, then answer.
- If unsure: say "I don't know." Never guess confidently.
- Never invent file paths, function names, or API signatures.
- If a user corrects a factual claim: accept it as ground truth for the entire session. Never re-assert the original claim.

## Code Output

- Return the simplest working solution. No over-engineering.
- No abstractions or helpers for single-use operations.
- No speculative features or future-proofing.
- No docstrings or comments on code that was not changed.
- Inline comments only where logic is non-obvious.
- Read the file before modifying it. Never edit blind.

## Warnings and Disclaimers

- No safety disclaimers unless there is a genuine life-safety or legal risk.
- No "Note that...", "Keep in mind that...", "It's worth mentioning..." soft warnings.
- No "As an AI, I..." framing.

## Session Memory

- Learn user corrections and preferences within the session.
- Apply them silently. Do not re-announce learned behavior.
- If the user corrects a mistake: fix it, remember it, move on.

## Scope Control

- Do not add features beyond what was asked.
- Do not refactor surrounding code when fixing a bug.
- Do not create new files unless strictly necessary.

---

## Writing a PRD

A PRD describes what the product does and why, from a user perspective. It is not a technical spec. No implementation details, no architecture, no code.

### When asked to write or help write a PRD

1. Ask clarifying questions before writing anything. Do not guess at ambiguity.
2. Write questions one batch at a time. Do not dump 20 questions at once.
3. Stop and confirm answers before proceeding to the next section.

### Clarifying questions - what to ask

For each proposed feature, surface:

- **Who** is the user performing this action? (role, context, skill level)
- **What** problem does it solve? What does the user currently do without this feature?
- **When** does this happen? What triggers it? What comes before and after?
- **What does success look like?** How does the user know the feature worked?
- **What are the failure cases?** What happens when it goes wrong?
- **What is explicitly out of scope?** Name things that sound related but are not included.
- **Are there constraints?** Performance, platform, legal, backwards compatibility.

### PRD structure

Each feature section must contain:

- **Problem statement** - one paragraph, user-centric, no solution language
- **User stories** - "As a [user], I want to [action] so that [outcome]." One per distinct use case.
- **Functional requirements** - numbered list, each requirement independently testable
- **Out of scope** - explicit list of what this feature does NOT do
- **Open questions** - anything still unresolved; never leave silent ambiguity

### What a PRD must NOT contain

- Technology choices (language, library, database, API)
- Implementation approach or architecture
- File names, function names, class names
- Performance targets expressed as code-level metrics
- Anything that can only be decided during implementation

### Ambiguity is a blocker

If a requirement can be interpreted two ways, it is not a requirement - it is an open question. Flag it explicitly. Do not resolve ambiguity by picking the most obvious interpretation silently. Ask.

---

## Writing a SPEC

A SPEC translates PRD requirements into a precise technical design. It is the bridge between "what the product does" and "how to build it." It must be grounded in the PRD and, when present, must comply with `ARCHITECTURE.md`.

### Before writing anything

1. Read the relevant PRD section(s) in full.
2. Read `ARCHITECTURE.md` if it exists. Every design decision must be compatible with it.
3. Identify technical ambiguities - things the PRD leaves open that have multiple valid implementations with meaningfully different tradeoffs. Ask about those before proceeding.
4. Do not ask about things that `ARCHITECTURE.md` already answers.

### Clarifying questions - what to ask

Surface ambiguities that affect the technical shape of the solution:

- **Data ownership** - which module/store/service owns this state? Who is allowed to mutate it?
- **Boundaries** - where does this feature start and stop? What existing code does it touch?
- **Lifecycle** - when is this created, updated, destroyed? What are the trigger conditions?
- **Error handling** - what happens on failure? Silent, surface to user, retry?
- **Concurrency** - can this be called multiple times simultaneously? What is the ordering guarantee?
- **Performance constraints** - is this on the hot path (e.g. 60fps loop)? Latency budget?
- **Persistence** - is this in-memory only, or does it survive restarts? What is the storage contract?

Ask one focused batch. Wait for answers before writing the design.

### SPEC structure

Each feature section must contain:

#### 1. Context
- Which PRD requirement(s) this implements (reference by name/section).
- Which existing files/modules are touched and why.

#### 2. Data model
- New types, interfaces, or schema changes as TypeScript or pseudocode scaffolding.
- Show the shape, not the implementation.

```ts
// example - shape only, not implementation
interface LapSample {
  positionNormalized: number  // 0-1
  speedKmh: number
  brake: number               // 0-1
  gas: number                 // 0-1
}
```

#### 3. Component / module design
- New files to create and their responsibility (one line each).
- Existing files modified and what changes (one line each).
- Public API surface: exported functions, methods, signals - signatures only, no bodies.

#### 4. Interaction diagram
Show data flow and call sequences using ASCII diagrams. Use one of:

- Sequence diagram for time-ordered interactions between components:
```
UDPListener --> SessionManager.processCarTelemetry(data)
SessionManager --> LapRecordingStore.onTelemetryUpdate(data, session)
LapRecordingStore --> (accumulates in _samples[])
```

- State diagram for lifecycle transitions:
```
idle --> recording  [startRecording()]
recording --> complete  [lap crossed finish line]
recording --> idle  [stopRecording()]
```

- Data flow for pipelines:
```
UDP packet --> TelemetryData --> SessionManager --> [Store A, Store B, Store C]
```

Every non-trivial feature needs at least one diagram. No exceptions.

#### 5. Acceptance criteria
- Numbered list. Each item must be independently verifiable - a test, a query, or a manual check.
- No vague criteria ("works correctly", "feels fast"). Each criterion must be falsifiable.

#### 6. Out of scope
- Explicit list of related things this SPEC does NOT cover.

### SPEC must NOT contain

- Full function implementations or method bodies (scaffolding only - signatures + comments describing intent).
- Copy-paste of existing code unless illustrating a change.
- Repetition of PRD content - reference it, do not restate it.
- Decisions that contradict `ARCHITECTURE.md`.

### Ambiguity is a blocker

If a design choice has two valid implementations with different tradeoffs and the PRD does not resolve it, it is an open question - not a silent assumption. Flag it, propose the options with tradeoffs, and ask. Only proceed once resolved.

---

## Writing a TASKS file

A TASKS file breaks a SPEC into discrete, independently deliverable units of work. Each task must be complete enough that someone unfamiliar with the codebase can execute it without asking follow-up questions.

### Before writing anything

1. Read the SPEC in full.
2. Read `ARCHITECTURE.md` if present. Every task must produce output that complies with it.
3. Identify the natural seams: what can be built and tested in isolation? Those are your task boundaries.
4. Identify dependencies: which tasks produce output that other tasks consume?

### Task decomposition rules

- One task = one cohesive, testable change. Not a file, not a function - a behavior.
- A task is too large if it touches more than 3-4 files or has more than one distinct acceptance criterion cluster.
- A task is too small if it cannot be verified in isolation (e.g. "add a field to an interface" with no consumer).
- Platform/infrastructure tasks (DB schema, migrations, caches) come before the features that depend on them.
- UI tasks come last - they depend on data and logic being in place.

### Task structure

Every task must contain all of the following sections.

#### Context
One short paragraph. Explain:
- What this task is for (link to SPEC section by name).
- Why it exists at this point in the order (what it enables).
- What the reader needs to understand before starting (key concepts, existing patterns to follow).

#### Requirements
Numbered list. Each requirement is a precise statement of what the finished task must do.
- Use active voice: "The store must...", "The method must...", "The component must...".
- One behavior per line. No compound requirements ("X and Y" = two requirements).
- Reference existing patterns explicitly: "Follow the same pattern as `TrackRecordingStore`" or "Use the same transaction pattern as `saveTrack` in `db-store.ts`."
- The final requirement in every list must be: "Run `npm run test` and fix any test failures introduced by this task before marking it complete."

#### Technical decisions
Bullet list of choices that are already resolved and must not be revisited:
- Why a particular pattern was chosen over alternatives.
- Constraints that apply (e.g. "must be synchronous - called at 60fps", "must not do IO on this path").
- Any gotchas the implementer must know.

#### Design
Concrete scaffolding. Show:
- New files to create with their path.
- Signatures of new types, interfaces, functions, and methods - no bodies.
- Modified files and the specific lines/methods that change.

Use code blocks. Keep it at the scaffolding level - intent comments inside method bodies are fine, implementation is not.

```ts
// src/store/example-store.ts  (new file)

class ExampleStore {
  private _items = signal<Item[]>([])

  // Called from SessionManager on every telemetry tick. Must stay synchronous.
  onTelemetryUpdate(data: TelemetryData): void

  // Called by LapWatcher when a lap completes. Triggers async persist.
  onLapComplete(lapNumber: number): void
}
```

#### Acceptance criteria
Numbered list. Each criterion must be independently verifiable without reading the code - a DB query, a visible UI state, a test assertion, or a console check.

- Good: "After calling `saveTrack('monza', samples)`, `isTrackRecorded('monza')` returns `true`."
- Bad: "The cache works correctly."

Include at least one criterion that covers the failure/edge case, not just the happy path.

#### Test Plan

Named list of test files to create or modify, and what scenarios each must cover.

- `src/path/to/file.test.ts` (new or modified)
  - Scenario: happy path description.
  - Scenario: failure/edge case description.
  - At least one edge case per test file (empty input, failure path, boundary value).

This section is mandatory. A task without a Test Plan section is incomplete.

#### Files
Explicit list of every file touched:
- `path/to/file.ts` (new) - one-line description of what it contains
- `path/to/other.ts` (modified) - one-line description of what changes

#### Final step

The last requirement of every task must read:

> Run `npm run test` and fix any test failures introduced by this task before marking it complete.

A task is not done until the full test suite is green.

---

### Implementation order table

Every TASKS file must end with a tracking table in this exact format:

```markdown
| Done | Priority | Task | Depends on | Effort |
|------|----------|------|------------|--------|
| [ ]  | 1        | T-1: Name | -     | Small  |
| [ ]  | 2        | T-2: Name | T-1   | Medium |
| [ ]  | 3        | T-3: Name | T-1   | Small  |
| [ ]  | 4        | T-4: Name | T-2, T-3 | Large |
```

- **Done** - checkbox, updated manually as tasks complete.
- **Priority** - integer, lowest number = do first. Respects dependency order.
- **Task** - short ID + name. ID format: `T-N`.
- **Depends on** - list of task IDs that must be complete first, or `-` if none.
- **Effort** - Small (< 1 hour), Medium (1-3 hours), Large (3+ hours).

### Effort sizing guidelines

- **Small** - one new method or one new file with a narrow interface, clear pattern to follow, and straightforward acceptance criteria.
- **Medium** - a new class/store, or a UI component with non-trivial state, or changes across 2-3 files with coordination between them.
- **Large** - a new screen, a new subsystem, or any task that requires design judgment during implementation.

### Writing style for tasks

- Write as if the reader has never seen this codebase. Spell out file paths in full.
- Name the exact existing file and method to follow as a pattern. Never say "similar to existing code."
- If a task requires reading another file before starting, say so explicitly in the Context section.
- Every "must" in Requirements is non-negotiable. Every "should" is a strong preference. Use them deliberately.
- Never leave a task that starts with "and also..." - that is two tasks.