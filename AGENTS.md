# AGENTS.md — bee-js

This file provides guidance to AI coding agents (Codex, Cursor, Copilot, etc.) when working with this repository.

## Project Overview

**bee-js** (`@ethersphere/bee-js`) is the official TypeScript/JavaScript client library for the [Ethereum Swarm](https://ethswarm.org/) Bee node. It wraps the Bee HTTP API into a type-safe SDK that works in both Node.js (18+) and modern browsers.

- **Package**: `@ethersphere/bee-js`
- **License**: BSD-3-Clause
- **Key dependencies**: `axios` (HTTP), `cafe-utility` (binary helpers, crypto, types), `isomorphic-ws` / `ws` (WebSocket for PSS/GSOC), `semver`, `debug`
- **Compatible Bee version**: see `engines.bee` and `engines.beeApiVersion` in `package.json`

## Build Commands

```bash
npm install           # Install dependencies
npm run build         # Full build: CJS + ESM + types + browser bundle
npm run build:node    # CJS (dist/cjs/) + ESM (dist/mjs/) via tsc + babel
npm run build:types   # Type declarations (dist/types/)
npm run build:browser # Webpack UMD bundle (dist/index.browser.js)
npm test              # Jest tests (requires a running Bee node)
npm run check         # TypeScript type-check only (no emit)
npm run lint          # ESLint + Prettier
npm run depcheck      # Check for unused dependencies
```

### Build Pipeline

1. **CJS**: `tsc -p tsconfig.json` to `dist/cjs/`
2. **ESM**: `tsc -p tsconfig-mjs.json` to `dist/mjs/`, then babel appends `.js` import extensions
3. **Types**: `tsc --emitDeclarationOnly` to `dist/types/`
4. **Browser**: webpack UMD bundle to `dist/index.browser.js` (exposed as `window.BeeJs`)
5. **Fixup**: `./build-fixup` patches `package.json` files in dist directories

## Project Structure

```
src/
  index.ts              Public exports
  bee.ts                Bee class (~100 public methods)
  bee-dev.ts            BeeDev class (dev/debug extensions)
  chunk/                CAC and SOC implementations
    bmt.ts              Binary Merkle Tree hashing
    cac.ts              Content Addressed Chunks
    soc.ts              Single Owner Chunks
  feed/                 Feed reader/writer and identifiers
  manifest/             Mantaray manifest handling
  modules/              HTTP API call layer (one file per API group)
    debug/              Debug/admin API modules
  stamper/              Client-side postage stamp issuing
  types/                TypeScript interfaces and constants
  utils/                Shared utilities
test/
  unit/                 Unit tests (no Bee node required)
  integration/          Integration tests (require a running Bee node)
```

### Key Source Files

- `src/bee.ts` — Main `Bee` class with all public API methods
- `src/bee-dev.ts` — `BeeDev` class extending `Bee` with dev-mode methods
- `src/modules/*.ts` — HTTP-level wrappers for each Bee API group
- `src/utils/typed-bytes.ts` — Typed-bytes classes (`Reference`, `BatchId`, `PrivateKey`, etc.)
- `src/utils/tokens.ts` — `BZZ` and `DAI` fixed-point token arithmetic
- `src/utils/http.ts` — axios wrapper with retry, abort signal, and error wrapping
- `src/stamper/stamper.ts` — Client-side postage stamp assignment

## Architecture

### Typed-Bytes Pattern

All Swarm identifiers are strongly typed via classes extending `Bytes` from `src/utils/bytes.ts`. Each enforces a fixed byte length. Constructors accept `Uint8Array | string | Bytes`.

Key classes:
- `PrivateKey` (32B) — Ethereum private key; can derive `PublicKey` and sign data
- `PublicKey` (64B) — Uncompressed public key
- `EthAddress` (20B) — Ethereum address with checksum encoding
- `Reference` (32 or 64B) — Content hash; 64B for encrypted references; also accepts CID strings
- `BatchId` (32B) — Postage batch identifier
- `Topic` (32B) — Feed topic (often keccak256 of a string)
- `FeedIndex` (8B) — Sequential feed index (big-endian uint64)
- `Signature` (65B) — ECDSA signature; supports `recoverPublicKey`

### Token Classes

`src/utils/tokens.ts` provides immutable fixed-point arithmetic:
- **`BZZ`**: 16 decimal digits (1 BZZ = 10^16 PLUR). Use `BZZ.fromDecimalString("1.5")`.
- **`DAI`**: 18 decimal digits (1 DAI = 10^18 wei). Use `DAI.fromDecimalString("1.0")`.

### Browser vs Node.js

Platform-specific code uses `.browser.ts` variants resolved via the `"browser"` field in `package.json`:

- `utils/data.ts` / `utils/data.browser.ts` — data preparation for uploads
- `utils/collection.node.ts` / `utils/collection.browser.ts` — file collection building
- `utils/tar.ts` / `utils/tar.browser.ts` — tar archive creation
- `utils/chunk-stream.ts` / `utils/chunk-stream.browser.ts` — streaming chunk upload

### Modules Layer

Files in `src/modules/` make HTTP calls using the `http()` helper from `src/utils/http.ts`. The `Bee` class delegates to these; do not import modules directly from application code.

### Stamper

`src/stamper/stamper.ts` provides `Stamper` — client-side postage stamp issuing tracking 65,536 buckets locally. Create via `Stamper.fromBlank(signer, batchId, depth)` or resume with `Stamper.fromState(...)`.

## Testing

Tests require a running Bee node. Set environment variables:

```bash
JEST_BEE_URL=http://localhost:1633
JEST_BEE_SIGNER=<private-key-hex>
JEST_MANAGED_BATCH_ID=<64-char-hex>
JEST_EXTERNAL_BATCH_ID=<64-char-hex>
JEST_WITHDRAW_ADDRESS=<eth-address>

npm test        # Run all tests
npm run check   # Type-check only (no Bee node needed)
```

- Tests use `ts-jest` with a 4-minute timeout
- Coverage collected from `src/**/*.ts`

## Code Conventions

- **Strict TypeScript**: `strict: true`, `alwaysStrict: true`, `skipLibCheck: false`
- **Formatting**: Prettier + ESLint; run `npm run lint` before committing
- **Imports**: Use `cafe-utility` for binary ops (`Binary`), type assertions (`Types`), async helpers (`System`), strings (`Strings`)
- **Conventional commits**: enforced by commitlint — use prefixes `feat:`, `fix:`, `docs:`, `chore:`, etc.
- **Errors**: throw `BeeError`, `BeeArgumentError`, or `BeeResponseError` from `src/utils/error.ts`
- **Validation**: typed-bytes constructors validate byte length; use helpers in `src/utils/type.ts`
- **Request options**: every `Bee` method accepts optional `requestOptions?: BeeRequestOptions` as the last parameter

## Common Pitfalls

- **Gateway vs full node**: PSS, GSOC, staking, stamps, and chequebook operations require a full node. Check with `isGateway()`.
- **Stamp usability**: After `createPostageBatch`, stamps need block confirmations before use. Set `waitForUsable: true` (default) or poll `getPostageBatch` until `usable === true`.
- **Encrypted references**: Are 64 bytes (128 hex chars); the `Reference` class handles both 32B and 64B.
- **CID support**: `Reference` constructor accepts `bah5...` CID strings and auto-decodes them.
- **Browser code**: Never use Node.js APIs (`fs`, `stream`, `path`) in shared code — use the `.browser.ts` pattern.
- **BZZ amounts**: Methods accept a `BZZ` instance or raw PLUR string/bigint. 1 BZZ = 10^16 PLUR.
- **Network parameter**: `Bee` constructor accepts `network: 'gnosis' | 'sepolia'` affecting block time used for TTL calculations.

## Key Constants

```typescript
CHUNK_SIZE = 4096         // Swarm chunk payload size
SECTION_SIZE = 32         // BMT hash section size
BRANCHES = 128            // BMT branching factor
STAMPS_DEPTH_MIN = 17     // Minimum postage batch depth
STAMPS_DEPTH_MAX = 255    // Maximum postage batch depth
```

## Related Files

- `CLAUDE.md` — identical guidance for Claude Code (if present)
- `README.md` — user-facing documentation and quick-start
- `CHANGELOG.md` — release history
- `cheatsheet.ts` — example code snippets for common operations
