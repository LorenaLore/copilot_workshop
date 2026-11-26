# Agent Setup: Fullstack Online Shop

This repository uses a multi-agent workflow for planning, implementation, and quality review across:
- Frontend: Angular 21 (`onlineshopui/`)
- Backend: Spring Boot 4 (`onlineshopapi/`)
- DB: PostgreSQL + Flyway migrations

## Global Rules (All Agents)

1. Always follow repository instructions in:
   - `.github/copilot-instructions.md`
   - `.github/instructions/java-junit.instructions.md` (for `onlineshopapi/src/test/**/*.java`)
2. Respect architecture and folder boundaries:
   - Backend: `controller -> service -> repository -> model`, DTOs in `dto/`, mappers in `dto/mapper/`
   - Frontend: feature-first under `src/app/features/`, shared pieces in `clib/`, app-wide infra in `core/`
3. Prefer minimal, focused changes with tests for behavior changes.
4. Do not introduce new UI libraries; use existing Tailwind + `clib` components.
5. For schema changes, use Flyway migrations only.

## Agent: architect-planner

See full instructions: [`.github/agents/architect-planner.md`](.github/agents/architect-planner.md)

**Purpose:** Drive task decomposition, implementation sequencing, and acceptance criteria before coding starts.

**Output:** problem statement · file-level change map · acceptance criteria · test matrix

## Agent: backend-dev

See full instructions: [`.github/agents/backend-dev.md`](.github/agents/backend-dev.md)

**Purpose:** Implement and validate backend behavior in `onlineshopapi/`.

**Skills:** Use the unit test writer skill when available. Follow `java-junit` instructions for all test code.

## Agent: frontend-dev

See full instructions: [`.github/agents/frontend-dev.md`](.github/agents/frontend-dev.md)

**Purpose:** Implement and validate UI/API flow changes in `onlineshopui/`.

**Skills:** Use the unit test writer skill when available.

## Agent: reviewer

See full instructions: [`.github/agents/reviewer.md`](.github/agents/reviewer.md)

**Purpose:** Provide findings-first review focused on regressions, correctness, and missing tests.

**Output format:** findings (severity ordered) · open questions · summary + residual risks

## Standard Workflow

1. `architect-planner` creates implementation/test plan.
2. `backend-dev` and `frontend-dev` implement per plan and update tests.
3. `reviewer` performs findings-first review.
4. Dev agents address findings and re-run relevant tests.
5. Final pass confirms acceptance criteria and changed contracts.
