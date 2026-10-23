# ERC frontend architecture (for teammates)

## Theme (use everywhere)

```js
import { colors, spacing, radius, typography, shadows } from '../theme';
import { IconCircleButton, SearchField, StatusBadge, SectionHeader, PrimaryButton } from '../components/ui';
```

Do **not** hardcode `#BF824F` / `#FFF8F1` in new screens — import `colors`.

NativeWind aliases (`splash`, `ink`, `muted`, `field`, `brand`) stay in sync with `colors.js` via `tailwind.config.js`.

## Data flow (dynamic end-to-end)

```
Firebase Auth → Bearer token
       ↓
Backend /api/clinic/*  (clinicData store today; swap DB later)
       ↓
src/lib/clinic.js
       ↓
ClinicDataContext (dashboard, appointments, branches, managers)
SessionContext (signed-in user + verified region)
       ↓
Screens (Home, Appointments, Branches, Clinic Managers, Profile, details)
```

Screens must not keep local demo arrays. Pull from `useClinicData()` / `useSession()`, or fetch by id (`fetchAppointment`, `fetchBranch`, `fetchManager`).

## Clinic Manager module

| Screen | Route |
| --- | --- |
| List | `ClinicManagers` |
| Detail | `ClinicManagerDetail` (`managerId`) |

Entry points: Home → “Clinic Managers”, Profile → Account Setting.

## Adding a new feature screen

1. Add/extend Backend `clinicData.js` + route in `Backend/src/app.js`
2. Add client helper in `src/lib/clinic.js`
3. Expose via `ClinicDataContext` if list-shaped, or fetch-on-focus for details
4. Build UI with `theme` + `components/ui`
