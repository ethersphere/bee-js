# Release process

bee-js is published on two npm dist-tags, mirroring Bee's own RC/stable cadence:

| dist-tag | branch | tracks | install |
| --- | --- | --- | --- |
| `latest` | `master` | Bee **stable** | `npm i @ethersphere/bee-js` |
| `upcoming` | `upcoming` | Bee **RC** | `npm i @ethersphere/bee-js@upcoming` |

## Branch model

- **`upcoming`** is the integration trunk — **every PR merges here**.
- **`master`** always reflects the **latest stable release**. It is never committed to directly; it only ever fast-forwards to a stable release commit. This is the invariant that keeps promotion conflict-free.

## What happens automatically

1. **PR merged to `upcoming`** → `snapshot-upcoming.yaml` publishes an ephemeral prerelease
   (`X.Y.Z-upcoming.<run>`) under the **`upcoming`** dist-tag. The version is computed at build
   time and never committed, so `upcoming` accrues no version/changelog churn.
2. **release-please** (`release_github.yaml`, now targeting `upcoming`) maintains a release PR
   that bumps the version and updates `CHANGELOG.md` from conventional commits.
3. **Release = merge the release PR on `upcoming`.** That creates the GitHub release/tag, which:
   - `publish_npmjs.yaml` → `npm publish` under **`latest`**;
   - `promote-master.yaml` → **fast-forwards `master`** to that commit;
   - `dispatch-release.yml` → notifies `create-swarm-app`.

So "merging `upcoming` → `master` at release" is realised as an automatic fast-forward of
`master` to the released commit — no manual merge, no back-merge, no conflicts.

## Bee versions (`engines`)

The supported Bee / Bee API versions live in `package.json` `engines`, and `src/version.ts`
(the `SUPPORTED_BEE_VERSION*` exports) is generated from them by `scripts/generate-version.cjs`.
They are updated by the **separate `update_bee.yaml` workflow** — run manually or dispatched from
the Bee repo when a new Bee ships — which bumps `engines`, regenerates `version.ts`, updates the
README, and opens its own PR against the default branch (`upcoming`). release-please's release PR
does **not** touch `engines`.

Tracking Bee **RC** on `upcoming` and Bee **stable** on `master` is therefore a maintainer
convention (which Bee version you feed to `update_bee.yaml`), not something these release
workflows enforce automatically. `master` receives whatever value is current via the fast-forward.

## One-time GitHub settings (not expressible in workflow files)

- Create the **`upcoming`** branch from `master` and set it as the **default branch** (so new PRs
  target it).
- Protect **`master`**: no direct pushes/PRs; allow the release automation (the `REPO_GHA_PAT`
  identity) to fast-forward it.
- Keep the `publish` environment secrets/OIDC available to `snapshot-upcoming.yaml` as they are
  for `publish_npmjs.yaml`.

## Hotfixes / maintenance

Fixes land on `upcoming` and ship with the next stable release. Patching an *older* stable while
`upcoming` has moved ahead is a rare maintenance release: branch `release-x.y` from the stable tag,
fix, tag — outside the normal path.
