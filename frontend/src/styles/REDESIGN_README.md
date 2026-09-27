# Saaf Visual Redesign Notes

## Color Palette (Unified Tokens)

Light mode:
- Background: `#F3E8D8`
- Primary surface: `#FAF1E5`
- Secondary surface: `#F0E2D1`
- Heading text: `#38261E`
- Body text: `#594638`
- Muted text: `#6A5648`
- Clay accent: `#C77A5C`
- Clay hover: `#AE6448`
- Sage accent: `#7E8963`

Dark mode (warm espresso):
- Background: `#1B140F`
- Primary surface: `#241B15`
- Secondary surface: `#30241D`
- Navbar surface: `rgba(38, 29, 23, 0.9)`
- Sidebar surface: `rgba(44, 33, 26, 0.93)`
- Primary text (warm cream): `#F2E3CF`
- Secondary text: `#E3D1BA`
- Muted text: `#C9B79F`
- Clay accent (luminous): `#D48B68`
- Clay hover: `#E29C7A`

## Key Changes

- Rebuilt global design tokens in `rising_phoenix/main/static/css/main.css` with a cohesive earth-tone identity.
- Rebuilt dark mode using warm espresso surfaces and cream typography.
- Removed pure black/pure white values from CSS (`#000`, `#000000`, `#fff`, `#ffffff`, `#0d0d0d`).
- Unified nav utility button sizing (language switch, theme toggle, bell) for visual consistency.
- Improved focus-visible states for accessibility on action buttons.
- Added cleaner responsive navbar collapse container at `991px`.
- Updated secondary CSS files to inherit from shared tokens:
  - `rising_phoenix/request/static/css/request.css`
  - `rising_phoenix/main/static/css/proposal.css`
  - `rising_phoenix/main/static/css/style.css`

## Real CSS Bugs Found and Fixed

- `rising_phoenix/main/static/css/progress.css` had multiple structural CSS errors:
  - Nested selector accidentally injected inside another selector.
  - Missing selector headers before property blocks.
  - Missing closing braces causing broken cascade.
  - Duplicate/conflicting status-pill declarations.
- Fixed by fully replacing `progress.css` with a clean, token-based, syntax-valid stylesheet while preserving class names used by templates.

## File Paths Updated

- `rising_phoenix/main/static/css/main.css`
- `rising_phoenix/main/static/css/proposal.css`
- `rising_phoenix/main/static/css/notification.css` (inherits updated tokens automatically)
- `rising_phoenix/main/static/css/progress.css`
- `rising_phoenix/main/static/css/style.css`
- `rising_phoenix/request/static/css/request.css`

## How To Apply

1. Keep these files at the same paths above.
2. Hard refresh browser (`Ctrl+F5`) to clear old CSS cache.
3. If static caching is enabled in deployment, run collectstatic and redeploy static assets.
