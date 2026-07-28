# Main branch rules

GitHub stores repository rulesets outside Git, so
[`main.json`](./main.json) is the reviewable source of truth for the active
`Protect main` ruleset.

The ruleset targets only `main` and:

- requires every change to arrive through a pull request;
- blocks force pushes and branch deletion; and
- allows only `@amaisel` to bypass the rules and push directly.

It does **not** require an approving review. It used to require one from the
code owner, which on a repository with a single collaborator is a lock with no
key: GitHub will not let anyone approve their own pull request, so every merge
had to spend the bypass. Approvals are worth reinstating the day a second
collaborator is added — until then the requirement gated nobody and hid the
force-push and deletion rules behind a permanent override.

## What actually keeps other people out

Not this file. Repository rulesets are subtractive: they constrain people who
already have write access, and there is no setting here that can grant it. A
contributor with no write access is stopped before the ruleset is consulted.

Write access comes from the collaborator list, deploy keys, GitHub Apps, and
workflow tokens — as of July 2026 that is one admin, `@amaisel`, with no
invitations, no deploy keys and no workflows. Anyone else may fork, clone, open
issues and pull requests, comment, and submit reviews; none of that can change
`main`.

If CI is added later, note that the realistic way a public repository leaks
write access is a workflow with `contents: write` triggered by
`pull_request_target`, which runs with repository credentials in a context a
fork's pull request can influence. Prefer `pull_request` for anything that
executes untrusted code.

`CODEOWNERS` is kept so pull requests still request a review from `@amaisel`
automatically. That request is now advisory and does not block merging.

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

If the rule already exists, update it in place rather than creating a second
overlapping ruleset with the same name:

```sh
gh api \
  --method PUT \
  repos/amaisel/AmReViz/rulesets/19790774 \
  --input .github/rulesets/main.json
```

To check the live rule still matches what is checked in:

```sh
gh api repos/amaisel/AmReViz/rulesets/19790774 \
  --jq '{rules: [.rules[].type], pr: (.rules[] | select(.type=="pull_request") | .parameters)}'
```
