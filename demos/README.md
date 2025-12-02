# ALIS Demos

All demo pages live under `demos/` and **must** load `../dist/alis.js`. Use `npm run build` followed by `npm run demo:serve` to explore the scenarios locally.

| Folder | Scenario | Notes |
|--------|----------|-------|
| `form-submit/` | Native form POST + validation states | Focused on swap + validation UI |
| `inline-edit/` | Inline change + PATCH via `data-alis-collect` | Highlights smart defaults |
| `indicators/` | Loading indicators and busy states | Exercises indicator syntax |
| `confirm-delete/` | Registry-driven confirm step | Demonstrates custom confirm handlers |
| `programmatic/` | `ALIS.request` + `ALIS.from()` flows | Intended for third-party integrations |

The Playwright fixtures under `tests/integration/pages/` mirror these demos exactly to guarantee parity between documentation and automated coverage. Update both when making behavioral changes.

