# ERC Theme

Shared colors, spacing, typography, and shadows for every screen.

```js
import { colors, spacing, radius, typography, shadows } from '../theme';
```

| Token | Use |
| --- | --- |
| `colors.brand` | Primary buttons, accents (`#BF824F`) |
| `colors.background` | Screen background (`#FFF8F1`) |
| `colors.ink` / `colors.desc` / `colors.muted` | Text hierarchy |
| `colors.success` / `danger` / `warning` | Status pills |
| `spacing.screen` | Horizontal page padding |
| `radius.xl` | Cards |

NativeWind classes (`splash`, `ink`, `muted`, `field`, `card`, `peach`) mirror these tokens in `tailwind.config.js`. Prefer `colors.*` in StyleSheet/`style={{}}` so both NativeWind and inline styles stay aligned.
