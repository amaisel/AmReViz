# Main branch rules

GitHub stores repository rulesets outside Git, so
[`main.json`](./main.json) is the reviewable source of truth for the active
`Protect main` ruleset.

The ruleset targets only `main` and:

- requires every change to arrive through a pull request;
- requires one approval from the code owner, `@amaisel`;
- dismisses approvals after new reviewable commits are pushed;
- requires all review conversations to be resolved;
- blocks force pushes and branch deletion; and
- allows only `@amaisel` to bypass the rules and push directly.

These settings do not prevent other contributors from forking the repository,
creating branches, opening pull requests, commenting, or submitting reviews.
Reviews from contributors other than the code owner do not replace the required
code-owner approval.

## Apply or reconcile

Repository administrators can inspect the active rule under **Settings → Rules
→ Rulesets**. If the rule does not exist, create it from the checked-in
definition:

```sh
gh api \
  --method POST \
  repos/amaisel/AmReViz/rulesets \
  --input .github/rulesets/main.json
```

If the rule already exists, compare its exported JSON with `main.json` before
updating it. Do not create a second overlapping ruleset with the same name.
