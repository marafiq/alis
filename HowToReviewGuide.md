# How To Review ALIS Pull Requests

This guide explains the exact steps a reviewer should take to evaluate ALIS changes line-by-line. Use it as the checklist before signing off any PR.

---

## 1. Preparation

1. **Sync & install**
   - `git fetch origin && git checkout <branch> && git pull`
   - `npm install`
2. **Verify plan alignment**
   - Skim `plan.md` for the phase/feature being touched.
   - Ensure the PR description references the relevant section; if not, request clarity.
3. **Run the required commands before diving into code**
   - `npm run lint`
   - `npm run test:unit`
   - `npm run test:e2e`
   - `npm run build`
   - If any command fails, stop and send the logs back to the author.

---

## 2. High-Level Pass

1. Read the PR description and confirm it lists:
   - Scope and motivation
   - Files changed
   - Tests performed
   - Any follow-ups or TODOs
2. Compare `git diff origin/main...HEAD` to ensure only relevant files are present. Flag:
   - Generated artifacts committed by mistake
   - Formatting-only changes without justification
   - Missing updates to `plan.md` when architecture shifts
3. Confirm the PR is logically sized (prefer < 400 LOC). If it is larger, ask whether it can be split before continuing.

---

## 3. Line-by-Line Checklist

For **every hunk**, answer these questions:

| Question | What to look for |
|----------|------------------|
| **Is the intent clear?** | Comments or naming should explain non-trivial logic. |
| **Does it honor the code rules?** | Pure functions, SRP, no hacks, explicit errors, no global mutations. |
| **Are types enforced?** | JSDoc for new params/returns, no implicit `any`, and happy-dom compatibility. |
| **Is there a regression risk?** | Existing behavior maintained? Are default values preserved? |
| **Are tests updated?** | New logic needs unit coverage; pipeline/demos need Playwright validation. |
| **Are docs updated?** | `plan.md`, `demos/README.md`, or inline docs updated when behavior changes. |

### Specific Areas

- **Pipeline steps**: Confirm inputs/outputs stay immutable and context fields are typed.
- **Registries**: Ensure new registrations sanitize keys, enforce overrides, and include tests.
- **Trigger/DOM code**: Validate delegation, event.preventDefault usage, and that selectors still resolve.
- **State management**: Check that capture/apply/restore cover removal edge cases and call the state manager.
- **HTTP/serialization**: Confirm headers/body changes respect `DEFAULTS` and no sensitive data leaks.

---

## 4. Testing Expectations

1. **Unit tests**: Every new function or branch must have explicit Vitest coverage. Look for:
   - Happy-dom assertions for DOM work
   - Mocked fetch/retry logic for network code
2. **Integration tests**: Any user-visible change needs a matching Playwright scenario that exercises the dist bundle (`tests/integration/pages` + `tests/integration/flows`).
3. **Snapshots/artifacts**: If bundle size or exports change, request updated snapshots in `tests/bundle/` (when available).
4. **CI parity**: Ensure the author ran the same scripts that CI will run (the full chain: `lint → test:unit → build → test:e2e`). Screenshots or log excerpts should appear in the PR description for flaky environments.

---

## 5. Commenting Strategy

1. **Blockers**
   - Failing tests, missing tests, behavior regressions, spec violations, architectural shifts without plan updates.
2. **Actionable suggestions**
   - Provide concrete fixes, not vague “refactor this”.
3. **Nits**
   - Style issues only when they obstruct readability or violate the rules; batch them to avoid noise.
4. **Positive feedback**
   - Call out especially clean implementations or thorough tests to encourage good patterns.

Always include the rationale (why it matters) and the desired outcome (what to change).

---

## 6. Final Approval Checklist

Before approving:

- [ ] All TODOs in the diff are resolved or converted into tracked issues.
- [ ] Tests and build scripts pass locally (author provided evidence).
- [ ] Documentation (`plan.md`, demos, README, TypeScript declarations) reflects the change.
- [ ] PR title/description match Conventional Commits and describe scope accurately.
- [ ] Dist-only consumption rule is honored (Playwright/demos import from `dist/`).
- [ ] No “temporary” hacks remain; dead code deleted.

If any box is unchecked, request changes and link to the relevant section of this guide.

---

## 7. Using This Guide With Another Model

When requesting a secondary review (human or AI):

1. Share this `HowToReviewGuide.md` file with the reviewer.
2. Provide the exact diff or PR link plus test results.
3. Ask them to cite the section numbers (e.g., “Section 3.1 violation”) in their feedback for traceability.

This keeps reviews consistent regardless of who or what performs them.

