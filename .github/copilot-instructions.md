# Copilot Instructions

Full-stack e-commerce app: **Angular 21** frontend (`onlineshopui/`) + **Spring Boot 4** backend (`onlineshopapi/`), backed by PostgreSQL.

## Commands

### Backend (`onlineshopapi/`)
```bash
# Start (requires local profile + DB running)
./mvnw spring-boot:run -Dspring-boot.run.profiles=local

# Run all tests (uses Testcontainers — Docker required)
./mvnw test

# Run a single test class
./mvnw test -Dtest=OrderServiceTest

# Build
./mvnw package
```

### Frontend (`onlineshopui/`)
```bash
npm start               # dev server against real API (http://localhost:4200)
npm run start:mock      # dev server with in-memory mock API (no backend needed)
npm test                # run unit tests with Vitest via Angular CLI
npm run lint            # ESLint
npm run format          # Prettier (src/**/*.{ts,html,css,scss})
```

### Infrastructure
```bash
# Start PostgreSQL (port 5433)
docker compose -f docker/development/docker-compose.yml up -d
```

## Architecture

### Backend layers
Standard Spring MVC layering under package `msg.onlineshopapi`:

```
controller/ → service/ → repository/ → model/
```

- **`dto/`** — request/response DTOs; mappers live in `dto/mapper/`
- **`security/`** — JWT filter (`JwtAuthFilter`), `JwtService`, `SecurityConfig`, `UserDetailsServiceImpl`
- **`exception/`** — `GlobalExceptionHandler` handles `ResourceNotFoundException`, `DuplicateResourceException`, `OrderNotProcessableException`
- **`service/strategy/`** — pluggable order fulfillment strategy (`SINGLE_LOCATION` or `MOST_ABUNDANT`), selected via `app.order.strategy` config property
- **`src/main/resources/db/migration/`** — Flyway SQL migrations; `local/` subfolder contains dev-only seed data (activated only by the `local` profile via `application-local.yml`)

API is served at `http://localhost:3000/api`. OpenAPI UI available at `/swagger-ui.html`.

### Frontend structure
Feature-based layout under `src/app/`:

- **`features/`** — `auth`, `products`, `cart`, `orders` — each has its own routes file, components, services, and types
- **`clib/`** — shared component library (components, layouts, services used across features)
- **`core/`** — app-wide infrastructure: config constants, DI providers, HTTP interceptors, mock system, type definitions

### Mock mode
`npm run start:mock` switches to `environment.mock.ts` (`apiUrl: 'http://mock-api'`). Any HTTP request to that origin is intercepted by `mockApiInterceptor` before hitting the network. Mock handlers live in `core/mocks/interceptors/handlers/`. To add a new mock endpoint, implement it in the relevant handler file (`auth-handler.mock.ts`, `products-handler.mock.ts`, `orders-handler.mock.ts`).

### Authentication flow
1. JWT issued on login, stored in `localStorage` under key `access_token`
2. `authTokenInterceptor` attaches `Authorization: Bearer <token>` to every request
3. On app init, `AuthService.loadProfileIfNeeded()` fetches `/auth/profile` if a token is present
4. `authGuard` protects all non-auth routes; role checks use `AuthService.hasRole()`

## Key Conventions

### Backend
- **Lombok everywhere**: use `@RequiredArgsConstructor` for constructor injection, `@Builder` on entities/DTOs, `@Data`/`@Getter`/`@Setter` as needed
- **Profile-based config**: `application.yml` defines env-var-driven defaults; `application-local.yml` provides concrete local values (DB at `localhost:5433`, JWT secret, CORS for `localhost:4200`)
- **Integration tests** use `@SpringBootTest + @Testcontainers + @ActiveProfiles("test")`. Test config in `application-test.yml`. `TestSecurityConfig` in `src/test/…/config/` disables security for controller slice tests
- **JPA DDL**: `ddl-auto: validate` — schema changes must go through Flyway migrations, not entity changes alone

### Frontend
- **Standalone components** — no NgModules; all components are `standalone: true`
- **Angular Signals** — services use `signal()` / `computed()` for reactive state (see `AuthService`)
- **Inject `EnvironmentConfig`** via DI token (not by importing `environment` directly): `inject(EnvironmentConfig)`
- **Icons**: register new Lucide icons in `core/config/constants/icons.constants.ts` (`AppIcons` object); they are picked at app root via `LucideAngularModule.pick(AppIcons)`; always use the `<app-icon>` component from `clib/components/icon/` to render icons
- **Validation messages**: global form validation strings live in `core/config/constants/validation.constants.ts` (`DefaultValidationMessages`), provided via `provideValidationMessages()`
- **Route constants**: navigation paths defined in `core/config/constants/navigation.constants.ts` (`AppNavRoutes`) — use these instead of raw strings
- **Reusable UI primitives**: `clib/components/` contains `card`, `modal`, `spinner`, `icon`, `error-message`, `notification-popup` — always prefer these over creating one-off components
- **Node 24 required** (enforced in `package.json` engines); use npm 11

### Frontend UI Style
- **CSS framework**: Tailwind CSS v4 is used via `@import 'tailwindcss'` in `styles.css` — prefer Tailwind utility classes for layout, spacing, and typography; avoid custom CSS when a utility class suffices
- **Design tokens**: Global CSS custom properties are defined in `:root` (light theme) and `.theme-dark` (dark theme) in `styles.css`. Always use these variables — never hardcode color values:
  - `--color-primary` / `--color-primary-foreground`
  - `--color-surface` / `--color-surface-2`
  - `--color-border`
  - `--color-text` / `--color-text-muted`
  - `--color-accent` / `--color-accent-foreground`
  - `--color-destructive` / `--color-destructive-foreground`
  - `--color-ring`, `--shadow-card`
  - All tokens are bridged into Tailwind via `@theme`, so they are also available as Tailwind classes (e.g. `bg-primary`, `text-text-muted`, `border-border`, `shadow-card`)
- **Theming**: Dark/light mode is managed by `ThemeService` (`clib/services/theme.service.ts`). It toggles `dark` and `theme-dark` classes on `<html>`. Theme preference is persisted in `localStorage` and respects `prefers-color-scheme`. Use `ThemeService` to read or toggle the theme — never manipulate theme classes directly
- **Typography**: Default font is `Roboto` (sans-serif stack). Use `--color-text` for body text and `--color-text-muted` for secondary/placeholder text
- **Component styles**: Each component has its own scoped style file — do not add styles to `styles.css` unless they are truly global
- **No additional UI libraries**: Do not introduce Angular Material, PrimeNG, or other component libraries — the project uses its own `clib/` library built on top of Tailwind

