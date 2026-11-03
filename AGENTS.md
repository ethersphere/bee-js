# AGENTS.md

Guide for coding agents working on bee-js. Read it before changing anything.

## Project

bee-js (`@ethersphere/bee-js`) is the JavaScript/TypeScript client for the [Bee](https://github.com/ethersphere/bee) Swarm node API. It runs in Node.js and browsers.

- Pure data types and crypto (`Bytes`, `Reference`, `Topic`, `PrivateKey`, chunks, SOCs, BMT, mantaray, BPS framing) come from `@ethersphere/core-sdk` and are re-exported from `src/index.ts`. Put protocol logic with no network I/O there, not here.
- bee-js adds the HTTP and WebSocket transport, request handling, input validation and the user-facing `Bee` API.
- The supported Bee version is in `package.json` under `engines`.

## Structure

| Path | Contents |
| --- | --- |
| `src/bee.ts` | The `Bee` class. Builds a `BeeContext` and exposes one namespace per module (`bee.stamp`, `bee.storage`, `bee.messaging`, ...) |
| `src/modules/` | One class per namespace. Takes a `BeeContext` (`src/modules/context.ts`), validates input and orchestrates calls. This is the public API |
| `src/api/` | Raw HTTP calls, one file per Bee endpoint group. No validation and no orchestration, just request in, parsed response out |
| `src/types/index.ts` | Public types and interfaces |
| `src/types/schema/` | zod schemas that parse Bee API responses |
| `src/utils/schema.ts` | zod schemas that validate user input (options, handlers) |
| `src/utils/` | Shared helpers: `http.ts` transport, `error.ts` (`BeeError`, `BeeArgumentError`, `BeeResponseError`), tokens, sizes, durations, tar, collections |
| `src/utils/*.browser.ts` | Browser variants, swapped in through the `browser` map in `package.json` |
| `src/bps/`, `src/feed/`, `src/chunk/`, `src/manifest/` | Feature logic that is too large for a module file |
| `codemod/` | Migration runner for users upgrading across breaking versions |
| `test/unit/` | Tests without a Bee node, using mocks such as a local `ws` server. `*.browser.spec.ts` runs in jsdom |
| `test/integration/` | Tests against a real Bee node |
| `test/regression/` | One file per fixed issue, named after the issue |

When adding a feature: endpoint call in `src/api/`, types in `src/types/`, input schema in `src/utils/schema.ts`, public method in the matching `src/modules/` class, and an export from `src/index.ts` if users need to import something new.

## Commands

```sh
npm install
npm run check    # typecheck src and test
npm run lint     # eslint + prettier --check
npm run build    # cjs, mjs, types, browser bundle, codemod
npm test         # full suite, needs a Bee node (see below)
```

`npm test` reads `.env.test` (`JEST_BEE_URL`, `JEST_BEE_SIGNER`, `JEST_MANAGED_BATCH_ID`, `JEST_EXTERNAL_BATCH_ID`, `JEST_WITHDRAW_ADDRESS`) and waits for the node to warm up. To run only the unit tests without a node:

```sh
TS_NODE_PROJECT=tsconfig.test.json npx jest --config '{"preset":"ts-jest","testEnvironment":"node","rootDir":".","testRegex":"test/unit/.*(?<!\\.browser)\\.spec\\.ts"}'
```

`test/unit/extend-storage.spec.ts` needs a live node despite its location, so it fails without one.

Browser tests: `npm run test:browser`.

Before finishing, `npm run check`, `npm run lint` and the unit tests must pass, and `npm run build` must succeed.

## Coding style

- Prettier: no semicolons, single quotes, trailing commas, 2-space indent, 120 columns, `arrowParens: avoid`. eslint enforces the rest (`.eslintrc.js`), including blank lines before `if`, `return` and function declarations, and no `console`.
- Validate user input at the module boundary with zod schemas or the `asNumberString`-style helpers, and throw `BeeArgumentError` with the offending value.
- Throw `BeeError` subclasses, never plain `Error`.
- Accept flexible input types (`EthAddress | Uint8Array | string`) and normalise them right away with the core-sdk constructors (`new EthAddress(x)`, `new Topic(x)`).
- Use `bigint` for indexes and token amounts that can exceed 2^53.
- Every public method takes an optional `requestOptions` last and passes it through `context.getRequestOptionsForCall`.
- Prefer small, well-named functions over long ones. Match the naming and idioms of the surrounding code.
- `async` functions that return promises must be declared `async` (`promise-function-async`).

## Comments: strict rule

Write code that is easy to read, so it doesn't need comments. Comments must not explain unclear code; rewrite the code instead.

- Default to no comments.
- Before adding one, try better names, a well-named helper function or a named constant.
- If a comment is still needed, for a non-obvious "why" such as a protocol quirk or a workaround, keep it to one short line.
- No multi-line block comments, no comments that restate the next line, and no commented-out code.
- Public API members get a one-line JSDoc summary, because it feeds the generated API docs. Leave out `@param` and `@returns` unless a parameter has a non-obvious unit or range.
- When you edit code that has verbose comments, shorten or remove them.

## Tests: required

Every functionality must be covered by tests. A change without tests is not done.

- New feature: unit tests for the logic and edge cases, plus an integration test when it talks to Bee.
- Bug fix: a test that fails without the fix. For reported issues, add it to `test/regression/` named after the issue.
- Cover error paths: invalid input, rejected requests, closed sockets, aborts.
- Unit tests must not need a Bee node. Mock HTTP or WebSocket servers locally, as `test/unit/bps.spec.ts` does.
- Browser-specific code (`*.browser.ts`) needs a `*.browser.spec.ts`.
- Test names describe the behaviour: `rejects a subscriber identity equal to the owner`, not `test 3`.

## Git and releases

- Conventional Commits (`feat:`, `fix:`, `chore:` ...), enforced by commitlint.
- `upcoming` is the integration branch. Every push publishes an `@ethersphere/bee-js@<next>-upcoming.g<sha>` snapshot under the `upcoming` npm tag. release-please cuts stable releases from it, and `master` follows the latest stable release.
- Breaking changes need a `codemod/` transform when users can migrate mechanically.
