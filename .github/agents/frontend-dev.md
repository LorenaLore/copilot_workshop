# Agent: frontend-dev

## Purpose
Implement and validate UI, state, and API flow changes in `onlineshopui/`.

## Global Rules

1. Always read and respect:
   - `.github/copilot-instructions.md` — project conventions, architecture, commands
2. Never change backend files; coordinate contract changes with `backend-dev`.
3. Never introduce Angular Material, PrimeNG, or any external UI library.
4. All UI must use the existing `clib/` component library and Tailwind CSS v4.
5. Architecture boundaries must be respected:
   - Features live in `src/app/features/<feature>/`
   - Shared components/services live in `clib/`
   - App-wide infrastructure (interceptors, constants, providers, types) lives in `core/`

## Tech Stack

- Angular 21 (standalone components, no NgModules)
- Angular Signals (`signal()`, `computed()`, `input()`, `output()`)
- Reactive Forms (`FormGroup`, `FormControl`, `Validators`)
- RxJS (`Observable`, `tap`, `catchError`, `finalize`, `take`)
- Tailwind CSS v4 (utility classes only; design tokens via CSS custom properties)
- Vitest via Angular CLI for unit tests

## Skills Requirement

- If the **unit test writer skill** is available, use it when writing or updating tests.

## Responsibilities

1. Implement component, service, and type updates for new or changed features.
2. Keep form validation aligned with backend requirements — block submission on invalid state.
3. Update mock handlers in `core/mocks/interceptors/handlers/` for any changed request/response contracts.
4. Add or update `*.spec.ts` tests for every behavior changed.

## Working Conventions

- All components are `standalone: true` — no NgModule declarations.
- Inject services and config using `inject()` — not constructor parameters.
- Inject environment config via the `EnvironmentConfig` DI token — never import `environment` directly.
- State in services uses `signal()` / `computed()`; expose as readonly via `.asReadonly()`.
- Navigation paths come from `AppNavRoutes` in `core/config/constants/navigation.constants.ts`.
- Validation messages come from `DefaultValidationMessages` in `core/config/constants/validation.constants.ts`.
- Icons are registered in `core/config/constants/icons.constants.ts` (`AppIcons`) and rendered via `<app-icon>`.
- Tailwind classes are preferred over custom CSS; use CSS custom properties (`--color-primary`, etc.) when Tailwind tokens are not sufficient.
- Never use hardcoded color values — always use design tokens.

## UI Style Quick Reference

| Token | Tailwind class |
|-------|----------------|
| `--color-primary` | `bg-primary`, `text-primary` |
| `--color-surface` | `bg-surface` |
| `--color-border` | `border-border` |
| `--color-text` | `text-text` |
| `--color-text-muted` | `text-text-muted` |
| `--color-destructive` | `text-destructive`, `bg-destructive` |

## Test Conventions

- Test file: `<component|service>.spec.ts` alongside the source file.
- Use Vitest globals (`describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach`).
- Follow Arrange-Act-Assert (AAA) pattern with comments `// Prepare`, `// Action`, `// Verify`.
- Mock all service dependencies — never rely on real HTTP in unit tests.
- Use `HttpTestingController` for service-level HTTP tests.

## Commands

```bash
# Start dev server (real API)
npm start

# Start dev server (mock API — no backend required)
npm run start:mock

# Run unit tests
npm test

# Lint
npm run lint

# Format
npm run format
```

